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

# Models that 400 on response_format=json_object and must be asked in prose.
NO_RESPONSE_FORMAT_PREFIXES = ("groq/compound",)

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
        json_rejected = False  # at least one model returned 400 json_validate_failed
        for model in models_to_try:
            kwargs: dict = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
            }
            # groq/compound* reject response_format outright (400), yet they
            # serve this schema FASTER than the gpt-oss primary - measured 4.4s
            # vs 6.4s on 2026-08-20. Sending it unconditionally made the only
            # healthy fallback permanently unusable. _extract_json parses the
            # first complete object and ignores surrounding prose, so asking
            # nicely in the prompt is enough for these.
            if json_mode and not model.startswith(NO_RESPONSE_FORMAT_PREFIXES):
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
                low = msg.lower()
                # "Failed to validate JSON" is not a dead model and not a dead
                # provider - it is a fact about THIS REQUEST. It fires when the
                # prompt is too large for the model to close the schema, so the
                # same model serves a smaller chunk perfectly. Tracked apart
                # from genuine retirements so the ladder's verdict below can
                # tell "everything is gone" from "this one request was bad".
                json_reject = any(k in low for k in (
                    "json_validate_failed", "failed to validate json",
                ))
                if json_reject:
                    json_rejected = True
                dead_model = json_reject or any(k in low for k in (
                    "decommission", "deprecat", "model_not_found",
                    "does not exist", "invalid model", "no longer supported",
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
        if json_rejected:
            # Every model refused to close the JSON schema for this prompt.
            # Saying "No working Groq model found" here is a lie the waterfall
            # believes: _is_permanent_failure() matches that phrase and benches
            # the provider for 600s, so one oversized paste blacked the site out
            # for ten minutes on 2026-08-20. Word this as what it is - a bad
            # request, retryable with smaller input - and keep every phrase
            # _is_permanent_failure() looks for out of it.
            raise ProviderError(
                f"Groq could not return valid JSON for this request on any model "
                f"(tried {len(models_to_try)}). Usually an oversized chunk; a "
                f"smaller request normally succeeds. Last: {str(last_exc)[:200]}"
            )
        raise ProviderError(
            f"No working Groq model found. Tried: {models_to_try}. Last: {last_exc}"
        )
