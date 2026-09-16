# RetailPulse Enterprise: REST & WebSocket API Specification

**API Version**: 3.2.0-Commercial  
**Base URL**: `https://app.retailpulse.ai/api` (Production) / `http://localhost:8000/api` (Local)  
**Authentication**: Bearer Token (`Authorization: Bearer <JWT>`)  
**Data Format**: JSON (`Content-Type: application/json`)  

---

## 1. Authentication & Security

All private endpoints require an `Authorization` header containing a valid JWT access token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Standard Error Response Format
```json
{
  "detail": "Descriptive human-readable error explanation",
  "error_code": "RESOURCE_NOT_FOUND",
  "status_code": 404,
  "timestamp": "2026-09-16T12:00:00Z"
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: No (Public)
- **Rate Limit**: 10 requests / minute
- **Request Body**:
  ```json
  {
    "email": "user@retailbrand.com",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": 1,
      "email": "user@retailbrand.com",
      "name": "Jane Retailer",
      "company": "Acme Retail Brands Inc.",
      "role": "owner",
      "created_at": "2026-01-15T09:30:00"
    },
    "message": "Login successful"
  }
  ```

### 2.2 Instant 1-Click Demo Login
- **Endpoint**: `POST /api/auth/demo-login`
- **Auth Required**: No (Public Evaluation Shortcut)
- **Success Response (`200 OK`)**: Returns valid JWT token and user profile for `evaluator@retailpulse.ai`.

### 2.3 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth Required**: No (Public)
- **Request Body**:
  ```json
  {
    "name": "Alex Smith",
    "email": "alex@retailbrand.com",
    "password": "StrongPassword!2026",
    "company": "Smith Retail Co."
  }
  ```

### 2.4 Authenticated Profile (`/me`)
- **Endpoint**: `GET /api/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Success Response (`200 OK`)**: Returns current user entity.

---

## 3. Analytics & Machine Learning Endpoints

### 3.1 Overview KPIs & Trend Aggregates
- **Endpoint**: `GET /api/dashboard/kpis`
- **Auth Required**: Yes
- **Query Parameters**:
  - `store_id` (optional, int): Filter by specific store ID.
- **Success Response (`200 OK`)**:
  ```json
  {
    "total_revenue": 2297200.86,
    "total_profit": 286397.02,
    "profit_margin_pct": 12.47,
    "total_orders": 99831,
    "active_customers": 1000,
    "at_risk_customers": 48,
    "critical_inventory_skus": 24,
    "sales_trend": [
      { "date": "2026-09-01", "sales": 8420.5, "orders": 312 }
    ]
  }
  ```

### 3.2 Customer Segmentation (RFM K-Means)
- **Endpoint**: `GET /api/segmentation`
- **Auth Required**: Yes
- **Success Response (`200 OK`)**: Returns RFM cluster boundaries, silhouette score (0.6557), cluster counts, and actionable strategic playbooks for each segment (*VIP Champions*, *New & Promising*, *At Risk*, *Lost*).

### 3.3 Churn Prediction & High-Risk Alerts
- **Endpoint**: `GET /api/churn`
- **Auth Required**: Yes
- **Query Parameters**:
  - `risk_level` (string): `All`, `High`, `Medium`, `Low`.
  - `limit` (int, default: 50): Page size.
- **Success Response (`200 OK`)**:
  ```json
  {
    "model_metrics": {
      "accuracy": 0.904,
      "roc_auc": 0.9615,
      "f1_score": 0.8333,
      "champion_model": "XGBoost Classifier"
    },
    "high_risk_alerts": [
      {
        "CustomerID": "CUST-0412",
        "CustomerName": "TechCorp Logistics",
        "ChurnProbability": 0.842,
        "RiskTier": "High",
        "Monetary": 14200.50,
        "RecommendedAction": "Dedicated Account Manager Retention Outreach"
      }
    ]
  }
  ```

### 3.4 Demand Forecasting (PyTorch LSTM)
- **Endpoint**: `GET /api/forecasting`
- **Auth Required**: Yes
- **Query Parameters**:
  - `category` (string, default: `All`): Product category filter.
  - `model` (string, default: `lstm`): `lstm`, `random_forest`, `ensemble`.
  - `horizon` (int, default: 30): 7, 14, 30, 60, or 90 days.
