"""Shared manuscript ingestion: read DOCX / RTF / TXT to plain text.

This is the single home for upload reading, so every service (Blurb, Story Map,
...) ingests files identically instead of each keeping its own copy. Content is
never logged. PDF is deliberately unsupported for now.
"""
from __future__ import annotations

import io

from striprtf.striprtf import rtf_to_text


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT."""


def extract_text(data: bytes, ext: str) -> str:
    """Decode an uploaded manuscript to plain text by extension."""
    ext = ext.lower()
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".rtf":
        return rtf_to_text(data.decode("utf-8", errors="ignore"))
    if ext == ".docx":
        from docx import Document

        doc = Document(io.BytesIO(data))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    raise UnsupportedFormat(
        f"Unsupported file type '{ext}'. Please upload a DOCX, RTF, or TXT file."
    )
