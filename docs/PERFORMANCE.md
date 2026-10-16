# Performance

Measured locally (Apple Silicon, SQLite file DB, FastAPI TestClient, median of 7 runs).
Reproduce with the seed generator at a larger `--count`.

| Operation | 10k employees (target) | 100k employees (10× headroom check) |
|-----------|-----------------------:|------------------------------------:|
| Seed (bulk insert, incl. ~23k salary-history rows at 10k) | 0.57 s | 6.6 s |
| List, page 1 (sorted by name) | 1.8 ms | 2.1 ms |
| List, last page | 1.9 ms | 4.7 ms |
| List filtered by country, sorted by USD salary | 2.6 ms | 13 ms |
| Free-text search (`q=sharma`) | 16 ms | 217 ms |
| Insights: summary | 19 ms | 255 ms |
| Insights: by country | 21 ms | 298 ms |
| Insights: by job title (one country) | 6 ms | 62 ms |
| Insights: distribution | 20 ms | 190 ms |

Through the full HTTP stack (uvicorn + Vite preview proxy), every endpoint answered in under 35 ms at
10k. Cold start on Vercel demo mode (create tables + seed 10k into `/tmp` SQLite) took ~0.6 s.

## What makes it fast at 10k

- **Server-side pagination, filtering and sorting.** The browser never holds more than 25 rows.
- **Indexes** on `country`, `department`, `job_title`, `(country, job_title)`, `(last_name, first_name)`,
  and unique indexes on `email` and `employee_code`.
- **Stable sort** (`ORDER BY <key>, id`) so pages never repeat or skip rows.
- **USD sort in SQL** through a `CASE country WHEN … THEN rate` expression, rather than
  sorting in Python.
- **Insights read 4 narrow columns** in one query and aggregate in pure Python (needed for medians,
  which SQLite lacks).
- **Bulk insert** for seeding (`executemany` in 2k batches, one transaction).
- **Frontend:** debounced search (250 ms), `keepPreviousData` so paging doesn't flash, React Query
  cache invalidated only on writes, chart library lazily loaded on the insights route, and icons
  imported per-module (the 6k-module icon barrel had made the test run take 15 minutes; it now
  takes 2 s).

## Where it stops scaling, and what to do next

Both slow paths are **linear scans** and grow ~10× per 10× rows:

1. **Insights aggregation in Python.** Fine at 10k (~20 ms); ~300 ms at 100k. Past roughly 50–100k
   employees, move aggregation into Postgres (`percentile_cont`, `GROUP BY`) behind the same service
   functions. The API contract and the tests on it stay unchanged. Caching insight responses
   (invalidated on write) would be a cheap intermediate step.
2. **`LIKE '%term%'` search** can't use a B-tree index. On Postgres, add a `pg_trgm` GIN index on
   name/email; beyond that, a search engine.

Neither is worth doing at the stated scale of 10,000 employees. Both are isolated in a single
service function, so the change is local.

## Production (Vercel + Neon)

Measured from the developer's machine: `/api/health` ~0.74 s and `/api/insights/summary` ~0.85 s end
to end. Most of that is network distance (a raw Postgres round trip from the same machine to Neon
was ~0.6 s), not server time.

Seeding the remote database first ran as `executemany`, which made one round trip per row: hours
at that latency. The loader now sends one multi-row `INSERT … VALUES` per 1,000 rows (~35 statements),
which seeds Neon in **63 s**. Locally on SQLite it went from 0.6 s to 1.9 s (building the larger
statements costs more), a deliberate trade.

## Serverless notes

- `NullPool` for Postgres: each function instance may be short-lived, so pooling is left to the
  provider's pooler (Neon pgbouncer), which avoids exhausting connections.
- DB initialisation is lazy and runs once per instance, so imports have no side effects and the
  app doesn't rely on ASGI lifespan support.
