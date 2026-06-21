"""Promote service: validation, parsing, and endpoint shape."""
from __future__ import annotations

import json

import pytest

from app.providers.json_engine import JSONParseError


@pytest.fixture()
def _ok(monkeypatch, valid_shot_list):
    """Patch the mapper's generate_json to return a valid shot list."""
    from app.services.promote import mapper
    from app.services.promote.models import ShotList

    monkeypatch.setattr(
        mapper, "generate_json",
        lambda system, user, model: ShotList.model_validate(valid_shot_list),
    )


def test_map_script_happy_path(_ok, valid_script):
    from app.services.promote.mapper import map_script
    result = map_script(valid_script)
    assert result.video_title_suggestion == "A Test Title"
    assert len(result.segments) == 1


def test_endpoint_returns_validated_shape(client, _ok, valid_script):
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"video_title_suggestion", "estimated_runtime_seconds", "segments"}
    segment = body["segments"][0]
    assert set(segment) == {
        "id", "script_text", "start_time", "end_time",
        "search_terms", "clip_duration_seconds", "mood",
    }


def test_endpoint_502_on_parse_failure(client, valid_script, monkeypatch):
    from app.services.promote import mapper

    def boom(system, user, model):
        raise JSONParseError("nope")

    monkeypatch.setattr(mapper, "generate_json", boom)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 502
    assert response.json()["error"] == "generation_failed"


def test_empty_script_rejected(client):
    response = client.post("/api/promote", json={"script": ""})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_short_script_rejected(client):
    response = client.post("/api/promote", json={"script": "only a few words here"})
    assert response.status_code == 422
    assert "100 words" in response.json()["detail"]


def test_long_script_rejected(client):
    response = client.post("/api/promote", json={"script": "word " * 3001})
    assert response.status_code == 422
    assert "too long" in response.json()["detail"].lower()
