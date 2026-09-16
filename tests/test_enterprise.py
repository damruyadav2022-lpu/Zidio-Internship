import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.auth import create_access_token

client = TestClient(app)
evaluator_token = create_access_token(1, "evaluator@retailpulse.ai", "owner", 1)
client.headers["Authorization"] = f"Bearer {evaluator_token}"

def test_health_probe():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "uptime_seconds" in data
    assert "database" in data

def test_get_current_organization():
    response = client.get("/api/organizations/current")
    assert response.status_code == 200
    data = response.json()
    assert "organization" in data
    assert "stores" in data
    assert "members" in data
    assert len(data["stores"]) >= 1
    assert data["organization"]["slug"] == "acme-retail-brands"

def test_store_mode_toggle():
    response = client.post("/api/organizations/stores/1/toggle-mode")
    assert response.status_code == 200
    data = response.json()
    assert "is_live" in data
    assert "mode_label" in data

def test_integration_directory():
    response = client.get("/api/integrations/directory")
    assert response.status_code == 200
    data = response.json()
    assert "platforms" in data
    assert any(p["id"] == "shopify" for p in data["platforms"])

def test_list_integrations():
    response = client.get("/api/integrations")
    assert response.status_code == 200
    data = response.json()
    assert "integrations" in data

def test_background_task_trigger():
    response = client.post("/api/tasks/trigger", json={
        "job_type": "nightly_forecast_sync"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "task" in data
    assert data["task"]["status"] in ["queued", "running"]

def test_actions_send_po_email():
    response = client.post("/api/actions/send-po-email", json={
        "po_number": "PO-2026-TEST",
        "supplier_name": "Apex Global",
        "supplier_email": "procurement@apex-logistics.com",
        "total_amount": 14200.0,
        "total_units": 150
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["recipient"] == "procurement@apex-logistics.com"

def test_actions_webhook_test():
    response = client.post("/api/actions/webhooks/test", json={
        "webhook_url": "https://example.com/webhooks/slack-sample",
        "service_type": "slack"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_retention_klaviyo_sync():
    response = client.post("/api/actions/retention/sync-klaviyo", json={
        "segment_name": "High-Risk Attrition Cohort",
        "service_type": "klaviyo",
        "customer_count": 48
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["customers_pushed"] == 48

def test_audit_logs_query():
    response = client.get("/api/audit-logs?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert "total_count" in data
    assert len(data["logs"]) >= 1

def test_security_api_keys_workflow():
    # Create key
    create_res = client.post("/api/security/api-keys", json={
        "name": "Automated Unit Test Key",
        "environment": "sandbox"
    })
    assert create_res.status_code == 200
    key_data = create_res.json()
    assert key_data["status"] == "success"
    assert "full_key" in key_data
    assert key_data["full_key"].startswith("rp_test_")
    key_id = key_data["id"]

    # List keys
    list_res = client.get("/api/security/api-keys")
    assert list_res.status_code == 200
    keys = list_res.json()["keys"]
    assert any(k["id"] == key_id for k in keys)

    # Revoke key
    del_res = client.delete(f"/api/security/api-keys/{key_id}")
    assert del_res.status_code == 200
