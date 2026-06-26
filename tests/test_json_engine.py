"""Defensive JSON parsing + one-retry tests, provider mocked at the seam."""
from __future__ import annotations

import json

import pytest
from pydantic import BaseModel

from app.providers import json_engine
from app.providers.json_engine import JSONParseError, _extract_json, generate_json


class _Model(BaseModel):
    a: int
    b: str


def _patch_provider(monkeypatch, *responses):
    """Make get_provider() return a fake whose generate() yields each response."""
    calls = {"n": 0, "systems": []}

    class _Fake:
        name = "fake"

        def generate(self, system_prompt, user_content, json_mode=True):
            calls["systems"].append(system_prompt)
            i = calls["n"]
            calls["n"] += 1
            value = responses[min(i, len(responses) - 1)]
            if isinstance(value, Exception):
                raise value
            return value

    monkeypatch.setattr(json_engine, "get_provider", lambda: _Fake())
    return calls


def test_extract_plain_json():
    assert _extract_json('{"a": 1, "b": "x"}') == {"a": 1, "b": "x"}


def test_extract_strips_markdown_fences():
    assert _extract_json('```json\n{"a": 1, "b": "x"}\n```') == {"a": 1, "b": "x"}


def test_extract_tolerates_surrounding_commentary():
    chatty = 'Sure!\n{"a": 1, "b": "x"}\nHope that helps!'
    assert _extract_json(chatty) == {"a": 1, "b": "x"}


def test_extract_raises_on_garbage():
    with pytest.raises(ValueError):
        _extract_json("I'm sorry, I can't do that.")


def test_generate_json_happy_path(monkeypatch):
    _patch_provider(monkeypatch, '{"a": 1, "b": "x"}')
    result = generate_json("system", "user", _Model)
    assert result == _Model(a=1, b="x")


def test_generate_json_retries_once_then_succeeds(monkeypatch):
    calls = _patch_provider(monkeypatch, "not json", '{"a": 2, "b": "y"}')
    result = generate_json("system", "user", _Model)
    assert result == _Model(a=2, b="y")
    assert calls["systems"][0] == "system"
    assert json_engine.RETRY_INSTRUCTION in calls["systems"][1]


def test_generate_json_fails_after_two_bad_responses(monkeypatch):
    _patch_provider(monkeypatch, "still not json")
    with pytest.raises(JSONParseError):
        generate_json("system", "user", _Model)


def test_generate_json_schema_violation_triggers_retry_then_fails(monkeypatch):
    _patch_provider(monkeypatch, '{"wrong": "shape"}')
    with pytest.raises(JSONParseError):
        generate_json("system", "user", _Model)


# --- repair ladder --------------------------------------------------------
def test_extract_repairs_trailing_comma():
    assert _extract_json('{"a": 1, "b": "x",}') == {"a": 1, "b": "x"}


def test_extract_repairs_trailing_comma_in_nested_array():
    assert _extract_json('{"a": 1, "b": "x", "c": [1, 2,]}') == {
        "a": 1, "b": "x", "c": [1, 2]
    }


def test_extract_strips_stray_control_characters():
    # A NUL byte sneaks into otherwise-valid JSON; repair removes it.
    assert _extract_json('{"a": 1,\x00 "b": "x"}') == {"a": 1, "b": "x"}


def test_extract_still_raises_on_unrecoverable_garbage():
    with pytest.raises(ValueError):
        _extract_json("I'm sorry, I can't do that.")


def test_generate_json_succeeds_via_repair_without_retry(monkeypatch):
    # Trailing comma alone must be fixed in-place, not cost a second model call.
    calls = _patch_provider(monkeypatch, '{"a": 1, "b": "x",}')
    result = generate_json("system", "user", _Model)
    assert result == _Model(a=1, b="x")
    assert len(calls["systems"]) == 1  # repaired on the first response
