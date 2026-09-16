# RetailPulse Enterprise Database Architecture & Persistence Guide

RetailPulse uses a high-performance, resilient **dual-engine database architecture** designed for zero-downtime SaaS workloads on **`retailpulse.in`**.

---

## 1. Dual-Engine Architecture Overview

RetailPulse dynamically selects its database engine based on the `DATABASE_URL` environment variable:

```
                          ┌──────────────────────────┐
                          │    RetailPulse Engine    │
                          │   (backend/database.py)  │
                          └─────────────┬────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
       [Production SaaS Engine]               [Local Development Engine]
          PostgreSQL 16 Cluster                  SQLite 3 with WAL Mode
   DATABASE_URL=postgresql://...            DATABASE_URL=sqlite:///retailpulse.db
   - High concurrency connection pool       - Zero external dependencies
   - Row-level transactions                 - Write-Ahead Logging (WAL)
   - Multi-tenant tenant isolation          - Instant test execution
```

### Automatic Fallback & Query Translation
`backend/database.py` incorporates an automatic translation layer that normalizes parameter markers (`?` -> `%s`), date intervals (`datetime('now', ...)` -> `NOW() - INTERVAL ...`), and upsert clauses (`INSERT OR IGNORE` -> `ON CONFLICT DO NOTHING`). If PostgreSQL is configured but temporarily unreachable, the system gracefully falls back to SQLite with an audit warning.

---

## 2. Multi-Tenant Entity Relational Schema

### Core Multi-Tenant Tables

#### `organizations`
Defines enterprise tenant boundaries.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL / INTEGER PRIMARY KEY | Unique Organization ID |
| `name` | TEXT NOT NULL | Company name (e.g. Acme Retail Brands) |
| `slug` | TEXT UNIQUE NOT NULL | URL identifier (e.g. `acme-retail-brands`) |
| `plan_id` | TEXT DEFAULT 'growth' | Subscription tier (`starter`, `growth`, `scale`, `enterprise`) |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `users`
Global system users with PBKDF2 authentication and RBAC.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL / INTEGER PRIMARY KEY | User ID |
| `email` | TEXT UNIQUE NOT NULL | Corporate login email |
| `name` | TEXT NOT NULL | Full name |
| `company` | TEXT | Company / Merchant name |
| `password_hash` | TEXT NOT NULL | PBKDF2-HMAC-SHA256 (100,000 rounds) |
| `salt` | TEXT NOT NULL | 16-byte random hex salt |
| `role` | TEXT DEFAULT 'evaluator' | Global role: `admin`, `evaluator`, `operator`, `analyst` |
| `two_factor_enabled` | INTEGER DEFAULT 0 | 2FA status |
| `created_at` | TIMESTAMP | Registration timestamp |

#### `organization_members`
Maps users to organizations with tenant-scoped permissions.
| Column | Type | Description |
|---|---|---|
| `organization_id` | INTEGER NOT NULL | Organization FK |
| `user_id` | INTEGER NOT NULL | User FK |
| `role` | TEXT NOT NULL DEFAULT 'admin' | Tenant role: `owner`, `admin`, `member`, `viewer` |
| `title` | TEXT | Position title |
| `joined_at` | TIMESTAMP | Association date |

#### `stores`
Connected e-commerce stores, POS registers, and marketplace channels.
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL / INTEGER PRIMARY KEY | Store ID |
| `organization_id` | INTEGER NOT NULL | Tenant FK |
| `name` | TEXT NOT NULL | Store name (e.g. Acme Flagship Online) |
| `platform` | TEXT NOT NULL | `Shopify`, `WooCommerce`, `Amazon SP-API`, `Square POS` |
| `domain` | TEXT | Store URL / domain |
| `currency` | TEXT DEFAULT 'USD' | Store currency code |
| `timezone` | TEXT DEFAULT 'America/New_York' | Timezone for reporting |
| `is_active` | INTEGER DEFAULT 1 | Enabled status |
| `is_live` | INTEGER DEFAULT 1 | Mode: 1 = Live Production, 0 = Test Sandbox |

