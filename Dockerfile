FROM python:3.12-slim

WORKDIR /srv/quiet-shelf

# pandoc is bundled by pypandoc_binary (no system package needed); theme fonts
# are vendored in the repo under app/services/format/theme_assets.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY static/ static/
COPY pyproject.toml .

RUN useradd --create-home --shell /usr/sbin/nologin shelf
USER shelf

# Render/Railway inject PORT; default to 8000 for local runs.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
