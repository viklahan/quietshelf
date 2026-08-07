"""Waterfall provider — automatic failover across free-tier providers.

Tries each provider in WATERFALL_ORDER (default: gemini, groq, cerebras)
and moves to the next on ProviderRateLimited or ProviderError. Only raises
to the caller if every provider in the chain fails.

Configure with LLM_PROVIDER=waterfall in .env.
WATERFALL_ORDER=gemini,groq,cerebras controls the order.

Smart routing: Cerebras free tier caps context at 8,192 tokens. The
waterfall skips Cerebras for large calls automatically.
"""
from __future__ import annotations
import concurrent.futures
import logging
import time
from app import config
from app.providers.base import (
    Provider, ProviderConfigError, ProviderError, ProviderRateLimited, ProviderTimeout,
)

logger = logging.getLogger("quietshelf.waterfall")
CEREBRAS_CONTEXT_LIMIT = 24_000


def _build_provider(name: str):
    from app.providers.cerebras import CerebrasProvider
    from app.providers.gemini import GeminiProvider
    from app.providers.groq import GroqProvider
    from app.providers.ollama import OllamaProvider
    from app.providers.openrouter import OpenRouterProvider
    registry = {
        "gemini": GeminiProvider,
        "groq": GroqProvider,
        "cerebras": CerebrasProvider,
        "ollama": OllamaProvider,
        "openrouter": OpenRouterProvider,
    }
    cls = registry.get(name)
    if not cls:
        logger.warning("waterfall: unknown provider %r — skipping", name)
        return None
    p = cls()
    try:
        p.validate_config()
        return p
    except ProviderConfigError as e:
        logger.info("waterfall: skipping %s (not configured): %s", name, e)
        return None


def _is_permanent_failure(msg: str) -> bool:
    """True for failures that cannot heal within a request's retry window:
    dead keys (401), unpaid accounts (402), and exhausted DAILY quotas.
    Per-minute 429s and upstream 5xx are transient and stay retryable."""
    m = msg.lower()
    if "unauthorized" in m or "authenticationerror" in m or "401" in m:
        return True
    if "payment_required" in m or "payment required" in m or "402" in m:
        return True
    # Gemini daily free-tier exhaustion names the per-day quota explicitly
    if "perday" in m or "free_tier_requests" in m:
        return True
    # A provider whose entire model ladder is gone won't heal in minutes
    if "no working groq model" in m or "decommission" in m:
        return True
    return False


# ── Dead-provider cooldown ────────────────────────────────────────────────────────────
# FAIL FAST, REMEMBER THE FAILURE. Without this, every chunk re-walks the
# graveyard: pacing sleeps 12-31s for a Groq slot before a call that 400s in
# 200ms, times three providers, times retries, times chunks — minutes of
# waiting to be told what the first chunk already knew. One request pays the
# discovery cost; everyone after skips the corpse in zero seconds.
COOLDOWN_SECONDS = 600.0

# A provider that HANGS is worse than one that's broken. A dead key 401s in
# 200ms and the waterfall moves on; a provider that runs to LLM_TIMEOUT_SECONDS
# (120s) burns two-thirds of the promote stream's 180s budget before the healthy
# legs downstream get a turn. Timeouts are transient by nature — one is a blip,
# so a single one must NOT sideline a good provider — but a provider timing out
# CONSECUTIVELY is reliably slow, and re-paying 120s per chunk is what starved
# the stream on 2026-08-07 (OpenRouter, first in order, on a :free model).
# Streak counts consecutive timeouts; any success resets it.
TIMEOUT_STREAK_LIMIT = 2
TIMEOUT_COOLDOWN_SECONDS = 300.0  # shorter than a dead key: slowness does heal

# ── Wall-clock deadline per leg ───────────────────────────────────────────────
# An HTTP client timeout is NOT a deadline. httpx (and the OpenAI SDK on top of
# it) applies `read` PER SOCKET READ, so a provider that returns 200 headers
# immediately and then dribbles the body a few bytes at a time resets the timer
# forever and hangs indefinitely — no exception, no fallthrough.
#
# That is exactly what took Promote down on 2026-08-07: OpenRouter answered
# headers in ~5s then trickled for 8+ minutes while LLM_TIMEOUT_SECONDS=120 sat
# there never firing. The promote stream gives up at 180s (SSE_WAIT_TIMEOUT), so
# the writer saw "Timed out waiting for chunks" and lost the whole run.
#
# One leg must never be able to outlive the stream that is waiting on it. This
# is a true wall-clock budget: when it expires we stop waiting and move on. The
# abandoned worker is a daemon and dies with the process; after
# TIMEOUT_STREAK_LIMIT of these the leg is cooled down and stops being called
# at all, so the leak is bounded.
PROVIDER_DEADLINE_SECONDS = 45.0

_dead: dict[str, tuple[float, str]] = {}  # name -> (until_ts, reason)
_timeout_streak: dict[str, int] = {}      # name -> consecutive timeouts


