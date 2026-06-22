"""OpenRouter via the OpenAI-compatible SDK. One key, many free models."""
from __future__ import annotations

import httpx
from openai import OpenAI, APIError, APITimeoutError, RateLimitError

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)


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

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config.openrouter_api_key(),
            timeout=float(config.LLM_TIMEOUT_SECONDS),
        )
        try:
            response = client.chat.completions.create(
                model=config.model_name(),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"} if json_mode else None,
            )
        except RateLimitError as exc:
            raise ProviderRateLimited(str(exc)) from exc
        except APITimeoutError as exc:
            raise ProviderTimeout(str(exc)) from exc
        except (APIError, httpx.TimeoutException) as exc:
            raise ProviderError(f"OpenRouter API error: {exc}") from exc
        except UnicodeEncodeError as exc:
            raise ProviderConfigError(
                "OPENROUTER_API_KEY contains non-ASCII characters and looks "
                "corrupted - re-copy just the key from https://openrouter.ai/keys."
            ) from exc
        except Exception as exc:  # safety net: a writer must never see a raw 500
            raise ProviderError(f"OpenRouter request failed: {exc}") from exc
        return response.choices[0].message.content or ""