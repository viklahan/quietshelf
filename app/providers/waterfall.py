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

        for name in order:
            if name == "cerebras" and call_len > CEREBRAS_CONTEXT_LIMIT:
                logger.info("waterfall: skipping cerebras (too large: %d chars)", call_len)
                continue
            p = _build_provider(name)
            if not p:
                continue
            try:
                logger.info("waterfall: trying %s", name)
                result = p.generate(system_prompt, user_content, json_mode)
                if errors:
                    logger.warning("waterfall: fell through to %s after: %s", name, "; ".join(errors))
                return result
            except (ProviderRateLimited, ProviderTimeout) as e:
                msg = f"{name}: rate-limited ({e})"
                logger.warning("waterfall: %s — trying next", msg)
                errors.append(msg)
            except ProviderError as e:
                msg = f"{name}: error ({e})"
                logger.warning("waterfall: %s — trying next", msg)
                errors.append(msg)

        raise ProviderError(
            "All waterfall providers failed: " + "; ".join(errors) if errors
            else "No providers configured."
        )
