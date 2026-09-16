# RetailPulse Enterprise: Engineering & Product Roadmap

**Horizon**: 2026 – 2027  
**Cadence**: Quarterly Phased Releases  

---

## Phase 1 — Production MVP (Current Release - v3.2.0)
*Focus: Security, Platform Hardening, Real-Time WebSockets & Core Accuracy*

- [x] **P0 Security Hardening**: Enforce JWT authentication, RBAC, and tenant boundary protection across all routes.
- [x] **SSRF & CORS Remediation**: Deploy safe URL resolver and strict origin whitelist.
- [x] **Native WebSockets**: Real-time event hub (`/ws/{org_id}`) for live background task streaming and stock alerts.
- [x] **Inventory Replenishment Accuracy**: Fix mathematical double-scaling bug in service-level calculations.
- [x] **Container & Multi-Database Parity**: Support PostgreSQL 16 connection pooling alongside SQLite dev mode.

---

## Phase 2 — Public Launch & Merchant Onboarding (Q4 2026)
*Focus: Self-Serve Onboarding, Merchant Connectors & Observability*

| Initiative | Impact | Effort | Risk | Dependencies |
| :--- | :---: | :---: | :---: | :--- |
| **Shopify OAuth App Store Release** | High | Medium | Low | Shopify Partner API Review |
| **Amazon SP-API Connector** | High | High | Medium | Amazon Developer Approval |
| **Self-Serve Team Invitations** | Medium | Low | Low | SMTP / Postmark Relay |
| **Automated Sentry Telemetry** | High | Low | Low | Sentry DSN configuration |

---

## Phase 3 — Growth & Intelligent Automation (Q1–Q2 2027)
*Focus: Deep Learning Expansion, Multi-Warehouse Allocation & ERP Sync*

| Initiative | Impact | Effort | Risk | Dependencies |
| :--- | :---: | :---: | :---: | :--- |
| **Hierarchical Multi-Warehouse Allocation** | High | High | Medium | Inventory Schema v2 |
| **Automated Retraining on KS Drift** | High | Medium | Medium | Background Task Queue (Redis/Celery) |
| **NetSuite & SAP ERP Connectors** | High | High | High | Enterprise Sales Pipeline |
| **Automated Supplier EDI Invoicing** | Medium | Medium | Low | Procurement Partner APIs |

---

## Phase 4 — Scale & Omni-Channel Autonomous Supply Chain (Q3–Q4 2027)
*Focus: Agentic Procurement, Global CDN & High-Throughput Stream Processing*

- **Autonomous Purchasing Agent**: Threshold-based automated PO signing with executive spend approvals.
- **Apache Kafka Ingestion**: Real-time POS stream ingestion handling 50,000+ transactions per second.
- **SOC 2 Type II Certification**: Complete independent third-party compliance audit.
