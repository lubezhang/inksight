"""Root-only pairing code operations for the backend console."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field, field_validator

from core.auth import get_current_root_user
from core.config_store import create_claim_token, expire_claim_token, list_claim_tokens

router = APIRouter(
    prefix="/admin/pair-codes",
    tags=["admin-pairing"],
    dependencies=[Depends(get_current_root_user)],
)


class CreatePairCodeRequest(BaseModel):
    mac: str = Field(pattern=r"^([0-9A-F]{2}:){5}[0-9A-F]{2}$")
    pair_code: str = Field(default="", pattern=r"^(?:[A-Z0-9]{6,16})?$")
    ttl_minutes: int = Field(default=10, ge=1, le=1440)

    @field_validator("mac", "pair_code", mode="before")
    @classmethod
    def normalize(cls, value):
        return value.strip().upper() if isinstance(value, str) else value


@router.get("")
async def list_pair_codes(
    q: str = Query(default="", max_length=64),
    status: Literal["all", "active", "used", "expired"] = "all",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return await list_claim_tokens(q.strip(), status, page, page_size)


@router.post("", status_code=201)
async def create_pair_code(body: CreatePairCodeRequest):
    created = await create_claim_token(
        body.mac, source="admin", ttl_minutes=body.ttl_minutes,
        preferred_pair_code=body.pair_code,
    )
    if created is None:
        raise HTTPException(status_code=409, detail="pair_code_conflict")
    return {
        "ok": True, "mac": body.mac, "pair_code": created["pair_code"],
        "expires_at": created["expires_at"], "server_time": datetime.now().isoformat(),
    }


@router.delete("/{token_id}")
async def expire_pair_code(token_id: str = Path(pattern=r"^[0-9a-f]{64}$")):
    if not await expire_claim_token(token_id):
        raise HTTPException(status_code=409, detail="pair_code_not_active")
    return {"ok": True}
