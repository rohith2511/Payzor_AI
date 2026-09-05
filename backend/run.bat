@echo off
echo ===================================================
echo   Starting Payzor AI FastAPI Backend on Port 8000
echo ===================================================

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
) else (
    python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
)
