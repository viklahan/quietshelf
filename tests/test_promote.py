"""Promote service: validation, parsing, and endpoint shape."""
from __future__ import annotations

import json

import pytest

from app.providers.json_engine import JSONParseError


@pytest.fixture()
def _ok(monkeypatch, valid_shot_list):
    """Patch the mapper's generate_json to return a valid shot list."""
    from app.services.promote import mapper
    from app.services.promote.models import ShotList

    monkeypatch.setattr(
        mapper, "generate_json",
        lambda system, user, model: ShotList.model_validate(valid_shot_list),
    )


def test_map_script_happy_path(_ok, valid_script):
    from app.services.promote.mapper import map_script
    result = map_script(valid_script)
    assert result.video_title_suggestion == "A Test Title"
    assert len(result.segments) == 1


def test_endpoint_returns_validated_shape(client, _ok, valid_script):
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"video_title_suggestion", "estimated_runtime_seconds", "segments"}
    segment = body["segments"][0]
    assert set(segment) == {
        "id", "script_text", "start_time", "end_time",
        "search_terms", "clip_duration_seconds", "mood", "cast",
        "needs_remap",  # added: silent-fallback flag (regression R4)
    }


def test_endpoint_parse_failure_degrades_to_local_fallback(client, valid_script, monkeypatch):
    """A chunk the model can't map drops to the local coarse mapping — the
    writer still gets a complete, editable shot list, never a 502."""
    from app.services.promote import mapper

    def boom(system, user, model):
        raise JSONParseError("nope")

    monkeypatch.setattr(mapper, "generate_json", boom)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 200
    body = response.json()
    assert body["segments"], "fallback must still cover the script"
    for segment in body["segments"]:
        assert segment["mood"] == "neutral"
        assert len(segment["search_terms"]) >= 3
    covered = " ".join(s["script_text"] for s in body["segments"])
    assert covered.split() == valid_script.split()


def test_endpoint_429_on_rate_limit(client, valid_script, monkeypatch):
    """Infrastructure failures still propagate honestly — a throttled provider
    is a 429, never a silently keyword-degraded map."""
    from app.providers import ProviderRateLimited
    from app.services.promote import mapper

    def throttled(system, user, model):
        raise ProviderRateLimited("slow down")

    monkeypatch.setattr(mapper, "generate_json", throttled)
    monkeypatch.setattr(mapper.time, "sleep", lambda _s: None)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 429
    assert response.json()["error"] == "rate_limited"


def _valid_chunk_result():
    from app.services.promote.models import ChunkResult, ChunkSegment

    return ChunkResult(
        video_title_suggestion="A Test Title",
        segments=[
            ChunkSegment(
                script_text="the quick brown fox jumps over the lazy dog.",
                search_terms=["fox running field", "dog sleeping grass", "forest light"],
                clip_duration_seconds=5,
                mood="calm",
            )
        ],
    )


def test_transient_upstream_error_retried_once(client, valid_script, monkeypatch):
    """One flaky 5xx among many chunks must not tank the whole map - the
    chunk gets exactly one retry. A second consecutive failure still
    propagates honestly as 502."""
    from app.providers import ProviderError
    from app.services.promote import mapper

    calls = {"n": 0}

    def flaky_then_fine(system, user, model):
        calls["n"] += 1
        if calls["n"] == 1:
            raise ProviderError("upstream 500")
        return _valid_chunk_result()

    monkeypatch.setattr(mapper, "generate_json", flaky_then_fine)
    monkeypatch.setattr(mapper.time, "sleep", lambda _s: None)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 200
    assert response.json()["segments"]


def test_persistent_upstream_error_is_502(client, valid_script, monkeypatch):
    from app.providers import ProviderError
    from app.services.promote import mapper

    def always_down(system, user, model):
        raise ProviderError("upstream 500")

    monkeypatch.setattr(mapper, "generate_json", always_down)
    monkeypatch.setattr(mapper.time, "sleep", lambda _s: None)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 502


