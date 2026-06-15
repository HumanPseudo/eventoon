FROM python:3.12-slim AS builder
WORKDIR /app
COPY backend/pyproject.toml .
RUN mkdir -p src/eventoon && touch src/eventoon/__init__.py && \
    pip install --no-cache-dir uv && \
    uv sync --no-dev && \
    rm -rf /root/.cache

FROM python:3.12-slim AS production
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv && \
    addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 --ingroup app --no-create-home app
COPY --from=builder /app/.venv /app/.venv
COPY backend/src src
COPY alembic.ini .
COPY alembic alembic
COPY backend/start.sh .
RUN chmod +x start.sh && chown -R app:app /app
USER app
ENV PATH="/app/.venv/bin:$PATH" \
    HOME=/app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:8000/health || exit 1
CMD ["./start.sh"]
