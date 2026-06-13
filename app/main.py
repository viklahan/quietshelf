"""FastAPI app: one mapping endpoint, a health check, and static frontend."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.mapping import MappingError, map_script
from app.models import MapRequest, ShotList
from app.providers import (
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
    validate_startup,
)
from app.ratelimit import RateLimiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("qfc.api")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Fail fast with an actionable message if the selected provider is
    # missing its key/host (ProviderConfigError aborts startup).
    provider = validate_startup()
    logger.info("startup provider=%s model=%s", provider.name, config.model_name())
    yield


app = FastAPI(
    title="Quiet Fight Club",
    version="0.2.0",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Access-Code"],
)

_rate_limiter = RateLimiter(limit=config.rate_limit_per_hour())


def _client_ip(request: Request) -> str:
    # Render/Railway terminate TLS in front of the container; trust the first
    # forwarded hop if present.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_access(request: Request) -> None:
    expected = config.access_code()
    if expected and request.headers.get("x-access-code") != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing access code.")


def _check_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    if not _rate_limiter.allow(ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": str(_rate_limiter.retry_after_seconds(ip))},
        )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "provider": config.provider_name()}


@app.post("/api/map", response_model=ShotList)
def map_endpoint(body: MapRequest, request: Request) -> ShotList | JSONResponse:
    _check_access(request)
    _check_rate_limit(request)

    word_count = len(body.script.split())
    if word_count == 0:
        raise HTTPException(status_code=422, detail="Script is empty. Paste your script text and try again.")
    if word_count < config.MIN_WORDS:
        raise HTTPException(
            status_code=422,
            detail=f"Script too short - needs at least {config.MIN_WORDS} words (got {word_count}).",
        )
    if word_count > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail="Script too long - split it into parts.")

    logger.info("map_request word_count=%d provider=%s", word_count, config.provider_name())
    try:
        return map_script(body.script)
    except MappingError:
        return JSONResponse(
            status_code=502,
            content={
                "error": "mapping_failed",
                "message": "The mapping engine returned an unreadable result. Try again.",
            },
        )
    except ProviderRateLimited:
        logger.warning("provider_rate_limited provider=%s", config.provider_name())
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limited",
                "message": "The free AI tier needs a breather. Try again in a minute.",
            },
        )
    except ProviderTimeout:
        logger.error("provider_timeout provider=%s word_count=%d", config.provider_name(), word_count)
        return JSONResponse(
            status_code=504,
            content={
                "error": "mapping_timeout",
                "message": "The mapping engine took too long (over 120 seconds). Try a shorter script or try again.",
            },
        )
    except ProviderError as exc:
        logger.error("provider_error provider=%s detail=%s", config.provider_name(), exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_error",
                "message": "The mapping engine is unavailable right now. Try again in a minute.",
            },
        )


# Serve the frontend from the same app so the whole product is one container.
if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False, response_model=None)
def index() -> FileResponse | JSONResponse:
    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse({"status": "ok", "message": "Quiet Fight Club API. POST /api/map"})
