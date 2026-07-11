"""Quiet Shelf: one FastAPI app mounting four independent services, plus a
health check and the static frontend."""
from __future__ import annotations

import logging
import datetime
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app import config
from app.deps import guard
from app.providers import validate_startup
from app.services.blurb.router import router as blurb_router
from app.services.format.router import router as format_router
from app.services.promote.router import router as promote_router
from app.services.storymap.router import router as storymap_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("quietshelf.api")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


class RevalidateStaticFiles(StaticFiles):
    """StaticFiles that asks browsers to revalidate every asset.

    The frontend is hand-edited .jsx/.css served by filename (no content
    hashing), so a browser that heuristically caches an old copy will silently
    serve stale UI after an update. `no-cache` keeps conditional requests
    (ETag/Last-Modified) — unchanged files still return a cheap 304 — while
    guaranteeing edits are picked up immediately.
    """

    async def get_response(self, path: str, scope):  # type: ignore[override]
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache"
        return response


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
app.include_router(storymap_router)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "provider": config.provider_name(),
        "services": ["format", "blurb", "promote", "storymap"],
    }


FEEDBACK_FILE = Path(__file__).resolve().parent.parent / "feedback.jsonl"


class FeedbackIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


@app.post("/api/feedback")
def submit_feedback(body: FeedbackIn, _: None = Depends(guard)) -> dict:
    """Append a suggestion/bug report to a local file. No email involved at
    all — nothing to expose, nothing to configure, just a file the person
    running the server reads. Same access guard as the four tools."""
    entry = {"ts": datetime.datetime.utcnow().isoformat() + "Z", "message": body.message.strip()}
    try:
        with FEEDBACK_FILE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except OSError:
        logger.exception("feedback_write_failed")
        raise HTTPException(status_code=500, detail="Couldn't save that just now.")
    return {"ok": True}


if STATIC_DIR.is_dir():
    app.mount("/static", RevalidateStaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False, response_model=None)
def index() -> FileResponse | JSONResponse:
    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file, headers={"Cache-Control": "no-cache"})
    return JSONResponse({"status": "ok", "message": "Quiet Shelf API. See /api/health"})
