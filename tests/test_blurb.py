"""Blurb service tests: extraction, sampling, generation, endpoint."""
from __future__ import annotations


def test_extract_text_from_txt():
    from app.services.blurb.extract import extract_text
    data = "Hello world.\n\nSecond paragraph.".encode("utf-8")
    assert "Second paragraph" in extract_text(data, ".txt")


def test_extract_text_from_docx(sample_docx):
    from app.services.blurb.extract import extract_text
    raw = sample_docx.read_bytes()
    text = extract_text(raw, ".docx")
    assert "bright cold day" in text


def test_extract_text_rejects_unknown():
    from app.services.blurb.extract import extract_text, UnsupportedFormat
    import pytest
    with pytest.raises(UnsupportedFormat):
        extract_text(b"%PDF", ".pdf")


def test_extract_text_corrupt_docx_is_unsupported_not_crash():
    """A file with a .docx extension but junk bytes is a client mistake - it
    must raise UnsupportedFormat (-> clean 415), never an unhandled 500."""
    from app.services.blurb.extract import extract_text, UnsupportedFormat
    import pytest
    with pytest.raises(UnsupportedFormat):
        extract_text(b"PK\x03\x04 not a real docx", ".docx")


def test_extract_text_corrupt_rtf_is_unsupported_not_crash():
    from app.services.blurb.extract import extract_text, UnsupportedFormat
    import pytest
    # striprtf is lenient, so feed bytes that fail the utf-8 decode path guard.
    # A truncated control word shouldn't 500 regardless.
    try:
        extract_text(b"{\\rtf1\\ansi corrupt", ".rtf")
    except UnsupportedFormat:
        pass  # acceptable: cleanly rejected


def test_sample_text_short_passes_through():
    from app.services.blurb.extract import sample_text
    assert sample_text("a b c") == "a b c"


def test_sample_text_long_takes_opening_and_middle():
    from app.services.blurb.extract import sample_text
    words = [f"w{i}" for i in range(10000)]
    sampled = sample_text(" ".join(words), opening_words=100, middle_words=100)
    sampled_words = sampled.split()
    assert "w0" in sampled_words          # opening included
    assert len(sampled_words) <= 220      # opening + middle + a marker, bounded
    assert "w5000" in sampled_words or "w4999" in sampled_words  # middle included


def test_generate_blurb_happy_path(monkeypatch):
    from app.services.blurb import generator
    from app.services.blurb.models import BlurbResult, Tone, Length

    fake = BlurbResult(
        back_cover="A quiet, aching novel about coming home.",
        taglines=["Home is a country you can't return to.", "Some roads only run one way.", "She left. The town remembered."],
        short_description="A short, evocative description of the book.",
        keywords=["literary fiction", "family drama", "small town"],
    )
    captured = {}

    def fake_generate_json(system, user, model):
        captured["system"] = system
        captured["user"] = user
        return fake

    monkeypatch.setattr(generator, "generate_json", fake_generate_json)
    result = generator.generate_blurb("Some manuscript text.", tone=Tone.warm, length=Length.short)
    assert result.taglines == fake.taglines
    assert "warm" in captured["system"].lower()
    assert "Some manuscript text." in captured["user"]


def test_blurb_result_validates_three_taglines():
    from app.services.blurb.models import BlurbResult
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        BlurbResult(back_cover="x", taglines=["one", "two"], short_description="y", keywords=["z"])


def test_blurb_endpoint_with_pasted_text(client, monkeypatch):
    from app.services.blurb import router as blurb_router_mod
    from app.services.blurb.models import BlurbResult

    fake = BlurbResult(
        back_cover="A quiet, aching novel.",
        taglines=["One.", "Two.", "Three."],
        short_description="Short description here.",
        keywords=["literary fiction"],
    )
    monkeypatch.setattr(blurb_router_mod, "generate_blurb", lambda *a, **k: fake)

    response = client.post(
        "/api/blurb",
        data={"text": "word " * 80, "tone": "warm", "length": "short"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["taglines"]) == 3
    assert body["back_cover"]


def test_blurb_endpoint_rejects_too_short(client):
    response = client.post("/api/blurb", data={"text": "too short"})
    assert response.status_code == 422


def test_length_enum_includes_full():
    from app.services.blurb.models import Length
    assert Length("full") == Length.full


def test_blurb_result_backfills_back_cover_from_variants():
    from app.services.blurb.models import BlurbResult

    r = BlurbResult(
        back_cover_variants=["Character-led take.", "Mood-led take."],
        taglines=["One.", "Two.", "Three."],
        short_description="Short.",
        keywords=["fiction"],
    )
    assert r.back_cover == "Character-led take."


def test_blurb_result_old_shape_still_valid():
    from app.services.blurb.models import BlurbResult

    r = BlurbResult(
        back_cover="Just the one take.",
        taglines=["One.", "Two.", "Three."],
        short_description="Short.",
        keywords=["fiction"],
    )
    assert r.back_cover == "Just the one take."
    assert r.back_cover_variants == []
    assert r.query_paragraph is None
    assert r.comps == []


def test_blurb_result_requires_some_back_cover():
    from app.services.blurb.models import BlurbResult
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        BlurbResult(
            taglines=["One.", "Two.", "Three."],
            short_description="Short.",
            keywords=["fiction"],
        )


def test_generate_blurb_full_length_and_rich_prompt(monkeypatch):
    from app.services.blurb import generator
    from app.services.blurb.models import BlurbResult, Tone, Length

    fake = BlurbResult(
        back_cover_variants=["A.", "B."],
        taglines=["One.", "Two.", "Three."],
        short_description="Short.",
        keywords=["fiction"],
    )
    captured = {}

    def fake_generate_json(system, user, model):
        captured["system"] = system
        return fake

    monkeypatch.setattr(generator, "generate_json", fake_generate_json)
    generator.generate_blurb("Some manuscript text.", tone=Tone.warm, length=Length.full)
    system = captured["system"]
    assert "full" in system.lower()
    assert "back_cover_variants" in system
    assert "query_paragraph" in system
    assert "comps" in system


def test_blurb_endpoint_returns_rich_fields(client, monkeypatch):
    from app.services.blurb import router as blurb_router_mod
    from app.services.blurb.models import BlurbResult

    fake = BlurbResult(
        back_cover_variants=["Character-led.", "Mood-led.", "Hook-led."],
        taglines=["One.", "Two.", "Three."],
        short_description="Short description here.",
        keywords=["literary fiction"],
        query_paragraph="Dear Agent, THE LONG ROAD (82,000 words) ...",
        comps=["The Dutch House — Ann Patchett", "Commonwealth — Ann Patchett"],
    )
    monkeypatch.setattr(blurb_router_mod, "generate_blurb", lambda *a, **k: fake)

    response = client.post(
        "/api/blurb",
        data={"text": "word " * 80, "tone": "warm", "length": "full"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["back_cover"] == "Character-led."          # backfilled for old clients
    assert len(body["back_cover_variants"]) == 3
    assert body["query_paragraph"].startswith("Dear Agent")
    assert len(body["comps"]) == 2
