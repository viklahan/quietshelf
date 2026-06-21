"""Generate a simple, elegant typographic cover PNG when the writer supplies
none. Uses the theme's font on a themed background. No external services."""
from __future__ import annotations

import io

from PIL import Image, ImageDraw, ImageFont

from app.services.format.models import Theme
from app.services.format.themes import get_theme

_W, _H = 1600, 2400

# (background RGB, ink RGB) per theme.
_PALETTE: dict[Theme, tuple[tuple[int, int, int], tuple[int, int, int]]] = {
    Theme.classic: ((244, 240, 232), (40, 34, 28)),
    Theme.cozy: ((247, 241, 238), (60, 46, 46)),
    Theme.modern: ((250, 250, 250), (24, 24, 28)),
    Theme.children: ((255, 248, 230), (44, 62, 80)),
}


def _wrap(draw, text, font, max_width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def generate_cover(title: str, author: str, theme: Theme) -> bytes:
    spec = get_theme(theme)
    bg, ink = _PALETTE[theme]
    img = Image.new("RGB", (_W, _H), bg)
    draw = ImageDraw.Draw(img)

    font_file = str(spec.font_paths[0])
    title_font = ImageFont.truetype(font_file, 150)
    author_font = ImageFont.truetype(font_file, 70)

    margin = 180
    max_text_width = _W - 2 * margin

    # Shrink title font until it wraps to at most 5 lines.
    size = 150
    while size > 70:
        title_font = ImageFont.truetype(font_file, size)
        lines = _wrap(draw, title, title_font, max_text_width)
        if len(lines) <= 5:
            break
        size -= 10

    line_h = int(size * 1.2)
    block_h = line_h * len(lines)
    y = (_H // 2) - block_h // 2 - 120
    for line in lines:
        w = draw.textlength(line, font=title_font)
        draw.text(((_W - w) / 2, y), line, fill=ink, font=title_font)
        y += line_h

    # Divider rule + author.
    rule_y = y + 80
    draw.line([(margin + 200, rule_y), (_W - margin - 200, rule_y)], fill=ink, width=3)
    author_text = author.upper()
    aw = draw.textlength(author_text, font=author_font)
    draw.text(((_W - aw) / 2, rule_y + 60), author_text, fill=ink, font=author_font)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
