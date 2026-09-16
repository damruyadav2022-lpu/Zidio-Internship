"""
RetailPulse 24/7 Always-Live Supervisor & Public Tunnel Manager
- Prevents Windows PC from sleeping (via Windows Kernel API SetThreadExecutionState)
- Supervises both FastAPI (port 8000) and Streamlit (port 8501) with auto-restart on crash
- Generates a live public HTTPS URL via localtunnel so anyone on the internet can access it
- Periodically pings all endpoints to ensure 100% uptime
"""
import os
import sys
import time
import ctypes
import subprocess
import threading
import urllib.request

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
FASTAPI_PORT = 8000
STREAMLIT_PORT = 8501
FASTAPI_URL = f"http://localhost:{FASTAPI_PORT}"
STREAMLIT_URL = f"http://localhost:{STREAMLIT_PORT}"

# Windows API constants to prevent OS sleep/hibernation
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

def prevent_windows_sleep():
    """Tells Windows kernel to never put the PC to sleep while RetailPulse is running."""
    if sys.platform == "win32":
        try:
            ctypes.windll.kernel32.SetThreadExecutionState(
                ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
            )
            print("[System] Windows Power State: SLEEP DISABLED (PC will stay awake 24/7)")
        except Exception as e:
            print(f"[System] Warning: Could not adjust Windows power state: {e}")

def restore_windows_sleep():
    """Restores default Windows sleep settings when user stops the process."""
    if sys.platform == "win32":
        try:
            ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
            print("[System] Windows Power State: Standard sleep settings restored.")
        except Exception:
            pass

def ping_loop():
    """Continuous heartbeat pinger to keep internal event loops and sockets active."""
    while True:
        time.sleep(30)
        for url in [f"{FASTAPI_URL}/api/health", STREAMLIT_URL]:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "RetailPulse-AlwaysLive/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    pass
            except Exception:
                pass

def run_fastapi_server():
    """Supervisor loop that launches and auto-restarts FastAPI on port 8000."""
    restart_count = 0
    while True:
        try:
            cmd = [
                sys.executable, "-m", "uvicorn", "backend.main:app",
                "--host", "0.0.0.0",
                "--port", str(FASTAPI_PORT),
                "--log-level", "warning"
            ]
            print(f"[FastAPI] Starting Enterprise Platform on port {FASTAPI_PORT} (Run #{restart_count + 1})...")
            proc = subprocess.Popen(cmd, cwd=PROJECT_DIR)
            proc.wait()
            restart_count += 1
            print("[FastAPI] Warning: Process stopped. Auto-restarting in 2 seconds...")
            time.sleep(2)
        except Exception as e:
            print(f"[FastAPI] Supervisor error: {e}")
            time.sleep(3)

def run_streamlit_server():
    """Supervisor loop that launches and auto-restarts Streamlit on port 8501."""
    restart_count = 0
    app_path = os.path.join(PROJECT_DIR, "dashboard", "app.py")
    while True:
        try:
            cmd = [
                sys.executable, "-m", "streamlit", "run", app_path,
                "--server.port", str(STREAMLIT_PORT),
                "--server.address", "0.0.0.0",
                "--server.headless", "true"
            ]
            print(f"[Streamlit] Starting Analytics Dashboard on port {STREAMLIT_PORT} (Run #{restart_count + 1})...")
            proc = subprocess.Popen(cmd, cwd=PROJECT_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            proc.wait()
            restart_count += 1
            print("[Streamlit] Warning: Process stopped. Auto-restarting in 2 seconds...")
            time.sleep(2)
        except Exception as e:
            print(f"[Streamlit] Supervisor error: {e}")
            time.sleep(3)

def run_public_tunnel():
    """Starts localtunnel to expose port 8000 to a public HTTPS URL."""
    time.sleep(4)
    print("\n" + "=" * 65)
    print("ESTABLISHING PUBLIC LIVE INTERNET URL (NO SLEEP / 24/7 ACCESSIBLE)")
    print("=" * 65)
    try:
        # Launch npx localtunnel
        tunnel_cmd = "npx -y localtunnel --port 8000"
        proc = subprocess.Popen(tunnel_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            if "your url is:" in line.lower():
                url = line.strip().split()[-1]
                print(f"\n🚀 YOUR LIVE PUBLIC WEB URL IS: {url}")
                print(f"👉 Share this link with anyone! It is live and directly accessible over the internet.")
                print(f"👉 Pre-configured login: evaluator@retailpulse.ai / password123 (or 1-Click Demo)\n")
                # Save to keep_alive_url.txt
                with open(os.path.join(PROJECT_DIR, "keep_alive_url.txt"), "w", encoding="utf-8") as f:
                    f.write(f"# Active live public URL\n{url}\n")
            elif line.strip():
                print(f"[Tunnel] {line.strip()}")
    except Exception as e:
        print(f"[Tunnel] Tunnel launcher note: {e}")

def main():
    print("=" * 65)
    print("       RETAILPULSE 24/7 ALWAYS-LIVE DEPLOYMENT SUPERVISOR")
    print("=" * 65)
    print(f"Local FastAPI App   : {FASTAPI_URL}")
    print(f"Local Streamlit App : {STREAMLIT_URL}")
    print(f"Auto-Restart        : ENABLED (Restarts instantly on crash)")
    print(f"Anti-Sleep Mode     : ENABLED (Keeps PC active 24/7)")
    print("=" * 65 + "\n")

    prevent_windows_sleep()

    # Start background ping thread
    threading.Thread(target=ping_loop, daemon=True).start()

    # Start FastAPI thread
    fastapi_thread = threading.Thread(target=run_fastapi_server, daemon=True)
    fastapi_thread.start()

    # Start Streamlit thread
    streamlit_thread = threading.Thread(target=run_streamlit_server, daemon=True)
    streamlit_thread.start()

    # Start Public Tunnel thread
    tunnel_thread = threading.Thread(target=run_public_tunnel, daemon=True)
    tunnel_thread.start()

    print("RetailPulse is fully active. Press Ctrl+C at any time to stop.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping RetailPulse Always-Live Supervisor...")
        restore_windows_sleep()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
