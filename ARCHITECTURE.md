# RetailPulse Enterprise: System Architecture & Data Flow

## 1. High-Level Architectural Overview

RetailPulse employs a modern, multi-tier decoupled architecture engineered for high concurrency, low-latency analytics queries, and real-time state synchronization across retail teams.

```mermaid
graph TD
    subgraph Client Tier
        UI["React 18 SPA (Vite + Tailwind)"]
        WSClient["WebSocket Client (Auto-Reconnect)"]
    end

    subgraph API & Gateway Tier
        Nginx["Reverse Proxy / SSL Termination"]
        FastAPI["FastAPI Commercial Core (Uvicorn ASGI)"]
        WSServer["WebSocket Manager (/ws/{org_id})"]
        AuthMiddleware["JWT Authentication & RBAC Filter"]
        RateLimiter["Rate Limiting & Security Headers"]
    end

    subgraph Background & Worker Tier
        TaskRunner["Asynchronous Task Manager"]
        MLWorker["PyTorch & XGBoost Inference Engine"]
        DriftWorker["Kolmogorov-Smirnov Drift Monitor"]
    end

    subgraph Data & Storage Tier
        PrimaryDB[("Relational Store (PostgreSQL / SQLite)")]
        FileStore[("Static Assets / PO PDF Storage")]
        ModelStore[("Trained Model Registry (.pt, .json, .pkl)")]
    end

    UI --> Nginx
    WSClient --> Nginx
    Nginx --> FastAPI
    Nginx --> WSServer
    FastAPI --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> PrimaryDB
    RateLimiter --> TaskRunner
    TaskRunner --> MLWorker
    TaskRunner --> DriftWorker
    MLWorker --> ModelStore
    TaskRunner --> PrimaryDB
    WSServer --> WSClient
    TaskRunner -.->|Publish Event| WSServer
```

---

## 2. Architectural Layers

### 2.1 Frontend Presentation Layer (React 18 + Vite)
- **Framework**: React 18, TypeScript 5.6, Tailwind CSS 3.4.
- **State & Server Cache**: TanStack React Query (`@tanstack/react-query`) with automatic background refetching and cache invalidation upon WebSocket push notifications.
- **Charts & Visualization**: Recharts for responsive time-series charts, radar distribution plots, and cohort bar charts.
- **PDF & Document Engine**: Client-side `jspdf` and `html2canvas` for instantaneous Purchase Order invoice and audit report rendering.

### 2.2 API & Real-Time Gateway Layer (FastAPI ASGI)
- **Framework**: Python 3.11+ with FastAPI, Starlette, and Pydantic v2.
- **Concurrency**: Asynchronous event loop handling I/O-bound database queries and non-blocking WebSocket broadcasts.
- **Authentication**: Stateless HMAC-SHA256 JWT tokens with user ID, email, role, and organization scopes.
- **Real-Time WebSockets**: Dedicated `/ws/{org_id}` endpoint supporting authenticated bi-directional communication, client room partitioning, and background task progress streaming.

### 2.3 Machine Learning & Analytical Pipelines
- **Customer Segmentation**: RFM Feature scaling via Scikit-Learn `StandardScaler` with K-Means clustering ($K=4$), achieving Silhouette Score of 0.6557.
- **Predictive Churn Engine**: XGBoost Classifier evaluated on held-out test split with strict anti-data-leakage features, achieving **0.9615 ROC-AUC**.
- **Demand Forecasting**: 2-Layer PyTorch LSTM Recurrent Neural Network handling sequential temporal dependencies across a 30-day lookback horizon alongside Random Forest autoregressive benchmarks.
- **Statistical Inventory Optimization**: Dynamic calculation of Safety Stock ($SS = Z \times \sigma_d \times \sqrt{L}$) and Reorder Point ($ROP = (\bar{d} \times L) + SS$) with 90%, 95%, and 99% service-level confidence intervals.
- **Drift Detection**: Automated 2-Sample Kolmogorov-Smirnov test comparing baseline vs. current distributions of Sales, Order Quantity, and Profit.

### 2.4 Data & Storage Layer
- **Relational Store**: Dual-engine architecture supporting **SQLite** for rapid development, testing, and zero-setup evaluations, and **PostgreSQL 16** with connection pooling for multi-worker containerized deployments.
- **Model Registry**: File-backed model artifact directory (`models/`) storing model weights (`lstm_model.pt`), scalers (`scaler_lstm.pkl`, `scaler_rfm.pkl`), and feature importance mappings.

---

## 3. Real-Time Event Architecture

RetailPulse utilizes a publish-subscribe event model over WebSockets to guarantee immediate state synchronization without client-side polling.

```mermaid
sequenceDiagram
    autonumber
    actor User as Inventory Manager
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant WS as WebSocket Hub
    participant Worker as Background Task Engine
    participant DB as Relational Database

    User->>UI: Clicks "Run Nightly Forecast Sync"
    UI->>API: POST /api/tasks/trigger { job_type: "nightly_forecast_sync" }
    API->>DB: Record task (status='queued', progress=0)
    API->>Worker: Dispatch job in background
    API-->>UI: Return 200 OK (task_id="task_abc123")
    
    Worker->>Worker: Load demand series & fit LSTM
    Worker->>DB: Update task progress (progress=25, 50, 75)
    Worker->>WS: Broadcast event { type: "TASK_PROGRESS", progress: 50 }
    WS-->>UI: Push progress update to connected clients
    UI->>UI: Render live progress bar
    
    Worker->>DB: Persist updated forecast points (status='completed')
    Worker->>WS: Broadcast event { type: "TASK_COMPLETED", job_type: "nightly_forecast_sync" }
    WS-->>UI: Push completion payload
    UI->>UI: Invalidate TanStack Query cache & re-render forecast chart
```

---

## 4. Multi-Tenant Isolation Model

1. **Organization Hierarchy**:
   - `organizations` represents a commercial tenant.
   - `stores` represents individual physical or digital e-commerce channels (Shopify, WooCommerce, Amazon).
   - `organization_members` maps users to organizations with granular roles (`owner`, `admin`, `inventory_manager`, `analyst`).
2. **Tenant Scoping**:
   - Every API request derives the tenant context from the verified JWT payload.
   - All database reads and writes enforce `WHERE organization_id = :org_id`.
   - Cross-tenant data leakage is prevented at both the application and database query levels.
