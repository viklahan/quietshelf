#!/usr/bin/env python
"""Report what each configured provider ACTUALLY grants this account.

Every limit in this app was originally learned by hitting it in production -
Gemini's 20/day, Groq's 8,000 tokens/minute, Cerebras's 402. That is an
expensive way to find out, and it always happened mid-demo. This asks instead.

    python qs_limits.py

Prints one line per provider. Never prints a key. Safe to run any time; each
check is a single near-empty request.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv()

UA = "quietshelf-limits/1.0"


def _post(url: str, key: str, model: str) -> tuple[int, dict]:
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 1,
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": UA,
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers)
    except Exception as e:  # noqa: BLE001
        return 0, {"_error": f"{type(e).__name__}: {e}"}


def groq() -> str:
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        return "groq        no key configured"
    status, h = _post("https://api.groq.com/openai/v1/chat/completions",
                      key, "openai/gpt-oss-120b")
    if "_error" in h:
        return f"groq        UNREACHABLE {h['_error']}"
    tpm = h.get("x-ratelimit-limit-tokens", "?")
    rpd = h.get("x-ratelimit-limit-requests", "?")
    # Free tier for gpt-oss-120b is 8,000 TPM; Developer is ~10x. If TPM still
    # reads 8000 after adding billing, the upgrade has not taken effect.
    try:
        tier = "FREE" if int(tpm) <= 8000 else "PAID (developer)"
    except ValueError:
        tier = "unknown"
    note = "" if status == 200 else f"  [HTTP {status}]"
    return f"groq        {tier:16} {tpm:>7} tokens/min  {rpd:>6} req/day{note}"


def cerebras() -> str:
    key = os.getenv("CEREBRAS_API_KEY", "").strip()
    if not key:
        return "cerebras    no key configured"
    status, h = _post("https://api.cerebras.ai/v1/chat/completions",
                      key, "gpt-oss-120b")
    if "_error" in h:
        return f"cerebras    UNREACHABLE {h['_error']}"
    if status == 402:
        return "cerebras    402 PAYMENT REQUIRED - account unpaid, a new key will not help"
    tpm = h.get("x-ratelimit-limit-tokens-minute", h.get("x-ratelimit-limit-tokens", "?"))
    return f"cerebras    HTTP {status:<3}  {tpm} tokens/min"


def gemini() -> str:
    """Gemini publishes no limit headers; a 429 names the exhausted quota."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        return "gemini      no key configured"
    body = json.dumps({"contents": [{"parts": [{"text": "hi"}]}]}).encode()
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-flash-latest:generateContent?key={key}",
        data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return (f"gemini      HTTP {r.status} OK   (no limit headers published; "
                    "free tier is per-DAY per-model - 20/day when last measured)")
    except urllib.error.HTTPError as e:
        detail = e.read()[:200].decode("utf-8", "replace").replace("\n", " ")
        return f"gemini      HTTP {e.code}  {detail}"
    except Exception as e:  # noqa: BLE001
        return f"gemini      UNREACHABLE {type(e).__name__}: {e}"


def openrouter() -> str:
    key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not key:
        return "openrouter  no key configured"
    req = urllib.request.Request("https://openrouter.ai/api/v1/key", headers={
        "Authorization": f"Bearer {key}", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.load(r).get("data", {})
            return (f"openrouter  usage=${d.get('usage', 0)}  "
                    f"limit={d.get('limit') if d.get('limit') is not None else 'none'}  "
                    f"free_tier={d.get('is_free_tier')}")
    except urllib.error.HTTPError as e:
        return f"openrouter  HTTP {e.code}"
    except Exception as e:  # noqa: BLE001
        return f"openrouter  UNREACHABLE {type(e).__name__}: {e}"


if __name__ == "__main__":
    print("Provider entitlements - asked, not assumed\n")
    for check in (groq, gemini, cerebras, openrouter):
        print("  " + check())
    print("\nOne 150-word Promote chunk measures ~3,100 tokens "
          "(805 in / 2,292 out).")
    print("An 836-word script is ~6 chunks, ~19,000 tokens - so tokens/min "
          "above is the run's speed limit.")
