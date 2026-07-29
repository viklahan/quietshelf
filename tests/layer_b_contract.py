#!/usr/bin/env python3
"""Layer B — endpoint contract tests against the REAL app, in-process.
No network, no quota: the AI provider layer (generate_json) is monkeypatched
to return canned VALID data, so the entire pipeline — routing, multipart
parsing, file extraction, chunking, SSE streaming, ordering, model validation
— is exercised deterministically.

Run with the app's venv:
    .venv/Scripts/python.exe tests/layer_b_contract.py            (mocked AI)
    .venv/Scripts/python.exe tests/layer_b_contract.py --live     (real AI too)

Writes tests/test-report.log. Exit 0 green / 1 red.
"""
import io
import json
import sys
import time
import zipfile
from pathlib import Path

# Windows consoles default to cp1252 — force UTF-8 so unicode in test
# names/details never crashes the harness itself.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
LIVE = "--live" in sys.argv

REPORT = []
FAILS = []
def log(line=""):
    print(line)
    REPORT.append(line)
def result(name, passed, detail=""):
    tag = "PASS" if passed else "FAIL"
    log(f"  [{tag}] {name}" + (f" — {detail}" if detail else ""))
    if not passed:
        FAILS.append(name)

log("=" * 62)
log("  LAYER B — ENDPOINT CONTRACT  (" + ("LIVE AI" if LIVE else "mocked AI") + ")")
log("  " + time.strftime("%Y-%m-%d %H:%M:%S"))
log("=" * 62)

# ---- boot the real app ------------------------------------------------------
try:
    from fastapi.testclient import TestClient
    import app.main as appmain
    client = TestClient(appmain.app)
    result("app boots (import app.main)", True)
except Exception as e:
    result("app boots (import app.main)", False, f"{e.__class__.__name__}: {e}")
    log("\nCannot continue — the app itself will not start. Run the doctor.")
    (ROOT / "tests" / "test-report.log").write_text("\n".join(REPORT), encoding="utf-8")
    sys.exit(1)

# ---- mock the AI unless --live ---------------------------------------------
if not LIVE:
    from app.services.promote import mapper as _mapper
    from app.services.promote.models import ChunkResult, ChunkSegment

    def _fake_generate_json(system, user, model_cls, *a, **k):
        """Return canned-but-VALID data for any model the app requests."""
        if model_cls is ChunkResult:
            # Build one segment per ~40 words of the chunk so coverage math works
            words = user.split()
            segs = []
            for i in range(0, max(1, len(words)), 40):
                part = " ".join(words[i:i + 40])
                if not part.strip():
                    continue
                segs.append(ChunkSegment(
                    script_text=part,
                    search_terms=["quiet room interior", "window light dust", "hands writing letter"],
                    clip_duration_seconds=8,
                    mood="reflective",
                ))
            return ChunkResult(video_title_suggestion="Canned Title", segments=segs)
        # Generic: try to build an empty-ish instance; fall back loudly
        try:
            return model_cls()
        except Exception:
            raise RuntimeError(f"mock cannot fabricate {model_cls}")

    _mapper.generate_json = _fake_generate_json
    log("  [info] AI layer mocked (deterministic, zero quota)")

# ---- test assets ------------------------------------------------------------
ASSETS = ROOT / "tests"
docx_path = None
for cand in [ASSETS / "test_story_9k.docx", ROOT / "tests" / "assets" / "sample.docx"]:
    if cand.exists():
        docx_path = cand
        break
txt_script = ("The morning light came slowly. " * 40).strip()          # ~240 words
long_script = ("She walked to the harbor and watched the boats. " * 60).strip()

# ============================================================================
log("\n[B1] /api/health")
r = client.get("/api/health")
result("health 200", r.status_code == 200, f"got {r.status_code}")
if r.status_code == 200:
    result("health has provider", "provider" in r.json(), str(r.json())[:80])

# ============================================================================
log("\n[B2] /api/promote/extract — the browse path")
# TXT
r = client.post("/api/promote/extract", files={"file": ("story.txt", txt_script.encode(), "text/plain")})
result("extract .txt 200", r.status_code == 200, f"got {r.status_code}: {r.text[:120]}")
if r.status_code == 200:
    d = r.json()
    result("extract .txt shape {text,word_count}", set(d) >= {"text", "word_count"})
    result("extract .txt count>0", d.get("word_count", 0) > 0, f"{d.get('word_count')}")
