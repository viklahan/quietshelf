"""Shared manuscript ingestion: read DOCX / RTF / TXT to plain text.

This is the single home for upload reading, so every service (Blurb, Story Map,
...) ingests files identically instead of each keeping its own copy. Content is
never logged. PDF is deliberately unsupported for now.
"""
from __future__ import annotations

import io
from zipfile import BadZipFile

from striprtf.striprtf import rtf_to_text


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT, or its contents are not a
    readable file of that type (right extension, corrupt or fake bytes)."""


def extract_text(data: bytes, ext: str) -> str:
    """Decode an uploaded manuscript to plain text by extension. A file whose
    extension we support but whose bytes we cannot parse (a corrupt or renamed
    file) raises UnsupportedFormat - a client mistake the routers turn into a
    clean 415, never an unhandled 500."""
    ext = ext.lower()
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".rtf":
        try:
            return rtf_to_text(data.decode("utf-8", errors="ignore"))
        except Exception as exc:
            raise UnsupportedFormat(
                "That .rtf file couldn't be read - it may be corrupt. Try re-exporting it."
            ) from exc
    if ext == ".docx":
        from docx import Document
        from docx.opc.exceptions import PackageNotFoundError

        try:
            doc = Document(io.BytesIO(data))
            return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except (PackageNotFoundError, BadZipFile, KeyError, ValueError, OSError) as exc:
            raise UnsupportedFormat(
                "That .docx file couldn't be read - it may be corrupt or not a real Word file. "
                "Try re-saving it from Word, or paste the text instead."
            ) from exc
    raise UnsupportedFormat(
        f"Unsupported file type '{ext}'. Please upload a DOCX, RTF, or TXT file."
    )
