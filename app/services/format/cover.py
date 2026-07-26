"""Generate a simple, elegant typographic cover PNG when the writer supplies
none. Uses the theme's font on a themed background. No external services.

Four looks (CoverStyle), all built from the theme palette (bg = page,
ink = text) plus an optional accent hex the writer picks in the UI:

- quiet: bg field, short accent rule above the title, title in ink in the
  upper third, author small at the bottom.
- frame: bg field, double rectangular border inset from the edge (outer in
  accent, inner thinner at 40% opacity), title centered.
- wash:  vertical gradient from mix(accent 34%, bg) at the top to bg by ~60%
  height; otherwise like quiet.
- band:  full-width accent band from 28%-54% of the height, title centered
  inside the band in bg color, no rule, author at the bottom in ink.

Unknown/missing style or accent fall back to quiet + ink - a cover option
must never fail the format call.
"""
from __future__ import annotations

import io
import re

from PIL import Image, ImageDraw, ImageFont

from app.services.format.models import CoverStyle, Theme
from app.services.format.themes import get_theme

_W, _H = 1600, 2400

# (background RGB, ink RGB) per theme.
_PALETTE: dict[Theme, tuple[tuple[int, int, int], tuple[int, int, int]]] = {
    Theme.classic: ((244, 240, 232), (40, 34, 28)),
    Theme.cozy: ((247, 241, 238), (60, 46, 46)),
    Theme.modern: ((250, 250, 250), (24, 24, 28)),
    Theme.children: ((255, 248, 230), (44, 62, 80)),
}

_HEX_RE = re.compile(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def _mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    """Blend two RGB colors: t=1 -> c1, t=0 -> c2."""
    return tuple(round(a * t + b * (1 - t)) for a, b in zip(c1, c2))


def _parse_style(value: object) -> CoverStyle:
    try:
        return CoverStyle(value) if value else CoverStyle.quiet
    except ValueError:
        return CoverStyle.quiet


def _parse_accent(value: str | None, fallback: tuple[int, int, int]) -> tuple[int, int, int]:
    if not value:
        return fallback
    m = _HEX_RE.match(value.strip())
    if not m:
        return fallback
    hexval = m.group(1)
    if len(hexval) == 3:
        hexval = "".join(ch * 2 for ch in hexval)
    return tuple(int(hexval[i : i + 2], 16) for i in (0, 2, 4))


def _line_width(draw, line, font, tracking):
    extra = tracking * max(0, len(line) - 1)
    return draw.textlength(line, font=font) + extra


def _wrap(draw, text, font, max_width, tracking=0.0):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if _line_width(draw, trial, font, tracking) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def _draw_line(draw, x, y, line, font, fill, tracking):
    if tracking <= 0:
        draw.text((x, y), line, fill=fill, font=font)
        return
    cx = x
    for ch in line:
        draw.text((cx, y), ch, fill=fill, font=font)
        cx += draw.textlength(ch, font=font) + tracking


def generate_cover(
    title: str,
    author: str,
    theme: Theme,
    style: object = CoverStyle.quiet,
    accent: str | None = None,
) -> bytes:
    spec = get_theme(theme)
    bg, ink = _PALETTE[theme]
    look = _parse_style(style)
    accent_rgb = _parse_accent(accent, ink)

    img = Image.new("RGB", (_W, _H), bg)
    draw = ImageDraw.Draw(img)

    band_top, band_bottom = int(_H * 0.28), int(_H * 0.54)

    if look is CoverStyle.wash:
        stop = int(_H * 0.60)
        for y in range(stop):
            draw.line([(0, y), (_W, y)], fill=_mix(accent_rgb, bg, 0.34 * (1 - y / stop)))
    elif look is CoverStyle.band:
        draw.rectangle([0, band_top, _W - 1, band_bottom], fill=accent_rgb)
    elif look is CoverStyle.frame:
        outer = int(_W * 0.015)
        draw.rectangle([outer, outer, _W - 1 - outer, _H - 1 - outer], outline=accent_rgb, width=8)
        inner = outer * 2 + 8
        draw.rectangle(
            [inner, inner, _W - 1 - inner, _H - 1 - inner],
            outline=_mix(accent_rgb, bg, 0.4), width=3,
        )

    # Per-theme title typography, matching the UI previews: classic/cozy serif
    # centered, modern uppercase + letterspaced + left-aligned, children larger
    # centered. The face itself comes from the theme's font files.
    font_file = str(spec.font_paths[0])
    is_modern = theme is Theme.modern
    display_title = title.upper() if is_modern else title
    base_size = 170 if theme is Theme.children else 150

    margin = 180
    max_text_width = _W - 2 * margin
    # Inside the band the title must fit the band or it becomes invisible
    # (bg-on-bg outside the accent area).
    max_block_h = (band_bottom - band_top) - 100 if look is CoverStyle.band else None

    size = base_size
    while True:
        title_font = ImageFont.truetype(font_file, size)
        tracking = size * 0.10 if is_modern else 0.0
        lines = _wrap(draw, display_title, title_font, max_text_width, tracking)
        line_h = int(size * 1.2)
        block_h = line_h * len(lines)
        fits = len(lines) <= 5 and (max_block_h is None or block_h <= max_block_h)
        if fits or size <= 60:
            break
        size -= 10

    if look is CoverStyle.band:
        y = band_top + ((band_bottom - band_top) - block_h) // 2
        title_fill = bg
    elif look is CoverStyle.frame:
        y = (_H - block_h) // 2
        title_fill = ink
    else:  # quiet, wash: upper third
        y = int(_H * 0.18)
        title_fill = ink

    # Short accent rule above the title (quiet and wash only).
    if look in (CoverStyle.quiet, CoverStyle.wash):
        rule_w = 260
        rule_x = margin if is_modern else (_W - rule_w) // 2
        draw.line([(rule_x, y - 90), (rule_x + rule_w, y - 90)], fill=accent_rgb, width=6)

    for line in lines:
        w = _line_width(draw, line, title_font, tracking)
        x = margin if is_modern else (_W - w) / 2
        _draw_line(draw, x, y, line, title_font, title_fill, tracking)
        y += line_h

    # Author, small at the bottom, always in ink.
    author_font = ImageFont.truetype(font_file, 70)
    author_text = author.upper()
    aw = draw.textlength(author_text, font=author_font)
    ax = margin if is_modern else (_W - aw) / 2
    draw.text((ax, _H - 220), author_text, fill=ink, font=author_font)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
