"""Blurb ingestion: shared file reading plus long-manuscript sampling.

The DOCX/RTF/TXT reader now lives in app.ingest so every service shares one
implementation; this module re-exports it and adds blurb's sampling helper.
Never logs content.
"""
from __future__ import annotations

from app.ingest import UnsupportedFormat, extract_text

__all__ = ["UnsupportedFormat", "extract_text", "sample_text"]


def sample_text(text: str, *, opening_words: int = 1200, middle_words: int = 800) -> str:
    """For a full manuscript, send the opening plus a middle chunk - enough for
    the model to infer voice, genre, and stakes without blowing the token budget."""
    words = text.split()
    if len(words) <= opening_words + middle_words:
        return text
    opening = words[:opening_words]
    mid_start = len(words) // 2 - middle_words // 2
    middle = words[mid_start : mid_start + middle_words]
    return " ".join(opening) + "\n\n[...]\n\n" + " ".join(middle)
