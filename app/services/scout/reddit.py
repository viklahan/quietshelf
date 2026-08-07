"""Scout harvest: pull question-shaped material from Reddit's free JSON API.

No scraping, no auth, no keys: reddit exposes every listing as JSON by
appending `.json`. We fetch each source's `rising` and weekly `top`, strip the
~90% API scaffolding down to the human words, and emit a MATERIAL block ready
for editorial synthesis (in-app later, or pasted into any frontier model now).

Politeness rules baked in: a real User-Agent, one fetch per listing, an
in-process cache so repeated harvests inside an hour cost Reddit nothing, and
a hard cap on sources per harvest.
"""
from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import os

import httpx

logger = logging.getLogger("quietshelf.scout")

USER_AGENT = "QuietShelf-Scout/1.0 (writer research tool; +https://github.com/viklahan/quietshelf)"
# Reddit's Responsible Builder Policy (June 2026) requires approved API access
# and prohibits masking how you access data. So: we identify honestly, always.
# OAuth (approved app credentials) is the real road; the single anonymous
# attempt below exists only so networks where it still works keep working,
# and it fails with an honest status code everywhere else.
FETCH_PACING = 0.6   # seconds between listing fetches - stay well under limits
MAX_SOURCES = 6
POSTS_PER_LISTING = 15
SELFTEXT_CAP = 700          # chars of body we keep per post
CACHE_TTL = 3600            # one hour
SNAPSHOT_DIR = Path(__file__).resolve().parents[3] / "data" / "scout"

_cache: dict[str, tuple[float, list[dict]]] = {}

# ── Reddit OAuth (free, read-only) ──────────────────────────────────────
# Anonymous .json access is now blocked (HTTP 403) from many networks. A free
# "script" app from reddit.com/prefs/apps gives client credentials; app-only
# auth then serves the same listings from oauth.reddit.com at 100 req/min.
# Without credentials we still try the anonymous ladder - it works on some
# networks and keeps local dev honest about which path is live.
TOKEN_URL = "https://www.reddit.com/api/v1/access_token"
OAUTH_BASE = "https://oauth.reddit.com"
_token: dict = {"value": None, "expires": 0.0}


def _reddit_creds() -> tuple[str, str] | None:
    cid = os.getenv("REDDIT_CLIENT_ID", "").strip()
    secret = os.getenv("REDDIT_CLIENT_SECRET", "").strip()
    return (cid, secret) if cid and secret else None


def _get_token(client: httpx.Client) -> str | None:
    creds = _reddit_creds()
    if not creds:
        return None
    if _token["value"] and time.time() < _token["expires"] - 60:
        return _token["value"]
    r = client.post(
        TOKEN_URL,
        data={"grant_type": "client_credentials"},
        auth=creds,
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    r.raise_for_status()
    payload = r.json()
    _token["value"] = payload["access_token"]
    _token["expires"] = time.time() + float(payload.get("expires_in", 3600))
    logger.info("scout reddit oauth token acquired")
    return _token["value"]


def _clean_source(name: str) -> str:
    """'r/selfimprovement', '/r/x/', 'https://reddit.com/r/x' -> 'selfimprovement'."""
    name = name.strip()
    m = re.search(r"(?:^|/)r/([A-Za-z0-9_]+)", name)
    if m:
        return m.group(1)
    return re.sub(r"[^A-Za-z0-9_]", "", name)


def strip_post(raw: dict) -> dict | None:
    """One Reddit API child -> the fields a human editor would actually read.
    Returns None for ads, stickied mod posts, and empty shells."""
    d = raw.get("data") or {}
    if d.get("stickied") or d.get("promoted"):
        return None
    title = (d.get("title") or "").strip()
    if not title:
        return None
    body = (d.get("selftext") or "").strip()
    body = re.sub(r"\s+", " ", body)
    if len(body) > SELFTEXT_CAP:
        body = body[:SELFTEXT_CAP].rsplit(" ", 1)[0] + "\u2026"
    created = d.get("created_utc") or 0
    age_days = max(0, (time.time() - created) / 86400) if created else None
    return {
        "title": title,
        "body": body,
        "score": int(d.get("score") or 0),
        "comments": int(d.get("num_comments") or 0),
        "age_days": round(age_days, 1) if age_days is not None else None,
        "permalink": "https://reddit.com" + (d.get("permalink") or ""),
        "subreddit": d.get("subreddit") or "",
    }


def parse_listing(payload: dict) -> list[dict]:
    children = ((payload.get("data") or {}).get("children")) or []
    out = []
    for child in children:
        post = strip_post(child)
        if post:
            out.append(post)
    return out


def fetch_listing(client: httpx.Client, sub: str, listing: str) -> list[dict]:
    key = f"{sub}/{listing}"
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]
    params = {"limit": POSTS_PER_LISTING}
    if listing == "top":
        params["t"] = "week"
    # OAuth first when credentials exist - the reliable road.
    token = None
    try:
        token = _get_token(client)
    except Exception as exc:  # noqa: BLE001
        logger.warning("scout oauth token failed: %s", exc)
    attempts: list[tuple[str, dict]] = []
    if token:
        attempts.append((
            f"{OAUTH_BASE}/r/{sub}/{listing}",
            {"User-Agent": USER_AGENT, "Authorization": f"bearer {token}"},
        ))
    attempts += [
        (f"https://www.reddit.com/r/{sub}/{listing}.json", {"User-Agent": USER_AGENT}),
    ]
    last_exc: Exception | None = None
    for url, headers in attempts:
        try:
            r = client.get(url, params=params, headers=headers, timeout=15)
            r.raise_for_status()
            posts = parse_listing(r.json())
            _cache[key] = (time.time(), posts)
            return posts
        except httpx.HTTPStatusError as exc:
            last_exc = exc
            code = exc.response.status_code
            logger.warning("scout fetch %s got HTTP %s via %s", key, code, url)
            if code not in (403, 429):
                break  # 404/5xx: switching UA will not help
            time.sleep(FETCH_PACING)
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            break
    raise last_exc if last_exc else RuntimeError("unreachable")