#### `subscriptions` & `payments`
Stripe / Razorpay billing transactions and invoices.
| Table | Key Columns | Description |
|---|---|---|
| `subscriptions` | `id`, `user_id`, `organization_id`, `plan_id`, `price`, `status`, `current_period_end` | Active subscription metadata |
| `payments` | `id`, `user_id`, `invoice_number`, `amount`, `currency`, `transaction_id`, `status` | Immutable invoice history |

#### `api_keys`
Hashed API keys for external store webhooks and developer integrations.
| Column | Type | Description |
|---|---|---|
| `key_prefix` | TEXT NOT NULL | Key preview (e.g. `rp_live_...`) |
| `key_hash` | TEXT NOT NULL | SHA-256 hash of API secret key |
| `environment` | TEXT DEFAULT 'live' | `live` or `sandbox` |
| `status` | TEXT DEFAULT 'active' | `active` or `revoked` |
| `last_used_at` | TIMESTAMP | Last invocation timestamp |

#### `audit_logs`
Immutable compliance audit trail (SOC2 requirement).
| Column | Type | Description |
|---|---|---|
| `organization_id` | INTEGER NOT NULL | Tenant ID |
| `user_email` | TEXT | Actor email |
| `action` | TEXT NOT NULL | Event name (`user.login`, `integration.sync`, `database.backup`) |
| `resource` | TEXT NOT NULL | Service component |
| `details` | TEXT | Human-readable log details |
| `ip_address` | TEXT | Source IP |
| `created_at` | TIMESTAMP | Event timestamp |

---

## 3. Retail Analytics & ML Datasets

| Table Name | Description | Key Metrics |
|---|---|---|
| `sales` | Normalized retail order transactions | `OrderID`, `OrderDate`, `CustomerID`, `ProductID`, `Sales`, `Quantity`, `Profit`, `Discount` |
| `customers` | Master customer directory | `CustomerID`, `CustomerName`, `Region` |
| `products` | Master SKU catalog | `ProductID`, `ProductName`, `Category`, `UnitPrice` |
| `customer_segments` | K-Means RFM clustering outputs | `Recency`, `Frequency`, `Monetary`, `Segment`, `ActionStrategy` |
| `churn_predictions` | XGBoost churn classification predictions | `ChurnProbability`, `RiskLevel`, `PredictedChurn` |
| `churn_high_risk_alerts` | Actionable at-risk accounts for retention | `CustomerID`, `Recency`, `Monetary`, `ChurnProbability`, `RecommendedAction` |
| `demand_forecast` | 30/60/90-day baseline forecasts | `ds` (date), `yhat`, `yhat_lower`, `yhat_upper` |
| `demand_forecast_lstm` | PyTorch deep learning demand forecast | `ds` (date), `yhat`, `yhat_lower`, `yhat_upper` |
| `inventory_recommendations` | Automated EOQ reorder recommendations | `ProductID`, `CurrentStock`, `DailyDemand`, `LeadTimeDays`, `SafetyStock`, `ROP`, `SuggestedOrder`, `AlertLevel` |
| `data_drift_monitoring` | Kolmogorov-Smirnov statistical feature drift | `Feature`, `TestStat_KS`, `PValue`, `DriftDetected`, `ActionRequired` |

---

## 4. Connection Pooling Configuration

When deploying on PostgreSQL:
- **Pool Type**: `psycopg2.pool.ThreadedConnectionPool`
- **Min Connections**: 5
- **Max Connections**: 30
- **Connection Timeout**: 10 seconds
- **Statement Timeout**: 30 seconds

When deploying on SQLite:
- **Journal Mode**: Write-Ahead Logging (`PRAGMA journal_mode=WAL;`)
- **Busy Timeout**: 20.0 seconds (`timeout=20.0`)
- **Synchronous**: `PRAGMA synchronous=NORMAL;`
