# RetailPulse: Comprehensive Production-Readiness Audit Report

**Assessment Date**: September 2026  
**Auditor**: Principal Systems Architect, Lead Security Engineer & MLOps Lead  
**Target Application**: RetailPulse B2B Enterprise AI Retail Intelligence Platform  
**Repository State**: Advanced Prototype / Pre-Production Candidate  

---

## 1. Executive Summary

RetailPulse is an end-to-end data science and analytics platform engineered to assist multi-channel retail merchants with customer segmentation (RFM K-Means), churn risk mitigation (XGBoost Classifier), forward demand forecasting (2-layer PyTorch LSTM), and inventory replenishment optimization (Safety Stock & Reorder Points).

The data science pipeline and analytical foundations are mathematically robust:
- Over 99,800 historical sales transactions ingested and normalized in SQLite.
- XGBoost classifier achieving **0.9615 ROC-AUC** and **90.40% accuracy** with anti-leakage feature engineering.
- 2-Layer PyTorch LSTM demand forecaster with 30-day lookback windows and out-of-sample evaluation.
- High-performing React 18 + Vite frontend with Tailwind CSS and responsive design.

However, a rigorous production audit reveals **critical P0 security vulnerabilities, architectural shortcuts, and missing infrastructure** that must be resolved before commercial production release.

---

## 2. Comprehensive Issue Matrix & Classification

Issues are classified using standard severity criteria:
- **P0 (Critical)**: Exploitable security vulnerabilities, payment bypass risks, data breaches, or fatal build errors.
- **P1 (High)**: Architectural debt, simulated/fake background jobs, silent error suppression, missing access control.
- **P2 (Medium)**: Suboptimal query performance, lack of database connection pooling, missing rate limits.
- **P3 (Low)**: Documentation gaps, styling inconsistencies, minor code redundancies.

| Issue ID | Category | Description | Severity | Impact |
| :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | Security | Broken Access Control: Unauthenticated access to customer data, financial metrics, and operational actions | **P0** | Data Leakage / Privacy Violation |
| **SEC-02** | Security | Server-Side Request Forgery (SSRF) in webhook test endpoint (`/api/actions/webhooks/test`) | **P0** | Internal Network Scan / Cloud Metadata Compromise |
| **SEC-03** | Security | Insecure CORS Configuration (`allow_origins=["*"]` with `allow_credentials=True`) | **P0** | Credential Theft / CSRF Vulnerability |
| **SEC-04** | Security | Payment Verification Bypass: Razorpay endpoint does not verify HMAC-SHA256 signature | **P0** | Unauthorized Free Subscription Provisioning |
| **SEC-05** | Security | Hardcoded Secrets: Static fallback JWT secret in codebase and hardcoded DB passwords | **P0** | Account Hijacking / Credential Compromise |
| **SEC-06** | Security | Tenant Boundary Violations: Hardcoded `organization_id = 1` and `user_id = 1` in security and action routes | **P0** | Multi-Tenant Data Cross-Contamination |
| **ARC-01** | Architecture | Fake Background Tasks: `task_manager.py` uses `time.sleep` and hardcoded completion statistics | **P1** | Misleading User Feedback / Lack of Execution |
| **ARC-02** | Architecture | Simulated Real-Time: No native WebSocket or SSE server; frontend relies on polling | **P1** | High Server Load / Unreliable Real-Time Updates |
| **ARC-03** | Architecture | Database Engine Mismatch: Code hardcodes SQLite while deployment manifests specify PostgreSQL | **P1** | Production Deployment Failure |
| **DEV-01** | Deployment | Broken Dockerfile: `COPY ml_models/` and `COPY etl/` reference non-existent directories; runs as root | **P0** | Container Build Failure / Root Execution Risk |
| **BUG-01** | Logic/Math | Inventory Reorder Point double-scales safety stock when adjusting service level $z$-scores | **P1** | Skewed Replenishment Quantities |
| **UX-01** | Frontend | Silent Error Suppression: `frontend/src/services/api.ts` masks API failures by returning demo data | **P1** | Masked Outages / Developer Misdirection |
| **SEC-07** | Security | Missing Rate Limiting on authentication, password reset, and API key endpoints | **P1** | Brute Force Attacks / DoS Vulnerability |
| **DAT-01** | Data/DB | Synthetic Customer Attributes: Customer email and signup dates generated on the fly via SQL string operations | **P2** | Inconsistent Data Representation |
| **OBS-01** | Observability | Hardcoded Model Registry and MLflow experiments in `backend/routes/mlops.py` | **P2** | Static Monitoring / Unsynchronized ML State |
| **PERF-01**| Performance | Monolithic frontend chunk size (>1.4 MB) without dynamic lazy-loading | **P2** | Slow Initial Page Load Times |
| **DOC-01** | Governance | Missing formalized compliance, terms, privacy, and disaster recovery specifications | **P3** | Operational Non-Compliance |

---

## 3. Deep Dive into Critical Categories

