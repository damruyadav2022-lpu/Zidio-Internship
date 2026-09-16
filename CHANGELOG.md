# RetailPulse Changelog

All notable changes to the RetailPulse platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.2.0-Production] - 2026-09-16

### Added
- **Native WebSockets Hub (`/ws/{org_id}`)**: Real-time streaming connection for live task progress, stock threshold alerts, and retraining events.
- **Centralized Configuration Management (`backend/config.py`)**: Strict Pydantic settings loading environment variables with production fail-safes.
- **SSRF Defense Gate**: Validated and resolved all outbound URLs in `actions.py` to prevent access to loopback, link-local, or private RFC 1918 subnets.
- **Comprehensive Specifications**: Added `PRODUCTION_READINESS_AUDIT.md`, `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `SECURITY.md`, `DEPLOYMENT.md`, `TESTING.md`, `MONITORING.md`, `ANALYTICS.md`, `GO_TO_MARKET.md`, `ROADMAP.md`, and `COST_MODEL.md`.
- **Automated Security Test Suite (`tests/test_security_audit.py`)**: Unit and integration tests covering SSRF blocking, JWT token verification, RBAC permissions, and Razorpay signature verification.
- **Environment Templates**: Added `.env.development`, `.env.staging`, and `.env.production`.

### Fixed
- **P0 Broken Access Control**: Added JWT Bearer authentication to `/api/customers`, `/api/inventory`, `/api/forecasting`, `/api/churn`, `/api/segmentation`, `/api/actions`, `/api/security`, and `/api/dashboard`.
- **P0 Insecure CORS**: Replaced wildcard `allow_origins=["*"]` with explicit trusted origins, securing credentialed cross-origin requests.
- **P0 Payment Bypass**: Enforced HMAC-SHA256 signature verification in Razorpay payment callbacks.
- **P1 Inventory Double-Scaling Math Bug**: Fixed service-level recalculation in `inventory.py` to prevent compounding safety stock scaling.
- **P1 Broken Dockerfile**: Removed invalid `COPY ml_models/` and `COPY etl/` directives and enforced non-root execution (`appuser`).
- **P1 Real Background Task Runner**: Replaced simulated sleep delays in `task_manager.py` with real analytics and database operations.
- **P1 Silent Error Masking**: Removed silent fallback to mock data in `frontend/src/services/api.ts`.

---

## [3.1.0] - 2026-09-15
- Initial prototype release of multi-tenant dashboard and analytical models.
