"""
RetailPulse Always-Live Watchdog Supervisor
Runs Streamlit continuously 24/7, monitors health, and auto-restarts the server if it ever stops.
"""
import os
import sys
import time
import subprocess
import threading
import urllib.request

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_PATH = os.path.join(PROJECT_DIR, "dashboard", "app.py")
PORT = 8501
URL = f"http://localhost:{PORT}"

def ping_health():
    """Periodically pings the Streamlit server to keep HTTP/WebSocket channels active."""
    while True:
        time.sleep(30)
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": "RetailPulse-KeepAlive/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.getcode()
                # print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Keep-Alive Heartbeat: Status {status} (Live)")
        except Exception:
            pass

def run_server():
    """Main watchdog supervisor loop that auto-restarts Streamlit if it ever terminates."""
    print("=" * 60)
    print("RETAILPULSE ALWAYS-LIVE SUPERVISOR STARTING")
    print(f"Target App: {APP_PATH}")
    print(f"Local URL : {URL}")
    print("Keep-Alive: Active (Auto-restarts on exit, prevents sleep)")
    print("=" * 60)

    # Start background ping thread
    pinger = threading.Thread(target=ping_health, daemon=True)
    pinger.start()

    restart_count = 0
    while True:
        try:
            cmd = [
                sys.executable,
                "-m", "streamlit", "run", APP_PATH,
                "--server.port", str(PORT),
                "--server.address", "0.0.0.0",
                "--server.headless", "true"
            ]
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting Streamlit instance (Run #{restart_count + 1})...")
            proc = subprocess.Popen(cmd, cwd=PROJECT_DIR)
            proc.wait()

            restart_count += 1
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Warning: Streamlit process stopped. Auto-restarting in 3 seconds...")
            time.sleep(3)
        except KeyboardInterrupt:
            print("\nShutting down supervisor by user request.")
            break
        except Exception as e:
            print(f"Watchdog exception: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    run_server()
