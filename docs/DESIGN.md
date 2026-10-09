# Design Notes

## Architecture

```
            ┌──────────────────────── Vercel project ────────────────────────┐
 Browser ──▶│  /            static React SPA (Vite build, Mantine UI)         │
            │  /api/*  ──▶  Python serverless function (FastAPI, api/index.py)│
            └───────────────────────────────┬─────────────────────────────────┘
                                            │ SQLAlchemy 2.0
                                  Postgres (Neon) in prod / SQLite locally & tests
```

Backend layering (each layer only depends on the one below):

```
routers/      HTTP: request parsing, status codes, pagination params      (thin)
services/     business rules: validation beyond types, salary history, stats
models.py     SQLAlchemy ORM tables
domain/       pure functions, no I/O: currency conversion, statistics
```

The pure `domain/` layer is where most unit tests live: they are fast, deterministic, and need no DB.

## Data model

```
employees
  id              PK
  employee_code   unique, system-generated ("EMP00001"), immutable
  first_name, last_name
  email           unique
  job_title       indexed
  department      indexed
  country         ISO-3166 alpha-2, indexed  (currency derived from country)
  employment_type full_time | part_time | contractor
  hire_date
  salary          integer, annual, local currency (whole units — no float money)
  created_at, updated_at
  (country, job_title) composite index → "job title within country" insight

salary_changes            (append-only audit trail)
  id, employee_id FK (cascade delete), previous_salary (nullable for first record),
  new_salary, effective_date, reason, created_at
```

Why currency is derived from country rather than stored per employee: it removes a whole class of
inconsistent rows (an Indian employee paid in EUR by typo). If ACME ever pays someone in a currency
other than their country's, a `currency` column can be added and backfilled from the country.

FX: `domain/currency.py` holds a fixed, dated rate table (local → USD). Conversion is applied at
read time for insights, so updating the rate table instantly re-bases every report.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/employees` | `q`, `country`, `department`, `job_title`, `sort`, `order`, `page`, `page_size` |
| POST | `/api/employees` | create (writes initial salary_changes row) |
| GET | `/api/employees/{id}` | detail |
| PATCH | `/api/employees/{id}` | partial update; salary change ⇒ history row (`salary_change_reason`, `effective_date`) |
| DELETE | `/api/employees/{id}` | delete |
| GET | `/api/employees/{id}/salary-history` | newest first |
| GET | `/api/meta` | countries (+currency), departments, job titles, employment types — drives filters/forms |
| GET | `/api/insights/summary` | headcount, payroll USD, median/mean USD; optional `country` |
| GET | `/api/insights/by-country` | per country: headcount, local + USD stats |
| GET | `/api/insights/by-department` | optional `country` |
| GET | `/api/insights/by-job-title` | required `country`: min/median/max/avg in local currency |
| GET | `/api/insights/distribution` | USD salary histogram, optional `country`/`department` |

## Insights computation

SQLite has no `percentile_cont`, and we need medians. Options considered:

1. DB-specific SQL (Postgres `percentile_cont`) — fast, but two code paths and SQLite tests no longer
   cover prod behaviour.
2. **Select `(group_key, salary, country)` rows, aggregate in Python** — one code path, trivially
   testable pure functions. 10k rows ≈ 300 KB, aggregates in single-digit ms.
3. Pre-computed materialised aggregates — premature at 10k rows.

Chosen: **(2)**. Revisit at ~1M rows (switch to DB percentiles or materialised views behind the same
service interface).

## Seeding

`python -m app.seed --count 10000 --seed 42`: deterministic (`random.Random(seed)`), bulk insert via
`session.execute(insert(...), rows)` in one transaction (~1 s). Salaries are generated from a
job-level base (USD) × country cost-of-labour factor × noise, then converted to local currency and
rounded — so the insights dashboard shows realistic, explainable patterns.

## Testing strategy

- `domain/` unit tests: statistics (median even/odd, empty), currency conversion, rounding.
- service tests against in-memory SQLite: salary history is written on create/update, uniqueness, filters.
- API tests with FastAPI `TestClient`: status codes, validation errors, pagination contract.
- Seed tests: determinism (same seed ⇒ same data), count, all salaries positive & countries valid.
- Frontend: Vitest + Testing Library for formatting helpers and key components.
