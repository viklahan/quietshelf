"""App-level tests: health, access code, rate limiter, themes endpoint."""
from __future__ import annotations


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider"] == "gemini"
    assert set(body["services"]) == {"format", "blurb", "promote", "storymap", "scout"}


def test_themes_endpoint_lists_four(client):
    response = client.get("/api/format/themes")
    assert response.status_code == 200
    themes = response.json()["themes"]
    assert len(themes) == 4
    assert {t["id"] for t in themes} == {"classic", "cozy", "modern", "children"}


def test_access_code_required_when_set(client, valid_script, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 401


def test_access_code_accepted_when_correct(client, valid_script, valid_shot_list, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    from app.services.promote import mapper
    from app.services.promote.models import ShotList
    monkeypatch.setattr(mapper, "generate_json", lambda s, u, m: ShotList.model_validate(valid_shot_list))
    response = client.post("/api/promote", json={"script": valid_script}, headers={"X-Access-Code": "sekrit"})
    assert response.status_code == 200


def test_rate_limiter_blocks_after_limit():
    from app.ratelimit import RateLimiter
    limiter = RateLimiter(limit=3, window_seconds=3600)
    assert all(limiter.allow("1.2.3.4") for _ in range(3))
    assert not limiter.allow("1.2.3.4")
    assert limiter.allow("5.6.7.8")
    assert limiter.retry_after_seconds("1.2.3.4") > 0


def test_permanent_provider_failure_does_not_promise_a_retry():
    """When every waterfall leg died a PERMANENT death (dead key, unpaid
    account, exhausted daily quota), the waterfall sets exc.permanent. Telling
    the writer "try again in a minute" is then simply false — the cooldown
    alone is 10 minutes and a dead key never heals on its own. Regression for
    2026-08-19, where this message sent the owner hunting a dead server while
    the real fault was an expired Groq key."""
    from app.http_errors import llm_error_to_response
    from app.providers import ProviderError

    exc = ProviderError("All waterfall providers failed: groq: 401; cerebras: 402")
    exc.permanent = True

    response = llm_error_to_response(
        exc, failure_code="generation_failed", failure_msg="unused"
    )
    import json

    body = json.loads(response.body)
    assert response.status_code == 503
    assert body["error"] == "upstream_down"
    assert "minute" not in body["message"].lower()


def test_transient_provider_failure_still_says_try_again():
    """A plain upstream hiccup has no .permanent flag and must keep the
    original retryable 502 — only the permanent case changes."""
    from app.http_errors import llm_error_to_response
    from app.providers import ProviderError

    response = llm_error_to_response(
        ProviderError("upstream 500"),
        failure_code="generation_failed",
        failure_msg="unused",
    )
    import json

    body = json.loads(response.body)
    assert response.status_code == 502
    assert body["error"] == "upstream_error"
    assert "minute" in body["message"].lower()
