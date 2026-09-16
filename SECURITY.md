# RetailPulse Enterprise: Security & Threat Mitigation Policy

**Classification**: SOC 2 Type II / ISO 27001 Preparedness Document  
**Version**: 3.2.0-Production  
**Scope**: Full Stack (React SPA, FastAPI Gateway, PostgreSQL/SQLite, WebSocket, AI Workers)  

---

## 1. Security Architecture & Threat Modeling (STRIDE / OWASP)

RetailPulse implements a defense-in-depth security model across every infrastructure tier.

```
       [ Internet / Client Requests ]
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Edge TLS 1.3 / Cloudflare   │   • DDoS Protection & WAF Rules
       └─────────────┬───────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Nginx Ingress Controller    │   • Secure Headers (HSTS, CSP, XFO)
       └─────────────┬───────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ FastAPI Application Gateway │   • Rate Limiting (SlowAPI)
       │                             │   • CORS Origin Whitelisting
       │                             │   • JWT Auth & RBAC Middleware
       │                             │   • SSRF Safe URL Resolver
       └─────────────┬───────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Data Access & DB Layer      │   • Parameterized SQL Statements
       │                             │   • Tenant-Isolated Row Filtering
       │                             │   • Encrypted-at-Rest SQLite/PG
       └─────────────────────────────┘
```

---

## 2. Specific Threat Mitigations

### 2.1 Broken Access Control & Multi-Tenancy (OWASP A01)
- **Problem Identified**: The initial prototype left critical analytical and administrative endpoints open to unauthenticated access and hardcoded `organization_id = 1`.
- **Production Mitigation**:
  - Global `get_current_user` dependency verifies JWT signature, expiration (`exp`), and revoked token states on all non-public endpoints.
  - Granular RBAC dependency `require_roles(["owner", "admin"])` restricts high-impact actions (API key generation, webhooks, billing changes).
  - All database queries enforce tenant isolation via `WHERE organization_id = :org_id`.

### 2.2 Server-Side Request Forgery (SSRF) Protection (OWASP A10)
- **Problem Identified**: Outbound webhook testing (`test_webhook`) directly contacted user-supplied URLs using `urllib.request.urlopen`, exposing internal cloud metadata services (`169.254.169.254`) and local loopback interfaces.
- **Production Mitigation**:
  - Outbound URLs are resolved through a dedicated `validate_safe_url()` security gate.
  - Rejects non-HTTP/HTTPS schemes.
  - Resolves domain names to IP addresses prior to dispatch.
  - Blocks all IPv4/IPv6 private and reserved ranges:
    - Loopback: `127.0.0.0/8`, `::1`
    - Link-Local / Cloud Metadata: `169.254.0.0/16`, `fe80::/10`
    - RFC 1918 Private Subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
    - Broadcast & Multicast: `224.0.0.0/4`, `255.255.255.255`

### 2.3 Injection Defense (SQLi / NoSQLi / Command Injection) (OWASP A03)
- **Parameterized SQL**: All database queries across `database.py` and modular routers use strict DBAPI parameterized bindings (`?` for SQLite, `%s` for PostgreSQL). Zero dynamic string interpolation into SQL clauses.
- **Path Traversal**: File exports enforce filename sanitization and prevent directory traversal (`../`) attacks.

### 2.4 Cross-Origin Resource Sharing (CORS) & Secure Headers (OWASP A05)
- **Strict Origin Whitelist**: In production, CORS explicitly whitelists trusted domains (`https://app.retailpulse.ai`, `https://retailpulse.ai`) instead of wildcard `*`.
- **Security Headers Injected**:
  - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `DENY`
  - `X-XSS-Protection`: `1; mode=block`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Content-Security-Policy`: Restricts scripts, styles, and connect sources to verified origins and WebSockets (`wss://`).

### 2.5 Payment Gateway Integrity & PCI DSS Compliance
- **Razorpay Cryptographic Verification**: Payments submitted to `/api/billing/razorpay/verify-payment` verify the HMAC-SHA256 signature against `RAZORPAY_KEY_SECRET`:
  $$\text{Expected Signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$
- **PCI DSS Scope Reduction**: RetailPulse never stores or handles raw credit card PAN or CVV numbers on its production servers. All payment methods utilize client-side tokenized gateways (Stripe Elements / Razorpay Checkout modal).

### 2.6 Credential Security & Password Hashing
- **Password Storage**: Passwords are saved with high-iteration PBKDF2-HMAC-SHA256 with 100,000 rounds and a unique 16-byte cryptographic salt per user.
- **Developer API Keys**: API keys are generated using `secrets.token_urlsafe(32)`. The plain-text key is presented only once during creation; the database stores only the SHA-256 hash and truncated prefix for identification.

### 2.7 Audit Logging & Compliance Traceability
Every security-sensitive event is logged to the immutable `audit_logs` table with:
- `organization_id` & `user_id`
- Verified `user_email`
- High-resolution UTC timestamp
- Client IP address and User-Agent
- Detailed action description (`user.login`, `api_key.create`, `po.email_dispatched`, `retention.klaviyo_sync`)

---

## 3. Vulnerability Disclosure & Incident Response

- **Security Point of Contact**: `security@retailpulse.ai`
- **PGP Fingerprint**: `98B2 4F1A 02E7 C681 559D`
- **Response SLA**: Initial triage within 24 hours; critical remediation deployed within 72 hours.
