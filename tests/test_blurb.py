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
