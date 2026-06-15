# Eventoon

Full-stack event management application. Create events, register attendees, track statistics with AI-powered insights.

## Entities

### Event

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Primary key |
| `name` | `string` | Event name (unique, max 255 chars) |
| `description` | `string` | Event description (max 1000 chars) |
| `date` | `date` | Event date |
| `max_capacity` | `int` | Maximum number of attendees |

### Registration

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Primary key |
| `event_id` | `int` | Foreign key to Event |
| `user_name` | `string` | Attendee name |
| `email` | `string` | Attendee email (unique per event) |
| `registration_date` | `datetime` | Auto-set on creation |

## Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI (Python 3.12), SQLAlchemy 2.0 (async), PostgreSQL 18 |
| **Frontend** | React 19, Vite, Tailwind 4, MUI 7 |
| **Mobile** | React Native, Expo SDK 54, Expo Router |
| **AI** | LangChain + NVIDIA AI (optional) |
| **Monitoring** | Prometheus + Grafana |
| **Infrastructure** | Docker Compose, GitHub Actions CI/CD |

## Quick Start

```bash
cp .env.example .env
# Edit .env with your values (NVIDIA_API_KEY is optional)
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Mobile (web) | http://localhost:8081 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Prometheus | http://localhost:9091 (monitoring profile) |
| Grafana | http://localhost:3000 (monitoring profile) |

For monitoring, start with `docker compose --profile monitoring up --build`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `eventoon` | PostgreSQL user |
| `POSTGRES_PASSWORD` | *(required)* | PostgreSQL password |
| `POSTGRES_DB` | `eventoon` | PostgreSQL database name |
| `BACKEND_PORT` | `8000` | Backend host port |
| `FRONTEND_PORT` | `80` | Frontend host port |
| `MOBILE_PORT` | `8081` | Mobile web host port |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8081` | Allowed CORS origins |
| `NVIDIA_API_KEY` | *(optional)* | API key for AI features |
| `GRAFANA_PASSWORD` | `admin` | Grafana admin password |

## Manual Setup

### Backend

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn eventoon.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Use `EXPO_PUBLIC_API_URL` to override the API base URL (defaults to `http://localhost:8000` on iOS/web, `http://10.0.2.2:8000` on Android emulator).

## API Reference

### Events

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/events` | Create an event |
| `GET` | `/events` | List all events (with attendee counts) |
| `GET` | `/events/{id}` | Get event details |
| `POST` | `/events/{id}/register` | Register an attendee |
| `GET` | `/events/{id}/stats` | Get registration statistics |
| `GET` | `/events/{id}/stats/summary` | AI-generated summary (requires NVIDIA_API_KEY) |
| `GET` | `/events/export/csv` | Export all events as CSV |

### AI

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ai/suggest` | Improve an event description (requires NVIDIA_API_KEY) |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `DELETE` | `/test/cleanup` | Truncate all data (for testing) |

### Request Schemas

**`POST /events`**
```json
{
  "name": "Tech Conference",
  "description": "Annual technology conference",
  "date": "2026-07-15",
  "max_capacity": 100
}
```

**`POST /events/{id}/register`**
```json
{
  "user_name": "Jane Doe",
  "email": "jane@example.com"
}
```

**`POST /ai/suggest`**
```json
{
  "name": "Tech Conference",
  "description": "A conference about tech stuff",
  "date": "2026-07-15",
  "max_capacity": 100
}
```

## AI Features

When `NVIDIA_API_KEY` is configured:

- **Description improvement** (`POST /ai/suggest`): improves the user's draft description using event context (name, date, capacity). The AI refines the draft without mentioning the event name, date, or capacity.
- **Stats summary** (`GET /events/{id}/stats/summary`): generates a 2-sentence summary of event registration status. Results are cached in the database.

## Architecture

```
                    ┌──────────┐
                    │ Frontend │ :80
                    │ (nginx)  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐   ┌──────────┐
                    │ Backend  │──▶│ Mobile   │ :8081
                    │ (FastAPI)│   │ (nginx)  │
                    └────┬─────┘   └──────────┘
                         │
                    ┌────▼─────┐
                    │PostgreSQL│
                    └──────────┘
```

### Backend Layers

| Layer | File | Responsibility |
|-------|------|---------------|
| **Routers** | `routers.py` | HTTP endpoints, request validation |
| **Services** | `services.py` | Business logic, validation orchestration |
| **Repositories** | `repositories.py` | Data access (SQLAlchemy async queries) |
| **Schemas** | `schemas.py` | Pydantic request/response models |
| **Models** | `models.py` | SQLAlchemy ORM models |
| **AI** | `ai.py` | LangChain + NVIDIA integration |
| **Config** | `config.py` | pydantic-settings from env |
| **Database** | `database.py` | Async engine + session factory |

