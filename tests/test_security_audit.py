import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.security_utils import validate_outbound_url, verify_razorpay_signature
from backend.routes.auth import create_access_token, hash_password, verify_password
from backend.config import settings

client = TestClient(app)

def test_ssrf_validator_blocks_private_and_metadata_ips():
    """Verify SSRF validator blocks localhost, loopback, private RFC 1918 subnets, and cloud metadata."""
    # Loopback
    is_valid, msg = validate_outbound_url("http://127.0.0.1:8000/internal")
    assert is_valid is False
    assert "SSRF defense" in msg or "prohibited" in msg or "private" in msg

    # Localhost hostname
    is_valid, msg = validate_outbound_url("http://localhost:3000/secret")
    assert is_valid is False

    # Cloud metadata IP (AWS / GCP / Azure)
    is_valid, msg = validate_outbound_url("http://169.254.169.254/latest/meta-data/")
    assert is_valid is False

    # Invalid scheme
    is_valid, msg = validate_outbound_url("file:///etc/passwd")
    assert is_valid is False
    assert "scheme" in msg

    # Invalid scheme
    is_valid, msg = validate_outbound_url("ftp://internal.vault/keys")
    assert is_valid is False

def test_ssrf_endpoint_blocks_malicious_target():
    """Verify /api/actions/webhooks/test blocks loopback target with 400 Bad Request."""
    token = create_access_token(1, "evaluator@retailpulse.ai", "owner", 1)
    response = client.post(
        "/api/actions/webhooks/test",
        headers={"Authorization": f"Bearer {token}"},
        json={"webhook_url": "http://127.0.0.1:9000/admin", "service_type": "slack"}
    )
    assert response.status_code == 400
    assert "SSRF Security Violation" in response.json()["detail"]

def test_broken_access_control_unauthenticated_rejected():
    """Verify protected endpoints reject unauthenticated requests with 401 Unauthorized."""
    # Unauthenticated customers query
    res = client.get("/api/customers")
    assert res.status_code == 401
    assert "Authorization header" in res.json()["detail"]

    # Unauthenticated inventory query
    res_inv = client.get("/api/inventory")
    assert res_inv.status_code == 401

    # Unauthenticated churn query
    res_churn = client.get("/api/churn")
    assert res_churn.status_code == 401

    # Unauthenticated forecasting query
    res_fc = client.get("/api/forecasting")
    assert res_fc.status_code == 401

def test_authenticated_access_succeeds():
    """Verify valid JWT token grants access to protected endpoints."""
    token = create_access_token(1, "evaluator@retailpulse.ai", "owner", 1)
    headers = {"Authorization": f"Bearer {token}"}

    res_cust = client.get("/api/customers?limit=5", headers=headers)
    assert res_cust.status_code == 200
    data = res_cust.json()
    assert "items" in data
    assert len(data["items"]) <= 5

    res_inv = client.get("/api/inventory", headers=headers)
    assert res_inv.status_code == 200
    assert "items" in res_inv.json()

def test_razorpay_hmac_signature_verification():
    """Verify Razorpay payment signature validation."""
    order_id = "order_RP_test12345"
    payment_id = "pay_test_98765"
    secret = "test_razorpay_secret_key"

    import hmac
    import hashlib
    valid_sig = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()

    # Valid signature
    assert verify_razorpay_signature(order_id, payment_id, valid_sig, secret) is True

    # Forged signature
    assert verify_razorpay_signature(order_id, payment_id, "forged_invalid_signature_hex", secret) is False

def test_security_headers_present():
    """Verify production security headers and request tracing ID are injected in HTTP responses."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

def test_password_hashing_pbkdf2():
    """Verify cryptographic password hashing with unique salt."""
    raw_pwd = "MySecretProductionPassword2026!"
    h1, s1 = hash_password(raw_pwd)
    h2, s2 = hash_password(raw_pwd)

    # Salts must be unique per invocation
    assert s1 != s2
    assert h1 != h2

    # Verification must succeed with correct password and salt
    assert verify_password(raw_pwd, h1, s1) is True
    assert verify_password("WrongPassword", h1, s1) is False