def harvest(sources: list[str]) -> dict:
    """Fetch rising + weekly-top for each source, dedupe, build MATERIAL."""
    subs = []
    for s in sources[:MAX_SOURCES]:
        c = _clean_source(s)
        if c and c.lower() not in [x.lower() for x in subs]:
            subs.append(c)
    if not subs:
        raise ValueError("No valid subreddit names given.")

    gathered: dict[str, dict] = {}
    errors: list[str] = []
    with httpx.Client(follow_redirects=True) as client:
        for sub in subs:
            for listing in ("rising", "top"):
                try:
                    for post in fetch_listing(client, sub, listing):
                        gathered.setdefault(post["permalink"], post)
                except httpx.HTTPStatusError as exc:
                    msg = f"r/{sub}/{listing}: HTTP {exc.response.status_code}"
                    logger.warning("scout harvest failed %s (%s)", msg, exc)
                    errors.append(msg)
                except Exception as exc:  # noqa: BLE001
                    msg = f"r/{sub}/{listing}: {exc.__class__.__name__}"
                    logger.warning("scout harvest failed %s (%s)", msg, exc)
                    errors.append(msg)
                time.sleep(FETCH_PACING)

    posts = sorted(gathered.values(), key=lambda p: (-(p["score"] or 0)))
    material = build_material(posts)
    snapshot_path = save_snapshot(subs, posts)
    return {
        "material": material,
        "word_count": len(material.split()),
        "post_count": len(posts),
        "sources": subs,
        "errors": errors,
        "snapshot": snapshot_path.name if snapshot_path else None,
    }


def build_material(posts: list[dict]) -> str:
    """The paste-ready block: human words + the numbers that signal loudness."""
    lines = []
    for p in posts:
        meta = f"[r/{p['subreddit']} \u00b7 \u25b2{p['score']} \u00b7 {p['comments']} comments"
        if p["age_days"] is not None:
            meta += f" \u00b7 {p['age_days']}d old"
        meta += "]"
        lines.append(meta)
        lines.append(p["title"])
        if p["body"]:
            lines.append(p["body"])
        lines.append(p["permalink"])
        lines.append("")
    return "\n".join(lines).strip()


def save_snapshot(subs: list[str], posts: list[dict]) -> Path | None:
    """Week-stamped snapshot: the seed of real loudness deltas later."""
    try:
        SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
        now = datetime.now(timezone.utc)
        name = f"{now.strftime('%G-W%V')}-{'-'.join(subs[:3])}.json"
        path = SNAPSHOT_DIR / name
        path.write_text(json.dumps({
            "captured": now.isoformat(),
            "sources": subs,
            "posts": posts,
        }, indent=1), encoding="utf-8")
        return path
    except Exception as exc:  # noqa: BLE001
        logger.warning("scout snapshot failed: %s", exc)
        return None
