# ACME Pay — Salary Management

A web app that lets ACME's HR Manager maintain salary data for ~10,000 employees across 8 countries,
and answer "how do we pay people?" without spreadsheets.

**Stack:** FastAPI · SQLAlchemy 2 · Postgres (prod) / SQLite (dev, tests) · React 19 · Mantine 9 ·
TanStack Query · Vercel

| Doc | What's in it |
|-----|--------------|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | One-page requirements: goal, scope, **what's deliberately left out and why** |
| [docs/DESIGN.md](docs/DESIGN.md) | Architecture, data model, API, key trade-offs |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Measured numbers at 10k employees and how it scales |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | How AI tools were used, prompts, and where their output was corrected |
| [docs/KNOWLEDGE_GRAPH.md](docs/KNOWLEDGE_GRAPH.md) | Knowledge graph of the codebase ([graphify](https://github.com/Graphify-Labs/graphify)): core abstractions, layers, doc-to-code traceability |

## What it does

**Employees.** Search across 10k employees by name, email or code; filter by country, department and
job title; sort by any column (salary sorts by USD equivalent, so cross-currency ordering is
meaningful); add, edit and delete with validation. Changing a salary requires a reason and an
effective date, and every change is written to an append-only **salary history** shown on the
employee's detail drawer.

**Pay insights.** Headcount, annual payroll, median vs mean salary (mean > median flags skew);
pay by country in local currency and USD; median by department; salary distribution; and min /
median / average / max by job title within a country, which is the view used for setting pay bands.
Everything can be scoped to one country.

## Run locally

Prerequisites: [uv](https://docs.astral.sh/uv/) and Node ≥ 20.19.

```bash
# API — http://localhost:8000 (interactive docs at /docs)
cd backend
uv sync
uv run python -m app.seed --reset          # 10,000 deterministic employees, ~0.5 s
uv run uvicorn app.main:app --reload

# UI — http://localhost:5173 (proxies /api to :8000)
cd frontend
npm ci
npm run dev
```

## Tests

```bash
cd backend  && uv run pytest --cov=app     # 64 tests, ~0.5 s, 96% coverage
cd frontend && npm test                    # 25 tests, ~2 s
```

Backend tests use a fresh in-memory SQLite DB per test and an injected clock, so they're isolated
and deterministic. Most business logic lives in pure functions (`backend/app/domain/`) that are
tested without a database. CI (`.github/workflows/ci.yml`) runs lint, format, type-check, tests and
build for both halves.

## Deploy (Vercel)

One Vercel project serves the static UI and the API (`api/index.py` → FastAPI), configured in
[vercel.json](vercel.json). Vercel's filesystem is ephemeral, so production data lives in Postgres:

1. Import the repo into Vercel (framework preset: *Other*; build settings come from `vercel.json`).
2. Add a Postgres database: *Storage → Neon* in the Vercel dashboard. This sets `DATABASE_URL`
   (`postgres://…` URLs are normalised to the psycopg driver automatically).
3. Seed it once from your machine:
   ```bash
   cd backend && DATABASE_URL='<neon url>' uv run python -m app.seed --reset
   ```
4. Deploy.

**Zero-setup demo mode:** without a database, set `DATABASE_URL=sqlite:////tmp/salary.db` and
`AUTO_SEED=1`. Each serverless instance seeds itself on first request (~0.6 s), but edits are lost
when the instance recycles, so use this for demos only.

| Env var | Default | Purpose |
|---------|---------|---------|
| `DATABASE_URL` / `POSTGRES_URL` | `sqlite:///./salary.db` | Database connection |
| `AUTO_SEED` | off | Seed 10k employees on first request if the DB is empty |
| `CORS_ORIGINS` | `http://localhost:5173` | Only needed if UI and API are on different origins |

## Repository layout

```
backend/
  app/domain/      pure logic: currency conversion, statistics, reference data  (no I/O)
  app/services/    business rules: validation, salary history, insights aggregation
  app/routers/     thin HTTP layer
  app/seed.py      deterministic data generator + bulk loader
  tests/
frontend/src/
  api/             typed fetch client + React Query hooks
  features/        employees/, insights/
  lib/             formatting helpers
api/index.py       Vercel function entrypoint
docs/              requirements, design, performance, AI usage, knowledge graph
graphify-out/      generated knowledge graph (graph.html, GRAPH_REPORT.md, graph.json)
```