def test_stream_emits_heartbeats_during_slow_chunks(monkeypatch, client):
    """nginx kills silent SSE at proxy_read_timeout; slow provider waits must
    produce ': hb' comment lines so the pipe never goes silent. Regression for
    ERR_INCOMPLETE_CHUNKED_ENCODING seen in production 2026-08-07."""
    import time as _time
    from app.services.promote import router as pr
    from app.services.promote import mapper

    monkeypatch.setattr(pr, "SSE_HEARTBEAT_SECONDS", 0.05)
    monkeypatch.setattr(pr, "SSE_WAIT_TIMEOUT", 5.0)

    def slow_generate(system, user, model):
        _time.sleep(0.3)  # several heartbeat intervals of silence
        return _valid_chunk_result()
    monkeypatch.setattr(mapper, "generate_json", slow_generate)

    with client.stream("POST", "/api/promote/stream",
                       json={"script": "A quiet morning. " * 40}) as r:
        assert r.status_code == 200
        raw = "".join(chunk for chunk in r.iter_text())
    assert ": hb" in raw, "no heartbeat comments during slow chunk waits"
    assert '"type": "done"' in raw or '"type":"done"' in raw.replace(" ", ""), "stream did not complete"


def test_empty_script_rejected(client):
    response = client.post("/api/promote", json={"script": ""})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_short_script_rejected(client):
    response = client.post("/api/promote", json={"script": "only a few words here"})
    assert response.status_code == 422
    assert "100 words" in response.json()["detail"]


def test_long_script_rejected(client, monkeypatch):
    # MAX_WORDS is deliberately uncapped in prod (999999); verify the cap
    # mechanism still fires by lowering it for this test only.
    from app import config
    monkeypatch.setattr(config, "MAX_WORDS", 5000)
    response = client.post("/api/promote", json={"script": "word " * 5001})
    assert response.status_code == 422
    assert "too long" in response.json()["detail"].lower()


# ── Regression: pasted prose must chunk (2026-08-20) ─────────────────────────
def test_pasted_prose_without_line_breaks_still_chunks():
    """A stranger pastes an essay out of a Google Doc: one paragraph, no line
    breaks. _beats() makes that ONE beat, and a lone beat cannot be split by
    the group loop — so the whole script went to the model in a single call.
    That is how a 5,000-word story became one request: thin output at best,
    400 json_validate_failed at worst, which then poisoned the entire Groq leg
    for 600s. Every chunk must respect the word target regardless of how the
    writer formatted their text."""
    from app.services.promote.mapper import _chunk_script

    sentence = "The lighthouse had been dark for eleven years when Mara came home. "
    prose = (sentence * 60).strip()          # ~720 words, ZERO line breaks
    chunks = _chunk_script(prose, 400)

    assert len(chunks) > 1, "single-paragraph prose was not chunked"
    assert max(len(c.split()) for c in chunks) <= 400


def test_chunking_loses_no_words_from_pasted_prose():
    """The writer's word count is the contract - chunking may regroup text but
    must never drop or duplicate it."""
    from app.services.promote.mapper import _chunk_script, _clean_transcript

    sentence = "She climbed the hill through wet grass past the old cottage. "
    prose = (sentence * 50).strip()
    expected = len(_clean_transcript(prose)[0].split())
    got = sum(len(c.split()) for c in _chunk_script(prose, 400))
    assert got == expected, f"chunking changed word count: {got} != {expected}"


def test_line_broken_scripts_still_honor_the_writers_beats():
    """The 2026-08-07 behaviour must survive: when the writer DID break lines,
    those breaks remain the pacing and are not re-split on sentences."""
    from app.services.promote.mapper import _chunk_script

    script = "\n".join(f"Beat number {i} lands here." for i in range(1, 21))
    chunks = _chunk_script(script, 400)
    assert len(chunks) == 1
    assert chunks[0].count("\n") == 19, "line breaks were not preserved as beats"


