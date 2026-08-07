"""Cover suggestions: extract visual search terms from the story, then source
portrait photos from a free-API waterfall (Unsplash -> Pexels -> Pixabay).

Contract (frontend static/api.js):
    get_cover_suggestions(title, passage, n) -> [
        {url, thumb_url, photographer, source, search_term}, ...
    ]

Suggestions are optional garnish: every failure path (no keys, provider down,
LLM dry, weird payloads) degrades to fewer or zero suggestions - never an
exception. The format flow works without this feature.
"""
from __future__ import annotations

import logging
import re

import httpx
from pydantic import BaseModel, Field

from app import config
from app.providers.json_engine import generate_json

logger = logging.getLogger("quietshelf.covers")

_TIMEOUT = 8.0
_PASSAGE_CAP = 2400  # chars sent to the LLM; enough to smell the mood

_TERMS_SYSTEM = (
    "You suggest stock-photo search terms for a book cover. Given a title and "
    "an excerpt, return JSON: {\"terms\": [t1, t2, t3]} - exactly three short "
    "search phrases (2-3 words each) for photographic subjects that capture the "
    "story's setting and mood. Concrete and photographable: places, objects, "
    "weather, light. No character names, no abstract nouns, no adjectives alone."
)

_STOPWORDS = frozenset(
    "a an and are as at be but by for from has he her his i in is it its my of on "
    "or our she so that the their they this to was we were what when where who "
    "will with you your".split()
)


class _Terms(BaseModel):
    terms: list[str] = Field(default_factory=list)


def _fallback_terms(title: str) -> list[str]:
    words = [w for w in re.findall(r"[a-zA-Z']+", title.lower()) if len(w) > 3 and w not in _STOPWORDS]
    terms = [" ".join(words[:2])] if words else []
    terms += ["moody landscape", "morning light window"]
    return terms[:3]


def _extract_terms(title: str, passage: str) -> list[str]:
    if not passage.strip():
        return _fallback_terms(title)
    try:
        user = f"Title: {title}\n\nExcerpt:\n{passage[:_PASSAGE_CAP]}"
        terms = [t.strip() for t in generate_json(_TERMS_SYSTEM, user, _Terms).terms if t and t.strip()]
        if terms:
            logger.info("cover_terms_ok count=%d", len(terms))
            return terms[:3]
    except Exception as exc:  # LLM quota/parse/provider - all non-fatal here
        logger.warning("cover_terms_failed error=%s", type(exc).__name__)
    return _fallback_terms(title)


def _search_unsplash(client: httpx.Client, term: str, n: int) -> list[dict]:
    key = config.unsplash_access_key()
    if not key:
        return []
    resp = client.get(
        "https://api.unsplash.com/search/photos",
        params={"query": term, "per_page": n, "orientation": "portrait", "content_filter": "high"},
        headers={"Authorization": f"Client-ID {key}", "Accept-Version": "v1"},
    )
    resp.raise_for_status()
    return [
        {
            "url": p["urls"]["regular"],
            "thumb_url": p["urls"]["small"],
            "photographer": (p.get("user") or {}).get("name") or "Unknown",
            "source": "Unsplash",
            "search_term": term,
        }
        for p in resp.json().get("results", [])
        if p.get("urls", {}).get("regular")
    ]


def _search_pexels(client: httpx.Client, term: str, n: int) -> list[dict]:
    key = config.pexels_api_key()
    if not key:
        return []
    resp = client.get(
        "https://api.pexels.com/v1/search",
        params={"query": term, "per_page": n, "orientation": "portrait"},
        headers={"Authorization": key},
    )
    resp.raise_for_status()
    return [
        {
            "url": p["src"].get("portrait") or p["src"].get("large"),
            "thumb_url": p["src"].get("medium") or p["src"].get("small"),
            "photographer": p.get("photographer") or "Unknown",
            "source": "Pexels",
            "search_term": term,
        }
        for p in resp.json().get("photos", [])
        if p.get("src")
    ]


def _search_pixabay(client: httpx.Client, term: str, n: int) -> list[dict]:
    key = config.pixabay_api_key()
    if not key:
        return []
    resp = client.get(
        "https://pixabay.com/api/",
        params={
            "key": key, "q": term, "per_page": max(3, n), "orientation": "vertical",
            "image_type": "photo", "safesearch": "true",
        },
    )
    resp.raise_for_status()
    return [
        {
            "url": p.get("largeImageURL") or p.get("webformatURL"),
            "thumb_url": p.get("webformatURL") or p.get("previewURL"),
            "photographer": p.get("user") or "Unknown",
            "source": "Pixabay",
            "search_term": term,
        }
        for p in resp.json().get("hits", [])
        if p.get("largeImageURL") or p.get("webformatURL")
    ]


_SOURCES = (_search_unsplash, _search_pexels, _search_pixabay)


def _search_term(client: httpx.Client, term: str, n: int) -> list[dict]:
    """First source with results wins; each source failure just falls through."""
    for search in _SOURCES:
        try:
            results = search(client, term, n)
            if results:
                return results
        except Exception as exc:  # HTTP/key/payload trouble - try the next source
            logger.warning("cover_source_failed source=%s error=%s", search.__name__, type(exc).__name__)
    return []


def get_cover_suggestions(title: str, passage: str = "", n: int = 3, exact: bool = False) -> list[dict]:
    """Up to n photo suggestions, ideally one per extracted term for variety.
    `exact=True` searches the title verbatim as the single term - used by the
    Thumbnail Studio, whose queries are already search-ready and whose variety
    depends on them reaching the photo APIs UNMANGLED. Term extraction (and
    its static fallback terms) is for book-cover passages only.
    Returns [] when nothing can be sourced. Never raises."""
    n = max(1, min(12, n))
    if exact:
        terms = [title.strip() or "portrait"]
    else:
        terms = _extract_terms(title or "untitled story", passage)
    pools: list[list[dict]] = []
    with httpx.Client(timeout=_TIMEOUT, follow_redirects=True) as client:
        for term in terms:
            pool = _search_term(client, term, n)
            if pool:
                pools.append(pool)
    # Interleave: term1[0], term2[0], term3[0], term1[1], ... dedupe by url.
    out: list[dict] = []
    seen: set[str] = set()
    rank = 0
    while len(out) < n and any(rank < len(p) for p in pools):
        for pool in pools:
            if rank < len(pool) and len(out) < n:
                photo = pool[rank]
                if photo["url"] not in seen:
                    seen.add(photo["url"])
                    out.append(photo)
        rank += 1
    logger.info("cover_suggestions terms=%d returned=%d", len(terms), len(out))
    return out
