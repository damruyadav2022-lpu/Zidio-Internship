"""
RetailPulse Product Application Launcher
Starts the enterprise FastAPI backend and opens the modern product frontend in your web browser.
"""
import os
import sys
import webbrowser
import threading
import time
import uvicorn

def open_browser():
    time.sleep(1.5)
    url = "http://localhost:8000"
    print(f"\nOpening RetailPulse Product Web App at: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    print("=" * 60)
    print("STARTING RETAILPULSE ENTERPRISE PRODUCT PLATFORM")
    print("FastAPI Backend + Modern SaaS Product Frontend")
    print("Access URL: http://localhost:8000")
    print("=" * 60)

    # Launch browser after slight delay
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn server
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, log_level="info")
