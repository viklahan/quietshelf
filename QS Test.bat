@echo off
setlocal
title QS Test
cd /d "%~dp0"

echo ============================================================== > tests\test-run.log
echo   QS TEST RUN  %date% %time% >> tests\test-run.log
echo ============================================================== >> tests\test-run.log

echo.
echo === DOCTOR (environment) ===
".venv\Scripts\python.exe" tools\qs_doctor.py >> tests\test-run.log 2>&1
if errorlevel 1 (
    echo DOCTOR: RED - see tests\test-run.log
    set FAILED=1
) else (
    echo DOCTOR: GREEN
)

echo.
echo === LAYER A (static) ===
".venv\Scripts\python.exe" tools\layer_a_static.py >> tests\test-run.log 2>&1
if errorlevel 1 (
    echo LAYER A: RED - see tests\test-run.log
    set FAILED=1
) else (
    echo LAYER A: GREEN
)

echo.
echo === PYTEST (unit + endpoint suite) ===
".venv\Scripts\python.exe" -m pytest tests -q --ignore=tests\layer_b_contract.py --ignore=tests\qs_e2e_test.py >> tests\test-run.log 2>&1
if errorlevel 1 (
    ".venv\Scripts\python.exe" -m pip show pytest >nul 2>&1
    if errorlevel 1 (
        echo PYTEST: installing pytest into .venv...
        ".venv\Scripts\python.exe" -m pip install pytest >> tests\test-run.log 2>&1
        ".venv\Scripts\python.exe" -m pytest tests -q --ignore=tests\layer_b_contract.py --ignore=tests\qs_e2e_test.py >> tests\test-run.log 2>&1
        if errorlevel 1 ( echo PYTEST: RED - see tests\test-run.log & set FAILED=1 ) else ( echo PYTEST: GREEN )
    ) else (
        echo PYTEST: RED - see tests\test-run.log
        set FAILED=1
    )
) else (
    echo PYTEST: GREEN
)

echo.
echo === LAYER B (endpoint contracts, mocked AI) ===
".venv\Scripts\python.exe" tests\layer_b_contract.py >> tests\test-run.log 2>&1
if errorlevel 1 (
    echo LAYER B: RED - see tests\test-report.log
    set FAILED=1
) else (
    echo LAYER B: GREEN
)

echo.
if defined FAILED (
    echo ============================================
    echo   RESULT: RED - do NOT commit.
    echo   Details: tests\test-run.log and tests\test-report.log
    echo ============================================
) else (
    echo ============================================
    echo   RESULT: ALL GREEN - safe to commit.
    echo ============================================
)
pause
