# AGENTS.md — eventoon

This repository implements a full-stack event management application. The authoritative spec is `spec.md` — read it first before writing code.

## Stack (required by spec)

- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Frontend:** React + Vite + Tailwind + MUI
- **Mobile:** React Native Expo (SDK 52, Expo Router)
- **Deployment (bonus):** Docker, CI/CD (GitHub Actions)

## Domain

Two entities: `Event` (id, name, description, date, max_capacity) and `Registration` (id, event_id, user_name, email, registration_date).

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/events` | Create event |
| GET | `/events` | List events |
| GET | `/events/{id}` | Event detail |
| POST | `/events/{id}/register` | Register attendee |
| GET | `/events/{id}/stats` | Event statistics |

Key validations: unique email per event, enforce max capacity (`max_capacity`).

### SQL queries required

- Top 5 events by registrations
- Registrations per month

## Setup

- **Backend:** `cd backend && uv sync` to install all deps (dev included via `[dependency-groups.dev]`); uses `src/` layout.
- **Frontend:** `cd frontend && npm install` (Node 22, Vite dev server on :5173).
- **Infrastructure:** `docker compose up --build` starts PostgreSQL, backend, frontend.
- **Lint/format:** `cd backend && uv run ruff check src && uv run ruff format --check src`
- **Test (API):** `cd backend && uv run pytest tests/test_api.py` (needs PostgreSQL running — `docker compose up -d db`)
- **Test (all backend):** `cd backend && uv run pytest -v`
- **Test (frontend):** `cd frontend && npm test` (vitest, no DB needed)
- **Test (E2E):** `cd backend && CI=true uv run pytest tests/test_selenium.py` (needs db + backend + frontend + selenium running)
- **DB migrations:** Alembic config at `backend/alembic.ini`, migrations in `backend/alembic/versions/`.
- **Seed data:** `docker compose exec backend uv run python /app/seed.py` (after copying: `docker cp backend/seed.py eventoon-backend-1:/app/`).

## Architecture (backend)

Layered, not hexagonal — appropriate for 2 entities / 5 endpoints:

| Layer | File | Responsibility |
|-------|------|---------------|
| **Routers** | `src/eventoon/routers.py` | HTTP endpoints, request validation |
| **Services** | `src/eventoon/services.py` | Business logic, validation orchestration |
| **Repositories** | `src/eventoon/repositories.py` | Data access (SQLAlchemy async queries) |
| **Schemas** | `src/eventoon/schemas.py` | Pydantic request/response models |
| **Models** | `src/eventoon/models.py` | SQLAlchemy ORM models (`Base`, `Event`, `Registration`) |
| **Config** | `src/eventoon/config.py` | `pydantic-settings` loading `DATABASE_URL` from env |
| **Database** | `src/eventoon/database.py` | Async engine + `async_sessionmaker` |

## Tests (backend)

| File | What it tests |
|------|---------------|
| `tests/conftest.py` | Fixtures: engine test, `dependency_overrides` for `get_session`, table create/drop per test |
| `tests/test_api.py` | 17 tests covering CRUD, 404, duplicate email, max capacity, stats, validation |
| `tests/test_selenium.py` | 3 E2E tests (homepage, create event, register) — only in CI with `CI=true` |

Run: `cd backend && uv run pytest -v` (requires PostgreSQL running, e.g. `docker compose up -d db`).

## CI/CD (GitHub Actions)

Workflow in `.github/workflows/ci.yml` with 4 parallel jobs:

| Job | Description |
|-----|-------------|
| `lint` | `ruff check` + `ruff format --check` |
| `test-api` | `pytest tests/test_api.py` with PostgreSQL service |
| `test-e2e` | `pytest tests/test_selenium.py` with PostgreSQL + selenium/standalone-chrome services + backend + frontend |
| `build` | `docker compose build` |

E2E tests only run when `CI=true` (automatic in GitHub Actions).

## Mobile (React Native Expo)

App in `mobile/` with Expo SDK 52 + Expo Router (file-based routing).

### Structure

| File | Route | Screen |
|------|-------|--------|
| `app/_layout.tsx` | — | Root Stack (tabs + event detail) |
| `app/(tabs)/_layout.tsx` | — | Bottom Tab navigator |
| `app/(tabs)/index.tsx` | `/` | Event list (FlatList, pull-to-refresh via `useFocusEffect`) |
| `app/(tabs)/stats.tsx` | `/stats` | Per-event registration stats |
| `app/event/[id].tsx` | `/event/:id` | Event detail + registration form |
| `lib/api.ts` | — | API client (Platform-aware host: `10.0.2.2` for Android emulator) |
| `lib/types.ts` | — | Shared TypeScript types |

### Setup

```bash
cd mobile && npm install
npx expo start
```

Use `EXPO_PUBLIC_API_URL` env var to override API base URL (defaults to `http://localhost:8000` on iOS/web, `http://10.0.2.2:8000` on Android).

## Frontend

Four routes under a `<BrowserRouter>` + `<Layout>` shell:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `EventList` | Cards grid of all events |
| `/events/:id` | `EventDetail` | Event info + registration form |
| `/new` | `NewEvent` | Create event form |
| `/stats` | `StatsDashboard` | Per-event registration counts |
