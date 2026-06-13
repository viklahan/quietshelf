FROM python:3.12-slim

WORKDIR /srv/qfc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY qfc/ qfc/
COPY static/ static/

RUN useradd --create-home --shell /usr/sbin/nologin qfc
USER qfc

# Render/Railway inject PORT; default to 8000 for local runs.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
