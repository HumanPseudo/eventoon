import re
import time

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from eventoon.config import settings
from eventoon.routers import router
from eventoon.ai import AIService

PATH_PATTERN = re.compile(r"/\d+")

def sanitize_path(path: str) -> str:
    return PATH_PATTERN.sub("/{id}", path)

REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "path"])
REQUEST_DURATION = Histogram("http_request_duration_seconds", "Request duration", ["method", "path"])

async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

async def metrics_middleware(request: Request, call_next):
    if request.url.path == "/metrics":
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
    start = time.time()
    response: Response = await call_next(request)
    duration = time.time() - start
    path = sanitize_path(request.url.path)
    REQUEST_COUNT.labels(method=request.method, path=path).inc()
    REQUEST_DURATION.labels(method=request.method, path=path).observe(duration)
    return response

app = FastAPI(title="Eventoon", version="0.1.0")

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

app.add_middleware(BaseHTTPMiddleware, dispatch=metrics_middleware)

if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.add_middleware(BaseHTTPMiddleware, dispatch=security_headers)

app.include_router(router)

@app.post("/ai/suggest")
async def ai_suggest(prompt: str, ai: AIService = Depends(AIService)):
    """Senior-level: Encapsulated AI service via dependency injection."""
    suggestion = await ai.get_event_suggestion(prompt)
    return {"suggestion": suggestion}


@app.get("/health")
async def health():
    return {"status": "ok"}
