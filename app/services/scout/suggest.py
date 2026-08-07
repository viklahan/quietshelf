"""Search-suggestion harvesting: what people TYPE, not what they post.

Google and YouTube both expose their autocomplete endpoints publicly
(client=firefox returns clean JSON; ds=yt scopes to YouTube). We fan a few
seed phrases through question-shaped prefixes and collect the completions -
arguably the purest question signal there is, since nobody performs for an
audience in a search bar.

Keyless, polite (tiny requests, cached an hour), and capped hard.
"""
from __future__ import annotations

import logging
import time

import httpx

logger = logging.getLogger("quietshelf.scout")

MAX_SEEDS = 4
PREFIXES = ["", "why ", "how to stop ", "is it normal "]
# Every engine here exposes a keyless "Firefox format" suggest endpoint that
# returns [query, [suggestions, ...]]. Only the URL and the name of the query
# parameter differ. Five engines = five phrasings of the same human ache:
# Google (wondering), YouTube (wanting it explained), Bing/Yahoo (an older
# crowd's words), Yandex (questions without the American cultural filter).
ENGINES = {
    "google": {"url": "https://suggestqueries.google.com/complete/search", "qkey": "q", "params": {"client": "firefox"}},
    "youtube": {"url": "https://suggestqueries.google.com/complete/search", "qkey": "q", "params": {"client": "firefox", "ds": "yt"}},
    "bing": {"url": "https://api.bing.com/osjson.aspx", "qkey": "query", "params": {}},
    "yahoo": {"url": "https://search.yahoo.com/sugg/ff", "qkey": "command", "params": {"output": "fxjson"}},
    "yandex": {"url": "https://suggest.yandex.com/suggest-ff.cgi", "qkey": "part", "params": {}},
}
CACHE_TTL = 3600

_cache: dict[str, tuple[float, list[str]]] = {}


def fetch_suggestions(client: httpx.Client, engine: str, query: str) -> list[str]:
    key = f"{engine}:{query}"
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]
    cfg = ENGINES[engine]
    params = dict(cfg["params"])
    params[cfg["qkey"]] = query
    r = client.get(cfg["url"], params=params, timeout=8,
                   headers={"User-Agent": "QuietShelf-Scout/1.0 (writer research tool)"})
    r.raise_for_status()
    payload = r.json()
    suggestions = [s for s in (payload[1] if isinstance(payload, list) and len(payload) > 1 else []) if isinstance(s, str)]
    _cache[key] = (now, suggestions)
    return suggestions


def gather(seeds: list[str]) -> dict:
    """Fan seeds x prefixes x engines; dedupe; build a MATERIAL section."""
    seeds = [s.strip() for s in seeds if s.strip()][:MAX_SEEDS]
    if not seeds:
        return {"section": "", "count": 0, "errors": []}

    collected: dict[str, list[str]] = {e: [] for e in ENGINES}
    seen: set[str] = set()
    errors: list[str] = []
    with httpx.Client(follow_redirects=True) as client:
        for engine in ENGINES:
            for seed in seeds:
                for prefix in PREFIXES:
                    q = (prefix + seed).strip()
                    try:
                        for s in fetch_suggestions(client, engine, q):
                            k = s.lower()
                            if k in seen or k == q.lower():
                                continue
                            seen.add(k)
                            collected[engine].append(s)
                    except Exception as exc:  # noqa: BLE001
                        msg = f"{engine}:{q}: {exc.__class__.__name__}"
                        logger.warning("scout suggest failed %s (%s)", msg, exc)
                        errors.append(msg)

    count = sum(len(v) for v in collected.values())
    if count == 0:
        return {"section": "", "count": 0, "errors": errors}

    lines = ["SEARCH SUGGESTIONS (what people are typing right now):", ""]
    for engine, items in collected.items():
        if not items:
            continue
        lines.append(f"[{engine} autocomplete]")
        lines.extend(items)
        lines.append("")
    return {"section": "\n".join(lines).strip(), "count": count, "errors": errors}
