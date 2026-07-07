"""Story Map grounding: the saved map as shared truth for Blurb and Promote.

Covers the cast-sheet renderer (found vs imagined headers, relationship name
resolution, empty map), the tolerant-but-honest parser, and both endpoints:
a good map reaches the engine prompt, a bad one is a clear 422 - never a
silent un-grounded run.
"""
from __future__ import annotations

import json

import pytest

SAMPLE_MAP = {
    "story_detected": True,
    "confidence": "high",
    "fabricated": False,
    "characters": [
        {
            "id": "mara",
            "name": "Mara",
            "role": "protagonist",
            "importance": 5,
            "personality": "Stubborn, tender underneath.",
            "arc": "Learns to stay.",
            "texture": {"appearance": "red coat", "associated_places": "the harbor"},
            "relationships": [{"with": "enn", "type": "sister", "note": "estranged"}],
        },
        {"id": "enn", "name": "Enn", "role": "supporting", "importance": 3},
    ],
}


# --- cast_sheet renderer ----------------------------------------------------

def test_cast_sheet_renders_cast_and_resolves_relationship_names():
    from app.services.storymap.grounding import cast_sheet, parse_map
    sheet = cast_sheet(parse_map(SAMPLE_MAP))
    assert "Mara (protagonist, importance 5/5)" in sheet
    assert "appearance: red coat" in sheet
    assert "places: the harbor" in sheet
    assert "with Enn (sister): estranged" in sheet  # id resolved to a name
    assert "ground truth" in sheet                   # found header
    assert "IMAGINED" not in sheet


def test_cast_sheet_imagined_stamp_travels():
    from app.services.storymap.grounding import cast_sheet, parse_map
    imagined = dict(SAMPLE_MAP, fabricated=True)
    sheet = cast_sheet(parse_map(imagined))
    assert "IMAGINED" in sheet
    assert "NOT a reading of their text" in sheet


def test_cast_sheet_empty_map_grounds_nothing():
    from app.services.storymap.grounding import cast_sheet, parse_map
    assert cast_sheet(parse_map({"story_detected": False, "characters": []})) == ""


# --- parser -----------------------------------------------------------------

def test_parse_map_json_rejects_garbage():
    from app.services.storymap.grounding import MapParseError, parse_map_json
    with pytest.raises(MapParseError):
        parse_map_json("not json at all")
    with pytest.raises(MapParseError):
        parse_map_json('["a", "list"]')
    with pytest.raises(MapParseError):
        parse_map_json('{"characters": [{"name": 42}]}')


def test_parse_map_ignores_extra_keys():
    from app.services.storymap.grounding import parse_map
    m = parse_map(dict(SAMPLE_MAP, some_future_key="ignored"))
    assert m.characters[0].name == "Mara"


# --- blurb endpoint ----------------------------------------------------------

def test_blurb_endpoint_grounds_with_map(client, monkeypatch):
    from app.services.blurb import router as blurb_router_mod
    from app.services.blurb.models import BlurbResult

    captured = {}

    def fake_generate_blurb(text, *, tone, length, cast_context=""):
        captured["cast_context"] = cast_context
        return BlurbResult(
            back_cover="x", taglines=["a", "b", "c"],
            short_description="y", keywords=["z"],
        )

    monkeypatch.setattr(blurb_router_mod, "generate_blurb", fake_generate_blurb)
    resp = client.post("/api/blurb", data={
        "text": "word " * 60,
        "tone": "warm",
        "length": "short",
        "map_json": json.dumps(SAMPLE_MAP),
    })
    assert resp.status_code == 200
    assert "Mara" in captured["cast_context"]


def test_blurb_endpoint_rejects_unreadable_map(client):
    resp = client.post("/api/blurb", data={
        "text": "word " * 60,
        "map_json": "{broken",
    })
    assert resp.status_code == 422
    assert "story map" in resp.json()["detail"].lower()


# --- promote endpoint ---------------------------------------------------------

def test_promote_endpoint_grounds_with_map(client, monkeypatch, valid_script, valid_shot_list):
    from app.services.promote import router as promote_router_mod
    from app.services.promote.models import ShotList

    captured = {}

    def fake_map_script(script, story_map=None):
        captured["story_map"] = story_map
        return ShotList(**valid_shot_list)

    monkeypatch.setattr(promote_router_mod, "map_script", fake_map_script)
    resp = client.post("/api/promote", json={"script": valid_script, "story_map": SAMPLE_MAP})
    assert resp.status_code == 200
    assert captured["story_map"] is not None
    assert captured["story_map"].characters[0].name == "Mara"


