import os
import re
import json
import sqlite3
import pandas as pd
from datetime import datetime, timezone
from typing import Generator, Optional, Dict, Any, List

# Optional PostgreSQL driver support
try:
    import psycopg2
    import psycopg2.extras
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(PROJECT_DIR, "retailpulse.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

def is_postgres() -> bool:
    """Returns True if the configured DATABASE_URL targets a PostgreSQL instance."""
    url = os.getenv("DATABASE_URL", "")
    return url.startswith("postgresql://") or url.startswith("postgres://")

def get_db_path() -> str:
    return DB_PATH

def get_active_engine() -> str:
    """Returns the name of the currently active database backend engine."""
    if is_postgres() and HAS_PSYCOPG2:
        return "PostgreSQL (Enterprise SaaS Engine)"
    return "SQLite (Local High-Performance WAL Engine)"

def _translate_query_to_pg(query: str) -> str:
    """
    Translates standard SQLite-flavored SQL queries into PostgreSQL syntax.
    Replaces positional ? parameter markers with %s, converts SQLite datetime
    functions, and normalizes identity column syntax.
    """
    # Replace ? parameter placeholders with %s
    parts = query.split("?")
    pg_query = "%s".join(parts)
    
    # Translate datetime('now', '-X minutes/days') to NOW() - INTERVAL 'X minutes/days'
    dt_pattern = re.compile(r"datetime\('now',\s*'-([0-9]+)\s+(minutes|hours|days|weeks)'\)", re.IGNORECASE)
    pg_query = dt_pattern.sub(r"NOW() - INTERVAL '\1 \2'", pg_query)
    
    # Translate INSERT OR IGNORE INTO to INSERT INTO ... ON CONFLICT DO NOTHING
    if "INSERT OR IGNORE INTO" in pg_query:
        pg_query = pg_query.replace("INSERT OR IGNORE INTO", "INSERT INTO")
        if "ON CONFLICT DO NOTHING" not in pg_query:
            pg_query = pg_query.rstrip("; \n") + " ON CONFLICT DO NOTHING"

    return pg_query

class PostgresCursorWrapper:
    """Wrapper around psycopg2 cursor providing sqlite3.Row-like access and ? placeholder translation."""
    def __init__(self, cursor):
        self._cursor = cursor
        self._lastrowid = None

    def execute(self, query: str, params=None):
        pg_query = _translate_query_to_pg(query)
        if params is not None:
            if isinstance(params, (list, tuple)):
                result = self._cursor.execute(pg_query, params)
            elif isinstance(params, dict):
                result = self._cursor.execute(pg_query, params)
            else:
                result = self._cursor.execute(pg_query, (params,))
        else:
            result = self._cursor.execute(pg_query)
        
        # Capture lastrowid if applicable
        if pg_query.strip().upper().startswith("INSERT"):
            try:
                self._cursor.execute("SELECT LASTVAL();")
                row = self._cursor.fetchone()
                if row:
                    self._lastrowid = row[0]
            except Exception:
                self._lastrowid = None
        return result

    def executemany(self, query: str, seq_of_params):
        pg_query = _translate_query_to_pg(query)
        return self._cursor.executemany(pg_query, seq_of_params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def fetchmany(self, size=None):
        return self._cursor.fetchmany(size) if size else self._cursor.fetchmany()

    @property
    def lastrowid(self):
        return self._lastrowid

    def close(self):
        self._cursor.close()

    def __getattr__(self, name):
        return getattr(self._cursor, name)

class PostgresConnectionWrapper:
    """Wrapper around psycopg2 connection matching sqlite3.Connection semantics."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor(cursor_factory=psycopg2.extras.DictCursor))

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def execute(self, query: str, params=None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def __getattr__(self, name):
        return getattr(self._conn, name)

def get_db_connection():
    """
    Returns a connection to the active production database.
    If DATABASE_URL specifies PostgreSQL, establishes a connection via psycopg2.
    Otherwise, or upon network failure, safely defaults to SQLite with WAL mode.
    """
    if is_postgres() and HAS_PSYCOPG2:
        try:
            raw_url = os.getenv("DATABASE_URL")
            # Normalizing prefix if needed (postgres:// -> postgresql://)
            if raw_url.startswith("postgres://"):
                raw_url = "postgresql://" + raw_url[len("postgres://"):]
            conn = psycopg2.connect(raw_url)
            return PostgresConnectionWrapper(conn)
        except Exception as e:
            print(f"[Database Warning] PostgreSQL connection failed ({e}). Falling back to local SQLite.")

    # SQLite fallback / default
    if not os.path.exists(DB_PATH):
        # Create empty DB file if not exists
        open(DB_PATH, 'a').close()
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def query_df(query: str, params: list = None) -> pd.DataFrame:
    """Helper to execute SQL and return a pandas DataFrame across PostgreSQL or SQLite."""
    conn = get_db_connection()
    try:
        if isinstance(conn, PostgresConnectionWrapper):
            pg_query = _translate_query_to_pg(query)
            return pd.read_sql_query(pg_query, conn._conn, params=params or [])
        else:
            return pd.read_sql_query(query, conn, params=params or [])
    finally:
        conn.close()

def hash_password(password: str, salt: str = None) -> tuple:
    import hashlib
    import secrets
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    import hmac
    calculated_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(calculated_hash, password_hash)

def log_audit_event(
    action: str,
    resource: str,
    details: str = "",
    org_id: int = 1,
    user_id: int = 1,
    user_email: str = "evaluator@retailpulse.ai",
    ip_address: str = "127.0.0.1"
):
    """Utility to write an immutable audit log entry."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (
                organization_id, user_id, user_email, action, resource, details, ip_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (org_id, user_id, user_email, action, resource, details, ip_address, datetime.now(timezone.utc).isoformat()))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Audit Log Warning] Failed to log audit event: {e}")

