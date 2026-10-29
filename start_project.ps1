# Unified Healthcare Platform PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting Unified Healthcare System (UHAITS)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start ML Service
Write-Host "`n[1/3] Starting ML Microservice on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); Set-Location '$baseDir\ml_service'; python app.py"

# 2. Start Backend Server
Write-Host "[2/3] Starting Backend API Server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); Set-Location '$baseDir\server'; npm run dev"

Start-Sleep -Seconds 3

# 3. Start Frontend Client
Write-Host "[3/3] Starting Frontend React Vite App on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'); Set-Location '$baseDir\client'; npm run dev"

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "All services initiated:" -ForegroundColor Green
Write-Host " - Frontend:   http://localhost:5173" -ForegroundColor Green
Write-Host " - Backend:    http://localhost:5000" -ForegroundColor Green
Write-Host " - ML Service: http://localhost:5001" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
