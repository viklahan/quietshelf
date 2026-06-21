"""Theme registry: each theme is a display name + description + CSS + OFL font
files. CSS and fonts live under theme_assets/. Source Serif 4 and Newsreader
are reused from the repo's existing vendored fonts; EB Garamond and Quicksand
are vendored under theme_assets/fonts/ (all OFL, free for commercial use)."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.services.format.models import Theme

ASSETS = Path(__file__).resolve().parent / "theme_assets"
CSS_DIR = ASSETS / "css"
FONT_DIR = ASSETS / "fonts"


@dataclass(frozen=True)
class ThemeSpec:
    id: Theme
    display_name: str
    description: str
    css_path: Path
    font_paths: tuple[Path, ...]


THEMES: dict[Theme, ThemeSpec] = {
    Theme.classic: ThemeSpec(
        Theme.classic,
        "Classic Literary",
        "Warm, timeless serif. The look of a hardback novel.",
        CSS_DIR / "classic.css",
        (FONT_DIR / "EBGaramond-Regular.ttf", FONT_DIR / "EBGaramond-Italic.ttf"),
    ),
    Theme.cozy: ThemeSpec(
        Theme.cozy,
        "Cozy",
        "Soft, gentle serif for mellow and emotional stories.",
        CSS_DIR / "cozy.css",
        (FONT_DIR / "Newsreader-Regular.ttf", FONT_DIR / "Newsreader-Italic.ttf"),
    ),
    Theme.modern: ThemeSpec(
        Theme.modern,
        "Modern Clean",
        "Crisp, humanist serif. Clean and contemporary.",
        CSS_DIR / "modern.css",
        (FONT_DIR / "SourceSerif4-Regular.ttf", FONT_DIR / "SourceSerif4-Italic.ttf"),
    ),
    Theme.children: ThemeSpec(
        Theme.children,
        "Children's",
        "Rounded, friendly face for younger readers.",
        CSS_DIR / "children.css",
        (FONT_DIR / "Quicksand-Regular.ttf", FONT_DIR / "Quicksand-Bold.ttf"),
    ),
}


def get_theme(theme: Theme) -> ThemeSpec:
    if theme not in THEMES:
        raise KeyError(f"unknown theme: {theme}")
    return THEMES[theme]
