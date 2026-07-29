#!/usr/bin/env python3
"""Quiet Shelf doctor — verifies the environment can actually run the app.
Run with the SAME python that runs the app:  .venv/Scripts/python.exe tools/qs_doctor.py
Exit 0 = healthy. Exit 1 = problems (each printed with the exact fix).
"""
import importlib
import os
import socket
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASS, FAIL, WARN = 0, 0, 0
def ok(msg): global PASS; PASS += 1; print(f"  [OK]   {msg}")
def bad(msg, fix): global FAIL; FAIL += 1; print(f"  [FAIL] {msg}\n         FIX: {fix}")
def warn(msg): global WARN; WARN += 1; print(f"  [WARN] {msg}")

print("=" * 62)
print("  QUIET SHELF DOCTOR")
print("=" * 62)

# 1. Which python is this?
print("\n[1] Python environment")
exe = Path(sys.executable).resolve()
print(f"  interpreter: {exe}")
print(f"  version:     {sys.version.split()[0]}")
in_venv = ".venv" in str(exe)
if in_venv:
    ok("running inside the project .venv")
else:
    warn("NOT the .venv interpreter — the app runs from .venv; run doctor as: .venv/Scripts/python.exe tools/qs_doctor.py")

# 2. Every dependency the app imports
print("\n[2] Dependencies (import test in THIS interpreter)")
DEPS = [
    ("fastapi", "fastapi"), ("uvicorn", "uvicorn"), ("pydantic", "pydantic"),
    ("python-docx", "docx"), ("striprtf", "striprtf"), ("python-multipart", "multipart"),
    ("google-genai", "google.genai"), ("groq", "groq"), ("openai", "openai"),
    ("httpx", "httpx"), ("requests", "requests"), ("python-dotenv", "dotenv"),
    ("pypandoc_binary", "pypandoc"), ("pillow", "PIL"), ("lxml", "lxml"),
]
for pkg, mod in DEPS:
    try:
        importlib.import_module(mod)
        ok(f"{pkg}")
    except Exception as e:
        bad(f"{pkg} ({mod}): {e.__class__.__name__}", f"{Path(sys.executable).name} -m pip install {pkg}")

# 3. The app itself imports (catches EVERY import-time crash before uvicorn does)
print("\n[3] App import (the whole module graph)")
sys.path.insert(0, str(ROOT))
os.environ.setdefault("QS_DOCTOR", "1")
try:
    import app.main  # noqa
    ok("app.main imports — server can boot")
except Exception as e:
    bad(f"app.main failed to import: {e.__class__.__name__}: {e}",
        "this is the exact error uvicorn would die with; fix it before starting")

# 4. .env sanity
print("\n[4] .env")
envf = ROOT / ".env"
if not envf.exists():
    bad(".env missing", "copy .env.example to .env and add keys")
else:
    content = envf.read_text(encoding="utf-8", errors="ignore")
    ok(".env exists")
    if "MODEL_NAME=" in content and not content.strip().startswith("#"):
        for line in content.splitlines():
            if line.strip().startswith("MODEL_NAME="):
                warn(f"global override present: {line.strip()} — in waterfall mode this is ignored (by design), remove to avoid confusion")
    for key in ("GEMINI_API_KEY", "GROQ_API_KEY"):
        if key + "=" not in content:
            warn(f"{key} not set — that waterfall leg will be skipped")

# 5. Port 8090 state
print("\n[5] Port 8090")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1)
busy = s.connect_ex(("127.0.0.1", 8090)) == 0
s.close()
if busy:
    warn("port 8090 is IN USE — a server is running. If it predates your code changes it is serving STALE code. Use 'Dev Quiet Shelf.bat' (kills + reloads).")
else:
    ok("port 8090 free")

# 6. Frontend files present + referenced
print("\n[6] Frontend integrity")
idx = ROOT / "static" / "index.html"
if not idx.exists():
    bad("static/index.html missing", "restore it")
else:
    html = idx.read_text(encoding="utf-8", errors="ignore")
    import re
    missing = []
    for m in re.finditer(r'src="/static/([^"]+)"', html):
        if not (ROOT / "static" / m.group(1)).exists():
            missing.append(m.group(1))
    if missing:
        bad(f"index.html references missing files: {missing}", "create them or remove the tags")
    else:
        ok("every script/css referenced in index.html exists on disk")

print("\n" + "=" * 62)
print(f"  RESULT: {PASS} ok, {WARN} warnings, {FAIL} failures")
print("=" * 62)
sys.exit(1 if FAIL else 0)
