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
RUN pip install --no-cache-dir uv
COPY --from=builder /app/.venv /app/.venv
COPY backend/src src
COPY alembic.ini .
COPY alembic alembic
COPY backend/start.sh .
RUN chmod +x start.sh
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["./start.sh"]
