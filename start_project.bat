@echo off
title Unified Healthcare Platform Launcher
echo ===================================================
echo   Starting Unified Healthcare System (UHAITS)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting ML Microservice on port 5001...
start "UHAITS - ML Service (Port 5001)" cmd /k "cd /d %~dp0ml_service && python app.py"

echo [2/3] Starting Backend API Server on port 5000...
start "UHAITS - Server (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend React Vite App on port 5173...
start "UHAITS - Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===================================================
echo All services launched!
echo - Frontend:   http://localhost:5173
echo - Backend:    http://localhost:5000
echo - ML Service: http://localhost:5001
echo ===================================================
echo You can keep this window open or close it anytime.
pause
