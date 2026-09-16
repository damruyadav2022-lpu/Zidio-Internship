@echo off
title RetailPulse Always-Live Server
echo ========================================================
echo       RETAILPULSE ALWAYS-LIVE SERVER SUPERVISOR
echo       Keeps the app awake 24/7 with auto-restart
echo ========================================================
echo.

cd /d "%~dp0"

echo Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not recognized on PATH.
    pause
    exit /b 1
)

echo Starting Always-Live Watchdog Supervisor (Anti-Sleep + Auto-Restart + Public Tunnel)...
python deploy_always_live.py

pause