# ── Regression: the model silently skipping the writer's words (2026-08-20) ──
def test_coverage_repair_recovers_lines_the_model_skipped():
    """"Cover EVERY line" is an instruction to the model, not a guarantee. On a
    549-word essay the model returned 14 good segments and silently dropped 97
    words in the middle - the writer's text, gone, with nothing on screen
    saying so. Coverage is the writer's contract: what they pasted is what gets
    mapped. Skipped runs come back as segments flagged needs_remap, in their
    original position, never hidden and never faked."""
    from app.services.promote.mapper import _repair_coverage
    from app.services.promote.models import ChunkResult, ChunkSegment

    chunk = "\n".join([
        "The first line opens the passage.",
        "The second line is the one the model dropped.",
        "The third line was also dropped.",
        "The fourth line closes the passage.",
    ])
    partial = ChunkResult(video_title_suggestion="t", segments=[
        ChunkSegment(script_text="The first line opens the passage.",
                     search_terms=["a b", "c d", "e f"],
                     clip_duration_seconds=3, mood="quiet"),
        ChunkSegment(script_text="The fourth line closes the passage.",
                     search_terms=["a b", "c d", "e f"],
                     clip_duration_seconds=3, mood="hopeful"),
    ])

    repaired = _repair_coverage(chunk, partial)
    blob = " ".join(s.script_text for s in repaired.segments)
    assert "second line" in blob, "dropped line was not recovered"
    assert "third line" in blob, "dropped line was not recovered"
    # recovered text is flagged, and the model's own segments are left alone
    recovered = [s for s in repaired.segments if s.needs_remap]
    assert recovered and all(not s.needs_remap for s in repaired.segments
                             if "first line" in s.script_text)
    # original order preserved
    texts = [s.script_text for s in repaired.segments]
    assert texts.index([t for t in texts if "first" in t][0]) < \
           texts.index([t for t in texts if "fourth" in t][0])


def test_coverage_repair_is_a_no_op_when_the_model_covered_everything():
    """A good run must not gain phantom segments."""
    from app.services.promote.mapper import _repair_coverage
    from app.services.promote.models import ChunkResult, ChunkSegment

    chunk = "Only line here."
    full = ChunkResult(video_title_suggestion="t", segments=[
        ChunkSegment(script_text="Only line here.", search_terms=["a b", "c d", "e f"],
                     clip_duration_seconds=3, mood="quiet"),
    ])
    repaired = _repair_coverage(chunk, full)
    assert len(repaired.segments) == 1
    assert not repaired.segments[0].needs_remap


def test_chunk_target_is_small_enough_for_reliable_json():
    """Measured 2026-08-20 against openai/gpt-oss-120b on Groq, same essay,
    same prompt - the ONLY variable was chunk size:

        150 words -> 8/8  valid JSON (100%)
        250 words -> 4/6  (67%)
        400 words -> 2/4  (50%)

    A 400-word chunk asks for ~12 segments x 6 search terms = 70+ constrained
    fields in one response, and the longer the model generates the likelier
    Groq's validator rejects the whole thing with 400 json_validate_failed.
    Commit 223fcb0 raised this 200 -> 400 to halve API calls and made every
    mapping call a coin flip. Reliability beats call count: a failed chunk
    costs a retry, a fallback, or the whole run."""
    from app.services.promote import mapper

    assert mapper.CHUNK_TARGET_WORDS <= 200, (
        f"chunk target {mapper.CHUNK_TARGET_WORDS} is in the coin-flip range"
    )


