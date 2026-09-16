"""
RetailPulse Enterprise Production Smoke Tests
Verifies that all 9 critical SaaS API endpoints meet the production contract specifications:
1. GET /api/health
2. GET /api/overview
3. GET /api/customers
4. GET /api/customers/CUST-001
5. GET /api/segmentation
6. GET /api/churn
7. GET /api/forecasting
8. GET /api/inventory
9. GET /api/mlops
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.auth import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    """Generates an authenticated JWT bearer token for the evaluator organization."""
    token = create_access_token(user_id=1, email="evaluator@retailpulse.ai", role="evaluator", org_id=1)
    return {"Authorization": f"Bearer {token}"}

def test_smoke_health():
    """1. GET /api/health - Production Liveness, Readiness, and Observability Probe."""
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "service" in data
    assert "version" in data
    assert "database" in data
    assert data["database"]["status"] == "healthy"
    assert "engine" in data["database"]
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], int)

def test_smoke_overview():
    """2. GET /api/overview - Executive KPI summary, revenue trends, and operational pulse."""
    response = client.get("/api/overview")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "kpis" in data
    assert "total_revenue" in data["kpis"]
    assert "total_orders" in data["kpis"]
    assert "active_customers" in data["kpis"]
    assert "monthly_trends" in data
    assert len(data["monthly_trends"]) > 0

def test_smoke_customers(auth_headers):
    """3. GET /api/customers - Paginated customer directory with RFM and churn metrics."""
    response = client.get("/api/customers?limit=10", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "customers" in data
    assert "total" in data
    assert "page" in data
    assert len(data["customers"]) > 0
    first_cust = data["customers"][0]
    assert "CustomerID" in first_cust
    assert "CustomerName" in first_cust
    assert "Segment" in first_cust
    assert "ChurnRiskLevel" in first_cust

def test_smoke_customer_detail_cust_001(auth_headers):
    """4. GET /api/customers/CUST-001 - Deep profile, retention action, and order history."""
    response = client.get("/api/customers/CUST-001", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["CustomerID"] == "CUST-001"
    assert "CustomerName" in data
    assert "Email" in data
    assert "RiskLevel" in data
    assert "RetentionAction" in data
    assert "TopRiskFactors" in data
    assert "OrdersHistory" in data
    assert isinstance(data["OrdersHistory"], list)
    assert len(data["OrdersHistory"]) > 0

def test_smoke_segmentation(auth_headers):
    """5. GET /api/segmentation - RFM customer clustering, PCA centroids, and persona strategies."""
    response = client.get("/api/segmentation", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "personas" in data
    assert len(data["personas"]) >= 3
    assert "scatter" in data
    assert len(data["scatter"]) > 0

def test_smoke_churn(auth_headers):
    """6. GET /api/churn - Machine learning churn probabilities, risk cohorts, and SHAP features."""
    response = client.get("/api/churn", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "high_risk_alerts" in data
    assert "feature_importance" in data
    assert "benchmarks" in data
    assert len(data["benchmarks"]) >= 2

def test_smoke_forecasting(auth_headers):
    """7. GET /api/forecasting - PyTorch LSTM demand projections, baseline comparisons, and accuracy."""
    response = client.get("/api/forecasting", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "forecast_lstm" in data
    assert "forecast_baseline" in data
    assert "model_comparison" in data
    assert len(data["forecast_lstm"]) > 0

def test_smoke_inventory(auth_headers):
    """8. GET /api/inventory - Stock levels, reorder points, EOQ calculations, and stockout risks."""
    response = client.get("/api/inventory", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "summary" in data
    assert "items" in data
    assert len(data["items"]) > 0
    item = data["items"][0]
    assert "ProductID" in item
    assert "CurrentStock" in item
    assert "SuggestedOrder" in item

def test_smoke_mlops(auth_headers):
    """9. GET /api/mlops - Dynamic model registry, MLflow experiments, and covariate drift monitors."""
    response = client.get("/api/mlops", headers=auth_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "model_registry" in data
    assert "drift_monitoring" in data
    assert "system_health" in data
    assert len(data["model_registry"]) >= 3
    # Verify models have valid artifact inspection data
    first_model = data["model_registry"][0]
    assert "model_name" in first_model
    assert "framework" in first_model
    assert "status" in first_model
