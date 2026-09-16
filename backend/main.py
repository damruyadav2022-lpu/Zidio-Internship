import os
import sys
import uuid
import asyncio
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root in sys.path
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

import time
from collections import defaultdict
from contextlib import asynccontextmanager

from backend.config import settings
from backend.database import init_auth_db
from backend.websocket import ws_router
from backend.tasks.task_manager import task_manager
from backend.routes import (
    auth, dashboard, customers, segmentation, churn, 
    forecasting, inventory, mlops, billing,
    organizations, integrations, actions, tasks, audit, security, health, alerts
)

# In-memory sliding-window rate limiting defense (SEC-07)
_rate_limit_records = defaultdict(list)
RATE_LIMITS = {
    "/api/auth/login": (25, 60),        # 25 requests per 60s
    "/api/auth/register": (15, 60),     # 15 requests per 60s
    "/api/security/api-keys": (40, 60)  # 40 requests per 60s
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize user authentication tables & seed multi-tenant accounts
    init_auth_db()
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.get_event_loop()
    task_manager.set_loop(loop)
    yield

app = FastAPI(
    title="RetailPulse Enterprise API",
    description="Commercial Multi-Tenant REST & Real-Time WebSocket API for RetailPulse AI Retail Intelligence Platform",
    version="3.2.0",
    lifespan=lifespan
)

# Structured request ID & Security headers middleware
@app.middleware("http")
async def add_security_headers_and_tracing(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
    
    # Rate limiting verification
    path = request.url.path
    if path in RATE_LIMITS:
        limit, window = RATE_LIMITS[path]
        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"{client_ip}:{path}"
        now = time.time()
        _rate_limit_records[key] = [t for t in _rate_limit_records[key] if now - t < window]
        if len(_rate_limit_records[key]) >= limit:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Rate limit exceeded. Please try again later."}
            )
        _rate_limit_records[key].append(now)

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Enforce secure CORS origin whitelist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular API routers
app.include_router(ws_router)
app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(segmentation.router)
app.include_router(churn.router)
app.include_router(forecasting.router)
app.include_router(inventory.router)
app.include_router(mlops.router)
app.include_router(organizations.router)
app.include_router(integrations.router)
app.include_router(actions.router)
app.include_router(tasks.router)
app.include_router(audit.router)
app.include_router(security.router)
app.include_router(health.router)
app.include_router(alerts.router)

# Asynchronous pipeline trigger
@app.post("/api/run-pipeline")
def trigger_pipeline(background_tasks: BackgroundTasks):
    import run_pipeline
    background_tasks.add_task(run_pipeline.main)
    return {"status": "success", "message": "Pipeline execution triggered in background"}

# Mount Frontend SPA
FRONTEND_DIST = os.path.join(PROJECT_DIR, "frontend", "dist")
FRONTEND_LEGACY = os.path.join(PROJECT_DIR, "frontend")

if os.path.exists(FRONTEND_DIST):
    # Mount built assets
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    # SPA Fallback for client-side routing (React Router)
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def serve_spa(full_path: str):
        # Don't intercept API or WebSocket calls
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return HTMLResponse("Not found", status_code=404)
        
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return HTMLResponse("<h1>RetailPulse Frontend bundle building... Please run 'npm run build' in frontend.</h1>")
else:
    # If dist not built yet, fallback to serving existing index.html
    @app.get("/", response_class=HTMLResponse)
    def serve_fallback_index():
        index_file = os.path.join(FRONTEND_LEGACY, "index.html")
        if os.path.exists(index_file):
            with open(index_file, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
        return HTMLResponse("<h1>RetailPulse API is live. Frontend build pending.</h1>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
