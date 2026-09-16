import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_pricing_plans():
    response = client.get("/api/billing/plans")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["plans"]) == 3
    plan_ids = [p["id"] for p in data["plans"]]
    assert "starter" in plan_ids
    assert "growth" in plan_ids
    assert "enterprise" in plan_ids

def test_validate_coupon_codes():
    # Valid coupon
    res_valid = client.post("/api/billing/validate-coupon", json={
        "coupon_code": "LAUNCH2026",
        "plan_id": "growth",
        "billing_cycle": "annual"
    })
    assert res_valid.status_code == 200
    assert res_valid.json()["valid"] is True
    assert res_valid.json()["discount_pct"] == 20

    # Invalid coupon
    res_invalid = client.post("/api/billing/validate-coupon", json={
        "coupon_code": "FAKEDISCOUNT999",
        "plan_id": "growth",
        "billing_cycle": "annual"
    })
    assert res_invalid.status_code == 200
    assert res_invalid.json()["valid"] is False

def test_get_current_subscription():
    response = client.get("/api/billing/subscription")
    assert response.status_code == 200
    data = response.json()
    assert data["has_subscription"] is True
    assert "plan_name" in data["subscription"]
    assert data["subscription"]["status"] == "active"

def test_process_checkout():
    payload = {
        "plan_id": "growth",
        "billing_cycle": "annual",
        "cardholder_name": "Unit Tester",
        "card_number": "4242 4242 4242 4242",
        "exp_month": "12",
        "exp_year": "28",
        "cvv": "888",
        "billing_email": "unit_test@retailpulse.ai",
        "coupon_code": "LAUNCH2026"
    }
    response = client.post("/api/billing/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "transaction" in data
    txn = data["transaction"]
    assert txn["invoice_number"].startswith("INV-RP-")
    assert txn["transaction_id"].startswith("TXN-RP-")
    assert txn["coupon_code"] == "LAUNCH2026"
    assert txn["amount"] > 0

    # Verify invoice can be downloaded
    receipt_res = client.get(f"/api/billing/invoices/{txn['invoice_number']}/download")
    assert receipt_res.status_code == 200
    receipt = receipt_res.json()
    assert receipt["status"] == "success"
    assert receipt["invoice"]["invoice_number"] == txn["invoice_number"]

def test_enterprise_inquiry():
    payload = {
        "name": "David Miller",
        "email": "david@omnichannel-retail.com",
        "company": "Omnichannel Retail Corp",
        "estimated_skus": "100,000+ SKUs",
        "requirements": "Dedicated PyTorch LSTM & Custom ERP Connector",
        "notes": "Interested in private cloud deployment on AWS."
    }
    response = client.post("/api/billing/enterprise-inquiry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["ticket_id"].startswith("ENT-RP-")
