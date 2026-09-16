# RetailPulse Enterprise: Production SaaS Cloud Deployment & Operations Guide

**Platform**: Enterprise SaaS on AWS EC2, DigitalOcean Droplet, GCP Compute, or Kubernetes (EKS/GKE)  
**Target Domains**: `retailpulse.in` (Frontend SPA & API), `api.retailpulse.in` (Direct API)  
**Release**: v3.2.0 Commercial Production  

---

## 1. Domain Configuration & DNS Records

To bind **`retailpulse.in`** to your cloud server:

| Type | Host / Name | Value / Target | TTL | Purpose |
|---|---|---|---|---|
| **A** | `@` (`retailpulse.in`) | `<YOUR_SERVER_PUBLIC_IP>` | 300 | Primary apex domain |
| **A** | `www` | `<YOUR_SERVER_PUBLIC_IP>` | 300 | Web alias redirect |
| **A** | `api` | `<YOUR_SERVER_PUBLIC_IP>` | 300 | Dedicated API subdomain |
| **CAA** | `@` | `0 issue "letsencrypt.org"` | 3600 | SSL security authority |

---

## 2. Ingress & Reverse Proxy Architecture

```
                    [ Internet Users & E-Commerce Webhooks ]
                                       │
                                       ▼
                     [ Port 80 / Port 443 Ingress ]
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │        Nginx Reverse Proxy & WAF          │
                 │   (TLS 1.3, Rate Limiting, Compression)   │
                 └─────────────────────┬─────────────────────┘
                                       │
                       ┌───────────────┴───────────────┐
                       │                               │
             /api and /ws Ingress                 / SPA Static
                       │                               │
                       ▼                               ▼
        ┌─────────────────────────────┐   ┌───────────────────────────┐
        │ FastAPI Backend (Port 8000) │   │ React 18 Production Dist  │
        │ 4 Uvicorn Workers (appuser) │   │ High Performance Caching  │
        └──────────────┬──────────────┘   └───────────────────────────┘
                       │
               ┌───────┴───────┐
               ▼               ▼
      ┌────────────────┐ ┌───────────────┐
      │ PostgreSQL 16  │ │ Redis 7 Hub   │
      │ Named Volume   │ │ Task/Cache    │
      └────────────────┘ └───────────────┘
```

---

## 3. Production Deployment with Docker Compose

### Step 3.1: Environment Configuration
Create the production `.env` file on the server:

```bash
cat << 'EOF' > .env
ENVIRONMENT=production
PORT=8000
DATABASE_URL=postgresql://retailpulse_admin:SuperSecretPostgresPass2026@db:5432/retailpulse_prod
REDIS_URL=redis://redis:6379/0
POSTGRES_USER=retailpulse_admin
POSTGRES_PASSWORD=SuperSecretPostgresPass2026
POSTGRES_DB=retailpulse_prod
JWT_SECRET=super_secret_enterprise_jwt_signing_key_2026_retailpulse
SHOPIFY_API_KEY=live_shopify_key
SHOPIFY_API_SECRET=live_shopify_secret
RAZORPAY_KEY_ID=rzp_live_key
RAZORPAY_KEY_SECRET=rzp_live_secret
EOF
```

### Step 3.2: Launch Production Stack
Start Nginx, FastAPI, PostgreSQL, and Redis in detached mode:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 3.3: Verify Container Health
```bash
docker compose -f docker-compose.prod.yml ps
```
Expected output:
```
NAME                       IMAGE               COMMAND                  SERVICE   STATUS
retailpulse_nginx          nginx:1.25-alpine   "/docker-entrypoint.…"   nginx     running (healthy)
retailpulse_app_prod       retailpulse:3.2.0   "uvicorn backend.mai…"   web       running (healthy)
retailpulse_postgres_prod  postgres:16-alpine  "docker-entrypoint.s…"   db        running (healthy)
retailpulse_redis_prod     redis:7-alpine      "docker-entrypoint.s…"   redis     running (healthy)
```

---

## 4. Let's Encrypt Automated SSL/TLS Provisioning

Issue a valid wildcard or multi-domain SSL certificate via Certbot:

```bash
# Request certificate using webroot validation
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    -d retailpulse.in -d www.retailpulse.in -d api.retailpulse.in \
    --email admin@retailpulse.in --agree-tos --no-eff-email

# Reload Nginx to activate SSL
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 5. Automated Health Checks & Verification

Run these verification probes to guarantee production integrity:

```bash
# 1. Probe health endpoint
curl -fsS http://localhost/api/health | jq .

# 2. Probe KPIs overview
curl -fsS http://localhost/api/overview | jq .kpis

# 3. Probe customer contract endpoint
curl -fsS http://localhost/api/customers/CUST-001 -H "Authorization: Bearer <TOKEN>" | jq .CustomerName

# 4. Run automated test suite inside container
docker compose -f docker-compose.prod.yml exec web python -m pytest tests/ -v
```

---

## 6. Disaster Recovery & Maintenance Runbook

| Operation | Command |
|---|---|
| **Hot Database Backup** | `docker compose -f docker-compose.prod.yml exec web python scripts/backup_database.py` |
| **Verify Backup Integrity** | `docker compose -f docker-compose.prod.yml exec web python scripts/restore_database.py --dry-run` |
| **View Live Container Logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=100 web` |
| **Restart Nginx Ingress** | `docker compose -f docker-compose.prod.yml restart nginx` |
| **Zero-Downtime Code Update** | `git pull origin main && docker compose -f docker-compose.prod.yml up -d --build --no-deps web` |
