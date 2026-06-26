"""Pre-clean manuscript text before the model sees it: strip non-narrative
STRUCTURE (ASCII tables, code fences, divider rules, box-drawing, diagram art)
while leaving PROSE byte-for-byte intact. This cuts tokens AND sharpens the
signal the model extracts from.

The one rule that keeps this safe: decisions are made on STRUCTURE via a
symbol-to-word ratio, never on a character blocklist. Any line that contains a
real word is prose and is kept exactly as written - em-dashes (—), curly quotes
(" " ' '), apostrophes (don't), accented names (José, Zoë), numbers, currency
($50,000), percentages, and timestamps (2:47 a.m.) all survive untouched. Only
lines that are essentially symbols-with-no-words are removed.

When in doubt we KEEP. A little surviving noise (false-keep) is far cheaper than
destroyed prose (false-strip): over-cleaning produces a WORSE input than the
original, so this filter never does a "strip all non-alphanumeric" pass.
"""
from __future__ import annotations

import re

# A "word" is a run of 2+ letters in ANY script (so José/Zoë/Æsir count). This
# excludes single letters (table cells like "| a | b |"), pure digits, and
# underscores - none of which signal prose on their own.
_WORD_RE = re.compile(r"[^\W\d_]{2,}", re.UNICODE)
# A fenced code block opener/closer: 3+ backticks, possibly indented. Only
# backticks - a run of tildes (~~~~~~) is a divider, not a fence, and is handled
# by the symbol-ratio rule below (so it's stripped as one line without eating
# the prose that follows it).
_FENCE_RE = re.compile(r"^\s*`{3,}")


def _is_structure(line: str) -> bool:
    """True only when a line is non-narrative structure: it carries no real word
    AND is dominated by symbol characters (a divider, table border, or ascii
    art). Lines with any real word, and bare numbers, are never structure."""
    stripped = line.strip()
    if not stripped:
        return False  # blank lines are paragraph structure, handled in sanitize
    if _WORD_RE.search(stripped):
        return False  # contains a real word -> prose -> keep
    non_space = [c for c in stripped if not c.isspace()]
    if not non_space:
        return False
    symbols = [c for c in non_space if not c.isalnum()]
    # No words AND at least half symbols -> structure. An all-digit line (a lone
    # "47" chapter number) has no symbols, so it stays.
    return len(symbols) / len(non_space) >= 0.5


def sanitize(text: str) -> str:
    """Return the manuscript with structural noise removed and whitespace
    normalized; prose lines are preserved (only trailing spaces trimmed)."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    out: list[str] = []
    in_fence = False
    for line in text.split("\n"):
        if _FENCE_RE.match(line):
            in_fence = not in_fence
            continue  # drop the fence marker line itself
        if in_fence:
            continue  # drop fenced code/diagram content wholesale
        if _is_structure(line):
            continue
        out.append(line.rstrip())  # trim trailing whitespace only
    cleaned = "\n".join(out)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)  # collapse big gaps to one break
    return cleaned.strip()
