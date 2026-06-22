"""Map provider/parse exceptions to friendly JSON responses. Shared by the
Blurb and Promote routers (Format uses no LLM). A stressed writer never sees a
raw stack trace."""
from __future__ import annotations

import logging

from fastapi.responses import JSONResponse

from app.providers import (
    JSONParseError,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)

logger = logging.getLogger("quietshelf.errors")


def llm_error_to_response(
    exc: Exception, *, failure_code: str, failure_msg: str
) -> JSONResponse:
    """Translate a known LLM-path exception into a JSONResponse. Re-raise if
    the exception is not one we handle."""
    if isinstance(exc, ProviderConfigError):
        logger.error("provider_config_error detail=%s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "error": "service_unconfigured",
                "message": (
                    "The AI service isn't set up correctly. If you're "
                    "self-hosting, check the API key in your .env."
                ),
            },
        )
    if isinstance(exc, JSONParseError):
        return JSONResponse(
            status_code=502, content={"error": failure_code, "message": failure_msg}
        )
    if isinstance(exc, ProviderRateLimited):
        logger.warning("provider_rate_limited")
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limited",
                "message": "The free AI tier needs a breather. Try again in a minute.",
            },
        )
    if isinstance(exc, ProviderTimeout):
        logger.error("provider_timeout")
        return JSONResponse(
            status_code=504,
            content={
                "error": "timeout",
                "message": "The AI took too long (over 120 seconds). Try again, or use a shorter piece.",
            },
        )
    if isinstance(exc, ProviderError):
        logger.error("provider_error detail=%s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_error",
                "message": "The AI is unavailable right now. Try again in a minute.",
            },
        )
    raise exc
