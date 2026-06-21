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
