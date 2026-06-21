"""App-level FastAPI dependencies shared by routers: access-code gate, rate
limiting, client-IP resolution. This is app infrastructure, not service code."""
from __future__ import annotations

from fastapi import HTTPException, Request

from app import config
from app.ratelimit import RateLimiter

_rate_limiter = RateLimiter(limit=config.rate_limit_per_hour())


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def require_access(request: Request) -> None:
    expected = config.access_code()
    if expected and request.headers.get("x-access-code") != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing access code.")


def enforce_rate_limit(request: Request) -> None:
    ip = client_ip(request)
    if not _rate_limiter.allow(ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": str(_rate_limiter.retry_after_seconds(ip))},
        )


def guard(request: Request) -> None:
    """Single dependency applied to every service endpoint."""
    require_access(request)
    enforce_rate_limit(request)