## Validations

| Rule | Enforcement |
|------|-------------|
| Duplicate email per event | Unique constraint `(event_id, email)`; returns 400 |
| Max capacity | Rejects registration when `attendee_count >= max_capacity`; returns 400 |
| Duplicate event name | Unique constraint on `Event.name`; returns 400 |
| Empty inputs | `min_length=1` in Pydantic; empty after sanitize returns 422 |
| HTML tags | Rejected at input layer; returns 422 |
| Invalid email | `EmailStr` Pydantic validator; returns 422 |
| Rate limit | 10 registrations/minute per email; returns 429 |

## Frontend Screens

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `EventList` | Card grid of all events with attendee counts |
| `/events/:id` | `EventDetail` | Event info + registration form |
| `/new` | `NewEvent` | Create event form |
| `/stats` | `StatsDashboard` | Registration statistics per event |

### Mobile Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Event List | FlatList with pull-to-refresh |
| `/event/:id` | Event Detail | Event info + registration form |
| `/stats` | Stats | Per-event registration statistics |
| `/new` | New Event | Create event form |

## Security

- **Input sanitization**: null bytes removed, HTML tags rejected (422), whitespace stripped, empty inputs rejected
- **Schema validation**: `min_length=1`, `gt=0`, `EmailStr` enforcement
- **Duplicate prevention**: unique constraint on `(event_id, email)` per registration; unique constraint on `Event.name`
- **Rate limiting**: 10 registrations per minute per email
- **Injection protection**: all queries use SQLAlchemy parameterized statements (ORM)
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `X-XSS-Protection`, `Strict-Transport-Security`
- **Container security**: `no-new-privileges`, read-only filesystem (PostgreSQL), non-root user (backend)
- **CI/CD security scanning**: Bandit (SAST), Safety (dependency CVEs), npm audit

## Testing

```bash
# Start database
docker compose up -d db

# API tests
cd backend && uv run pytest -v

# With coverage
uv run pytest --cov=eventoon --cov-report=term-missing

# E2E tests (requires CI environment)
CI=true uv run pytest tests/test_selenium.py -v
```

The test suite covers: CRUD operations, 404 handling, duplicate email enforcement, max capacity enforcement, input validation, stats computation, health check.

## Linting & Type Checking

```bash
cd backend
uv run ruff check src        # Lint
uv run ruff format --check src  # Format check
uv run mypy src              # Type checking
uv run bandit -r src         # Security audit
uv run safety check          # Dependency vulnerabilities
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) with 4 parallel jobs:

| Job | Description |
|-----|-------------|
| `lint` | Ruff, mypy, bandit |
| `security` | Safety dependency scan, npm audit |
| `test-api` | Pytest with PostgreSQL service container |
| `test-e2e` | Selenium E2E tests with full stack |
| `build` | Docker Compose build |

## SQL Queries

Top 5 events by registrations:

```sql
SELECT e.id, e.name, COUNT(r.id) AS registration_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id, e.name
ORDER BY registration_count DESC
LIMIT 5;
```

Registrations per month:

```sql
SELECT
  DATE_TRUNC('month', registration_date) AS month,
  COUNT(*) AS total_registrations
FROM registrations
GROUP BY month
ORDER BY month;
```

## Project Structure

```
├── backend/
│   ├── src/eventoon/       # FastAPI application
│   ├── tests/              # Pytest suite
│   ├── alembic/            # Database migrations
│   ├── seed_edge.py        # Edge case seed data
│   └── Dockerfile
├── frontend/
│   ├── src/components/     # React components
│   ├── src/api.ts          # API client
│   └── Dockerfile
├── mobile/
│   ├── app/                # Expo Router screens
│   ├── lib/                # API client + types
│   └── Dockerfile
├── monitoring/             # Prometheus + Grafana config
├── .github/workflows/      # CI/CD pipeline
├── docker-compose.yml
└── .env.example
```

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Layered architecture (not hexagonal) | Appropriate for 2 entities / 5 endpoints |
| Async SQLAlchemy + asyncpg | Non-blocking database access for FastAPI |
| HTML tag rejection (not stripping) | Prevents XSS at input layer; clean rejection feedback |
| TRUNCATE for cleanup | Faster than DELETE; resets auto-increment IDs |
| Nginx sidecar for SPA | Proper static serving + fallback to `index.html` for client-side routing |
| CSP allows `cdn.jsdelivr.net` | Required for MUI icons loaded at runtime |
