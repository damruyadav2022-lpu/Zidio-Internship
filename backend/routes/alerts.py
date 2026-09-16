from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from backend.database import query_df, get_db_connection, log_audit_event
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["System & Telemetric Alerts"])

# In-memory tracking of alert resolution and acknowledgment state for session persistence
_alert_states: Dict[str, Dict[str, bool]] = {}

class AlertActionRequest(BaseModel):
    action: str = "acknowledge" # acknowledge, resolve, dismiss

@router.get("")
def get_system_alerts(user: dict = Depends(get_current_user)):
    """
    Dynamically aggregates real-time alerts across:
    1. Inventory Replenishment & Stockout Risks (Critical Red / Warning Yellow)
    2. Predictive Churn Risks (High LTV Accounts)
    3. MLOps Statistical Covariate Drift (KS-Test p < 0.05)
    4. Infrastructure & Security Audit Logs
    """
    alerts: List[Dict[str, Any]] = []

    # 1. Inventory Stockout Alerts
    try:
        df_inv = query_df("""
            SELECT ProductID, ProductName, Category, CurrentStock, SafetyStock, ReorderPoint, AlertLevel 
            FROM inventory_recommendations 
            WHERE AlertLevel LIKE '%Red%' OR AlertLevel LIKE '%Yellow%'
            ORDER BY CurrentStock ASC 
            LIMIT 15
        """)
        for _, row in df_inv.iterrows():
            is_critical = "Red" in str(row["AlertLevel"])
            alert_id = f"INV-{row['ProductID']}"
            state = _alert_states.get(alert_id, {"acknowledged": False, "resolved": False})
            
            alerts.append({
                "id": alert_id,
                "title": f"{'Critical Stockout Imminent' if is_critical else 'Low Reorder Buffer'}: {row['ProductName']}",
                "category": "Inventory",
                "severity": "Critical" if is_critical else "Warning",
                "timestamp": "Real-time Telemetry",
                "description": (
                    f"Current stock is {int(row['CurrentStock'])} units against Safety Stock buffer of {int(row['SafetyStock'])} "
                    f"and Reorder Point {int(row['ReorderPoint'])}. Immediate replenishment required to maintain 95% SLA."
                ),
                "actionLabel": "Generate Purchase Order",
                "actionTarget": "/app/inventory",
                "product_id": str(row["ProductID"]),
                "acknowledged": state["acknowledged"],
                "resolved": state["resolved"]
            })
    except Exception as e:
        print(f"[Alerts Warning] Failed to query inventory alerts: {e}")

    # 2. Predictive Churn Attrition Alerts
    try:
        df_churn = query_df("""
            SELECT CustomerID, CustomerName, Segment, Monetary, Recency, ChurnProbability, RecommendedAction
            FROM churn_high_risk_alerts
            ORDER BY ChurnProbability DESC, Monetary DESC
            LIMIT 10
        """)
        for _, row in df_churn.iterrows():
            alert_id = f"CHURN-{row['CustomerID']}"
            state = _alert_states.get(alert_id, {"acknowledged": False, "resolved": False})
            prob = float(row["ChurnProbability"]) * 100
            monetary = float(row["Monetary"])

            alerts.append({
                "id": alert_id,
                "title": f"High-Value Churn Defection: {row['CustomerName']} (${monetary:,.0f} LTV)",
                "category": "Churn",
                "severity": "Critical" if prob >= 75 else "Warning",
                "timestamp": f"{int(row['Recency'])} days inactive",
                "description": (
                    f"XGBoost classifier predicts {prob:.1f}% defection probability for VIP customer in {row['Segment']} segment. "
                    f"Action: {row['RecommendedAction']}."
                ),
                "actionLabel": "Dispatch Win-Back Offer",
                "actionTarget": "/app/churn",
                "customer_id": str(row["CustomerID"]),
                "acknowledged": state["acknowledged"],
                "resolved": state["resolved"]
            })
    except Exception as e:
        print(f"[Alerts Warning] Failed to query churn alerts: {e}")

    # 3. MLOps Statistical Covariate Drift
    try:
        df_drift = query_df("SELECT * FROM data_drift_monitoring")
        for _, row in df_drift.iterrows():
            pval = float(row["P_Value"])
            if pval < 0.05:
                alert_id = f"DRIFT-{row['Feature']}"
                state = _alert_states.get(alert_id, {"acknowledged": False, "resolved": False})
                alerts.append({
                    "id": alert_id,
                    "title": f"Statistical Covariate Shift: {row['Feature']}",
                    "category": "Drift",
                    "severity": "Warning" if pval >= 0.01 else "Critical",
                    "timestamp": "Current Batch Window",
                    "description": (
                        f"Two-sample Kolmogorov-Smirnov test returned p-value = {pval:.4f} (KS={float(row['KS_Statistic']):.4f}). "
                        f"{row['Action']}"
                    ),
                    "actionLabel": "Review Model Observability",
                    "actionTarget": "/app/mlops",
                    "acknowledged": state["acknowledged"],
                    "resolved": state["resolved"]
                })
    except Exception as e:
        print(f"[Alerts Warning] Failed to query drift alerts: {e}")

    # 4. System & Security Operational Events
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5")
        logs = cursor.fetchall()
        conn.close()
        for log in logs:
            action = log["action"]
            if any(k in action for k in ["failed", "disconnect", "blocked", "login.failed"]):
                alert_id = f"SEC-{log['id']}"
                state = _alert_states.get(alert_id, {"acknowledged": True, "resolved": False})
                alerts.append({
                    "id": alert_id,
                    "title": f"Security Event: {action}",
                    "category": "System",
                    "severity": "Warning",
                    "timestamp": log["created_at"],
                    "description": f"{log['details']} (IP: {log['ip_address']})",
                    "actionLabel": "Inspect Audit Trail",
                    "actionTarget": "/app/audit-logs",
                    "acknowledged": state["acknowledged"],
                    "resolved": state["resolved"]
                })
    except Exception:
        pass

    # Summary counts
    total = len(alerts)
    critical = sum(1 for a in alerts if a["severity"] == "Critical" and not a["resolved"])
    warning = sum(1 for a in alerts if a["severity"] == "Warning" and not a["resolved"])
    unacknowledged = sum(1 for a in alerts if not a["acknowledged"] and not a["resolved"])

    return {
        "alerts": alerts,
        "summary": {
            "total": total,
            "critical": critical,
            "warning": warning,
            "unacknowledged": unacknowledged,
            "resolved": sum(1 for a in alerts if a["resolved"])
        }
    }

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Acknowledge a telemetric incident."""
    if alert_id not in _alert_states:
        _alert_states[alert_id] = {"acknowledged": True, "resolved": False}
    else:
        _alert_states[alert_id]["acknowledged"] = True

    log_audit_event(
        action="alert.acknowledge",
        resource="AlertIncidentCenter",
        details=f"Alert {alert_id} acknowledged by {user['email']}"
    )

    return {"status": "success", "alert_id": alert_id, "acknowledged": True}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Resolve an incident and dismiss from active alert dashboard."""
    if alert_id not in _alert_states:
        _alert_states[alert_id] = {"acknowledged": True, "resolved": True}
    else:
        _alert_states[alert_id]["resolved"] = True
        _alert_states[alert_id]["acknowledged"] = True

    log_audit_event(
        action="alert.resolve",
        resource="AlertIncidentCenter",
        details=f"Alert {alert_id} marked as resolved by {user['email']}"
    )

    return {"status": "success", "alert_id": alert_id, "resolved": True}
