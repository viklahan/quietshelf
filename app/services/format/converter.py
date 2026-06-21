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


def _copyright_html(author: str, year: int) -> str:
    return (
        "<div style=\"page-break-before: always; text-align: center; "
        "margin-top: 35%;\">"
        f"<p>Copyright &#169; {year} {author}</p>"
        "<p>All rights reserved.</p>"
        "</div>"
    )


def _prepare_input(source: Path, workdir: Path) -> tuple[Path, str]:
    """Return (input_path, pandoc_format) for the source file."""
    ext = source.suffix.lower()
    if ext == ".docx":
        return source, "docx"
    if ext == ".txt":
        return source, "markdown"
    if ext == ".rtf":
        text = rtf_to_text(source.read_text(encoding="utf-8", errors="ignore"))
        md = workdir / "from_rtf.md"
        md.write_text(text, encoding="utf-8")
        return md, "markdown"
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
        cover_path.write_bytes(cover_image if cover_image else generate_cover(title, author, theme))

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

        copyright_file = workdir / "copyright.html"
        copyright_file.write_text(_copyright_html(safe_author, year), encoding="utf-8")

        extra_args = [
            "--standalone",
            "--toc",
            "--toc-depth=2",
            "--split-level=1",
            f"--metadata-file={meta}",
            f"--css={spec.css_path}",
            f"--epub-cover-image={cover_path}",
            f"--include-before-body={copyright_file}",
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
