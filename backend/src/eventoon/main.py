import re
import time

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from eventoon.ai import AIService
from eventoon.config import settings
from eventoon.routers import router

PATH_PATTERN = re.compile(r"/\d+")

def sanitize_path(path: str) -> str:
    return PATH_PATTERN.sub("/{id}", path)

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "path"])
REQUEST_DURATION = Histogram("http_request_duration_seconds", "Request duration", ["method", "path"])

app = FastAPI(title="Eventoon", version="0.1.0")

# 1. CORS Middleware - Outermost layer to handle preflights correctly
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
# Add common variations to be safe
extra_origins = ["http://localhost", "http://127.0.0.1", "http://0.0.0.0"]
for r in list(origins):
    if r.endswith(":80"):
        extra_origins.append(r.replace(":80", ""))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + extra_origins if "*" not in origins else ["*"],
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 2. Custom Middlewares using the decorator pattern (more reliable than BaseHTTPMiddleware in some Starlette versions)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Disable HSTS on localhost to prevent forced HTTPS
    response.headers["Strict-Transport-Security"] = "max-age=0"
    return response

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    if request.url.path == "/metrics":
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    path = sanitize_path(request.url.path)
    REQUEST_COUNT.labels(method=request.method, path=path).inc()
    REQUEST_DURATION.labels(method=request.method, path=path).observe(duration)
    return response

app.include_router(router)

@app.post("/ai/suggest")
async def ai_suggest(prompt: str, ai: AIService = Depends(AIService)):
    suggestion = await ai.get_event_suggestion(prompt)
    return {"suggestion": suggestion}

@app.get("/health")
async def health():
    return {"status": "ok"}
