"""Story Map: sanitizer, two-pass engine, endpoints, and robustness.

Every test mocks the model at the generate_json / engine seam, so the suite is
deterministic and makes no network calls. The robustness assertions encode the
spec's hard guarantees: no test ever produces a 502, an unhandled exception, or
a fabricated character not present in the source.
"""
from __future__ import annotations

import pytest

from app.providers.json_engine import JSONParseError
from app.services.storymap.models import (
    Character,
    EntityScan,
    ImagineMode,
    Relationship,
    StoryMap,
    StoryPrompt,
    StoryPrompts,
    Texture,
)
from app.services.storymap.sanitize import sanitize


# --------------------------------------------------------------------------
# Sanitizer: strip STRUCTURE, preserve PROSE byte-for-byte.
# --------------------------------------------------------------------------
def test_sanitize_preserves_em_dash_and_smart_quotes():
    line = "She paused — then ran. “Don’t,” he said."
    assert line in sanitize(line)


def test_sanitize_preserves_apostrophes_and_contractions():
    line = "Don't, he said. That was Jack's coat."
    assert line in sanitize(line)


def test_sanitize_preserves_accented_names():
    line = "José met Zoë near the café."
    assert line in sanitize(line)


def test_sanitize_preserves_numbers_currency_and_timestamps():
    line = "It was 2:47 a.m. when the $50,000 changed hands — 40% of it gone."
    assert line in sanitize(line)


def test_sanitize_strips_divider_and_box_lines():
    text = "Real prose here.\n=======\n+--------+\n~~~~~~~~\nMore prose."
    cleaned = sanitize(text)
    assert "Real prose here." in cleaned
    assert "More prose." in cleaned
    assert "=======" not in cleaned
    assert "+--------+" not in cleaned
    assert "~~~~~~~~" not in cleaned


def test_sanitize_strips_symbol_only_table_rows():
    text = "Story begins.\n| a | b | c |\nStory continues."
    cleaned = sanitize(text)
    assert "Story begins." in cleaned
    assert "Story continues." in cleaned
    assert "| a | b | c |" not in cleaned


def test_sanitize_strips_fenced_code_blocks():
    text = "Before the code.\n```python\nprint('hello world')\n```\nAfter the code."
    cleaned = sanitize(text)
    assert "Before the code." in cleaned
    assert "After the code." in cleaned
    assert "print('hello world')" not in cleaned


def test_sanitize_keeps_lone_chapter_number():
    # A bare number is not structure - when in doubt, keep.
    assert "47" in sanitize("47").split()


def test_sanitize_keeps_table_row_that_contains_real_words():
    # False-keep is acceptable; we never mangle a line that holds real prose.
    line = "| He waited by the door |"
    assert "He waited by the door" in sanitize(line)


# --------------------------------------------------------------------------
# Engine: normalization + anti-fabrication.
# --------------------------------------------------------------------------
def _patch_map(monkeypatch, story: StoryMap):
    from app.services.storymap import engine

    monkeypatch.setattr(engine, "generate_json", lambda system, user, model: story)


def test_map_story_clamps_importance_and_backfills_ids(monkeypatch):
    from app.services.storymap.engine import map_story

    raw = StoryMap(
        story_detected=True,
        confidence="high",
        characters=[
            Character(id="", name="Jack", importance=9),
            Character(id="c1", name="Mara", importance=0),
            Character(id="c1", name="Duplicate Id", importance=3),  # dup id
        ],
    )
    _patch_map(monkeypatch, raw)
    result = map_story("some story text with enough words to be a story here")

    assert result.story_detected is True
    assert result.characters[0].importance == 5  # clamped down from 9
    assert result.characters[1].importance == 1  # clamped up from 0
    ids = [c.id for c in result.characters]
    assert len(ids) == len(set(ids))  # ids are unique after backfill


def test_map_story_drops_nameless_characters(monkeypatch):
    from app.services.storymap.engine import map_story

    raw = StoryMap(
        story_detected=True,
        confidence="medium",
        characters=[
            Character(id="c1", name="Real Person"),
            Character(id="c2", name="   "),  # nameless noise
        ],
    )
    _patch_map(monkeypatch, raw)
    result = map_story("a story with enough words present to map a character")
    assert [c.name for c in result.characters] == ["Real Person"]


def test_map_story_drops_dangling_relationships_and_resolves_names(monkeypatch):
    """Pointer check: a "with" naming another kept character (by id OR name)
    stays; a pointer to nobody on the map, or to the character itself, is model
    noise and is dropped — never shown to the writer as a raw id."""
    from app.services.storymap.engine import map_story
    from app.services.storymap.models import Relationship

    raw = StoryMap(
        story_detected=True,
        confidence="high",
        characters=[
            Character(
                id="c1", name="Mara",
                relationships=[
                    Relationship(**{"with": "c2", "type": "sibling"}),   # valid id
                    Relationship(**{"with": "Jack", "type": "family"}),  # name -> id
                    Relationship(**{"with": "c9", "type": "other"}),     # dangling
                    Relationship(**{"with": "c1", "type": "self"}),      # self-ref
                    Relationship(**{"with": "  ", "type": "other"}),     # blank
                ],
            ),
            Character(id="c2", name="Jack"),
        ],
    )
    _patch_map(monkeypatch, raw)
    result = map_story("a story with enough words present to map two characters")

    rels = result.characters[0].relationships
    assert [r.with_ for r in rels] == ["c2", "c2"]


