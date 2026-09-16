# RetailPulse Enterprise: Observability, Metrics & Telemetry

**Version**: 3.2.0-Production  
**Observability Standard**: OpenTelemetry, Prometheus Metrics & JSON Structured Logs  

---

## 1. System Health & Probes (`/api/health`)

RetailPulse provides standardized liveness and readiness probes designed for Kubernetes container orchestration.

### 1.1 Endpoint Overview
- **HTTP Path**: `GET /api/health`
- **Authentication**: Unauthenticated (Accessible to internal monitoring probes and ALBs)
- **Response Format**:
  ```json
  {
    "status": "healthy",
    "service": "RetailPulse Neural Optimization Engine",
    "version": "3.2.0-commercial",
    "environment": "production",
    "timestamp": "2026-09-16T12:00:00Z",
    "uptime_seconds": 84320,
    "database": {
      "status": "healthy",
      "latency_ms": 1.42,
      "engine": "PostgreSQL 16 Multi-AZ"
    },
    "system": {
      "memory_resident_mb": 142.8,
      "workers_active": 4
    },
    "models": {
      "xgboost_churn": "loaded",
      "pytorch_lstm": "loaded",
      "kmeans_rfm": "loaded"
    }
  }
  ```

---

## 2. Key Operational Metrics (SLIs & SLOs)

| Metric Name | Target SLO | Alert Threshold | Description |
| :--- | :--- | :--- | :--- |
| **API Availability** | $\ge 99.9\%$ uptime | $< 99.5\%$ over 5m window | Total successful HTTP responses (non-5xx). |
| **P95 Latency (Read)** | $< 120\text{ ms}$ | $> 350\text{ ms}$ for 3 consecutive minutes | Latency on analytical summary and KPI endpoints. |
| **P95 Latency (Forecast)** | $< 450\text{ ms}$ | $> 1200\text{ ms}$ | Inference response time for 90-day trajectory. |
| **Model Covariate Drift** | KS $p$-value $\ge 0.05$ | $p < 0.01$ or $\text{PSI} > 0.25$ | Detects significant shifts in Sales or Order volume. |
| **Failed PO Dispatches** | $0$ per day | $> 0$ failures | Any failed purchase order email dispatch. |

---

## 3. Structured Logging Architecture

All application events are logged to `stdout` in structured JSON format with contextual request metadata:
```json
{
  "timestamp": "2026-09-16T12:05:32.418Z",
  "level": "INFO",
  "logger": "retailpulse.backend",
  "request_id": "req-98f24a1b-32bc",
  "org_id": 1,
  "user_id": 1,
  "action": "inventory.reorder_point.recalculated",
  "resource": "InventoryService",
  "duration_ms": 42.1,
  "client_ip": "192.0.2.14"
}
```