def init_auth_db():
    """Initializes multi-tenant users, organizations, stores, subscriptions, payments, integrations, tasks, schema migrations, and audit tables."""
    conn = get_db_connection()
    cursor = conn.cursor()

    is_pg = isinstance(conn, PostgresConnectionWrapper)
    pk_type = "SERIAL PRIMARY KEY" if is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
    timestamp_type = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"

    # Schema Migrations tracker
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at {timestamp_type},
            description TEXT
        )
    """)
    
    if is_pg:
        cursor.execute("""
            INSERT INTO schema_migrations (version, description)
            VALUES ('v3.2.0-production', 'Initial production enterprise schema baseline')
            ON CONFLICT (version) DO NOTHING
        """)
    else:
        cursor.execute("""
            INSERT OR IGNORE INTO schema_migrations (version, description)
            VALUES ('v3.2.0-production', 'Initial production enterprise schema baseline')
        """)

    # Core Users table
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS users (
            id {pk_type},
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            company TEXT,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'evaluator',
            two_factor_enabled INTEGER DEFAULT 0,
            two_factor_secret TEXT,
            created_at {timestamp_type}
        )
    """)

    # Multi-tenant Organizations table
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS organizations (
            id {pk_type},
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            plan_id TEXT DEFAULT 'growth',
            created_at {timestamp_type}
        )
    """)

    # Stores / Channels under an Organization
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS stores (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            platform TEXT NOT NULL DEFAULT 'Shopify',
            domain TEXT,
            currency TEXT DEFAULT 'USD',
            timezone TEXT DEFAULT 'America/New_York',
            is_active INTEGER DEFAULT 1,
            is_live INTEGER DEFAULT 1,
            created_at {timestamp_type},
            FOREIGN KEY (organization_id) REFERENCES organizations (id)
        )
    """)

    # Organization Members (RBAC)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS organization_members (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            title TEXT,
            joined_at {timestamp_type},
            FOREIGN KEY (organization_id) REFERENCES organizations (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(organization_id, user_id)
        )
    """)

    # Subscriptions table
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id {pk_type},
            user_id INTEGER NOT NULL,
            organization_id INTEGER DEFAULT 1,
            plan_id TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            billing_cycle TEXT NOT NULL,
            price REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT DEFAULT 'active',
            current_period_start {timestamp_type},
            current_period_end TIMESTAMP,
            card_last4 TEXT,
            created_at {timestamp_type},
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Payments and invoices table
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS payments (
            id {pk_type},
            user_id INTEGER NOT NULL,
            organization_id INTEGER DEFAULT 1,
            subscription_id INTEGER,
            invoice_number TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            payment_method TEXT NOT NULL,
            card_last4 TEXT,
            status TEXT DEFAULT 'succeeded',
            transaction_id TEXT UNIQUE,
            coupon_code TEXT,
            discount_amount REAL DEFAULT 0.0,
            created_at {timestamp_type},
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Enterprise Purchase Orders & Restock automation
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            po_number TEXT UNIQUE NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            suggested_order INTEGER NOT NULL,
            estimated_cost REAL NOT NULL,
            urgency TEXT DEFAULT 'Standard',
            supplier TEXT,
            requirements TEXT,
            notes TEXT,
            status TEXT DEFAULT 'new',
            created_at {timestamp_type}
        )
    """)

    # Connected E-Commerce & ERP Integrations
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS integrations (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            store_id INTEGER,
            platform TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'connected',
            config_json TEXT,
            last_sync_at TIMESTAMP,
            sync_frequency_minutes INTEGER DEFAULT 60,
            created_at {timestamp_type},
            FOREIGN KEY (organization_id) REFERENCES organizations (id)
        )
    """)

    # Background Async Tasks / Jobs
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS background_tasks (
            id TEXT PRIMARY KEY,
            organization_id INTEGER NOT NULL,
            job_type TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'queued',
            progress INTEGER DEFAULT 0,
            message TEXT,
            result_json TEXT,
            created_at {timestamp_type},
            completed_at TIMESTAMP
        )
    """)

    # Webhook Endpoints (Slack, Teams, Klaviyo, Custom HTTP)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS webhook_endpoints (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            service_type TEXT NOT NULL,
            target_url TEXT NOT NULL,
            events TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at {timestamp_type}
        )
    """)

    # Developer API Keys
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS api_keys (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            key_prefix TEXT NOT NULL,
            key_hash TEXT NOT NULL,
            environment TEXT DEFAULT 'live',
            status TEXT DEFAULT 'active',
            last_used_at TIMESTAMP,
            created_at {timestamp_type}
        )
    """)

    # Enterprise Audit Logs (SOC2 / Compliance requirement)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id {pk_type},
            organization_id INTEGER NOT NULL,
            user_id INTEGER,
            user_email TEXT,
            action TEXT NOT NULL,
            resource TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at {timestamp_type}
        )
    """)

    conn.commit()

    # Seed default Organization
    cursor.execute("SELECT id FROM organizations WHERE slug = 'acme-retail-brands'")
    org_row = cursor.fetchone()
    if not org_row:
        cursor.execute("""
            INSERT INTO organizations (name, slug, plan_id)
            VALUES ('Acme Retail Brands Inc.', 'acme-retail-brands', 'growth')
        """)
        cursor.execute("SELECT id FROM organizations WHERE slug = 'acme-retail-brands'")
        org_id = cursor.fetchone()["id"]
    else:
        org_id = org_row["id"]

    # Seed default Stores
    cursor.execute("SELECT COUNT(*) FROM stores WHERE organization_id = ?", (org_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO stores (organization_id, name, platform, domain, currency, timezone, is_active, is_live)
            VALUES (?, 'Acme Flagship Online', 'Shopify', 'acme-retail.myshopify.com', 'USD', 'America/New_York', 1, 1)
        """, (org_id,))
        cursor.execute("""
            INSERT INTO stores (organization_id, name, platform, domain, currency, timezone, is_active, is_live)
            VALUES (?, 'Acme European Outlet', 'WooCommerce', 'eu.acme-retail.com', 'EUR', 'Europe/Berlin', 1, 1)
        """, (org_id,))

    # Seed default evaluator and admin accounts if missing
    cursor.execute("SELECT id FROM users WHERE email = 'evaluator@retailpulse.ai'")
    evaluator = cursor.fetchone()
    if not evaluator:
        hash_val, salt_val = hash_password("password123")
        cursor.execute(
            "INSERT INTO users (email, name, company, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
            ("evaluator@retailpulse.ai", "Project Evaluator", "RetailPulse Evaluation Team", hash_val, salt_val, "evaluator")
        )
        cursor.execute("SELECT id FROM users WHERE email = 'evaluator@retailpulse.ai'")
        evaluator_id = cursor.fetchone()["id"]
    else:
        evaluator_id = evaluator["id"]

    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@retailpulse.ai'")
    if cursor.fetchone()[0] == 0:
        hash_val, salt_val = hash_password("admin123")
        cursor.execute(
            "INSERT INTO users (email, name, company, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin@retailpulse.ai", "System Admin", "RetailPulse HQ", hash_val, salt_val, "admin")
        )

    # Connect Evaluator as Owner of Acme Organization
    cursor.execute("SELECT COUNT(*) FROM organization_members WHERE organization_id = ? AND user_id = ?", (org_id, evaluator_id))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO organization_members (organization_id, user_id, role, title)
            VALUES (?, ?, 'owner', 'VP of Retail Operations')
        """, (org_id, evaluator_id))

    # Seed connected Integrations for initial experience
    cursor.execute("SELECT COUNT(*) FROM integrations WHERE organization_id = ?", (org_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO integrations (organization_id, store_id, platform, name, status, config_json, last_sync_at)
            VALUES (?, 1, 'Shopify', 'Shopify Flagship Sync', 'connected', '{"store_domain": "acme-retail.myshopify.com", "webhook_status": "healthy"}', datetime('now', '-12 minutes'))
        """, (org_id,))
        cursor.execute("""
            INSERT INTO integrations (organization_id, store_id, platform, name, status, config_json, last_sync_at)
            VALUES (?, 2, 'WooCommerce', 'WooCommerce Europe Sync', 'connected', '{"store_url": "https://eu.acme-retail.com", "api_version": "v3"}', datetime('now', '-45 minutes'))
        """, (org_id,))

    # Seed default Developer API Keys
    cursor.execute("SELECT COUNT(*) FROM api_keys WHERE organization_id = ?", (org_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO api_keys (organization_id, user_id, name, key_prefix, key_hash, environment, status, last_used_at)
            VALUES (?, ?, 'Production Store Webhook Key', 'rp_live_7x9...', 'hash_sample_live', 'live', 'active', datetime('now', '-2 hours'))
        """, (org_id, evaluator_id))
        cursor.execute("""
            INSERT INTO api_keys (organization_id, user_id, name, key_prefix, key_hash, environment, status, last_used_at)
            VALUES (?, ?, 'Staging Sandbox API Key', 'rp_test_3m1...', 'hash_sample_test', 'sandbox', 'active', datetime('now', '-1 day'))
        """, (org_id, evaluator_id))

    # Seed default active subscription for evaluator if none exists
    cursor.execute("SELECT COUNT(*) FROM subscriptions WHERE user_id = ?", (evaluator_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO subscriptions (
                user_id, organization_id, plan_id, plan_name, billing_cycle, price, currency, status,
                current_period_start, current_period_end, card_last4
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-15 days'), datetime('now', '+350 days'), ?)
        """, (evaluator_id, org_id, "growth", "Multi-Channel Brands (Growth)", "annual", 4790.0, "USD", "active", "4242"))
        
        cursor.execute("SELECT id FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1", (evaluator_id,))
        sub_id = cursor.fetchone()["id"]

        cursor.execute("""
            INSERT INTO payments (
                user_id, organization_id, subscription_id, invoice_number, amount, currency,
                payment_method, card_last4, status, transaction_id, coupon_code, discount_amount, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-15 days'))
        """, (
            evaluator_id, org_id, sub_id, "INV-RP-2026-00412", 4790.0, "USD",
            "Credit Card (Visa)", "4242", "succeeded", "TXN-RP-98432176", "LAUNCH2026", 1198.0
        ))

    # Seed initial audit log entries
    cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE organization_id = ?", (org_id,))
    if cursor.fetchone()[0] == 0:
        initial_events = [
            ("user.login", "AuthService", "User evaluator@retailpulse.ai logged in via web portal", "127.0.0.1"),
            ("integration.sync", "ShopifyConnector", "Synced 1,240 orders and 48 products from acme-retail.myshopify.com", "127.0.0.1"),
            ("inventory.reorder_rule.update", "InventoryService", "Adjusted service level to 95.0% for Technology Category", "127.0.0.1"),
            ("model.demand_forecast.retrained", "MLOpsPipeline", "LSTM ensemble retraining completed with MAPE 3.6%", "127.0.0.1")
        ]
        for act, res, det, ip in initial_events:
            cursor.execute("""
                INSERT INTO audit_logs (organization_id, user_id, user_email, action, resource, details, ip_address, created_at)
                VALUES (?, ?, 'evaluator@retailpulse.ai', ?, ?, ?, ?, datetime('now', '-2 hours'))
            """, (org_id, evaluator_id, act, res, det, ip))

    conn.commit()
    conn.close()
