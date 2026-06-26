"""CLI smoke tests via Typer's CliRunner. Providers/engines are mocked."""
from __future__ import annotations

from typer.testing import CliRunner

from app.cli import app

runner = CliRunner()


def test_themes_command_lists_four():
    result = runner.invoke(app, ["themes"])
    assert result.exit_code == 0
    assert "Classic Literary" in result.stdout
    assert "Children's" in result.stdout


def test_health_command(monkeypatch):
    result = runner.invoke(app, ["health"])
    assert result.exit_code == 0
    assert "gemini" in result.stdout.lower()


def test_promote_command_writes_json(tmp_path, monkeypatch, valid_shot_list):
    from app.services.promote import mapper
    from app.services.promote.models import ShotList
    monkeypatch.setattr(mapper, "generate_json", lambda s, u, m: ShotList.model_validate(valid_shot_list))

    script = tmp_path / "s.txt"
    script.write_text(("the quick brown fox jumps over the lazy dog again " * 15), encoding="utf-8")
    out = tmp_path / "shotlist.json"
    result = runner.invoke(app, ["promote", str(script), "--out", str(out)])
    assert result.exit_code == 0
    assert out.is_file()
    assert "video_title_suggestion" in out.read_text(encoding="utf-8")


def test_format_command_writes_epub(tmp_path, sample_docx):
    out = tmp_path / "book.epub"
    result = runner.invoke(
        app,
        ["format", str(sample_docx), "--title", "My Stories", "--author", "Jane", "--theme", "cozy", "--out", str(out)],
    )
    assert result.exit_code == 0
    assert out.is_file()
    assert out.read_bytes()[:2] == b"PK"


def test_format_command_unsupported_file_fails_friendly(tmp_path):
    bad = tmp_path / "thing.pdf"
    bad.write_bytes(b"%PDF-1.4")
    result = runner.invoke(
        app,
        ["format", str(bad), "--title", "X", "--author", "Y", "--theme", "classic"],
    )
    assert result.exit_code != 0
    assert result.exception is None or isinstance(result.exception, SystemExit)  # no raw traceback


def test_storymap_command_writes_json(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    import app.cli as cli
    from app.services.storymap.models import Character, Relationship, StoryMap

    fake = StoryMap(
        story_detected=True,
        confidence="high",
        characters=[
            Character(id="c1", name="Jack", role="protagonist", importance=5,
                      relationships=[Relationship(with_="c2", type="sibling", note="raised together")]),
            Character(id="c2", name="Mara", role="supporting", importance=2),
        ],
    )
    monkeypatch.setattr(cli, "map_story", lambda text: fake)

    script = tmp_path / "story.txt"
    script.write_text("Jack and Mara grew up together in a small grey town by the sea.", encoding="utf-8")
    out = tmp_path / "map.json"
    result = runner.invoke(app, ["storymap", str(script), "--out", str(out)])
    assert result.exit_code == 0, result.stdout
    assert out.is_file()
    text = out.read_text(encoding="utf-8")
    assert "story_detected" in text
    assert '"with": "c2"' in text  # relationship serialized with the alias


def test_storymap_command_unsupported_file_fails_friendly(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    bad = tmp_path / "thing.pdf"
    bad.write_bytes(b"%PDF-1.4")
    result = runner.invoke(app, ["storymap", str(bad)])
    assert result.exit_code != 0
    assert result.exception is None or isinstance(result.exception, SystemExit)  # no raw traceback


def test_blurb_command_unsupported_file_fails_friendly(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    bad = tmp_path / "thing.pdf"
    bad.write_bytes(b"%PDF-1.4")
    result = runner.invoke(app, ["blurb", str(bad)])
    assert result.exit_code != 0
    assert result.exception is None or isinstance(result.exception, SystemExit)  # no raw traceback
