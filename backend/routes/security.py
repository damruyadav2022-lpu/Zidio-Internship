import secrets
import hashlib
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from backend.database import get_db_connection, log_audit_event
from backend.routes.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/security", tags=["Security, API Keys & Compliance"])

class CreateKeyRequest(BaseModel):
    name: str
    environment: str = "live" # live, sandbox

class Toggle2FARequest(BaseModel):
    enable: bool

@router.get("/api-keys")
def list_api_keys(user: dict = Depends(require_roles(["owner", "admin", "evaluator", "member"]))):
    """List developer API keys for programmatic access scoped to organization."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, key_prefix, environment, status, last_used_at, created_at
        FROM api_keys
        WHERE organization_id = ?
        ORDER BY created_at DESC
    """, (org_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"keys": rows}

@router.post("/api-keys")
def create_api_key(
    req: CreateKeyRequest,
    user: dict = Depends(require_roles(["owner", "admin", "evaluator", "member"]))
):
    """Generate a new secure developer API key for current tenant."""
    org_id = user.get("organization_id", 1)
    prefix = "rp_live_" if req.environment == "live" else "rp_test_"
    raw_secret = secrets.token_urlsafe(32)
    full_key = f"{prefix}{raw_secret}"
    key_prefix = full_key[:12] + "..."
    key_hash = hashlib.sha256(full_key.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO api_keys (organization_id, user_id, name, key_prefix, key_hash, environment, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    """, (org_id, user["id"], req.name, key_prefix, key_hash, req.environment))
    key_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit_event(
        action="api_key.create",
        resource="KeyManager",
        details=f"Created {req.environment} API key '{req.name}' (ID: {key_id})",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "id": key_id,
        "name": req.name,
        "key_prefix": key_prefix,
        "environment": req.environment,
        "full_key": full_key, # Returned only once on creation
        "message": "Key generated. Store this key securely; it will not be shown again."
    }

@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: int,
    user: dict = Depends(require_roles(["owner", "admin", "evaluator", "member"]))
):
    """Revoke an API key immediately within tenant boundaries."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM api_keys WHERE id = ? AND organization_id = ?", (key_id, org_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="API key not found")

    name = row["name"]
    cursor.execute("DELETE FROM api_keys WHERE id = ? AND organization_id = ?", (key_id, org_id))
    conn.commit()
    conn.close()

    log_audit_event(
        action="api_key.revoke",
        resource="KeyManager",
        details=f"Revoked API key '{name}' (ID: {key_id})",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {"status": "success", "message": f"API key '{name}' revoked."}

@router.post("/2fa/toggle")
def toggle_2fa(req: Toggle2FARequest, user: dict = Depends(get_current_user)):
    """Enable or disable Two-Factor Authentication (MFA / 2FA) for current authenticated user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET two_factor_enabled = ? WHERE id = ?", (1 if req.enable else 0, user["id"]))
    conn.commit()
    conn.close()

    org_id = user.get("organization_id", 1)
    log_audit_event(
        action="security.2fa_toggle",
        resource="AuthSecurity",
        details=f"Two-factor authentication was {'ENABLED' if req.enable else 'DISABLED'}",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "two_factor_enabled": req.enable,
        "message": f"Two-factor authentication {'activated' if req.enable else 'deactivated'}."
    }

@router.post("/gdpr/export")
def export_gdpr_data(user: dict = Depends(get_current_user)):
    """Generates an authoritative GDPR Article 15 Data Portability archive for current organization."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM organizations WHERE id = ?", (org_id,))
    org = dict(cursor.fetchone() or {})
    cursor.execute("SELECT * FROM stores WHERE organization_id = ?", (org_id,))
    stores = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT * FROM subscriptions WHERE organization_id = ?", (org_id,))
    subs = [dict(r) for r in cursor.fetchall()]
    cursor.execute("SELECT * FROM audit_logs WHERE organization_id = ? LIMIT 50", (org_id,))
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()

    log_audit_event(
        action="gdpr.data_export",
        resource="ComplianceManager",
        details="Generated GDPR Data Portability Archive",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "archive_format": "JSON",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "organization": org,
            "stores": stores,
            "subscriptions": subs,
            "audit_trail_sample": logs
        }
    }