def test_imagine_map_keeps_relationships_to_existing_cast(monkeypatch):
    """The imagine engine building around an existing cast may point at those
    characters by name; the pointer survives as the name. Pointers to nobody
    (an id the model dreamed up) still drop."""
    from app.services.storymap import engine
    from app.services.storymap.models import ImagineMode, Relationship

    raw = StoryMap(
        characters=[
            Character(
                id="c1", name="Elara",
                relationships=[
                    Relationship(**{"with": "mara", "type": "confidant"}),  # existing, case-insensitive
                    Relationship(**{"with": "c3", "type": "other"}),        # dangling
                ],
            ),
        ],
    )
    monkeypatch.setattr(engine, "generate_json", lambda system, user, model: raw)
    result = engine.imagine_map(
        "a few lines of material", ImagineMode.seed, existing=["Mara", "Jack"]
    )

    assert result.fabricated is True
    rels = result.characters[0].relationships
    assert [r.with_ for r in rels] == ["Mara"]


def test_map_story_forces_no_story_when_no_usable_characters(monkeypatch):
    """Anti-fabrication: a model claiming a story but giving no real characters
    is overruled - we never surface an invented map."""
    from app.services.storymap.engine import map_story

    raw = StoryMap(story_detected=True, confidence="high", characters=[])
    _patch_map(monkeypatch, raw)
    result = map_story("a block of words that the model wrongly thought was a story")
    assert result.story_detected is False
    assert result.note  # an honest explanation is filled in


# --------------------------------------------------------------------------
# Endpoints.
# --------------------------------------------------------------------------
@pytest.fixture()
def sample_map() -> StoryMap:
    return StoryMap(
        story_detected=True,
        confidence="high",
        note="",
        characters=[
            Character(
                id="c1",
                name="José",
                role="protagonist",
                importance=5,
                personality="Quietly stubborn — carries an old grief.",
                arc="Learns to ask for help.",
                texture=Texture(appearance="tall, greying"),  # other fields None
                relationships=[Relationship(with_="c2", type="sibling", note="raised together")],
            ),
            Character(id="c2", name="Mara", role="supporting", importance=3),
        ],
    )


def test_map_endpoint_returns_validated_shape(client, monkeypatch, sample_map):
    from app.services.storymap import router as router_mod

    monkeypatch.setattr(router_mod, "map_story", lambda text: sample_map)
    response = client.post("/api/storymap/map", data={"text": "word " * 60})
    assert response.status_code == 200
    body = response.json()
    assert body["story_detected"] is True
    assert {c["name"] for c in body["characters"]} == {"José", "Mara"}
    # relationship uses the "with" key (alias), and texture omits unknown fields
    rel = body["characters"][0]["relationships"][0]
    assert rel["with"] == "c2"
    assert set(body["characters"][0]["texture"]) == {"appearance"}


def test_map_endpoint_non_narrative_returns_honest_empty(client, monkeypatch):
    from app.services.storymap import router as router_mod

    empty = StoryMap(story_detected=False, confidence="low", note="Not a narrative.")
    monkeypatch.setattr(router_mod, "map_story", lambda text: empty)
    response = client.post("/api/storymap/map", data={"text": "spec section 4.2 " * 20})
    assert response.status_code == 200
    body = response.json()
    assert body["story_detected"] is False
    assert body["characters"] == []


def test_map_endpoint_parse_failure_is_clean_500_never_502(client, monkeypatch):
    from app.services.storymap import router as router_mod

    def boom(text):
        raise JSONParseError("unreadable")

    monkeypatch.setattr(router_mod, "map_story", boom)
    response = client.post("/api/storymap/map", data={"text": "word " * 60})
    assert response.status_code == 500
    assert response.status_code != 502
    assert response.json()["error"] == "unreadable_map"


def test_scan_endpoint_returns_entities(client, monkeypatch):
    from app.services.storymap import router as router_mod

    monkeypatch.setattr(
        router_mod, "scan_entities",
        lambda text: EntityScan(characters=["Jack"], places=["the harbor"]),
    )
    response = client.post("/api/storymap/scan", data={"text": "word " * 60})
    assert response.status_code == 200
    body = response.json()
    assert body["characters"] == ["Jack"]
    assert body["places"] == ["the harbor"]


def test_scan_endpoint_parse_failure_degrades_to_empty(client, monkeypatch):
    from app.services.storymap import router as router_mod

    def boom(text):
        raise JSONParseError("unreadable")

    monkeypatch.setattr(router_mod, "scan_entities", boom)
    response = client.post("/api/storymap/scan", data={"text": "word " * 60})
    assert response.status_code == 200  # loader never blocks the real map
    assert response.json() == {"characters": [], "places": []}


def test_map_endpoint_empty_input_rejected(client):
    response = client.post("/api/storymap/map", data={"text": ""})
    assert response.status_code == 422


