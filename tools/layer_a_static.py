#!/usr/bin/env python3
"""Layer A — static validation. No server, no network, instant.
Checks: every .py compiles, every .jsx transforms (needs node+babel, skips
gracefully if absent), css braces balanced, index.html refs resolve, and the
app's internal import graph (from app.X import Y => Y exists in X).
Run: python tools/layer_a_static.py   (any python; pure stdlib)
"""
import ast
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAIL = []
def ok(m): print(f"  [OK]   {m}")
def bad(m): FAIL.append(m); print(f"  [FAIL] {m}")

print("=" * 62)
print("  LAYER A — STATIC")
print("=" * 62)

# 1. Python compiles
print("\n[A1] Python syntax")
py_files = [p for p in (ROOT / "app").rglob("*.py") if "__pycache__" not in str(p)]
py_files += [p for p in (ROOT / "tools").glob("*.py")] if (ROOT / "tools").exists() else []
symbols = {}   # module path -> set of top-level names (for import graph)
trees = {}
for p in py_files:
    try:
        tree = ast.parse(p.read_text(encoding="utf-8", errors="ignore"))
        trees[p] = tree
        names = set()
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                names.add(node.name)
            elif isinstance(node, ast.Assign):
                for t in node.targets:
                    if isinstance(t, ast.Name):
                        names.add(t.id)
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                names.add(node.target.id)
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                for a in node.names:
                    names.add((a.asname or a.name).split(".")[0])
        rel = p.relative_to(ROOT)
        mod = str(rel.with_suffix("")).replace("\\", "/").replace("/", ".")
        if mod.endswith(".__init__"):
            mod = mod[: -len(".__init__")]
        symbols[mod] = names
    except SyntaxError as e:
        bad(f"{p.relative_to(ROOT)}: line {e.lineno}: {e.msg}")
if not FAIL:
    ok(f"{len(py_files)} python files compile")

# 2. Internal import graph: from app.x import y — does y exist in app.x?
print("\n[A2] Internal import graph")
graph_bad = 0
for p, tree in trees.items():
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("app"):
            target = symbols.get(node.module)
            if target is None:
                continue  # package __init__ re-exports handled loosely
            for a in node.names:
                if a.name == "*":
                    continue
                # 'from app import config' imports the SUBMODULE app.config —
                # valid even though __init__.py never defines the name.
                if f"{node.module}.{a.name}" in symbols:
                    continue
                if a.name not in target:
                    graph_bad += 1
                    bad(f"{p.relative_to(ROOT)}: imports '{a.name}' from {node.module} — not defined there")
if graph_bad == 0:
    ok("every 'from app.X import Y' resolves")

# 3. CSS braces
print("\n[A3] CSS")
for c in (ROOT / "static").glob("*.css"):
    t = c.read_text(encoding="utf-8", errors="ignore")
    if t.count("{") != t.count("}"):
        bad(f"{c.name}: braces {t.count('{')} vs {t.count('}')}")
    else:
        ok(f"{c.name} balanced")

# 4. index.html references
print("\n[A4] index.html references")
idx = ROOT / "static" / "index.html"
html = idx.read_text(encoding="utf-8", errors="ignore")
miss = 0
for m in re.finditer(r'(?:src|href)="/static/([^"]+)"', html):
    if not (ROOT / "static" / m.group(1)).exists():
        miss += 1
        bad(f"index.html -> /static/{m.group(1)} missing on disk")
if miss == 0:
    ok("all local references exist")

# 5. JSX transforms (browser-equivalent babel) — best effort, needs node
print("\n[A5] JSX (babel transform)")
node = None
for cand in ("node", "node.exe"):
    try:
        subprocess.run([cand, "--version"], capture_output=True, check=True)
        node = cand
        break
    except Exception:
        pass
if not node:
    print("  [SKIP] node not found — JSX check runs in Claude's sandbox instead")
else:
    helper = ROOT / "tools" / "_babel_check.js"
    if helper.exists():
        r = subprocess.run([node, str(helper)], capture_output=True, text=True, cwd=str(ROOT))
        print(r.stdout.strip() or r.stderr.strip())
        if "FAILED" in (r.stdout + r.stderr):
            bad("JSX transform failure (see above)")
    else:
        print("  [SKIP] tools/_babel_check.js not present")

print("\n" + "=" * 62)
print(f"  LAYER A: {'GREEN' if not FAIL else f'RED — {len(FAIL)} failures'}")
print("=" * 62)
sys.exit(1 if FAIL else 0)