- **Success Response (`200 OK`)**:
  ```json
  {
    "history": [ { "ds": "2026-08-01", "actual": 142.5 } ],
    "forecast": [
      { "ds": "2026-09-17", "yhat": 156.4, "yhat_lower": 137.6, "yhat_upper": 175.2 }
    ],
    "metrics": { "mae": 14.28, "rmse": 18.95, "mape": 3.6 }
  }
  ```

### 3.5 Inventory Optimization & Replenishment
- **Endpoint**: `GET /api/inventory`
- **Auth Required**: Yes
- **Query Parameters**:
  - `service_level` (int, default: 95): 90, 95, or 99.
  - `status` (string): `All`, `Critical`, `Warning`, `Healthy`.
  - `search` (string): SKU or Product name query.
- **Success Response (`200 OK`)**:
  ```json
  {
    "summary": {
      "total_skus": 200,
      "critical_skus": 24,
      "reorder_needed_skus": 58,
      "total_reorder_cost": 48250.00
    },
    "items": [
      {
        "ProductID": "TEC-PH-10001",
        "ProductName": "Wireless Ergonomic Headset",
        "CurrentStock": 14,
        "SafetyStock": 28,
        "ReorderPoint": 62,
        "AlertLevel": "Critical (Red)",
        "SuggestedOrder": 79,
        "UnitPrice": 89.99,
        "TotalOrderValue": 7109.21
      }
    ]
  }
  ```

---

## 4. Operational Actions & Integrations

### 4.1 Dispatch Purchase Order Email
- **Endpoint**: `POST /api/actions/send-po-email`
- **Auth Required**: Yes (`inventory_manager` or higher)
- **Request Body**:
  ```json
  {
    "po_number": "PO-2026-0914",
    "supplier_name": "Apex Electronics Supply",
    "supplier_email": "orders@apexsupply.com",
    "total_amount": 7109.21,
    "total_units": 79,
    "notes": "Urgent shipment required due to critical stock threshold."
  }
  ```
- **Success Response (`200 OK`)**: Confirms dispatch and records audit log.

### 4.2 Test Webhook Endpoint (SSRF Protected)
- **Endpoint**: `POST /api/actions/webhooks/test`
- **Auth Required**: Yes (`admin` or `owner`)
- **Security Check**: Enforces private/loopback/cloud-metadata IP blocking.
- **Request Body**:
  ```json
  {
    "webhook_url": "https://example.com/webhooks/slack-sample",
    "service_type": "slack"
  }
  ```

### 4.3 Push Segment to Klaviyo Retention Flow
- **Endpoint**: `POST /api/actions/retention/sync-klaviyo`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "segment_name": "At Risk / Slipping",
    "service_type": "klaviyo",
    "customer_count": 48
  }
  ```

---

## 5. Real-Time WebSockets (`/ws/{org_id}`)

### 5.1 Connection Handshake
- **URL**: `ws://localhost:8000/ws/{org_id}?token=<JWT>`
- **Protocol**: Standard WebSocket (WSS in production)
- **Authentication**: JWT token supplied via query parameter `token` during handshake.

### 5.2 Server-to-Client Event Payloads

#### Event: `TASK_PROGRESS`
```json
{
  "event": "TASK_PROGRESS",
  "task_id": "task_98a7bc",
  "job_type": "nightly_forecast_sync",
  "progress": 65,
  "message": "Fitting PyTorch LSTM weights (epoch 13/20)...",
  "timestamp": "2026-09-16T12:04:12Z"
}
```

#### Event: `TASK_COMPLETED`
```json
{
  "event": "TASK_COMPLETED",
  "task_id": "task_98a7bc",
  "job_type": "nightly_forecast_sync",
  "status": "completed",
  "result": { "mape": 3.42, "rmse": 17.8 },
  "timestamp": "2026-09-16T12:04:30Z"
}
```

#### Event: `STOCK_ALERT`
```json
{
  "event": "STOCK_ALERT",
  "product_id": "TEC-PH-10001",
  "alert_level": "Critical (Red)",
  "current_stock": 14,
  "reorder_point": 62,
  "timestamp": "2026-09-16T12:05:00Z"
}
```