def test_one_stalled_chunk_does_not_discard_the_rest_of_the_script(monkeypatch, client):
    """2026-08-20 prod: a writer got 1/3 of their script mapped. SSE_WAIT_TIMEOUT
    is a PER-WAIT ceiling and the generator `return`s when it fires - so one slow
    chunk threw away every chunk after it, including ones that would have
    succeeded. The writer's script is the contract: a stalled chunk costs THAT
    chunk (keyword fallback, flagged needs_remap), never the remainder."""
    import threading
    from app.services.promote import mapper
    from app.services.promote import router as pr

    monkeypatch.setattr(pr, "SSE_HEARTBEAT_SECONDS", 0.05)
    monkeypatch.setattr(pr, "SSE_WAIT_TIMEOUT", 1.0)

    calls = {"n": 0}
    lock = threading.Lock()
    # Released in `finally` so stalled worker threads exit WITH the test. Left
    # running, they outlive monkeypatch teardown, fall through to the real
    # provider, and fire live API calls on every test run.
    release = threading.Event()

    def first_fast_rest_stall(system, user, model):
        with lock:
            calls["n"] += 1
            n = calls["n"]
        if n == 1:
            return _valid_chunk_result()
        # Event.wait, not time.sleep: mapper.time IS the global time module, so
        # patching its sleep elsewhere would silently neuter this stall.
        release.wait(5)
        return _valid_chunk_result()

    monkeypatch.setattr(mapper, "generate_json", first_fast_rest_stall)

    script = "A quiet morning by the still water. " * 120
    try:
        with client.stream("POST", "/api/promote/stream", json={"script": script}) as r:
            assert r.status_code == 200
            raw = "".join(part for part in r.iter_text())
    finally:
        release.set()

    events = []
    for line in raw.splitlines():
        if line.startswith("data:"):
            payload = line[5:].strip()
            if payload and payload != "[DONE]":
                try:
                    events.append(json.loads(payload))
                except json.JSONDecodeError:
                    pass
    total = next(e["total_chunks"] for e in events if e.get("type") == "meta")
    delivered = [e for e in events if e.get("type") == "chunk"]

    assert total > 1, "test needs a multi-chunk script"
    assert len(delivered) == total, (
        f"only {len(delivered)}/{total} chunks reached the writer - the rest were discarded"
    )
    assert any(e.get("type") == "done" for e in events), "stream ended without 'done'"


def test_rate_limited_chunk_waits_for_a_window_instead_of_degrading(monkeypatch, client):
    """Groq's free tier is 8,000 tokens/MINUTE and one chunk is ~3,000, so a
    burst throttles BY DESIGN. The old backoff was 3s then 6s - both land in
    the same dead window, burn all three attempts, and hand the writer keyword
    garbage for a chunk that only needed to wait. A rate limit is a queue, not
    a failure. Someone's original writing must never be degraded because we
    were impatient."""
    from app.providers import ProviderRateLimited
    from app.services.promote import mapper
    from app.services.promote import router as pr

    monkeypatch.setattr(pr, "SSE_HEARTBEAT_SECONDS", 0.05)
    # A sentinel value, and ONE sleep patch: pr.time and mapper.time are the
    # same module object, so patching both means the second silently replaces
    # the first and the recorder never fires.
    monkeypatch.setattr(pr, "RATE_LIMIT_WINDOW_SECONDS", 0.123)
    slept: list[float] = []
    monkeypatch.setattr(pr.time, "sleep", lambda s: slept.append(s))

    calls = {"n": 0}

    def throttled_then_fine(system, user, model):
        # Echoes the chunk back so _repair_coverage is a genuine no-op here -
        # a canned result covering none of the input would be flagged
        # needs_remap for the right reason and mask what this test measures.
        from app.services.promote.models import ChunkResult, ChunkSegment

        calls["n"] += 1
        # 3 failures exhausts _map_chunk's own RATE_LIMIT_RETRIES (2), so the
        # 4th call only happens if the ROUTER waited for a fresh window rather
        # than dumping the chunk to keyword fallback. That is what is measured.
        if calls["n"] <= 3:
            raise ProviderRateLimited("All Groq models rate-limited")
        return ChunkResult(video_title_suggestion="t", segments=[
            ChunkSegment(script_text=user, search_terms=["quiet water dawn",
                         "still lake morning", "mist over reeds"],
                         clip_duration_seconds=5, mood="calm")])

    monkeypatch.setattr(mapper, "generate_json", throttled_then_fine)

    with client.stream("POST", "/api/promote/stream",
                       json={"script": "A quiet morning by the water. " * 20}) as r:
        raw = "".join(part for part in r.iter_text())

    segs = []
    for line in raw.splitlines():
        if line.startswith("data:"):
            payload = line[5:].strip()
            if payload and payload != "[DONE]":
                try:
                    ev = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                if ev.get("type") == "chunk":
                    segs.extend(ev["segments"])

    assert segs, "no segments emitted"
    assert not any(s["needs_remap"] for s in segs), (
        "a merely THROTTLED chunk was degraded to keyword fallback"
    )
    assert 0.123 in slept, (
        f"router never waited for a fresh rate-limit window (sleeps: {slept})"
    )
    assert calls["n"] >= 4, "gave up before retrying past the throttle"
