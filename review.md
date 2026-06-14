# Review Checklist

## 1. Infrastructure ✅
- [x] `docker-compose.yml` — multi-stage, CORS dinámico, monitoring, healthchecks, redes separadas
- [x] `.tool-versions` / `.python-version`
- [x] `.env.example` — actualizado con todas las vars
- [x] `monitoring/prometheus.yml`
- [x] Backend `/metrics` endpoint — expone métricas para Prometheus

## 2. Backend — Base
- [ ] `backend/pyproject.toml`
- [ ] `config.py`
- [ ] `database.py`
- [ ] `models.py`

## 3. Backend — Logic
- [ ] `schemas.py`
- [ ] `repositories.py`
- [ ] `services.py`
- [ ] `routers.py`
- [x] `main.py` — CORS dinámico, metrics middleware, security headers en prod

## 4. Database Migrations
- [ ] `alembic/` (ini, env, script, versions)

## 5. Tests
- [ ] `tests/conftest.py`
- [ ] `tests/test_api.py`

## 6. Seed Data & Queries
- [ ] `seed.py`
- [ ] `sql/queries.sql`

## 7. Backend Docker ✅
- [x] `backend/Dockerfile` — multi-stage (builder + production)
- [x] `backend/.dockerignore`
- [x] `backend/start.sh` — migraciones automáticas al arrancar

## 8. Frontend
- [ ] Setup (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`)
- [ ] API client + types
- [ ] `Layout.tsx`
- [ ] `EventList.tsx`
- [ ] `EventDetail.tsx`
- [ ] `NewEvent.tsx`
- [ ] `StatsDashboard.tsx`
- [x] `Dockerfile` — multi-stage (builder + nginx)

## 9. Mobile
- [ ] Setup (`package.json`, `app.json`, `tsconfig.json`, `babel.config.js`)
- [ ] `lib/api.ts` + `lib/types.ts`
- [ ] `app/_layout.tsx`, `app/(tabs)/`
- [ ] Event list + detail screens
- [ ] Stats screen

## 10. CI/CD
- [ ] `.github/workflows/ci.yml`

## 11. E2E Tests
- [ ] `tests/test_selenium.py`
