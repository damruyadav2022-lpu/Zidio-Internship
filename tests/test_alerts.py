import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.auth import create_access_token

client = TestClient(app)
evaluator_token = create_access_token(1, "evaluator@retailpulse.ai", "owner", 1)
client.headers["Authorization"] = f"Bearer {evaluator_token}"

def test_get_alerts_structure():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "summary" in data
    assert "total" in data["summary"]
    assert "critical" in data["summary"]
    assert "warning" in data["summary"]

def test_acknowledge_and_resolve_alert():
    # First get an alert ID
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.json()["alerts"]
    if alerts:
        target_id = alerts[0]["id"]
        # Acknowledge
        ack_res = client.post(f"/api/alerts/{target_id}/acknowledge")
        assert ack_res.status_code == 200
        assert ack_res.json()["acknowledged"] is True

        # Resolve
        res_res = client.post(f"/api/alerts/{target_id}/resolve")
        assert res_res.status_code == 200
        assert res_res.json()["resolved"] is True

def test_connect_amazon_spapi():
    payload = {
        "seller_id": "A3TESTSELLERID",
        "marketplace_id": "ATVPDKIKX0DER",
        "lwa_client_id": "amzn1.application-oa2-client.test",
        "refresh_token": "Atzr|IwEBICkTestToken"
    }
    response = client.post("/api/integrations/amazon/connect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "sync_task_id" in data

def test_connect_woocommerce():
    payload = {
        "store_url": "https://mystore.example.com",
        "consumer_key": "ck_test1234567890",
        "consumer_secret": "cs_test0987654321"
    }
    response = client.post("/api/integrations/woocommerce/connect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "sync_task_id" in data
