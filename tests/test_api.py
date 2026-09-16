import pytest
from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)

def test_frontend_home_serves_html():
    response = client.get("/")
    assert response.status_code == 200
    assert "<!DOCTYPE html>" in response.text
    assert "RetailPulse" in response.text

def test_api_overview():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "total_revenue" in data["kpis"]
    assert "monthly_trends" in data
    assert len(data["monthly_trends"]) > 0

def test_api_segmentation():
    response = client.get("/api/segmentation")
    assert response.status_code == 200
    data = response.json()
    assert "personas" in data
    assert len(data["personas"]) == 4

def test_api_churn():
    response = client.get("/api/churn")
    assert response.status_code == 200
    data = response.json()
    assert "benchmarks" in data
    assert "high_risk_alerts" in data
    assert len(data["benchmarks"]) >= 2

def test_api_forecasting():
    response = client.get("/api/forecasting")
    assert response.status_code == 200
    data = response.json()
    assert "forecast_lstm" in data
    assert "forecast_baseline" in data

def test_api_inventory():
    response = client.get("/api/inventory")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "items" in data

def test_api_drift():
    response = client.get("/api/drift")
    assert response.status_code == 200
    data = response.json()
    assert "drift_table" in data

def test_api_market_intelligence():
    response = client.get("/api/market-intelligence")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "July 2026"
    assert data["market"] == "India"
    assert len(data["domains"]) == 12
    assert data["domains"][0]["domain"] == "amazon.in"

