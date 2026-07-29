@echo off
setlocal
title Quiet Shelf
cd /d "%~dp0"

rem --- Kill any process already holding port 8090 (stale server) ---
rem Without this, a crashed or old-code server keeps serving and the app
rem never picks up updates. Find the PID on 8090 and kill it.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8090" ^| findstr "LISTENING"') do (
    echo Stopping old Quiet Shelf ^(PID %%p^)...
    taskkill /PID %%p /F >nul 2>&1
)

rem First run: create the Python environment and install dependencies.
if not exist ".venv\Scripts\python.exe" (
    echo First-time setup - this takes a few minutes. Please wait...
    py -3 -m venv .venv 2>nul || python -m venv .venv
    if not exist ".venv\Scripts\python.exe" (
        echo.
        echo Python was not found. Install it from https://www.python.org/downloads/
        echo ^(check "Add python.exe to PATH" during install^) then run this again.
        pause
        goto :eof
    )
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo Setup failed - see the messages above.
        pause
        goto :eof
    )
)

rem Make sure required packages are present even on an existing .venv.
rem Catches the case where requirements.txt gained a dep but .venv is stale.
".venv\Scripts\python.exe" -c "import docx, striprtf, multipart" >nul 2>&1
if errorlevel 1 (
    echo Installing missing dependencies...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
)

rem A .env is required for the AI provider settings.
if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env from .env.example - open it and add your AI key if requests fail.
)

rem Open the browser as soon as the server answers.
start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 90;$i++){ try { Invoke-WebRequest http://127.0.0.1:8090/api/health -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process 'http://127.0.0.1:8090/'; break } catch { Start-Sleep 1 } }"

echo.
echo Starting Quiet Shelf at http://127.0.0.1:8090 - keep this window open.
echo Close this window to stop Quiet Shelf.
echo.
".venv\Scripts\python.exe" -m uvicorn app.main:app --port 8090
pause
