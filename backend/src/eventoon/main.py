import re
import time

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from pydantic import BaseModel
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
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds", "Request duration", ["method", "path"]
)

# --- Middleware Functions ---


async def security_headers_dispatch(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data:; "
        "font-src 'self' data:; "
        "connect-src 'self' *;"
    )
    # Reset HSTS to avoid forcing HTTPS on localhost
    response.headers["Strict-Transport-Security"] = "max-age=0"
    return response


async def metrics_middleware_dispatch(request: Request, call_next):
    if request.url.path == "/metrics":
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception:
        return Response(content="Internal Server Error", status_code=500)

    duration = time.time() - start_time
    path = sanitize_path(request.url.path)
    REQUEST_COUNT.labels(method=request.method, path=path).inc()
    REQUEST_DURATION.labels(method=request.method, path=path).observe(duration)
    return response


# --- App Initialization ---

app = FastAPI(title="Eventoon", version="0.1.0")

# 1. Custom Middlewares (Inner layers)
app.add_middleware(BaseHTTPMiddleware, dispatch=metrics_middleware_dispatch)
app.add_middleware(BaseHTTPMiddleware, dispatch=security_headers_dispatch)

# 2. CORS Middleware (Outermost layer)
# Must be added AFTER other middlewares to be the first to handle requests (especially OPTIONS)
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
# Add common local variations
extra_origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://0.0.0.0",
    "http://localhost:5173",
    "http://localhost:8081",
]
for r in list(origins):
    if r.endswith(":80"):
        extra_origins.append(r.replace(":80", ""))

if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(set(origins + extra_origins)),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(router)


class AISuggestRequest(BaseModel):
    name: str
    description: str
    date: str
    max_capacity: int


@app.post("/ai/suggest")
async def ai_suggest(body: AISuggestRequest, ai: AIService = Depends(AIService)):
    suggestion = await ai.get_event_suggestion(
        name=body.name,
        date=body.date,
        max_capacity=body.max_capacity,
        description=body.description,
    )
    suggestion = suggestion.strip("\"'")
    return {"suggestion": suggestion}


@app.get("/health")
async def health():
    return {"status": "ok"}
