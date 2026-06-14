# Eventoon — Full-Stack Event Management

Full-stack event management application built with FastAPI, PostgreSQL, React, and React Native Expo.

[Full spec →](spec.md)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| Database | PostgreSQL 16 |
| Frontend | React 19, Vite 6, Tailwind CSS 4, MUI 7 |
| Mobile | React Native Expo SDK 52, Expo Router |
| Infrastructure | Docker, docker compose |
| CI/CD | GitHub Actions |
| Quality | Ruff (lint/format), pytest, Selenium |

---

## Quick Start

```bash
# Copy environment config
cp .env.example .env
# Edit .env if needed (set POSTGRES_PASSWORD)

# Start all services
docker compose up --build
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| Frontend | `http://localhost:5173` |
| Mobile (Expo web) | `http://localhost:8081` |

---

## Project Structure

```
├── backend/               # FastAPI application
│   ├── src/eventoon/
│   │   ├── main.py        # App entry point, CORS, lifespan
│   │   ├── config.py      # pydantic-settings (DATABASE_URL, CORS_ORIGINS)
│   │   ├── database.py    # Async engine + session factory
│   │   ├── models.py      # SQLAlchemy ORM (Event, Registration)
│   │   ├── schemas.py     # Pydantic request/response models
│   │   ├── repositories.py# Data access layer
│   │   ├── services.py    # Business logic + validation
│   │   └── routers.py     # HTTP endpoints
│   ├── alembic/           # Schema migrations
│   ├── tests/             # API tests (pytest) + E2E (Selenium)
│   └── Dockerfile
├── frontend/              # React + Vite web app
│   └── src/components/    # Layout, EventList, EventDetail, NewEvent, StatsDashboard
├── mobile/                # React Native Expo app
│   ├── app/               # Expo Router screens
│   └── lib/               # API client, types
├── docker-compose.yml     # All services orchestration
└── .github/workflows/     # CI pipeline (lint, test, build)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/events` | Create event |
| `GET` | `/events` | List all events |
| `GET` | `/events/{id}` | Event detail |
| `POST` | `/events/{id}/register` | Register attendee (validates unique email + capacity) |
| `GET` | `/events/{id}/stats` | Event statistics (registration count) |

---

## Development

### Backend (without Docker)

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn eventoon.main:app --reload
```

### Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

### Mobile (without Docker)

```bash
cd mobile
npm install
npx expo start --web
```

For **phone testing** with Expo Go, update `mobile/lib/api.ts` with your computer's LAN IP (e.g. `http://192.168.1.42:8000`). The phone and computer must be on the same WiFi network.

### Lint & Test

```bash
# Backend
cd backend && uv run ruff check src && uv run ruff format --check src && uv run pytest -v

# Frontend
cd frontend && npm run lint && npm run typecheck
```

### Seed data

```bash
docker compose exec backend uv run python /app/seed.py
# Or directly:
docker cp backend/seed.py eventoon-backend-1:/app/
docker compose exec backend uv run python seed.py
```

---

## Environment Variables

See `.env.example`. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | AsyncPG connection string |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8081` | Allowed CORS origins |
| `POSTGRES_PASSWORD` | — | Database password (must be set) |

---

## Technical Decisions

- **src/ layout**: Standard Python packaging; avoids import confusion.
- **Layered architecture**: Routers → Services → Repositories — appropriate for 2 entities / 5 endpoints.
- **Async SQLAlchemy + asyncpg**: Non-blocking database access for FastAPI.
- **Alembic**: Schema migrations for PostgreSQL.
- **Tailwind + MUI**: Tailwind for utility CSS, MUI for complex components (forms, tables).
- **Expo SDK 52**: Latest stable SDK with Expo Router for file-based routing.
- **CI/CD**: GitHub Actions with 4 parallel jobs — lint, API tests, E2E tests, Docker build.

---

## SQL Queries

Implemented in `backend/src/eventoon/repositories.py`:

**Top 5 events by registrations:**
```sql
SELECT e.id, e.name, COUNT(r.id) AS total
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.name
ORDER BY total DESC
LIMIT 5;
```

**Registrations per month:**
```sql
SELECT DATE_TRUNC('month', registration_date) AS month, COUNT(id) AS total
FROM registrations
GROUP BY month
ORDER BY month DESC;
```
