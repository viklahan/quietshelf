"""JSON-parsing tests with a mocked provider call."""
from __future__ import annotations

import json

import pytest

from app.mapping import MappingError, _extract_json, map_script
from app.providers import ProviderError, ProviderRateLimited, ProviderTimeout


def test_extract_plain_json(valid_shot_list):
    assert _extract_json(json.dumps(valid_shot_list)) == valid_shot_list


def test_extract_strips_markdown_fences(valid_shot_list):
    fenced = f"```json\n{json.dumps(valid_shot_list)}\n```"
    assert _extract_json(fenced) == valid_shot_list


def test_extract_tolerates_surrounding_commentary(valid_shot_list):
    chatty = f"Here is your shot list:\n{json.dumps(valid_shot_list)}\nHope that helps!"
    assert _extract_json(chatty) == valid_shot_list


def test_extract_raises_on_garbage():
    with pytest.raises(ValueError):
        _extract_json("I'm sorry, I can't do that.")


def test_map_script_happy_path(valid_script, valid_shot_list, monkeypatch):
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: json.dumps(valid_shot_list))
    shot_list = map_script(valid_script)
    assert shot_list.video_title_suggestion == "A Test Title"
    assert len(shot_list.segments) == 1
    assert shot_list.segments[0].search_terms == valid_shot_list["segments"][0]["search_terms"]


def test_map_script_retries_once_then_succeeds(valid_script, valid_shot_list, monkeypatch):
    calls: list[bool] = []

    def fake_call(script: str, retry: bool = False) -> str:
        calls.append(retry)
        return "not json at all" if len(calls) == 1 else json.dumps(valid_shot_list)

    monkeypatch.setattr("app.mapping._call_model", fake_call)
    shot_list = map_script(valid_script)
    assert calls == [False, True]  # second call carries the retry instruction
    assert shot_list.estimated_runtime_seconds == 60


def test_map_script_fails_after_two_bad_responses(valid_script, monkeypatch):
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: "still not json")
    with pytest.raises(MappingError):
        map_script(valid_script)


def test_schema_violation_triggers_retry(valid_script, monkeypatch):
    # Valid JSON but wrong shape must also count as a parse failure.
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: '{"wrong": "shape"}')
    with pytest.raises(MappingError):
        map_script(valid_script)


def test_endpoint_returns_502_on_mapping_failure(client, valid_script, monkeypatch):
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: "garbage")
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 502
    body = response.json()
    assert body["error"] == "mapping_failed"
    assert "unreadable" in body["message"]


def test_endpoint_returns_504_on_timeout(client, valid_script, monkeypatch):
    def fake_timeout(script: str, retry: bool = False) -> str:
        raise ProviderTimeout("model call exceeded 120s")

    monkeypatch.setattr("app.mapping._call_model", fake_timeout)
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 504
    assert response.json()["error"] == "mapping_timeout"


def test_endpoint_returns_429_when_free_tier_rate_limited(client, valid_script, monkeypatch):
    def fake_rate_limited(script: str, retry: bool = False) -> str:
        raise ProviderRateLimited("upstream 429")

    monkeypatch.setattr("app.mapping._call_model", fake_rate_limited)
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 429
    body = response.json()
    assert body["error"] == "rate_limited"
    assert "breather" in body["message"]


def test_endpoint_returns_502_on_provider_error(client, valid_script, monkeypatch):
    def fake_provider_error(script: str, retry: bool = False) -> str:
        raise ProviderError("upstream exploded")

    monkeypatch.setattr("app.mapping._call_model", fake_provider_error)
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 502
    assert response.json()["error"] == "upstream_error"


def test_endpoint_returns_validated_shape(client, valid_script, valid_shot_list, monkeypatch):
    monkeypatch.setattr("app.mapping._call_model", lambda script, retry=False: json.dumps(valid_shot_list))
    response = client.post("/api/map", json={"script": valid_script})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"video_title_suggestion", "estimated_runtime_seconds", "segments"}
    segment = body["segments"][0]
    assert set(segment) == {
        "id", "script_text", "start_time", "end_time",
        "search_terms", "clip_duration_seconds", "mood",
    }
