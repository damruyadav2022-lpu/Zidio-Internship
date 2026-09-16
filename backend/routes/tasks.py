from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.tasks.task_manager import task_manager
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Asynchronous Background Tasks"])

class TriggerTaskRequest(BaseModel):
    job_type: str
    title: Optional[str] = None

@router.get("")
def list_tasks(limit: int = 20, user: dict = Depends(get_current_user)):
    """List recent background tasks and their execution states scoped to tenant."""
    org_id = user.get("organization_id", 1)
    tasks = task_manager.list_tasks(org_id=org_id, limit=limit)
    return {"tasks": tasks}

@router.get("/{task_id}")
def get_task_status(task_id: str, user: dict = Depends(get_current_user)):
    """Check the real-time execution progress of a background job."""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("/trigger")
def trigger_task(req: TriggerTaskRequest, user: dict = Depends(get_current_user)):
    """Trigger an asynchronous background optimization or sync task."""
    org_id = user.get("organization_id", 1)
    job_titles = {
        "nightly_forecast_sync": "LSTM Demand Curve Retraining (90-Day Horizon)",
        "churn_retention_sweep": "XGBoost Customer Churn & LTV Scoring",
        "inventory_rop_audit": "Safety Stock & Reorder Point Audit",
        "full_catalog_resync": "Global Multi-Channel Catalog Reconciliation"
    }
    
    title = req.title or job_titles.get(req.job_type, f"Background Job: {req.job_type}")
    task = task_manager.create_task(req.job_type, title, org_id=org_id)

    return {
        "status": "success",
        "message": f"Task '{title}' started in background",
        "task": task
    }
