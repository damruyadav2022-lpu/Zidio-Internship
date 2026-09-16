import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_login_default_evaluator():
    response = client.post("/api/auth/login", json={
        "email": "evaluator@retailpulse.ai",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "evaluator@retailpulse.ai"
    assert data["user"]["role"] == "evaluator"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "evaluator@retailpulse.ai",
        "password": "wrongpassword999"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_demo_login():
    response = client.post("/api/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "evaluator@retailpulse.ai"

def test_user_registration_and_me():
    test_email = "tester_auth_unit@retailpulse.ai"
    response = client.post("/api/auth/register", json={
        "name": "Unit Tester",
        "email": test_email,
        "password": "securepassword123",
        "company": "QA Department"
    })
    # Could be 200 or 400 if already created in previous run
    if response.status_code == 200:
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == test_email
        token = data["token"]
    else:
        # If exists, login to get token
        login_res = client.post("/api/auth/login", json={
            "email": test_email,
            "password": "securepassword123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["token"]

    # Verify /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == test_email
    assert me_data["name"] == "Unit Tester"
