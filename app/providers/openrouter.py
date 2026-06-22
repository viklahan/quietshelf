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
        if not config.openrouter_api_key():
            raise ProviderConfigError(
                "OPENROUTER_API_KEY is not set. Get a free key at "
                "https://openrouter.ai/keys, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=gemini|groq|ollama."
            )

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
        return response.choices[0].message.content or ""