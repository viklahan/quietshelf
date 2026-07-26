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


def _open_cover(data: bytes):
    import io

    from PIL import Image

    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    return Image.open(io.BytesIO(data))


# Classic theme palette (documented in cover.py) and the frontend accent set.
_CLASSIC_BG = (244, 240, 232)
_OXBLOOD = "#7e2b23"
_OXBLOOD_RGB = (126, 43, 35)


def test_generate_cover_accepts_all_styles():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    for style in ("quiet", "frame", "wash", "band"):
        data = generate_cover(
            "The Long Road Home", "Jane Writer", Theme.classic,
            style=style, accent=_OXBLOOD,
        )
        assert data[:8] == b"\x89PNG\r\n\x1a\n", f"style {style} did not return PNG"


def test_band_cover_paints_accent_band():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    img = _open_cover(generate_cover(
        "The Long Road Home", "Jane Writer", Theme.classic,
        style="band", accent=_OXBLOOD,
    ))
    w, h = img.size
    # Band spans 28%-54% of the height, full width: 40% down is inside it.
    assert img.getpixel((5, int(h * 0.40))) == _OXBLOOD_RGB
    # Above the band is still the plain background field.
    assert img.getpixel((5, int(h * 0.10))) == _CLASSIC_BG


def test_frame_cover_draws_accent_border():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    img = _open_cover(generate_cover(
        "The Long Road Home", "Jane Writer", Theme.classic,
        style="frame", accent=_OXBLOOD,
    ))
    w, h = img.size
    # The accent border sits inset near the edge: scan the left strip mid-page.
    strip = [img.getpixel((x, h // 2)) for x in range(0, 120)]
    assert _OXBLOOD_RGB in strip
    # Corner (outside the inset border) is untouched background.
    assert img.getpixel((2, 2)) == _CLASSIC_BG


def test_wash_cover_gradient_top_and_clean_lower_half():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    img = _open_cover(generate_cover(
        "The Long Road Home", "Jane Writer", Theme.classic,
        style="wash", accent=_OXBLOOD,
    ))
    w, h = img.size
    expected_top = tuple(
        round(0.34 * a + 0.66 * b) for a, b in zip(_OXBLOOD_RGB, _CLASSIC_BG)
    )
    assert img.getpixel((10, 0)) == expected_top
    # Gradient is done by ~60% height; below that it's plain background.
    assert img.getpixel((10, int(h * 0.75))) == _CLASSIC_BG


def test_unknown_style_and_bad_accent_fall_back_to_quiet():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    img = _open_cover(generate_cover(
        "The Long Road Home", "Jane Writer", Theme.classic,
        style="banana", accent="not-a-color",
    ))
    w, h = img.size
    # No band, no wash: left edge mid-page is the plain background field.
    assert img.getpixel((5, int(h * 0.40))) == _CLASSIC_BG
    assert img.getpixel((10, 0)) == _CLASSIC_BG


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


def test_format_endpoint_accepts_cover_style_fields(client, sample_docx):
    with open(sample_docx, "rb") as fh:
        response = client.post(
            "/api/format",
            data={
                "title": "My Stories", "author": "Jane Writer", "theme": "classic",
                "cover_style": "band", "cover_accent": "#2e4257",
            },
            files={"file": ("manuscript.docx", fh, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/epub+zip"

    # The generated cover inside the EPUB must actually carry the chosen look:
    # harbor #2e4257 band across 28%-54% height.
    import io
    import zipfile

    from PIL import Image

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        pngs = [n for n in zf.namelist() if n.lower().endswith(".png")]
        assert pngs, "no cover PNG found in EPUB"
        img = Image.open(io.BytesIO(zf.read(pngs[0])))
    w, h = img.size
    assert img.getpixel((5, int(h * 0.40))) == (46, 66, 87)


def test_format_endpoint_never_fails_on_bad_cover_options(client, sample_docx):
    """Unknown/garbage cover options must fall back, never break the format."""
    with open(sample_docx, "rb") as fh:
        response = client.post(
            "/api/format",
            data={
                "title": "My Stories", "author": "Jane Writer", "theme": "classic",
                "cover_style": "banana", "cover_accent": "zzz",
            },
            files={"file": ("manuscript.docx", fh, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
    assert response.status_code == 200


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
