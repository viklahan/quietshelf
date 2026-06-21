"""Format service tests: themes, cover, conversion, validation."""
from __future__ import annotations

from app.services.format.themes import THEMES, Theme, get_theme


def test_four_themes_registered():
    assert set(Theme) == {Theme.classic, Theme.cozy, Theme.modern, Theme.children}
    assert len(THEMES) == 4


def test_each_theme_has_display_name_css_and_existing_font():
    for theme in Theme:
        spec = get_theme(theme)
        assert spec.display_name
        assert spec.description
        assert spec.css_path.is_file(), f"missing css for {theme}"
        assert spec.font_paths, f"no fonts for {theme}"
        for font in spec.font_paths:
            assert font.is_file(), f"missing font {font} for {theme}"


def test_get_theme_rejects_unknown():
    import pytest
    with pytest.raises(KeyError):
        get_theme("nonsense")  # type: ignore[arg-type]


def test_generate_cover_returns_png_bytes():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    data = generate_cover("The Long Road Home", "Jane Writer", Theme.classic)
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(data) > 1000


def test_generate_cover_handles_long_title():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    data = generate_cover("A " * 60 + "Very Long Title", "Author Name", Theme.modern)
    assert data[:8] == b"\x89PNG\r\n\x1a\n"


def test_convert_docx_produces_valid_epub(sample_docx, tmp_path):
    from app.services.format.converter import convert_to_epub
    from app.services.format.models import Theme

    out = tmp_path / "book.epub"
    convert_to_epub(
        source=sample_docx, out_path=out,
        title="My Stories", author="Jane Writer", theme=Theme.cozy,
    )
    assert out.is_file()

    import zipfile
    with zipfile.ZipFile(out) as zf:
        names = zf.namelist()
        assert "mimetype" in names
        assert zf.read("mimetype") == b"application/epub+zip"
        assert any(n.endswith("container.xml") for n in names)
        # the embedded theme font is present
        assert any("Newsreader" in n for n in names)
        # at least one chapter/content document exists
        assert any(n.endswith(".xhtml") or n.endswith(".html") for n in names)


def test_convert_txt_with_generated_cover(tmp_path):
    from app.services.format.converter import convert_to_epub
    from app.services.format.models import Theme

    src = tmp_path / "story.txt"
    src.write_text("First paragraph.\n\nSecond paragraph.\n", encoding="utf-8")
    out = tmp_path / "txt.epub"
    convert_to_epub(source=src, out_path=out, title="Plain", author="Anon", theme=Theme.modern)

    import zipfile
    with zipfile.ZipFile(out) as zf:
        names = zf.namelist()
        # pandoc embeds the cover image as a media file and creates a cover
        # page entry; the image itself is named fileN.png (e.g. file0.png)
        # and there is always a cover.xhtml wrapper page
        assert any(n.lower().endswith(".png") for n in names), f"no PNG found in: {names}"
        assert any("cover" in n.lower() for n in names), f"no cover entry found in: {names}"


def test_convert_rejects_unknown_extension(tmp_path):
    from app.services.format.converter import convert_to_epub, UnsupportedFormat
    from app.services.format.models import Theme

    src = tmp_path / "thing.pdf"
    src.write_bytes(b"%PDF-1.4")
    import pytest
    with pytest.raises(UnsupportedFormat):
        convert_to_epub(source=src, out_path=tmp_path / "x.epub",
                        title="X", author="Y", theme=Theme.classic)


def test_validate_epub_rejects_non_epub(tmp_path):
    from app.services.format.converter import validate_epub, EpubValidationError

    bad = tmp_path / "bad.epub"
    bad.write_bytes(b"not a zip")
    import pytest
    with pytest.raises(EpubValidationError):
        validate_epub(bad)


def test_format_endpoint_returns_epub(client, sample_docx):
    with open(sample_docx, "rb") as fh:
        response = client.post(
            "/api/format",
            data={"title": "My Stories", "author": "Jane Writer", "theme": "cozy"},
            files={"file": ("manuscript.docx", fh, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/epub+zip"
    assert response.content[:2] == b"PK"  # zip magic


def test_format_endpoint_rejects_unsupported(client, tmp_path):
    bad = tmp_path / "x.pdf"
    bad.write_bytes(b"%PDF-1.4")
    with open(bad, "rb") as fh:
        response = client.post(
            "/api/format",
            data={"title": "X", "author": "Y", "theme": "classic"},
            files={"file": ("x.pdf", fh, "application/pdf")},
        )
    assert response.status_code == 415
    assert response.json()["error"] == "unsupported_format"
