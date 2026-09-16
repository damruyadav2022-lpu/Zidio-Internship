import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routes.auth import create_access_token
from backend.websocket import ws_manager

client = TestClient(app)

def test_websocket_unauthenticated_rejected():
    """Verify WebSocket connection without token is closed with policy violation."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/1") as websocket:
            websocket.receive_json()

def test_websocket_invalid_token_rejected():
    """Verify WebSocket connection with forged token is rejected."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/1?token=invalid_forged_token") as websocket:
            websocket.receive_json()

def test_websocket_authenticated_handshake_and_ping():
    """Verify authenticated WebSocket connection connects, receives handshake, and responds to PING."""
    token = create_access_token(1, "evaluator@retailpulse.ai", "owner", 1)
    
    with client.websocket_connect(f"/ws/1?token={token}") as websocket:
        # Handshake confirmation
        data = websocket.receive_json()
        assert data["event"] == "CONNECTED"
        assert data["org_id"] == 1

        # Test Heartbeat PING / PONG
        websocket.send_text('{"type": "PING", "timestamp": 1726488000}')
        reply = websocket.receive_json()
        assert reply["type"] == "PONG"
        assert reply["timestamp"] == 1726488000
