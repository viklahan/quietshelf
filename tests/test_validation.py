"""Request validation, health check, and access-code tests."""
from __future__ import annotations


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "provider": "gemini"}


def test_empty_script_rejected(client):
    response = client.post("/api/map", json={"script": ""})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_whitespace_only_script_rejected(client):
    response = client.post("/api/map", json={"script": "   \n\t  "})
    assert response.status_code == 422


def test_short_script_rejected(client):
    response = client.post("/api/map", json={"script": "only a few words here"})
    assert response.status_code == 422
    assert "100 words" in response.json()["detail"]


def test_long_script_rejected(client):
    response = client.post("/api/map", json={"script": "word " * 3001})
    assert response.status_code == 422
    assert "too long" in response.json()["detail"].lower()
    assert "split it into parts" in response.json()["detail"].lower()


def test_missing_script_field_rejected(client):
    response = client.post("/api/map", json={})
    assert response.status_code == 422


def test_access_code_required_when_set(client, valid_script, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 401


def test_access_code_accepted_when_correct(client, valid_script, valid_shot_list, monkeypatch):
    import json

    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: json.dumps(valid_shot_list))
    response = client.post(
        "/api/map", json={"script": valid_script}, headers={"X-Access-Code": "sekrit"}
    )
    assert response.status_code == 200


def test_rate_limiter_blocks_after_limit():
    from app.ratelimit import RateLimiter

    limiter = RateLimiter(limit=3, window_seconds=3600)
    assert all(limiter.allow("1.2.3.4") for _ in range(3))
    assert not limiter.allow("1.2.3.4")
    assert limiter.allow("5.6.7.8")  # other IPs unaffected
    assert limiter.retry_after_seconds("1.2.3.4") > 0