def _mark_dead(name: str, reason: str, cooldown: float = COOLDOWN_SECONDS) -> None:
    _dead[name] = (time.time() + cooldown, reason[:200])
    logger.warning("waterfall: %s marked dead for %ds (%s)", name, int(cooldown), reason[:200])


def _record_timeout(name: str, reason: str) -> None:
    """Count a consecutive timeout; cool the provider down once it's clearly
    not a blip. Keeps a hanging leg from re-costing every later call."""
    streak = _timeout_streak.get(name, 0) + 1
    _timeout_streak[name] = streak
    if streak >= TIMEOUT_STREAK_LIMIT:
        _mark_dead(name, f"{streak} consecutive timeouts: {reason}", TIMEOUT_COOLDOWN_SECONDS)


def _dead_reason(name: str) -> str | None:
    entry = _dead.get(name)
    if not entry:
        return None
    until, reason = entry
    if time.time() >= until:
        del _dead[name]  # cooldown over - let it prove itself again
        return None
    return reason


def _revive(name: str) -> None:
    _dead.pop(name, None)
    _timeout_streak.pop(name, None)  # a success proves it's healthy again


# Daemon threads: an abandoned trickle-read must never hold the process open.
_deadline_pool = concurrent.futures.ThreadPoolExecutor(
    max_workers=8, thread_name_prefix="wf-deadline"
)


def _generate_with_deadline(provider, system_prompt: str, user_content: str,
                            json_mode: bool) -> str:
    """Run one provider call under a wall-clock budget.

    Raises ProviderTimeout when the budget expires, converting a silent hang
    into the honest failure the waterfall already knows how to fall through.
    """
    future = _deadline_pool.submit(
        provider.generate, system_prompt, user_content, json_mode
    )
    try:
        return future.result(timeout=PROVIDER_DEADLINE_SECONDS)
    except concurrent.futures.TimeoutError as exc:
        future.cancel()  # best-effort; a thread already in a socket read won't stop
        raise ProviderTimeout(
            f"exceeded {PROVIDER_DEADLINE_SECONDS:.0f}s wall-clock deadline "
            f"(response never completed)"
        ) from exc


class WaterfallProvider(Provider):
    name = "waterfall"

    def validate_config(self) -> None:
        order = config.waterfall_order()
        available = [n for n in order if _build_provider(n) is not None]
        if not available:
            raise ProviderConfigError(
                "LLM_PROVIDER=waterfall but no provider has a valid key. "
                "Configure at least one of: " + ", ".join(order)
            )
        logger.info("waterfall ready: %s", ", ".join(available))

    def generate(self, system_prompt: str, user_content: str, json_mode: bool = True) -> str:
        order = config.waterfall_order()
        call_len = len(system_prompt) + len(user_content)
        errors: list[str] = []

        permanent_flags: list[bool] = []

        for name in order:
            down = _dead_reason(name)
            if down is not None:
                # Zero-cost skip: no pacing sleep, no doomed API call.
                logger.info("waterfall: skipping %s (cooling down: %.120s)", name, down)
                errors.append(f"{name}: down ({down})")
                permanent_flags.append(True)
                continue
            if name == "cerebras" and call_len > CEREBRAS_CONTEXT_LIMIT:
                logger.info("waterfall: skipping cerebras (too large: %d chars)", call_len)
                continue
            p = _build_provider(name)
            if not p:
                continue
            try:
                logger.info("waterfall: trying %s", name)
                result = _generate_with_deadline(p, system_prompt, user_content, json_mode)
                _revive(name)
                if errors:
                    logger.warning("waterfall: fell through to %s after: %s", name, "; ".join(errors))
                return result
            except ProviderTimeout as e:
                msg = f"{name}: timed out ({e})"
                logger.warning("waterfall: %s — trying next", msg)
                errors.append(msg)
                permanent_flags.append(False)  # slowness is never permanent
                _record_timeout(name, str(e))
            except ProviderRateLimited as e:
                msg = f"{name}: rate-limited ({e})"
                logger.warning("waterfall: %s — trying next", msg)
                errors.append(msg)
                perm = _is_permanent_failure(str(e))
                permanent_flags.append(perm)
                if perm:
                    _mark_dead(name, str(e))
            except ProviderError as e:
                msg = f"{name}: error ({e})"
                logger.warning("waterfall: %s — trying next", msg)
                errors.append(msg)
                perm = _is_permanent_failure(str(e))
                permanent_flags.append(perm)
                if perm:
                    _mark_dead(name, str(e))

        exc = ProviderError(
            "All waterfall providers failed: " + "; ".join(errors) if errors
            else "No providers configured."
        )
        # When EVERY leg died a permanent death (dead key, unpaid account,
        # exhausted DAILY quota), retrying in seconds is pure waste — flag it
        # so callers skip their retry loops and fall back immediately.
        exc.permanent = bool(permanent_flags) and all(permanent_flags)
        if exc.permanent:
            logger.warning("waterfall: all providers permanently unavailable — callers should not retry")
        raise exc
