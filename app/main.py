"""Quiet Shelf: one FastAPI app mounting three independent services, plus a
health check and the static frontend."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.providers import validate_startup
from app.services.blurb.router import router as blurb_router
from app.services.format.router import router as format_router
from app.services.promote.router import router as promote_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("quietshelf.api")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    provider = validate_startup()
    logger.info("startup provider=%s model=%s", provider.name, config.model_name())
    yield


app = FastAPI(title="Quiet Shelf", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Access-Code"],
)

app.include_router(format_router)
app.include_router(blurb_router)
app.include_router(promote_router)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "provider": config.provider_name(),
        "services": ["format", "blurb", "promote"],
    }


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False, response_model=None)
def index() -> FileResponse | JSONResponse:
    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse({"status": "ok", "message": "Quiet Shelf API. See /api/health"})
