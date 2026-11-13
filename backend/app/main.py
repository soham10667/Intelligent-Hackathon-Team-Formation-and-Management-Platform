import time
import json
import logging
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import decode_token
from app.middleware.idempotency import IdempotencyMiddleware
from app.websocket.manager import manager
from app.api import auth, users, hackathons, teams, notifications, admin

# Configure Structured JSON Logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra"):
            log_record.update(record.extra)
        return json.dumps(log_record)

logger = logging.getLogger("app")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.setLevel(logging.INFO)

# Prometheus Metrics
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP Requests", 
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", 
    "HTTP Request Latency in seconds", 
    ["endpoint"]
)
ACTIVE_WEBSOCKETS = Gauge(
    "active_websocket_connections", 
    "Active live WebSocket connections"
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade API for Intelligent Hackathon Team Formation, Race-Proof Membership and Teammate Matching.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus & Structured Logging Middleware
@app.middleware("http")
async def metrics_and_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    endpoint = request.url.path
    
    # Process request
    response = await call_next(request)
    
    # Latency & Metrics
    duration = time.perf_counter() - start_time
    if not endpoint.startswith("/metrics"):
        REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status=response.status_code).inc()
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
    
    return response

# Idempotency Middleware
app.add_middleware(IdempotencyMiddleware)

# Include Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(hackathons.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# ----------------- PROMETHEUS METRICS -----------------
@app.get("/metrics", tags=["Monitoring"])
def metrics_endpoint():
    """Prometheus metrics endpoint for scraping system telemetry."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ----------------- HEALTH CHECK -----------------
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": str(engine.url.drivername)
    }

# ----------------- WEBSOCKET ENDPOINT -----------------
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Authenticated WebSocket connection for real-time notifications,
    live team discovery board updates, and team activity streams.
    """
    user_id = 0
    if token:
        sub = decode_token(token)
        if sub:
            try:
                user_id = int(sub)
            except ValueError:
                user_id = 0

    await manager.connect(websocket, user_id)
    ACTIVE_WEBSOCKETS.inc()
    # Automatically subscribe to live discovery events
    manager.subscribe_discovery(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            # Handle client-side ping or subscribe messages
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ACTIVE_WEBSOCKETS.dec()
        manager.disconnect(websocket, user_id)
    except Exception:
        ACTIVE_WEBSOCKETS.dec()
        manager.disconnect(websocket, user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