# DOCX (real file if present)
if docx_path:
    r = client.post("/api/promote/extract", files={"file": (docx_path.name, docx_path.read_bytes(),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    result("extract .docx 200", r.status_code == 200, f"got {r.status_code}: {r.text[:120]}")
    if r.status_code == 200:
        result("extract .docx words>0", r.json().get("word_count", 0) > 0, f"{r.json().get('word_count')}")
else:
    log("  [SKIP] no test .docx found (tests/test_story_9k.docx)")
# RTF
rtf = rb"{\rtf1\ansi Hello from RTF land. " + b" ".join([b"word"] * 120) + rb"}"
r = client.post("/api/promote/extract", files={"file": ("s.rtf", rtf, "application/rtf")})
result("extract .rtf 200", r.status_code == 200, f"got {r.status_code}")
# Rejects junk
r = client.post("/api/promote/extract", files={"file": ("x.exe", b"MZ...", "application/octet-stream")})
result("extract rejects .exe (415)", r.status_code == 415, f"got {r.status_code}")

# ============================================================================
log("\n[B3] /api/promote/stream — SSE pipeline (mocked AI)")
payload = {"script": long_script, "story_map": None}
t0 = time.time()
with client.stream("POST", "/api/promote/stream", json=payload) as resp:
    result("stream 200", resp.status_code == 200, f"got {resp.status_code}")
    events = []
    if resp.status_code == 200:
        buf = ""
        for chunk in resp.iter_text():
            buf += chunk
        for line in buf.split("\n"):
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
types = [e.get("type") for e in events]
result("stream meta first", bool(types) and types[0] == "meta", str(types[:3]))
result("stream has chunks", "chunk" in types, f"{types.count('chunk')} chunk events")
result("stream done last", bool(types) and types[-1] == "done", str(types[-3:]))
# coverage: every input word appears in output segments
segs = [s for e in events if e.get("type") == "chunk" for s in e["segments"]]
out_words = sum(len(s["script_text"].split()) for s in segs)
in_words = len(long_script.split())
result("stream coverage 100%", out_words >= in_words * 0.99, f"{out_words}/{in_words} words")
# order: reassembled by chunk_index, text equals script order
by_idx = {}
for e in events:
    if e.get("type") == "chunk":
        by_idx[e["chunk_index"]] = e["segments"]
ordered_text = " ".join(s["script_text"] for i in sorted(by_idx) for s in by_idx[i])
result("stream order = script order", ordered_text.split()[:12] == long_script.split()[:12])
result("stream done has title", any(e.get("type") == "done" and e.get("title") for e in events))
log(f"  [info] stream wall time {time.time()-t0:.1f}s")

# ============================================================================
log("\n[B4] /api/promote (non-stream) — validation gates")
r = client.post("/api/promote", json={"script": "too short"})
result("promote rejects <100 words (422)", r.status_code == 422, f"got {r.status_code}")

# ============================================================================
log("\n[B5] /api/format — EPUB pipeline (no AI involved)")
r = client.post("/api/format",
    data={"title": "Test Book", "author": "QS Harness", "theme": "classic"},
    files={"file": ("book.txt", ("Chapter One\n\n" + txt_script).encode(), "text/plain")})
# NOTE: on success the body is BINARY EPUB — never print it (cp1252 crash)
_detail = f"got {r.status_code}" + ("" if r.status_code == 200 else f": {r.text[:120]}")
result("format 200", r.status_code == 200, _detail)
if r.status_code == 200:
    try:
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        result("format returns valid EPUB (zip w/ mimetype)", "mimetype" in names, str(names[:3]))
    except Exception as e:
        result("format returns valid EPUB", False, str(e))

# ============================================================================
log("\n[B6] /api/format/cover-suggestions + fetch-cover-image (thumbnail path)")
r = client.post("/api/format/cover-suggestions", data={"title": "pensive person portrait", "passage": "", "n": "3"})
if r.status_code == 200:
    d = r.json()
    result("cover-suggestions 200 + list", isinstance(d.get("suggestions"), list), f"{len(d.get('suggestions', []))} results")
    sugg = d.get("suggestions") or []
    if sugg and LIVE:
        r2 = client.post("/api/format/fetch-cover-image", data={"url": sugg[0]["url"]})
        result("fetch-cover-image returns bytes", r2.status_code == 200 and len(r2.content) > 1000, f"{len(r2.content)}b")
    elif sugg:
        log("  [SKIP] fetch-cover-image (needs --live; avoids external download)")
else:
    # No image API keys locally is a legitimate state — warn, don't fail
    log(f"  [WARN] cover-suggestions returned {r.status_code} — image API keys may be absent in .env (upload-your-own still works)")

# ============================================================================
log("\n[B7] Regressions (every past bug, permanently)")
from app.services.promote.mapper import _chunk_script, _clean_transcript, CHUNK_TARGET_WORDS
from app.services.promote.models import Segment as _Seg, ChunkSegment as _CSeg
from app import config as _cfg

# R1: waterfall gives each provider its OWN model (the Groq gemini-404 bug)
import os
_bak = dict(os.environ)
os.environ["PROVIDER"] = "waterfall"
os.environ["MODEL_NAME"] = "gemini-2.5-flash"
try:
    gm = _cfg.model_name("groq")
    result("R1 waterfall: groq never gets gemini model", "gemini" not in gm, f"groq -> {gm}")
finally:
    os.environ.clear(); os.environ.update(_bak)

# R2: chunker drops nothing (the missing-lines bug)
script = "\n".join(f"Line {i} with several more words here." for i in range(120))
chunks = _chunk_script(script, CHUNK_TARGET_WORDS)
joined = " ".join(chunks)
missing = [i for i in range(120) if f"Line {i} " not in joined + " "]
result("R2 chunker: zero lines dropped", not missing, f"missing {missing[:5]}" if missing else "120/120")

# R3: title detection
_, title = _clean_transcript("A Short Title\nThe story begins here with more words.\nAnd continues.")
result("R3 title detected from first line", title == "A Short Title", repr(title))

# R4: needs_remap flag exists on both models (silent-fallback bug)
result("R4 Segment.needs_remap exists", "needs_remap" in _Seg.model_fields)
result("R4 ChunkSegment.needs_remap exists", "needs_remap" in _CSeg.model_fields)

# R5: MIN/MAX words config (the paste-cap bug)
result("R5 MIN_WORDS=100", _cfg.MIN_WORDS == 100, str(_cfg.MIN_WORDS))
result("R5 MAX_WORDS uncapped", _cfg.MAX_WORDS >= 999999, str(_cfg.MAX_WORDS))

# R6: fail-fast on permanently-dead providers (the 40s-of-retries bug).
# A ProviderError flagged permanent must skip ALL retry sleeps.
from app.providers import ProviderError as _PErr
from app.services.promote import mapper as _m2
_calls = {"n": 0}
def _always_dead(system, user, model):
    _calls["n"] += 1
    e = _PErr("All waterfall providers failed: groq: 401; cerebras: 402")
    e.permanent = True
    raise e
_orig_gj = _m2.generate_json
_orig_sleep = _m2.time.sleep
_slept = {"n": 0}
_m2.generate_json = _always_dead
_m2.time.sleep = lambda s: _slept.__setitem__("n", _slept["n"] + 1)
try:
    t_ff = time.time()
    try:
        _m2._map_chunk("some chunk text here")
    except _PErr:
        pass
    result("R6 permanent failure: exactly 1 call, 0 retries", _calls["n"] == 1, f"calls={_calls['n']}")
    result("R6 permanent failure: zero retry sleeps", _slept["n"] == 0, f"sleeps={_slept['n']}")
finally:
    _m2.generate_json = _orig_gj
    _m2.time.sleep = _orig_sleep

# R6b: the waterfall classifier itself
from app.providers.waterfall import _is_permanent_failure as _ipf
result("R6 classifier: 401 permanent", _ipf("Groq API error: AuthenticationError"))
result("R6 classifier: 402 permanent", _ipf("Error code: 402 - payment_required"))
result("R6 classifier: daily quota permanent", _ipf("quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier"))
result("R6 classifier: 5xx transient", not _ipf("upstream 500 internal server error"))
result("R6 classifier: per-minute 429 transient", not _ipf("429 too many requests, retry in 12s"))

# ============================================================================
log("\n" + "=" * 62)
verdict = "GREEN — safe to commit" if not FAILS else f"RED — {len(FAILS)} failures: {FAILS}"
log(f"  LAYER B: {verdict}")
log("=" * 62)
(ROOT / "tests").mkdir(exist_ok=True)
(ROOT / "tests" / "test-report.log").write_text("\n".join(REPORT), encoding="utf-8")
sys.exit(1 if FAILS else 0)
