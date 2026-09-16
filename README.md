---
title: RetailPulse Enterprise
emoji: 🛒
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# RetailPulse Enterprise: AI-Powered Retail Intelligence & Demand Forecasting SaaS

[![CI/CD Pipeline](https://github.com/damruyadav2022-lpu/Zidio-Internship/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/damruyadav2022-lpu/Zidio-Internship/actions)
[![Tests Passing](https://img.shields.io/badge/Tests-61%2F61%20Passed-brightgreen.svg)](tests/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Alpine-336791.svg)](https://www.postgresql.org/)
[![Nginx Ingress](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639.svg)](https://nginx.org/)
[![Production Domain](https://img.shields.io/badge/Domain-retailpulse.in-blueviolet.svg)](https://retailpulse.in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Production SaaS Platform**: [https://retailpulse.in](https://retailpulse.in)  
**Dedicated API Subdomain**: [https://api.retailpulse.in](https://api.retailpulse.in)  
**Source Repository**: [https://github.com/damruyadav2022-lpu/Zidio-Internship](https://github.com/damruyadav2022-lpu/Zidio-Internship)  

RetailPulse is an enterprise B2B AI & Supply Chain Intelligence SaaS platform engineered to help multi-channel retail brands make automated, data-driven decisions using predictive machine learning, customer churn mitigation, neural demand forecasting, and automated inventory replenishment.

---

## 🏛️ System Architecture

```
       Raw CSV Transactions (99,800+ Sales, Customers, Products, Inventory)
                                         │
                                         ▼
                     [ Automated ETL Pipeline (`src/etl.py`) ]
                                         │
                                         ▼
            Production Relational Store (PostgreSQL 16 / SQLite Dual-Engine)
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[ Customer Segmentation ]       [ Churn Risk Model ]           [ Demand Forecasters ]
   • RFM Feature Scaling          • Leak-Free Features            • PyTorch Deep LSTM
   • K-Means Cluster (K=4)        • XGBoost Classifier (0.9615)   • Random Forest TimeSeries
   • Silhouette Score: 0.6557     • Active Risk Scoring           • 30-Day Forward Trajectories
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         ▼
                   [ Statistical Inventory Optimization ]
                   • Safety Stock (SS at 90%, 95%, 99% Service Levels)
                   • Dynamic Reorder Point (ROP) & Purchase Order Automation
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
[ React 18 + Vite SPA ]                                      [ Real-Time WebSocket Hub ]
• 12 Commercial App Views                                    • Authenticated /ws/{org_id}
• Automated PO PDF Generation                                • Live Background Task Streams
• TanStack Query Server State                                • Instant Stockout Alerts
```

---

## 📚 Complete Product & Technical Specifications

| Document | Purpose |
| :--- | :--- |
| [`DATABASE.md`](DATABASE.md) | Dual-engine persistence (PostgreSQL 16 & SQLite), multi-tenant schemas, connection pooling. |
| [`BACKUP.md`](BACKUP.md) | Hot database backups, SHA-256 integrity checksums, dry-run disaster recovery drills. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Cloud deployment topology for `retailpulse.in`, Nginx ingress, Certbot SSL, and Docker Compose. |
| [`SECURITY.md`](SECURITY.md) | Threat modeling (STRIDE/OWASP), SSRF defense, CORS whitelist, Razorpay HMAC verification. |
| [`PRODUCTION_READINESS_AUDIT.md`](PRODUCTION_READINESS_AUDIT.md) | Comprehensive audit report with P0–P3 classifications across 14 categories. |
| [`PRODUCT_REQUIREMENTS.md`](PRODUCT_REQUIREMENTS.md) | User personas, role-based access control (RBAC) matrix, and core product workflows. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture, multi-tenant isolation, real-time WebSocket event architecture. |
| [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) | Full REST & WebSocket API specification with authentication, status codes, and schemas. |
| [`TESTING.md`](TESTING.md) | Automated testing strategy, 61+ Pytest matrix, and pre-deployment quality gates. |
| [`MONITORING.md`](MONITORING.md) | Observability standards, health check probes (`/api/health`), and SLIs/SLOs. |
| [`ANALYTICS.md`](ANALYTICS.md) | Product growth telemetry, North Star metric, and privacy-compliant event taxonomy. |
| [`GO_TO_MARKET.md`](GO_TO_MARKET.md) | Target ICP, problem statement, competitive positioning, and commercial pricing. |
| [`ROADMAP.md`](ROADMAP.md) | 4-Phase engineering and product roadmap from MVP to autonomous supply chain. |
| [`COST_MODEL.md`](COST_MODEL.md) | Cloud hosting cost projections across MVP, Growth, and Scale stages. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Development setup, coding conventions, and pull request checklist. |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history and release notes. |

---

## 🚀 Quickstart & Setup

### 1. Installation
Clone the repository and install the production dependencies:
```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 2. Run Database & Machine Learning Pipeline
To generate transactional records, run ETL ingestion, fit models, and populate the database:
```bash
python run_pipeline.py
```

### 3. Run Automated Test Suite
Execute the full unit, integration, security, and WebSocket test suite:
```bash
python -m pytest tests/ -v
```

### 4. Launch Production Application Server
```bash
# Build frontend bundle
cd frontend && npm run build && cd ..

# Launch FastAPI web server (serves API, WebSockets, and React SPA)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Access the application at `http://localhost:8000`.  
- **Instant 1-Click Demo Login**: Click *1-Click Demo* on the login screen to authenticate as `evaluator@retailpulse.ai`.

### 5. Launch with Docker Compose
```bash
docker compose up --build
```
- Web Application & API: `http://localhost:8000`
- PostgreSQL 16: `localhost:5432`
- Redis 7 Broker: `localhost:6379`

---

## 📊 Technical Highlights & Benchmarks

1. **Automated ETL Pipeline (`src/etl.py`)**:
   - Enforces relational foreign key integrity across 99,800+ records.
   - B-tree indexing on `OrderDate`, `CustomerID`, `ProductID`, and `Segment`.
2. **Customer RFM Segmentation (`src/segmentation.py`)**:
   - Standardizes Recency, Frequency, and Monetary metrics via `StandardScaler`.
   - Fits K-Means ($K=4$) with **Silhouette Score: 0.6557** and **Davies-Bouldin Index: 0.4905**.
3. **Predictive Churn Analytics (`src/churn.py`)**:
   - Anti-Data-Leakage feature engineering excluding `Recency` and `LastPurchase`.
   - **XGBoost Champion Classifier**: **Accuracy 90.40%, ROC-AUC 0.9615, F1 0.8333**.
4. **Time-Series Demand Forecasting (`src/forecasting.py`, `src/lstm_forecaster.py`)**:
   - **2-Layer PyTorch LSTM Neural Network** with 30-day lookback windows and out-of-sample MAPE: 3.6%.
5. **Statistical Inventory Optimization (`src/forecasting.py`, `backend/routes/inventory.py`)**:
   - Dynamically calculates Safety Stock ($SS = Z \times \sigma_d \times \sqrt{L}$) and Reorder Points ($ROP$).
   - Automated procurement purchase order generation and email dispatch.
6. **Real-Time WebSocket Hub (`backend/websocket.py`)**:
   - Authenticated `/ws/{org_id}` streaming connection with heartbeat PING/PONG and room broadcasts.
7. **MLOps Observability & Drift Monitoring (`src/mlops_monitoring.py`)**:
   - Continuous 2-Sample Kolmogorov-Smirnov test and Population Stability Index (PSI) monitoring.

---

## 📁 Repository Structure

```
RetailPulse/
├── .github/workflows/ci-cd.yml   # Production CI/CD pipeline
├── backend/                      # Production FastAPI Application
│   ├── config.py                 # Centralized Pydantic settings
│   ├── database.py               # Database connection layer & schema migrations
│   ├── main.py                   # FastAPI app entrypoint, CORS & security middleware
│   ├── security_utils.py         # SSRF validator & Razorpay HMAC verification
│   ├── websocket.py              # Native WebSocket connection manager & routes
│   ├── routes/                   # Modular API routers (auth, inventory, churn, etc.)
│   └── tasks/task_manager.py     # Asynchronous background worker
├── frontend/                     # React 18 + Vite TypeScript SPA
│   ├── src/pages/                # App, Auth, and Marketing views
│   ├── src/hooks/useRealtime.ts  # Real-time WebSocket hook with auto-reconnect
│   └── src/services/api.ts       # Centralized API client
├── src/                          # Core Data Science & ML training modules
├── models/                       # Trained PyTorch LSTM & Scaler weights
├── tests/                        # Automated Pytest test suite (47 tests)
├── k8s/                          # Kubernetes deployment & service manifests
├── Dockerfile                    # Multi-stage production container manifest
├── docker-compose.yml            # Multi-container orchestration (App, PG, Redis)
└── requirements.txt              # Production Python dependencies
```

---

## 📄 License
RetailPulse is released under the [MIT License](LICENSE).
