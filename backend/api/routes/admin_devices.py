"""Root-only device inventory and configuration for the backend console."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import field_validator

from api.shared import ONLINE_WINDOW_MINUTES
from core.auth import get_current_root_user, validate_mac_param
from core.config_store import (
    get_active_config, get_device_owner, get_user_custom_modes,
    save_config, set_pending_refresh,
)
from core.db import get_main_db
from core.mode_registry import get_registry
from core.schemas import ConfigRequest

router = APIRouter(
    prefix="/admin/devices", tags=["admin-devices"],
    dependencies=[Depends(get_current_root_user)],
)


class AdminDeviceConfig(ConfigRequest):
    @field_validator("timeSlotRules")
    @classmethod
    def validate_time_slots(cls, rules: list[dict]) -> list[dict]:
        for rule in rules:
            start, end = rule.get("startHour"), rule.get("endHour")
            if type(start) is not int or type(end) is not int or not 0 <= start < end <= 24:
                raise ValueError("时段需要整数小时，且满足 0 ≤ startHour < endHour ≤ 24")
            modes = rule.get("modes")
            if not isinstance(modes, list) or not modes or not all(isinstance(mode, str) for mode in modes):
                raise ValueError("每个时段的 modes 必须是非空模式数组")
            rule["modes"] = ConfigRequest.validate_modes(modes)
        return rules

    @field_validator("countdownEvents")
    @classmethod
    def validate_countdowns(cls, events: list[dict]) -> list[dict]:
        for event in events:
            if not isinstance(event.get("name"), str) or not event["name"].strip():
                raise ValueError("倒计时事件需要 name")
            try:
                date.fromisoformat(event.get("date", ""))
            except (TypeError, ValueError):
                raise ValueError("倒计时日期应为 YYYY-MM-DD")
            if event.get("type", "countdown") not in {"countdown", "countup"}:
                raise ValueError("倒计时 type 应为 countdown 或 countup")
        return events


# Include configured, bound, and reporting devices, including offline devices.
_INVENTORY = """WITH devices AS (
    SELECT mac FROM configs UNION SELECT mac FROM device_state
    UNION SELECT mac FROM device_memberships UNION SELECT mac FROM device_heartbeats
), latest_config AS (
    SELECT mac, MAX(id) AS id FROM configs WHERE is_active = 1 GROUP BY mac
), heartbeat AS (
    SELECT mac, MAX(id) AS id FROM device_heartbeats GROUP BY mac
), inventory AS (
    SELECT d.mac, COALESCE(c.nickname, m.nickname, '') AS nickname,
           COALESCE(u.username, '') AS owner,
           COALESCE(h.created_at, '') AS last_seen,
           h.battery_voltage, h.wifi_rssi,
           COALESCE(s.last_persona, '') AS last_mode,
           COALESCE(s.pending_refresh, 0) AS pending_refresh,
           c.id AS config_id,
           CASE WHEN h.created_at >= ? THEN 1 ELSE 0 END AS is_online
    FROM devices d
    LEFT JOIN latest_config lc ON lc.mac = d.mac
    LEFT JOIN configs c ON c.id = lc.id
    LEFT JOIN device_state s ON s.mac = d.mac
    LEFT JOIN heartbeat hb ON hb.mac = d.mac
    LEFT JOIN device_heartbeats h ON h.id = hb.id
    LEFT JOIN device_memberships m
      ON m.mac = d.mac AND m.role = 'owner' AND m.status = 'active'
    LEFT JOIN users u ON u.id = m.user_id
) """


async def _require_device(mac: str) -> str:
    mac = validate_mac_param(mac)
    db = await get_main_db()
    cursor = await db.execute(
        """SELECT mac FROM configs WHERE mac = ?
           UNION SELECT mac FROM device_state WHERE mac = ?
           UNION SELECT mac FROM device_memberships WHERE mac = ?
           UNION SELECT mac FROM device_heartbeats WHERE mac = ? LIMIT 1""",
        (mac,) * 4,
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="device_not_found")
    return mac


def _editable_config(mac: str, config: dict | None) -> dict:
    # Whitelist request fields: never expose device tokens or legacy API keys.
    defaults = ConfigRequest(mac=mac).model_dump(exclude={"llmApiKey", "imageApiKey", "screenSize"})
    if config:
        defaults.update({key: config[key] for key in defaults if key in config})
        defaults["timeSlotRules"] = config.get("time_slot_rules", [])
        defaults["modeLanguage"] = config.get("modeLanguage") or config.get("language", "zh")
    return defaults


@router.get("")
async def list_devices(
    q: str = Query(default="", max_length=64),
    status: Literal["all", "online", "offline"] = "all",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    cutoff = (datetime.now() - timedelta(minutes=ONLINE_WINDOW_MINUTES)).isoformat()
    # instr treats %, _, and quotes as literal search text.
    where = "WHERE (instr(lower(mac), ?) > 0 OR instr(lower(nickname), ?) > 0 OR instr(lower(owner), ?) > 0)"
    params = [cutoff, *([q.strip().lower()] * 3)]
    if status != "all":
        where += " AND is_online = ?"
        params.append(int(status == "online"))
    db = await get_main_db()
    cursor = await db.execute(_INVENTORY + "SELECT COUNT(*) FROM inventory " + where, params)
    total = (await cursor.fetchone())[0]
    cursor = await db.execute(
        _INVENTORY + "SELECT * FROM inventory " + where
        + " ORDER BY last_seen DESC, mac LIMIT ? OFFSET ?",
        [*params, page_size, (page - 1) * page_size],
    )
    columns = [column[0] for column in cursor.description]
    items = [dict(zip(columns, row)) for row in await cursor.fetchall()]
    for item in items:
        item["is_online"] = bool(item["is_online"])
        item["pending_refresh"] = bool(item["pending_refresh"])
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{mac}/config")
async def read_device_config(mac: str):
    mac = await _require_device(mac)
    config = await get_active_config(mac, log_load=False)
    modes = {
        info.mode_id: {"mode_id": info.mode_id, "display_name": info.display_name}
        for info in get_registry().list_modes(mac) if info.source != "custom"
    }
    owner = await get_device_owner(mac)
    if owner:
        for mode in await get_user_custom_modes(owner["user_id"], mac):
            modes[mode["mode_id"]] = {
                "mode_id": mode["mode_id"],
                "display_name": mode["definition"].get("display_name", mode["mode_id"]),
            }
    return {
        "config": _editable_config(mac, config),
        "has_config": config is not None, "modes": list(modes.values()),
    }


@router.put("/{mac}/config")
async def write_device_config(mac: str, body: AdminDeviceConfig):
    mac = await _require_device(mac)
    if body.mac.upper() != mac:
        raise HTTPException(status_code=422, detail="device_mac_mismatch")
    # Merge only submitted fields, so partial admin edits retain all other settings.
    current = _editable_config(mac, await get_active_config(mac, log_load=False))
    current.update(body.model_dump(exclude_unset=True, exclude={"llmApiKey", "imageApiKey", "screenSize"}))
    current["mac"] = mac
    config_id = await save_config(mac, current)
    await set_pending_refresh(mac, True)
    return {"ok": True, "config_id": config_id}
