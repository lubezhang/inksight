"""Pairing administration through HTTP, with real roles and isolated SQLite data."""
from datetime import datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from api.index import app
from core import db as db_mod
from core.auth import create_session_token
from core.config_store import create_claim_token, create_user, init_db
from core.db import get_main_db

MAC = "AA:BB:CC:DD:EE:FF"


@pytest.fixture
async def pairing_client(tmp_path, monkeypatch):
    await db_mod.close_all()
    db_path = str(tmp_path / "pairing.db")
    monkeypatch.setattr(db_mod, "_MAIN_DB_PATH", db_path)
    monkeypatch.setattr("core.config_store.DB_PATH", db_path)
    await init_db()
    root_id = await create_user("pairing-admin", "test-password")
    user_id = await create_user("pairing-user", "test-password")
    db = await get_main_db()
    await db.execute("UPDATE users SET role = 'root' WHERE id = ?", (root_id,))
    await db.commit()
    headers = {
        "root": {"Authorization": "Bearer " + create_session_token(root_id, "pairing-admin")},
        "user": {"Authorization": "Bearer " + create_session_token(user_id, "pairing-user")},
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, headers
    await db_mod.close_all()


@pytest.mark.parametrize("method,path,body", [
    ("GET", "/api/admin/pair-codes", None),
    ("POST", "/api/admin/pair-codes", {"mac": MAC}),
    ("DELETE", "/api/admin/pair-codes/" + "0" * 64, None),
])
async def test_pairing_requires_root_for_every_operation(pairing_client, method, path, body):
    client, headers = pairing_client
    for auth, status in [({}, 401), (headers["user"], 403)]:
        result = await client.request(method, path, json=body, headers=auth)
        assert result.status_code == status


async def test_admin_code_can_pair_once_and_stays_visible(pairing_client):
    client, headers = pairing_client
    created = await client.post("/api/admin/pair-codes", headers=headers["root"], json={
        "mac": " aa:bb:cc:dd:ee:ff ", "pair_code": " 267715 ", "ttl_minutes": 30,
    })
    assert created.status_code == 201
    data = created.json()
    assert data["mac"] == MAC
    assert data["pair_code"] == "267715"
    assert "token" not in data
    assert 1799 < (datetime.fromisoformat(data["expires_at"]) - datetime.fromisoformat(data["server_time"])).total_seconds() <= 1800
    consumed = await client.post("/api/claim/consume", headers=headers["user"], json={"pair_code": "267715"})
    assert consumed.status_code == 200
    assert consumed.json()["status"] == "claimed"
    assert consumed.json()["mac"] == MAC
    again = await client.post("/api/claim/consume", headers=headers["user"], json={"pair_code": "267715"})
    assert again.status_code == 404
    await client.post("/api/admin/pair-codes", headers=headers["root"], json={"mac": MAC})
    result = await client.get("/api/admin/pair-codes?status=used", headers=headers["root"])
    row = result.json()["items"][0]
    assert row["pair_code"] == "267715"
    assert row["status"] == "used"
    assert row["source"] == "admin"
    assert row["used_at"]
    assert not {"token", "auth_token", "nonce", "token_hash"} & row.keys()


async def test_expiring_code_prevents_claim_without_touching_other_records(pairing_client):
    client, headers = pairing_client
    first = await create_claim_token(MAC, preferred_pair_code="400263")
    second = await create_claim_token(MAC, preferred_pair_code="267715")
    rows = (await client.get("/api/admin/pair-codes", headers=headers["root"])).json()["items"]
    row_id = next(row["id"] for row in rows if row["pair_code"] == first["pair_code"])
    expired = await client.delete(f"/api/admin/pair-codes/{row_id}", headers=headers["root"])
    assert expired.status_code == 200
    repeated = await client.delete(f"/api/admin/pair-codes/{row_id}", headers=headers["root"])
    assert repeated.status_code == 409
    for body in [{"pair_code": first["pair_code"]}, {"token": first["token"]}]:
        rejected = await client.post("/api/claim/consume", json=body, headers=headers["user"])
        assert rejected.status_code in (404, 410)
    remaining = (await client.get("/api/admin/pair-codes?status=active", headers=headers["root"])).json()
    assert [row["pair_code"] for row in remaining["items"]] == [second["pair_code"]]
    expired_rows = (await client.get("/api/admin/pair-codes?status=expired", headers=headers["root"])).json()
    assert expired_rows["items"][0]["pair_code"] == first["pair_code"]


async def test_code_expired_during_claim_cannot_bind_device(pairing_client, monkeypatch):
    client, headers = pairing_client
    await create_claim_token(MAC, preferred_pair_code="267715")
    db = await get_main_db()
    original_execute = db.execute

    async def expire_before_consuming(sql, parameters=()):
        if "UPDATE device_claim_tokens SET used_at" in sql:
            await original_execute(
                "UPDATE device_claim_tokens SET expires_at = ? WHERE pair_code = '267715'",
                ((datetime.now() - timedelta(seconds=1)).isoformat(),),
            )
        return await original_execute(sql, parameters)

    monkeypatch.setattr(db, "execute", expire_before_consuming)
    result = await client.post("/api/claim/consume", headers=headers["user"], json={"pair_code": "267715"})
    assert result.status_code == 410
    cursor = await original_execute("SELECT COUNT(*) FROM device_memberships WHERE mac = ?", (MAC,))
    assert (await cursor.fetchone())[0] == 0


async def test_filters_pagination_conflict_and_retention(pairing_client):
    client, headers = pairing_client
    await create_claim_token(MAC, preferred_pair_code="267715")
    await create_claim_token("11:22:33:44:55:66", preferred_pair_code="400263")
    db = await get_main_db()
    await db.execute("UPDATE device_claim_tokens SET expires_at = ? WHERE pair_code = '400263'",
                     ((datetime.now() - timedelta(minutes=1)).isoformat(),))
    await db.commit()
    conflict = await client.post("/api/admin/pair-codes", headers=headers["root"], json={"mac": MAC, "pair_code": "267715"})
    assert conflict.status_code == 409
    auto = await client.post("/api/admin/pair-codes", headers=headers["root"], json={"mac": MAC})
    assert auto.status_code == 201
    assert len(auto.json()["pair_code"]) == 8
    all_rows = (await client.get("/api/admin/pair-codes?page_size=1&page=2", headers=headers["root"])).json()
    assert all_rows["total"] == 3
    assert len(all_rows["items"]) == 1
    for query, expected in [("aa:bb", 2), ("400263", 1), ("%", 0), ("_", 0), ("' OR 1=1 --", 0)]:
        response = await client.get("/api/admin/pair-codes", params={"q": query}, headers=headers["root"])
        assert response.json()["total"] == expected
    expired = (await client.get("/api/admin/pair-codes?status=expired", headers=headers["root"])).json()
    assert expired["items"][0]["pair_code"] == "400263"
    await db.execute("UPDATE device_claim_tokens SET expires_at = ? WHERE pair_code = '400263'",
                     ((datetime.now() - timedelta(days=31)).isoformat(),))
    await db.commit()
    await create_claim_token(MAC)
    assert (await client.get("/api/admin/pair-codes?q=400263", headers=headers["root"])).json()["total"] == 0


@pytest.mark.parametrize("body", [
    {"mac": "bad"}, {"mac": MAC, "ttl_minutes": 0}, {"mac": MAC, "ttl_minutes": 1441},
    {"mac": MAC, "pair_code": "12"}, {"mac": MAC, "pair_code": "123-456"},
    {"mac": MAC, "pair_code": "<script>"},
])
async def test_invalid_codes_and_expiry_are_rejected(pairing_client, body):
    client, headers = pairing_client
    result = await client.post("/api/admin/pair-codes", headers=headers["root"], json=body)
    assert result.status_code == 422


async def test_list_and_expire_validate_parameters(pairing_client):
    client, headers = pairing_client
    for params in [{"status": "unknown"}, {"page": 0}, {"page_size": 101}]:
        result = await client.get("/api/admin/pair-codes", params=params, headers=headers["root"])
        assert result.status_code == 422
    result = await client.delete("/api/admin/pair-codes/not-an-id", headers=headers["root"])
    assert result.status_code == 422
    result = await client.get("/api/v1/admin/pair-codes", headers=headers["root"])
    assert result.status_code == 200
