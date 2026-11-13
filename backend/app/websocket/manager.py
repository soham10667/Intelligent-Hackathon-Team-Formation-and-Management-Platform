import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket")

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets (a user can have multiple tabs)
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # Set of all clients subscribed to live discovery board updates
        self.discovery_subscribers: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}. Active sessions: {len(self.user_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        self.discovery_subscribers.discard(websocket)
        logger.info(f"WebSocket disconnected for user {user_id}")

    def subscribe_discovery(self, websocket: WebSocket):
        self.discovery_subscribers.add(websocket)

    def unsubscribe_discovery(self, websocket: WebSocket):
        self.discovery_subscribers.discard(websocket)

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        if user_id in self.user_connections:
            dead_connections = set()
            payload = json.dumps(message)
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Failed to send to user {user_id} socket: {e}")
                    dead_connections.add(ws)
            for dead in dead_connections:
                self.user_connections[user_id].discard(dead)

    async def broadcast_to_users(self, message: Dict[str, Any], user_ids: List[int]):
        for uid in user_ids:
            await self.send_personal_message(message, uid)

    async def broadcast_discovery(self, message: Dict[str, Any]):
        """
        Broadcasts team discovery changes (e.g. team created, seat filled, team full)
        to all users currently viewing the Discovery Board.
        """
        payload = json.dumps(message)
        dead_connections = set()
        for ws in self.discovery_subscribers:
            try:
                await ws.send_text(payload)
            except Exception as e:
                dead_connections.add(ws)
        for dead in dead_connections:
            self.discovery_subscribers.discard(dead)

manager = ConnectionManager()