def test_promote_endpoint_rejects_unreadable_map(client, valid_script):
    resp = client.post("/api/promote", json={
        "script": valid_script,
        "story_map": {"characters": [{"name": 42}]},
    })
    assert resp.status_code == 422
    assert "story map" in resp.json()["detail"].lower()


def test_promote_endpoint_without_map_stays_ungrounded(client, monkeypatch, valid_script, valid_shot_list):
    from app.services.promote import router as promote_router_mod
    from app.services.promote.models import ShotList

    captured = {}

    def fake_map_script(script, story_map=None):
        captured["story_map"] = story_map
        return ShotList(**valid_shot_list)

    monkeypatch.setattr(promote_router_mod, "map_script", fake_map_script)
    resp = client.post("/api/promote", json={"script": valid_script})
    assert resp.status_code == 200
    assert captured["story_map"] is None


# --- the sheet reaches every chunk's prompt -----------------------------------

def test_map_script_puts_cast_sheet_in_every_chunk_system_prompt(monkeypatch, valid_script):
    from app.services.promote import mapper
    from app.services.promote.models import ChunkResult, ChunkSegment
    from app.services.storymap.grounding import parse_map

    systems = []

    def fake_generate_json(system, user, model):
        systems.append(system)
        return ChunkResult(
            video_title_suggestion="t",
            segments=[ChunkSegment(
                script_text=user, search_terms=["a b", "c d", "e f"],
                clip_duration_seconds=5, mood="calm",
            )],
        )

    monkeypatch.setattr(mapper, "generate_json", fake_generate_json)
    result = mapper.map_script(valid_script, story_map=parse_map(SAMPLE_MAP))
    assert result.segments
    assert systems and all("Mara" in s for s in systems)

    # And without a map, the addendum never leaks into the prompt.
    systems.clear()
    mapper.map_script(valid_script)
    assert systems and all("cast sheet" not in s for s in systems)


# --- anchor terms + per-segment cast (clip consistency) -----------------------

def test_grounded_segments_get_anchor_term_and_cast(monkeypatch):
    """Every segment that names a mapped character gets that character's
    deterministic anchor prepended and the name in cast - and segments that
    name nobody get neither."""
    from app.services.promote import mapper
    from app.services.promote.models import ChunkResult, ChunkSegment
    from app.services.storymap.grounding import parse_map

    script = (
        "Mara walked to the harbor in the cold morning light and waited. "
        "The town slept late and nothing moved on the long grey water. "
    ) * 10

    def fake_generate_json(system, user, model):
        return ChunkResult(
            video_title_suggestion="t",
            segments=[
                ChunkSegment(script_text="Mara walked to the harbor.",
                             search_terms=["woman walking", "harbor morning", "cold light"],
                             clip_duration_seconds=5, mood="calm"),
                ChunkSegment(script_text="The town slept late.",
                             search_terms=["small town", "empty street", "morning fog"],
                             clip_duration_seconds=5, mood="calm"),
            ],
        )

    monkeypatch.setattr(mapper, "generate_json", fake_generate_json)
    result = mapper.map_script(script, story_map=parse_map(SAMPLE_MAP))

    mara_segments = [s for s in result.segments if "Mara" in s.script_text]
    other_segments = [s for s in result.segments if "Mara" not in s.script_text]
    assert mara_segments and other_segments

    anchor = "red coat the harbor"  # appearance + places, deterministic
    for seg in mara_segments:
        assert seg.search_terms[0] == anchor   # same anchor, ranked first, every time
        assert seg.cast == ["Mara"]
        assert len(seg.search_terms) <= 8
    for seg in other_segments:
        assert anchor not in seg.search_terms
        assert seg.cast == []


def test_anchor_term_is_empty_without_texture():
    """No texture, no anchor - nothing is ever inferred from a bare name."""
    from app.services.promote.mapper import _anchor_term
    from app.services.storymap.models import Character
    assert _anchor_term(Character(id="enn", name="Enn")) == ""
