"""Groq free tier via the groq SDK - open models at high speed.

Groq deprecates models without notice (llama-3.3-70b-versatile went June 17
2026). We walk DEFAULT_GROQ_FALLBACKS when the configured model 404s so the
app self-heals instead of failing hard on a silent catalog change.
"""
from __future__ import annotations

import logging

import groq as groq_sdk

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)
from app.providers.pacing import acquire_slot

logger = logging.getLogger("quietshelf.groq")


class GroqProvider(Provider):
    name = "groq"

    def validate_config(self) -> None:
        if not config.groq_api_key():
            raise ProviderConfigError(
                "GROQ_API_KEY is not set. Get a free key (no card needed) at "
                "https://console.groq.com, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=gemini|ollama."
            )

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        acquire_slot(self.name)
        client = groq_sdk.Groq(
            api_key=config.groq_api_key(),
            timeout=config.LLM_TIMEOUT_SECONDS,
            max_retries=0,
        )

        primary = config.model_name("groq")
        fallbacks = config.groq_fallback_models()
        # Start with the configured model, then try fallbacks if it's gone
        models_to_try = [primary] + [m for m in fallbacks if m != primary]

        last_exc: Exception | None = None
        rate_limited = False  # at least one model on the ladder returned 429
        for model in models_to_try:
            kwargs: dict = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            try:
                response = client.chat.completions.create(**kwargs)
                if model != primary:
                    logger.warning("groq: fell through to fallback model=%s", model)
                return response.choices[0].message.content or ""
            except groq_sdk.RateLimitError as exc:
                # Groq rate-limits PER MODEL. A 429 on this one says nothing
                # about the next one on the ladder — walking it is free and
                # often lands immediately. Only when every model is throttled
                # is the whole leg genuinely rate-limited (raised below).
                logger.warning("groq: model %s rate-limited, trying next", model)
                last_exc = exc
                rate_limited = True
                continue
            except groq_sdk.APITimeoutError as exc:
                raise ProviderTimeout(str(exc)) from exc
            except groq_sdk.NotFoundError as exc:
                logger.warning("groq: model %s not found, trying next", model)
                last_exc = exc
                continue
            except groq_sdk.BadRequestError as exc:
                # Groq retires models with 400 model_decommissioned, NOT 404 -
                # the ladder must hear that too, or it never engages (August
                # 2026: every call 400'd on a dead primary while four healthy
                # fallbacks sat unused).
                msg = str(exc)
                dead_model = any(k in msg.lower() for k in (
                    "decommission", "deprecat", "model_not_found",
                    "does not exist", "invalid model", "no longer supported",
                    # This model cannot honour response_format=json_object for
                    # our prompt (Groq: "Failed to validate JSON"). That is a
                    # fact about the MODEL, not the provider — the next one on
                    # the ladder may serve it fine, and on 2026-08-07 one did.
                    "json_validate_failed", "failed to validate json",
                ))
                if dead_model:
                    logger.warning("groq: model %s rejected (%.200s), trying next", model, msg)
                    last_exc = exc
                    continue
                raise ProviderError(f"Groq API error: {msg[:300]}") from exc
            except groq_sdk.APIError as exc:
                # Always carry the provider's own words - a class name is a
                # symptom, the message is the diagnosis.
                raise ProviderError(f"Groq API error: {type(exc).__name__}: {str(exc)[:300]}") from exc

        if rate_limited:
            # Every model was throttled — the waterfall should treat this as a
            # rate limit (retryable, cools down) rather than a hard error.
            raise ProviderRateLimited(
                f"All Groq models rate-limited. Tried: {models_to_try}. Last: {last_exc}"
            )
        raise ProviderError(
            f"No working Groq model found. Tried: {models_to_try}. Last: {last_exc}"
        )
