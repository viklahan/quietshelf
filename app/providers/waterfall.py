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

_dead: dict[str, tuple[float, str]] = {}  # name -> (until_ts, reason)


def _mark_dead(name: str, reason: str) -> None:
    _dead[name] = (time.time() + COOLDOWN_SECONDS, reason[:200])
    logger.warning("waterfall: %s marked dead for %ds (%s)", name, int(COOLDOWN_SECONDS), reason[:200])


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
                result = p.generate(system_prompt, user_content, json_mode)
                _revive(name)
                if errors:
                    logger.warning("waterfall: fell through to %s after: %s", name, "; ".join(errors))
                return result
            except (ProviderRateLimited, ProviderTimeout) as e:
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
