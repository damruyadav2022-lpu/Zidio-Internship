@echo off
title RetailPulse Enterprise Product Platform
echo ========================================================
echo       RETAILPULSE ENTERPRISE PRODUCT PLATFORM
echo       FastAPI Backend + Modern SaaS Product Frontend
echo ========================================================
echo.

cd /d "%~dp0"

echo Launching RetailPulse at http://localhost:8000 ...
python run_product_app.py

pause
