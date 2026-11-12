"""Device administration with real role checks and isolated persisted data."""
from datetime import datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from api.index import app
from core import db as db_mod
from core.auth import create_session_token
from core.config_store import (
    bind_device, create_user, get_active_config, get_device_state,
    init_db, save_config, save_custom_mode, update_device_state,
)
from core.db import get_main_db
from core.stats_store import init_stats_db

MAC = "AA:BB:CC:DD:EE:FF"
OTHER_MAC = "11:22:33:44:55:66"


@pytest.fixture
async def devices_client(tmp_path, monkeypatch):
    await db_mod.close_all()
    path = str(tmp_path / "devices.db")
    monkeypatch.setattr(db_mod, "_MAIN_DB_PATH", path)
    monkeypatch.setattr("core.config_store.DB_PATH", path)
    monkeypatch.setattr("core.stats_store.DB_PATH", path)
    await init_db()
    await init_stats_db()
    root = await create_user("device-admin", "test-password")
    user = await create_user("device-owner", "test-password")
    db = await get_main_db()
    await db.execute("UPDATE users SET role = 'root' WHERE id = ?", (root,))
    await db.commit()
    headers = {
        "root": {"Authorization": "Bearer " + create_session_token(root, "device-admin")},
        "user": {"Authorization": "Bearer " + create_session_token(user, "device-owner")},
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, headers, user
    await db_mod.close_all()


@pytest.mark.parametrize("method,path,body", [
    ("GET", "/api/admin/devices", None),
    ("GET", f"/api/admin/devices/{MAC}/config", None),
    ("PUT", f"/api/admin/devices/{MAC}/config", {"mac": MAC}),
])
async def test_device_management_requires_root(devices_client, method, path, body):
    client, headers, _ = devices_client
    for auth, expected in [({}, 401), (headers["user"], 403)]:
        result = await client.request(method, path, headers=auth, json=body)
        assert result.status_code == expected


async def test_inventory_includes_offline_bound_configured_and_reporting_devices(devices_client):
    client, headers, user = devices_client
    await bind_device(user, MAC)
    await save_config(MAC, {"nickname": "书房", "modes": ["DAILY"]})
    await update_device_state(MAC, last_persona="DAILY")
    db = await get_main_db()
    for mac, seen in [(MAC, datetime.now()), (OTHER_MAC, datetime.now() - timedelta(days=2))]:
        await db.execute(
            "INSERT INTO device_heartbeats (mac, battery_voltage, wifi_rssi, created_at) VALUES (?, 3.9, -55, ?)",
            (mac, seen.isoformat()),
        )
    await db.commit()
    data = (await client.get("/api/admin/devices", headers=headers["root"])).json()
    assert data["total"] == 2
    assert [row["mac"] for row in data["items"]] == [MAC, OTHER_MAC]
    first = data["items"][0]
    assert first["owner"] == "device-owner"
    assert first["nickname"] == "书房"
    assert first["last_mode"] == "DAILY"
    assert first["is_online"] is True
    assert first["battery_voltage"] == 3.9
    assert not data["items"][1]["is_online"]
    assert not {"auth_token", "alert_token", "llmApiKey", "imageApiKey"} & first.keys()
    for query, expected in [("书房", 1), ("DEVICE-OWNER", 1), ("aa:bb", 1), ("%", 0), ("_", 0), ("' OR 1=1 --", 0)]:
        result = await client.get("/api/admin/devices", params={"q": query}, headers=headers["root"])
        assert result.json()["total"] == expected
    offline = (await client.get("/api/admin/devices?status=offline", headers=headers["root"])).json()
    assert [row["mac"] for row in offline["items"]] == [OTHER_MAC]
    paged = (await client.get("/api/v1/admin/devices?page_size=1&page=2", headers=headers["root"])).json()
    assert paged["total"] == 2
    assert paged["items"][0]["mac"] == OTHER_MAC


async def test_partial_save_retains_settings_and_queues_refresh_only_for_target(devices_client):
    client, headers, _ = devices_client
    initial = {
        "modes": ["DAILY", "ZEN"], "refreshStrategy": "time_slot", "refreshInterval": 120,
        "timeSlotRules": [{"startHour": 9, "endHour": 18, "modes": ["DAILY"]}],
        "countdownEvents": [{"name": "假期", "date": "2027-01-01"}],
        "memoText": "保留的备忘录", "modeOverrides": {"ZEN": {"city": "北京", "custom_setting": True}},
        "latitude": 30.2, "longitude": 120.1, "timezone": "Asia/Shanghai",
        "always_active": True, "is_focus_listening": True,
    }
    await save_config(MAC, initial)
    await save_config(OTHER_MAC, {"nickname": "其他设备", "modes": ["DAILY"]})
    await update_device_state(MAC)
    db = await get_main_db()
    await db.execute("UPDATE device_state SET auth_token = 'private-device-token', alert_token = 'private-alert-token' WHERE mac = ?", (MAC,))
    await db.commit()
    url = f"/api/admin/devices/{MAC}/config"
    before = (await client.get(url, headers=headers["root"])).json()
    assert "private-" not in str(before)
    assert "llmApiKey" not in before["config"]
    assert before["config"]["timeSlotRules"] == initial["timeSlotRules"]
    result = await client.put(url, headers=headers["root"], json={"mac": MAC, "nickname": "新昵称", "city": "上海"})
    assert result.status_code == 200
    after = (await client.get(url, headers=headers["root"])).json()["config"]
    for key, value in initial.items():
        assert after[key] == value
    assert after["nickname"] == "新昵称"
    assert after["city"] == "上海"
    assert (await get_device_state(MAC))["pending_refresh"] == 1
    assert (await get_active_config(OTHER_MAC))["nickname"] == "其他设备"
    assert await get_device_state(OTHER_MAC) is None
    cursor = await db.execute("SELECT COUNT(*) FROM configs WHERE mac = ?", (MAC,))
    assert (await cursor.fetchone())[0] == 2


async def test_bound_device_without_config_can_save_defaults_and_see_owner_modes(devices_client):
    client, headers, user = devices_client
    await bind_device(user, MAC)
    await save_custom_mode(user, "CUSTOM_TEST", {"display_name": "自定义内容"}, MAC)
    url = f"/api/admin/devices/{MAC}/config"
    response = await client.get(url, headers=headers["root"])
    assert response.status_code == 200
    data = response.json()
    assert data["has_config"] is False
    assert {"mode_id": "CUSTOM_TEST", "display_name": "自定义内容"} in data["modes"]
    data["config"]["modes"] = ["CUSTOM_TEST"]
    saved = await client.put(url, headers=headers["root"], json=data["config"])
    assert saved.status_code == 200
    assert (await get_active_config(MAC))["modes"] == ["CUSTOM_TEST"]


async def test_invalid_edits_leave_config_and_refresh_untouched(devices_client):
    client, headers, _ = devices_client
    await save_config(MAC, {"modes": ["DAILY"]})
    url = f"/api/admin/devices/{MAC}/config"
    for patch in [
        {"refreshInterval": 1}, {"modes": []}, {"refreshStrategy": "bad"},
        {"latitude": 100}, {"modeOverrides": []}, {"mac": OTHER_MAC},
        {"timeSlotRules": [{"startHour": "9", "endHour": 18, "modes": ["DAILY"]}]},
        {"timeSlotRules": [{"startHour": 18, "endHour": 9, "modes": []}]},
        {"countdownEvents": [{"name": "假期", "date": "invalid"}]},
    ]:
        response = await client.put(url, headers=headers["root"], json={"mac": MAC, **patch})
        assert response.status_code == 422
    assert await get_device_state(MAC) is None
    assert (await get_active_config(MAC))["refreshInterval"] == 60
    for method in ["GET", "PUT"]:
        result = await client.request(method, f"/api/admin/devices/{OTHER_MAC}/config", headers=headers["root"], **({"json": {"mac": OTHER_MAC}} if method == "PUT" else {}))
        assert result.status_code == 404
    for params in [{"status": "bad"}, {"page": 0}, {"page_size": 101}]:
        result = await client.get("/api/admin/devices", headers=headers["root"], params=params)
        assert result.status_code == 422