def test_map_endpoint_near_empty_input_rejected(client):
    response = client.post("/api/storymap/map", data={"text": "just three words"})
    assert response.status_code == 422


def test_map_endpoint_too_long_rejected(client):
    response = client.post("/api/storymap/map", data={"text": "word " * 3001})
    assert response.status_code == 422
    assert "3,000" in response.json()["detail"]


def test_map_endpoint_unsupported_file_rejected(client):
    files = {"file": ("manuscript.pdf", b"%PDF-1.4 not a real pdf", "application/pdf")}
    response = client.post("/api/storymap/map", files=files)
    assert response.status_code == 415


def test_health_lists_storymap(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "storymap" in response.json()["services"]


# --------------------------------------------------------------------------
# Fabrication engine ("imagine") - the opt-in escape from a dead end.
# --------------------------------------------------------------------------
def test_map_is_never_fabricated(monkeypatch):
    """The mirror path must always report fabricated=false."""
    from app.services.storymap.engine import map_story

    raw = StoryMap(story_detected=True, confidence="high",
                   characters=[Character(id="c1", name="Real")])
    _patch_map(monkeypatch, raw)
    result = map_story("a real story with enough words to map a character here")
    assert result.fabricated is False


def test_imagine_map_stamps_fabricated_true(monkeypatch):
    from app.services.storymap import engine

    invented = StoryMap(
        story_detected=False,  # model forgot to set it; engine must force true
        confidence="medium",
        fabricated=False,      # model lied; engine must force true
        characters=[Character(id="c1", name="Invented Hero", importance=9)],
    )
    monkeypatch.setattr(engine, "generate_json", lambda s, u, m: invented)
    result = engine.imagine_map("a mood, a place, a feeling", ImagineMode.seed)
    assert result.fabricated is True
    assert result.story_detected is True       # has characters -> a story
    assert result.characters[0].importance == 5  # still normalized/clamped


def test_imagine_prompts_returns_questions(monkeypatch):
    from app.services.storymap import engine

    fake = StoryPrompts(
        note="Some doors to try.",
        prompts=[StoryPrompt(question="Who wants something badly here?", angle="desire drives plot")],
    )
    monkeypatch.setattr(engine, "generate_json", lambda s, u, m: fake)
    result = engine.imagine_prompts("a sparse paragraph of notes")
    assert result.fabricated is True
    assert result.prompts[0].question


def test_imagine_endpoint_seed_mode(client, monkeypatch):
    from app.services.storymap import router as router_mod

    invented = StoryMap(
        story_detected=True, confidence="medium", fabricated=True,
        characters=[Character(id="c1", name="Imagined", role="protagonist", importance=4)],
    )
    monkeypatch.setattr(router_mod, "imagine_map", lambda *a, **k: invented)
    response = client.post("/api/storymap/imagine", data={"text": "a quiet town by the sea", "mode": "seed"})
    assert response.status_code == 200
    body = response.json()
    assert body["fabricated"] is True
    assert body["characters"][0]["name"] == "Imagined"


def test_imagine_endpoint_prompts_mode(client, monkeypatch):
    from app.services.storymap import router as router_mod

    fake = StoryPrompts(note="Try these.", prompts=[StoryPrompt(question="What goes wrong first?")])
    monkeypatch.setattr(router_mod, "imagine_prompts", lambda *a, **k: fake)
    response = client.post("/api/storymap/imagine", data={"text": "notes and a mood", "mode": "prompts"})
    assert response.status_code == 200
    body = response.json()
    assert body["fabricated"] is True
    assert body["prompts"][0]["question"] == "What goes wrong first?"


def test_imagine_endpoint_empty_input_rejected(client):
    response = client.post("/api/storymap/imagine", data={"text": "", "mode": "seed"})
    assert response.status_code == 422


def test_imagine_endpoint_allows_short_input(client, monkeypatch):
    """Imagine is lenient on the low end - it exists to break a dead end - so a
    few words that /map would reject must be accepted here."""
    from app.services.storymap import router as router_mod

    invented = StoryMap(story_detected=True, fabricated=True,
                        characters=[Character(id="c1", name="Spark")])
    monkeypatch.setattr(router_mod, "imagine_map", lambda *a, **k: invented)
    response = client.post("/api/storymap/imagine", data={"text": "rain on tin", "mode": "seed"})
    assert response.status_code == 200


def test_imagine_endpoint_too_long_rejected(client):
    response = client.post("/api/storymap/imagine", data={"text": "word " * 3001, "mode": "full"})
    assert response.status_code == 422
    assert "3,000" in response.json()["detail"]


def test_imagine_endpoint_parse_failure_is_clean_500(client, monkeypatch):
    from app.services.storymap import router as router_mod

    def boom(*a, **k):
        raise JSONParseError("nope")

    monkeypatch.setattr(router_mod, "imagine_map", boom)
    response = client.post("/api/storymap/imagine", data={"text": "a seed of an idea", "mode": "seed"})
    assert response.status_code == 500
    assert response.status_code != 502
    assert response.json()["error"] == "imagine_failed"
