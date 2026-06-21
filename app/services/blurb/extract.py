"""Read DOCX/RTF/TXT to plain text, and sample long manuscripts to stay within
token limits. Never logs content."""
from __future__ import annotations

import io

from striprtf.striprtf import rtf_to_text


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT."""


def extract_text(data: bytes, ext: str) -> str:
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
