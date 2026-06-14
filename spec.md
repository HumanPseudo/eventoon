# Full Stack Technical Test

Target stack: React, Vite, Tailwind, MUI, React Native Expo, FastAPI, PostgreSQL.

## Context

Build an event management module where an admin can create events and users can register.

## Part 1 — Backend (FastAPI)

Entities: Event (id, name, description, date, max_capacity) and Registration (id, event_id, user_name, email, registration_date).

Required endpoints:

- `POST /events`
- `GET /events`
- `GET /events/{id}`
- `POST /events/{id}/register`
- `GET /events/{id}/stats`

Validations: prevent duplicate email registrations per event and enforce max capacity.

## Part 2 — Database (PostgreSQL)

Provide SQL queries for: Top 5 events by registrations and registrations per month.

## Part 3 — Frontend (React + Vite)

Screens: event list, event detail with registration form, and statistics dashboard.

## Part 4 — Quality

Include a README with run instructions, environment variables, and technical decisions.

## Bonus

Docker, automated tests (pytest/vitest), CI/CD with GitHub Actions, and deployment.
