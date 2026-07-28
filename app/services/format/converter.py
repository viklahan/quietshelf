"""EPUB conversion pipeline. Pandoc (bundled via pypandoc_binary) does the
heavy lifting; we add theme CSS, embedded fonts, metadata, cover, copyright
page, and a structural validity check. Temp files are always cleaned up.

DOCX is the rich path. RTF cannot be read by pandoc, so we extract its text
with striprtf and feed markdown. TXT is treated as markdown (blank lines =
paragraph breaks). Logs carry counts/theme only, never manuscript content.
"""
from __future__ import annotations

import datetime
import logging
import re
import shutil
import tempfile
import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import pypandoc
from striprtf.striprtf import rtf_to_text

from app.services.format.cover import generate_cover
from app.services.format.models import Theme
from app.services.format.themes import get_theme

logger = logging.getLogger("quietshelf.format")

SUPPORTED = {".docx", ".rtf", ".txt"}


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT."""


class EpubValidationError(Exception):
    """The produced file is not a well-formed EPUB."""


# ---------------------------------------------------------------------------
# Chapter heading normaliser
# ---------------------------------------------------------------------------
# Writers produce chapter headings in many forms.  Pandoc splits EPUB files
# at H1 boundaries (--split-level=1), so anything that doesn't arrive as a
# markdown H1 ends up in the previous chapter's XHTML file, causing the
# "chapter starts mid-page" bug.
#
# Patterns we recognise and promote to `# …`:
#   CHAPTER ONE / CHAPTER 1 / CHAPTER I  (all-caps or title-case, optional colon)
#   Chapter One / chapter one
#   Ch. 7 / CH 7
#   Part I / PART TWO
#   Prologue / Epilogue / Introduction / Preface (standalone)
#   ## already-an-h2 heading  (demoted to H1 so split-level=1 catches it)
#   Any standalone line ≤ 60 chars followed by a blank line and ≥ 50 words
#   of prose (heuristic: looks like an untitled chapter break)
#
# Only plain-text / markdown paths are normalised; DOCX headings are already
# semantic and Pandoc reads them correctly via its native DOCX reader.

_CHAPTER_RE = re.compile(
    r'''
    ^
    (?:
        # explicit chapter/part keywords
        (?:chapter|ch\.?|part)\s+
        (?:[IVXLCDM]+|\d+|[a-z]+)
        (?:[:\s].*)?
      |
        # standalone structural words; a subtitle only after a colon —
        # a bare space would swallow prose like "Prologue prose."
        (?:prologue|epilogue|introduction|preface|afterword
           |interlude|coda|foreword|acknowledgements?|dedication)
        (?::.*)?
    )
    $
    ''',
    re.IGNORECASE | re.VERBOSE,
)


def _normalise_chapters(text: str) -> str:
    """Promote chapter headings to markdown H1 so Pandoc splits on them.

    Patterns handled:
    - CHAPTER ONE / Chapter 7 / chapter i / Ch. 3 (with optional subtitle)
    - Part I / PART TWO
    - Prologue / Epilogue / Introduction / Preface / Afterword etc.
    - ## H2 or ### H3 headings promoted to H1
    - Existing # H1 headings passed through unchanged

    Each detected heading gets a blank line before and after so Pandoc
    never runs heading text into adjacent prose. Consecutive blank lines
    are collapsed to one.
    """
    lines = text.splitlines()
    out: list[str] = []

    def ensure_blank_before() -> None:
        if out and out[-1] != '':
            out.append('')

    for raw in lines:
        stripped = raw.strip()

        # Already H1 — keep exactly, but ensure blank lines around it
        if re.match(r'^#\s+', stripped):
            ensure_blank_before()
            out.append(stripped)
            out.append('')
            continue

        # H2 / H3 — extract the heading text, promote to H1
        m = re.match(r'^#{2,3}\s+(.+)', stripped)
        if m:
            ensure_blank_before()
            out.append(f'# {m.group(1).strip()}')
            out.append('')
            continue

        # Plain-text chapter heading
        if _CHAPTER_RE.match(stripped):
            ensure_blank_before()
            out.append(f'# {stripped}')
            out.append('')
            continue

        # Blank line — collapse consecutive blanks to one
        if stripped == '':
            if out and out[-1] != '':
                out.append('')
            continue

        out.append(raw)

    while out and out[-1] == '':
        out.pop()
    return '\n'.join(out) + '\n'


def _prepare_input(source: Path, workdir: Path) -> tuple[Path, str]:
    """Return (input_path, pandoc_format) for the source file.

    TXT and RTF inputs pass through _normalise_chapters first so that
    common chapter heading patterns become proper H1s before Pandoc sees
    the file.  DOCX is left untouched — Pandoc reads its heading styles
    natively and already handles split-level=1 correctly.
    """
    ext = source.suffix.lower()
    if ext == ".docx":
        return source, "docx"
    if ext == ".txt":
        raw = source.read_text(encoding="utf-8", errors="ignore")
        normalised = workdir / "normalised.md"
        normalised.write_text(_normalise_chapters(raw), encoding="utf-8")
        return normalised, "markdown"
    if ext == ".rtf":
        text = rtf_to_text(source.read_text(encoding="utf-8", errors="ignore"))
        normalised = workdir / "from_rtf.md"
        normalised.write_text(_normalise_chapters(text), encoding="utf-8")
        return normalised, "markdown"
    raise UnsupportedFormat(
        f"Unsupported file type '{ext}'. Please upload a DOCX, RTF, or TXT file."
    )


def validate_epub(path: Path) -> None:
    """Structural check: valid zip, correct stored mimetype, parseable
    container.xml and OPF. (Lightweight - not full epubcheck.)"""
    if not zipfile.is_zipfile(path):
        raise EpubValidationError("Output is not a valid EPUB (not a zip archive).")
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        if "mimetype" not in names or zf.read("mimetype") != b"application/epub+zip":
            raise EpubValidationError("EPUB mimetype entry is missing or wrong.")
        container = "META-INF/container.xml"
        if container not in names:
            raise EpubValidationError("EPUB is missing META-INF/container.xml.")
        try:
            root = ET.fromstring(zf.read(container))
        except ET.ParseError as exc:
            raise EpubValidationError("EPUB container.xml is not valid XML.") from exc
        ns = {"c": "urn:oasis:names:tc:opendocument:xmlns:container"}
        rootfile = root.find(".//c:rootfile", ns)
        if rootfile is None:
            raise EpubValidationError("EPUB container.xml has no rootfile.")
        opf_path = rootfile.get("full-path")
        if not opf_path or opf_path not in names:
            raise EpubValidationError("EPUB OPF file is missing.")
        try:
            ET.fromstring(zf.read(opf_path))
        except ET.ParseError as exc:
            raise EpubValidationError("EPUB OPF is not valid XML.") from exc


def convert_to_epub(
    *,
    source: Path,
    out_path: Path,
    title: str,
    author: str,
    theme: Theme,
    cover_image: bytes | None = None,
    cover_style: str | None = None,
    cover_accent: str | None = None,
) -> Path:
    """Convert a manuscript to a themed, validated EPUB at out_path."""
    if source.suffix.lower() not in SUPPORTED:
        raise UnsupportedFormat(
            f"Unsupported file type '{source.suffix}'. Upload a DOCX, RTF, or TXT file."
        )
    spec = get_theme(theme)
    year = datetime.date.today().year
    workdir = Path(tempfile.mkdtemp(prefix="quietshelf_"))
    try:
        input_path, pandoc_fmt = _prepare_input(source, workdir)

        # Cover: supplied bytes, else generated typographic PNG.
        cover_path = workdir / "cover.png"
        cover_path.write_bytes(
            cover_image
            if cover_image
            else generate_cover(title, author, theme, style=cover_style, accent=cover_accent)
        )

        # Metadata YAML for pandoc.
        meta = workdir / "meta.yaml"
        safe_title = title.replace('"', "'")
        safe_author = author.replace('"', "'")
        meta.write_text(
            "---\n"
            f'title: "{safe_title}"\n'
            f'author: "{safe_author}"\n'
            "lang: en\n"
            f'identifier: "urn:uuid:{uuid.uuid4()}"\n'
            f'date: "{year}"\n'
            f'rights: "Copyright © {year} {safe_author}. All rights reserved."\n'
            "---\n",
            encoding="utf-8",
        )

        # No injected copyright block: the rights metadata above puts the
        # copyright line on pandoc's title page. --include-before-body would
        # glue it into the first chapter file instead (mid-page chapter one,
        # duplicated rights, drop cap on the word "Copyright").
        extra_args = [
            "--standalone",
            "--toc",
            "--toc-depth=2",
            "--split-level=1",
            f"--metadata-file={meta}",
            f"--css={spec.css_path}",
            f"--epub-cover-image={cover_path}",
        ]
        for font in spec.font_paths:
            extra_args.append(f"--epub-embed-font={font}")

        pypandoc.convert_file(
            str(input_path),
            to="epub",
            format=pandoc_fmt,
            outputfile=str(out_path),
            extra_args=extra_args,
        )
        validate_epub(out_path)
        logger.info(
            "format_complete theme=%s source_ext=%s size_bytes=%d",
            theme.value, source.suffix.lower(), out_path.stat().st_size,
        )
        return out_path
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
