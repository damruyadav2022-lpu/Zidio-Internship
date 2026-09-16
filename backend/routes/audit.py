from fastapi import APIRouter, Query
from typing import Optional
from backend.database import get_db_connection

router = APIRouter(prefix="/api/audit-logs", tags=["Enterprise Audit Logging & Compliance"])

@router.get("")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action_filter: Optional[str] = None,
    search: Optional[str] = None
):
    """Retrieve immutable SOC2/GDPR enterprise audit log records."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM audit_logs WHERE organization_id = 1"
    params = []

    if action_filter and action_filter != "all":
        query += " AND action LIKE ?"
        params.append(f"{action_filter}%")

    if search:
        query += " AND (action LIKE ? OR resource LIKE ? OR details LIKE ? OR user_email LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE organization_id = 1")
    total_count = cursor.fetchone()[0]
    conn.close()

    return {
        "logs": rows,
        "total_count": total_count,
        "returned_count": len(rows)
    }
