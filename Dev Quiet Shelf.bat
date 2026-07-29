@echo off
setlocal
title Quiet Shelf (DEV)
cd /d "%~dp0"

rem === DEV LAUNCHER ===
rem Always kills any stale server on 8090, then starts fresh with --reload so
rem code edits hot-reload. Writes all output to _live.log for debugging.

rem --- Kill anything on port 8090 ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8090" ^| findstr "LISTENING"') do (
    echo Killing old server ^(PID %%p^)...
    taskkill /PID %%p /F >nul 2>&1
)

rem Give the OS a second to release the port
timeout /t 1 /nobreak >nul

rem --- Verify dev deps in the venv ---
".venv\Scripts\python.exe" -c "import docx, striprtf, multipart" >nul 2>&1
if errorlevel 1 (
    echo Installing missing dependencies into .venv...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
)

echo.
echo === Quiet Shelf DEV at http://127.0.0.1:8090 ===
echo Reload is ON - edits apply automatically.
echo Logging to _live.log  (Ctrl+C to stop)
echo.

rem Tee output to both console and _live.log so it can be inspected on disk.
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8090 > _live.log 2>&1
pause
