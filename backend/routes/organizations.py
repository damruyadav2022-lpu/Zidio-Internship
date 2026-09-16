from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from backend.database import get_db_connection, log_audit_event
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/organizations", tags=["Organizations & Multi-Tenancy"])

class StoreCreateRequest(BaseModel):
    name: str
    platform: str = "Shopify"
    domain: Optional[str] = ""
    currency: str = "USD"
    timezone: str = "America/New_York"

class MemberInviteRequest(BaseModel):
    email: str
    name: str
    role: str = "inventory_manager"
    title: Optional[str] = "Retail Analyst"

@router.get("/current")
def get_current_organization(user: dict = Depends(get_current_user)):
    """Returns the current tenant organization, active stores, and team member directory."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM organizations WHERE id = ?", (org_id,))
    org_row = cursor.fetchone()
    if not org_row:
        # Fallback to org 1 if specific org not found
        cursor.execute("SELECT * FROM organizations WHERE id = 1")
        org_row = cursor.fetchone()
    
    if not org_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org = dict(org_row)
    actual_org_id = org["id"]

    # Fetch stores
    cursor.execute("SELECT * FROM stores WHERE organization_id = ? ORDER BY id ASC", (actual_org_id,))
    stores = [dict(r) for r in cursor.fetchall()]

    # Fetch members with user details
    cursor.execute("""
        SELECT om.id, om.role, om.title, om.joined_at, u.id as user_id, u.name, u.email
        FROM organization_members om
        JOIN users u ON om.user_id = u.id
        WHERE om.organization_id = ?
        ORDER BY om.id ASC
    """, (actual_org_id,))
    members = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "organization": org,
        "stores": stores,
        "members": members
    }

@router.post("/stores")
def create_store(req: StoreCreateRequest, user: dict = Depends(get_current_user)):
    """Add a new e-commerce or retail store location to the current organization."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO stores (organization_id, name, platform, domain, currency, timezone, is_active, is_live)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    """, (org_id, req.name, req.platform, req.domain, req.currency, req.timezone))
    new_store_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit_event(
        action="store.create",
        resource="StoreManager",
        details=f"Added new store channel '{req.name}' ({req.platform})",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "message": f"Store '{req.name}' created successfully",
        "store_id": new_store_id
    }

@router.post("/stores/{store_id}/toggle-mode")
def toggle_store_mode(store_id: int, user: dict = Depends(get_current_user)):
    """Toggle between Live Store and Demo Sandbox data mode."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_live, name FROM stores WHERE id = ? AND organization_id = ?", (store_id, org_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Store not found")
    
    new_mode = 0 if row["is_live"] == 1 else 1
    cursor.execute("UPDATE stores SET is_live = ? WHERE id = ?", (new_mode, store_id))
    conn.commit()
    conn.close()

    log_audit_event(
        action="store.mode_toggle",
        resource="StoreManager",
        details=f"Switched store '{row['name']}' to {'LIVE' if new_mode == 1 else 'DEMO SANDBOX'} mode",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "store_id": store_id,
        "is_live": bool(new_mode),
        "mode_label": "Live Store" if new_mode == 1 else "Demo Sandbox"
    }

@router.post("/members/invite")
def invite_member(req: MemberInviteRequest, user: dict = Depends(get_current_user)):
    """Invite a new team member with Role-Based Access Control (RBAC)."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    user_row = cursor.fetchone()
    if not user_row:
        # Create user record
        from backend.database import hash_password
        h, s = hash_password("tempPass123!")
        cursor.execute("""
            INSERT INTO users (email, name, company, password_hash, salt, role)
            VALUES (?, ?, 'Acme Retail Brands Inc.', ?, ?, ?)
        """, (req.email, req.name, h, s, req.role))
        user_id = cursor.lastrowid
    else:
        user_id = user_row["id"]

    # Check if already member
    cursor.execute("SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?", (org_id, user_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User is already a member of this organization")

    cursor.execute("""
        INSERT INTO organization_members (organization_id, user_id, role, title)
        VALUES (?, ?, ?, ?)
    """, (org_id, user_id, req.role, req.title))
    conn.commit()
    conn.close()

    log_audit_event(
        action="member.invite",
        resource="RBACService",
        details=f"Invited {req.email} as {req.role} ({req.title})",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {
        "status": "success",
        "message": f"Invitation sent to {req.email} ({req.role})"
    }

@router.delete("/members/{member_id}")
def remove_member(member_id: int, user: dict = Depends(get_current_user)):
    """Remove a team member from the organization."""
    org_id = user.get("organization_id", 1)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM organization_members WHERE id = ? AND organization_id = ?", (member_id, org_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Member not found")
    
    if row["role"] == "owner":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot remove the organization owner")

    cursor.execute("DELETE FROM organization_members WHERE id = ? AND organization_id = ?", (member_id, org_id))
    conn.commit()
    conn.close()

    log_audit_event(
        action="member.remove",
        resource="RBACService",
        details=f"Removed member ID {member_id} from organization",
        org_id=org_id,
        user_id=user["id"],
        user_email=user["email"]
    )

    return {"status": "success", "message": "Member removed successfully"}
