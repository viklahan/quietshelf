"""Format endpoint: POST /api/format to convert a manuscript to EPUB,
GET /api/format/themes to list available themes."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from app import config
from app.deps import guard
from app.services.format.converter import UnsupportedFormat, convert_to_epub
from app.services.format.models import Theme, ThemeInfo, ThemeList
from app.services.format.themes import THEMES

logger = logging.getLogger("quietshelf.format")

router = APIRouter(prefix="/api", tags=["format"])


@router.get("/format/themes", response_model=ThemeList)
def list_themes() -> ThemeList:
    """Return all registered themes."""
    return ThemeList(
        themes=[
            ThemeInfo(id=spec.id, display_name=spec.display_name, description=spec.description)
            for spec in THEMES.values()
        ]
    )


@router.post("/format")
async def format_manuscript(
    request: Request,
    title: str = Form(...),
    author: str = Form(...),
    theme: Theme = Form(Theme.classic),
    file: UploadFile = File(...),
    _: None = Depends(guard),
):
    """Convert an uploaded DOCX/RTF/TXT manuscript to a themed EPUB."""
    raw = await file.read()
    max_bytes = config.max_upload_mb() * 1024 * 1024
    if len(raw) > max_bytes:
        return JSONResponse(
            status_code=413,
            content={"error": "file_too_large", "message": f"File exceeds the {config.max_upload_mb()} MB limit."},
        )

    suffix = Path(file.filename or "upload").suffix.lower()

    with tempfile.TemporaryDirectory(prefix="quietshelf_fmt_") as workdir:
        src = Path(workdir) / f"manuscript{suffix}"
        src.write_bytes(raw)
        out = Path(workdir) / "output.epub"

        try:
            convert_to_epub(source=src, out_path=out, title=title, author=author, theme=theme)
        except UnsupportedFormat as exc:
            return JSONResponse(
                status_code=415,
                content={"error": "unsupported_format", "message": str(exc)},
            )

        epub_bytes = out.read_bytes()

    logger.info("format_endpoint theme=%s size=%d", theme.value, len(epub_bytes))

    import io
    from starlette.responses import StreamingResponse

    return StreamingResponse(
        io.BytesIO(epub_bytes),
        media_type="application/epub+zip",
        headers={"Content-Disposition": f'attachment; filename="{title}.epub"'},
    )
