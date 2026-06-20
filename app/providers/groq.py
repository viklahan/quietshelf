"""Groq free tier via the groq SDK - open models (Llama 3.x) at high speed."""
from __future__ import annotations

import groq as groq_sdk

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)


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
        client = groq_sdk.Groq(
            api_key=config.groq_api_key(),
            timeout=config.LLM_TIMEOUT_SECONDS,
            max_retries=0,
        )
        kwargs = {
            "model": config.model_name(),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        }
        if json_mode:
            # JSON mode requires the word "JSON" in the prompt; system prompts do.
            kwargs["response_format"] = {"type": "json_object"}
        try:
            response = client.chat.completions.create(**kwargs)
        except groq_sdk.RateLimitError as exc:
            raise ProviderRateLimited(str(exc)) from exc
        except groq_sdk.APITimeoutError as exc:
            raise ProviderTimeout(str(exc)) from exc
        except groq_sdk.APIError as exc:
            raise ProviderError(f"Groq API error: {type(exc).__name__}") from exc
        return response.choices[0].message.content or ""
