import json
import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from backend.routes.auth import decode_token

logger = logging.getLogger("retailpulse.websocket")

class WebSocketConnectionManager:
    """
    Manages active WebSocket sessions with organization-level channel partitioning.
    Supports authenticated pub/sub broadcasts for task progress, stock alerts, and notifications.
    """
    def __init__(self):
        # Maps org_id -> List of active WebSockets
        self.active_rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, org_id: int):
        await websocket.accept()
        if org_id not in self.active_rooms:
            self.active_rooms[org_id] = []
        self.active_rooms[org_id].append(websocket)
        logger.info(f"WebSocket client connected to org_{org_id}. Total active in room: {len(self.active_rooms[org_id])}")

    def disconnect(self, websocket: WebSocket, org_id: int):
        if org_id in self.active_rooms and websocket in self.active_rooms[org_id]:
            self.active_rooms[org_id].remove(websocket)
            if not self.active_rooms[org_id]:
                del self.active_rooms[org_id]
        logger.info(f"WebSocket client disconnected from org_{org_id}.")

    async def broadcast_to_org(self, org_id: int, payload: dict):
        """Sends real-time event JSON to all clients connected in an organization room."""
        if org_id not in self.active_rooms:
            return

        dead_sockets = []
        message_str = json.dumps(payload)
        for ws in self.active_rooms[org_id]:
            try:
                await ws.send_text(message_str)
            except Exception:
                dead_sockets.append(ws)

        for dead in dead_sockets:
            self.disconnect(dead, org_id)

    async def broadcast_global(self, payload: dict):
        """Broadcasts event across all connected organization rooms."""
        for org_id in list(self.active_rooms.keys()):
            await self.broadcast_to_org(org_id, payload)

ws_manager = WebSocketConnectionManager()
ws_router = APIRouter(tags=["Real-Time WebSockets"])

@ws_router.websocket("/ws/{org_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    org_id: int,
    token: Optional[str] = Query(None)
):
    """
    Production Real-Time WebSocket endpoint.
    Requires valid JWT token query parameter for authentication.
    """
    # Authenticate via token query parameter
    if not token:
        # Fallback check for demo/evaluator query
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token claims")
            return
    except Exception as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=f"Authentication failed: {str(e)}")
        return

    await ws_manager.connect(websocket, org_id)
    
    # Send initial connection confirmation handshake
    try:
        await websocket.send_json({
            "event": "CONNECTED",
            "message": f"Connected to RetailPulse Real-Time Event Hub (Org ID: {org_id})",
            "org_id": org_id
        })

        while True:
            # Listen for client heartbeat pings or custom commands
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": parsed.get("timestamp")})
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, org_id)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket, org_id)
