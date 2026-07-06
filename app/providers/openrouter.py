"""OpenRouter via the OpenAI-compatible SDK. One key, many free models."""
from __future__ import annotations

import logging

import httpx
from openai import OpenAI, APIError, APITimeoutError, NotFoundError, RateLimitError

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)
from app.providers.pacing import acquire_slot

logger = logging.getLogger("quietshelf.openrouter")


def _looks_unavailable(exc: Exception) -> bool:
    """A non-404 error that still means 'this model isn't usable' - e.g. a free
    slug that was retired and now reports no endpoints."""
    text = str(exc).lower()
    return "unavailable" in text or "no endpoints" in text or "not found" in text


class OpenRouterProvider(Provider):
    name = "openrouter"

    def validate_config(self) -> None:
        key = config.openrouter_api_key()
        if not key:
            raise ProviderConfigError(
                "OPENROUTER_API_KEY is not set. Get a free key at "
                "https://openrouter.ai/keys, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=gemini|groq|ollama."
            )
        # A key that isn't pure ASCII can't go in an HTTP Authorization header;
        # it's almost always a paste accident (an inline comment, smart quotes,
        # or an arrow copied from the website). Fail fast at startup with a clear
        # cause instead of an opaque UnicodeEncodeError deep in the HTTP layer.
        try:
            key.encode("ascii")
        except UnicodeEncodeError:
            raise ProviderConfigError(
                "OPENROUTER_API_KEY contains non-ASCII characters and looks "
                "corrupted - re-copy just the key (sk-or-...) from "
                "https://openrouter.ai/keys, with no trailing comment or quotes."
            ) from None

    def _model_candidates(self) -> list[str]:
        """The configured model first, then any fallbacks not already in it."""
        candidates: list[str] = []
        primary = config.model_name()
        if primary:
            candidates.append(primary)
        for model in config.openrouter_fallback_models():
            if model and model not in candidates:
                candidates.append(model)
        return candidates

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        acquire_slot(self.name)
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config.openrouter_api_key(),
            timeout=float(config.LLM_TIMEOUT_SECONDS),
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
        response_format = {"type": "json_object"} if json_mode else None

        candidates = self._model_candidates()
        last_unavailable: Exception | None = None
        for i, model in enumerate(candidates):
            has_fallback = i + 1 < len(candidates)
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format=response_format,
                )
            except NotFoundError as exc:
                # Model retired from the free tier (404). Self-heal: try the next.
                logger.warning(
                    "openrouter_model_unavailable model=%s fallback=%s",
                    model, has_fallback,
                )
                last_unavailable = exc
                continue
            except RateLimitError as exc:
                raise ProviderRateLimited(str(exc)) from exc
            except APITimeoutError as exc:
                raise ProviderTimeout(str(exc)) from exc
            except (APIError, httpx.TimeoutException) as exc:
                if has_fallback and _looks_unavailable(exc):
                    logger.warning("openrouter_model_unavailable model=%s (api) fallback=True", model)
                    last_unavailable = exc
                    continue
                raise ProviderError(f"OpenRouter API error: {exc}") from exc
            except UnicodeEncodeError as exc:
                raise ProviderConfigError(
                    "OPENROUTER_API_KEY contains non-ASCII characters and looks "
                    "corrupted - re-copy just the key from https://openrouter.ai/keys."
                ) from exc
            except Exception as exc:  # safety net: a writer must never see a raw 500
                raise ProviderError(f"OpenRouter request failed: {exc}") from exc
            if i > 0:
                logger.info("openrouter_fallback_succeeded model=%s", model)
            return response.choices[0].message.content or ""

        raise ProviderError(
            "Every configured OpenRouter model is unavailable for free right now. "
            "Set MODEL_NAME or OPENROUTER_FALLBACK_MODELS to a current free model "
            "from https://openrouter.ai/models?max_price=0."
        ) from last_unavailable