### 3.1 Architecture & Backend
- **Current Architecture**: FastAPI backend serving modular routers and static frontend SPA assets; SQLite database (`retailpulse.db`) populated via batch script `run_pipeline.py`.
- **Existing Functionality**: High-performance read operations on aggregated sales, RFM segmentation, churn probabilities, and forecasting data.
- **Prototype Artifacts**:
  - `src/api.py` is a 587-line legacy monolithic API that duplicates `backend/main.py`.
  - `backend/tasks/task_manager.py` simulates background processing using hardcoded sleep timers instead of running actual background recalculations.
  - Multi-tenancy is partially implemented in schema (`organizations`, `stores`, `organization_members`) but bypassed in router implementations by hardcoding `organization_id = 1`.

### 3.2 Security & Authentication
- **Broken Access Control**: Endpoints under `/api/customers`, `/api/forecasting`, `/api/inventory`, `/api/churn`, `/api/segmentation`, and `/api/actions` permit unauthenticated GET and POST requests. Anyone on the open web can query sensitive customer PII or invoke external webhooks.
- **SSRF in `backend/routes/actions.py`**:
  ```python
  # Vulnerable snippet in test_webhook:
  req_data = json.dumps(payload).encode("utf-8")
  request = urllib.request.Request(req.webhook_url, data=req_data, ...)
  urllib.request.urlopen(request, timeout=4)
  ```
  An attacker can supply `http://169.254.169.254/latest/meta-data/` to extract cloud provider instance credentials, or `http://127.0.0.1:8000/internal` to attack internal microservices.
- **Insecure CORS**:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
  `allow_origins=["*"]` with `allow_credentials=True` is prohibited by the Fetch standard and permits cross-origin session riding.
- **Payment Verification Bypass**:
  The Razorpay verification endpoint (`/api/billing/razorpay/verify-payment`) accepts payment IDs without validating HMAC SHA256 signatures against `RAZORPAY_KEY_SECRET`.

### 3.3 Database & Data Integrity
- **Database Engine Support**: `backend/database.py` explicitly opens `sqlite3.connect(DB_PATH)` regardless of the `DATABASE_URL` environment variable. In staging or production Kubernetes pods with PostgreSQL, this causes runtime failures.
- **Data Hardcoding**: Customer emails are synthesized dynamically in SQL (`lower(replace(c.CustomerName, ' ', '.')) || '@enterprise.retail' as Email`).
- **Missing Migrations Table**: Schema updates are executed via `CREATE TABLE IF NOT EXISTS` with no migration version tracking.

### 3.4 AI/ML System & MLOps
- **Strengths**: True XGBoost, K-Means, and PyTorch LSTM model binaries are trained and evaluated in `src/`. Strict anti-leakage protocols are enforced in `src/churn.py` (omitting Recency from churn classification).
- **Shortcomings**:
  - `backend/routes/mlops.py` returns hardcoded static JSON dictionaries for the Model Registry and MLflow experiments instead of querying dynamic experiment records or disk artifacts.
  - Model retraining trigger in `backend/main.py` (`/api/run-pipeline`) runs synchronously via a thread without job isolation or progress streaming.

### 3.5 Real-Time Functionality
- **Gap**: The landing page and pricing tiers promote "Real-Time WebSocket Pipelines", but no WebSocket endpoint (`ws://`) exists.
- **Frontend Workaround**: The frontend uses `refetchInterval: 20000` (polling every 20 seconds) and local mock events.

### 3.6 Docker, CI/CD & Deployment
- **Dockerfile Defects**:
  - `COPY ml_models/ ./ml_models/` and `COPY etl/ ./etl/` fail because directories are named `models/` and `src/`.
  - Process executes as root without a non-privileged system user.
  - Missing build caching layers for dependencies.
- **Docker Compose**: Hardcodes plain-text passwords for PostgreSQL.

---

## 4. Remediation Plan & Priority Roadmap

1. **P0 Immediate Remediations**:
   - Enforce JWT authentication and role-based access control across all operational routers.
   - Implement strict SSRF IP filtering blocking loopback, link-local, and RFC 1918 private subnets.
   - Restrict CORS origins to trusted domains and enforce secure HTTP headers.
   - Enforce cryptographic HMAC-SHA256 signature verification for payments.
   - Fix Dockerfile directory references and enforce non-root user execution.
2. **P1 Architectural Remediations**:
   - Build a native WebSocket server (`/ws/{org_id}`) for real-time task progress, inventory alerts, and model telemetry.
   - Replace simulated task delays with real background analytics execution routines.
   - Implement database abstraction layer supporting SQLite for local dev/testing and PostgreSQL for production.
   - Fix inventory ROP safety stock double-scaling mathematics.
   - Eliminate silent fallback masking in `frontend/src/services/api.ts`.
3. **P2 & P3 Operational Upgrades**:
   - Centralize configuration management with Pydantic `BaseSettings` and environment validation.
   - Deliver full product, security, architecture, deployment, and testing documentation.
