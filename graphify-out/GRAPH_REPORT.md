# Graph Report - INTVIEW-assesments  (2026-10-13)

## Corpus Check
- Corpus is ~15,480 words - fits in a single context window. You may not need a graph.

## Summary
- 589 nodes · 1245 edges · 28 communities (20 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.91)
- Token cost: 87,430 input · 0 output

## Community Hubs (Navigation)
- React UI and API Hooks
- Employee CRUD and Audit
- Config, DB and Startup
- Insights API and Schemas
- Docs, Requirements and CI
- Job Catalog and Employee Model
- Salary Statistics
- Currency Conversion
- Employee API Tests
- TS App Config
- Frontend Package Manifest
- Frontend Dev Dependencies
- TS Node Config
- Mantine Dependencies
- Vercel Deployment Config
- Employees Page Tests
- App Entry and Providers
- npm Scripts
- Lint Rules
- Test DOM Stubs
- Vite Build Config
- Favicon Asset
- TS Project References
- Python Package Manifest

## God Nodes (most connected - your core abstractions)
1. `Employee` - 21 edges
2. `compilerOptions` - 18 edges
3. `generate()` - 17 edges
4. `Database` - 16 edges
5. `EmployeesPage()` - 15 edges
6. `compilerOptions` - 15 edges
7. `seed_if_empty()` - 13 edges
8. `to_usd()` - 12 edges
9. `summarize()` - 12 edges
10. `group_summaries()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Repository Layout (domain/services/routers, frontend features)` --semantically_similar_to--> `Backend Layering (routers -> services -> models -> domain)`  [INFERRED] [semantically similar]
  README.md → docs/DESIGN.md
- `Python 3.12 Pin to Match Vercel` --conceptually_related_to--> `Vercel Deployment (single project, api/index.py)`  [INFERRED]
  docs/AI_USAGE.md → README.md
- `NullPool for Serverless Postgres (Neon pgbouncer)` --rationale_for--> `Vercel Deployment (single project, api/index.py)`  [INFERRED]
  docs/PERFORMANCE.md → README.md
- `Frontend HTML Shell (root div, /src/main.tsx)` --implements--> `Architecture: React SPA + FastAPI serverless + Postgres/SQLite`  [INFERRED]
  frontend/index.html → docs/DESIGN.md
- `Pinned Python Dependencies (FastAPI, SQLAlchemy, psycopg, pydantic)` --implements--> `Architecture: React SPA + FastAPI serverless + Postgres/SQLite`  [INFERRED]
  requirements.txt → docs/DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Serverless Deployment Adaptations** — readme_vercel_deployment, docs_design_lazy_db_init, docs_performance_nullpool_serverless, readme_demo_mode_auto_seed, docs_ai_usage_python_version_pin [INFERRED 0.85]
- **Insights Computation and Scaling Path** — docs_design_insights_python_aggregation, docs_performance_benchmarks, docs_ai_usage_ai_corrections, docs_requirements_pay_insights_dashboard [INFERRED 0.85]
- **Currency Handling Design** — docs_design_currency_derived_from_country, docs_design_fixed_fx_rate_table, docs_requirements_local_currency_usd_view, docs_performance_usd_sort_in_sql, docs_requirements_integer_money [INFERRED 0.85]

## Communities (28 total, 8 thin omitted)

### Community 0 - "React UI and API Hooks"
Cohesion: 0.06
Nodes (78): ApiError, errorMessage(), request(), toQueryString(), insight(), keys, useByCountry(), useByDepartment() (+70 more)

### Community 1 - "Employee CRUD and Audit"
Cohesion: 0.07
Nodes (28): SalaryChange, create_employee(), delete_employee(), get_employee(), list_employees(), salary_history(), update_employee(), EmployeeCreate (+20 more)

### Community 2 - "Config, DB and Startup"
Cohesion: 0.07
Nodes (20): load_settings(), normalize_database_url(), Settings, Base, Database, make_engine(), get_session(), get_today() (+12 more)

### Community 3 - "Insights API and Schemas"
Cohesion: 0.09
Nodes (32): currency_for(), by_country(), by_department(), by_job_title(), _country(), distribution(), _required_country(), summary() (+24 more)

### Community 4 - "Docs, Requirements and CI"
Cohesion: 0.06
Nodes (30): CI Backend Job (uv, ruff, pytest --cov), CI Workflow, CI Frontend Job (npm ci, oxlint, typecheck, test, build), AI Output Corrections Caught by Verification, AI-assisted Workflow with Claude Code, Future Work (auth, Excel import/export, SQL aggregation, Playwright, audit log), Python 3.12 Pin to Match Vercel, Tabler Icons Barrel Shim Fix (903s -> 2s tests) (+22 more)

### Community 5 - "Job Catalog and Employee Model"
Cohesion: 0.12
Nodes (19): Country, is_valid_job(), Employee, _ascii_slug(), generate(), _history(), load(), _pick() (+11 more)

### Community 6 - "Salary Statistics"
Cohesion: 0.12
Nodes (11): Bucket, group_summaries(), histogram(), median(), _round(), SalaryStats, summarize(), test_group_summaries_groups_by_key() (+3 more)

### Community 7 - "Currency Conversion"
Cohesion: 0.10
Nodes (10): from_usd(), _rate(), to_usd(), UnknownCurrencyError, test_converts_and_rounds_half_up(), test_currency_for_country(), test_round_trip_is_close(), test_unknown_currency_raises() (+2 more)

### Community 8 - "Employee API Tests"
Cohesion: 0.08
Nodes (5): employee_payload(), TestCreate, TestList, TestReadAndDelete, TestUpdate

### Community 9 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 10 - "Frontend Package Manifest"
Cohesion: 0.12
Nodes (16): name, private, type, version, jsdom, @mantine/form, oxlint, postcss (+8 more)

### Community 11 - "Frontend Dev Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, oxlint, postcss, postcss-preset-mantine, postcss-simple-vars, @testing-library/dom, @testing-library/jest-dom (+9 more)

### Community 12 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - "Mantine Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @mantine/charts, @mantine/core, @mantine/form, @mantine/hooks, @mantine/modals, @mantine/notifications, react (+5 more)

### Community 14 - "Vercel Deployment Config"
Cohesion: 0.18
Nodes (10): excludeFiles, includeFiles, maxDuration, buildCommand, functions, api/index.py, installCommand, outputDirectory (+2 more)

### Community 15 - "Employees Page Tests"
Cohesion: 0.22
Nodes (7): meta, priya, renderWithProviders(), @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, vitest

### Community 16 - "App Entry and Providers"
Cohesion: 0.24
Nodes (7): queryClient, theme, @mantine/charts, @mantine/modals, react-dom, react-router-dom, @tanstack/react-query

### Community 17 - "npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 18 - "Lint Rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 21 - "Favicon Asset"
Cohesion: 0.67
Nodes (3): Favicon (Vite Lightning Bolt Logo), Purple/Blue Blurred Gradient Palette (#863bff, #7e14ff, #47bfff, #ede6ff), Vite Brand Identity

## Knowledge Gaps
- **20 isolated node(s):** `salary-api`, `recharts`, `@testing-library/dom`, `@types/node`, `@types/react` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Employee` connect `Job Catalog and Employee Model` to `Employee CRUD and Audit`, `Config, DB and Startup`, `Insights API and Schemas`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `Employee` (e.g. with `load()` and `seed_if_empty()`) actually correct?**
  _`Employee` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `salary-api`, `recharts`, `@testing-library/dom` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React UI and API Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.0629076372817168 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `Frontend Dev Dependencies` to `Frontend Package Manifest`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Database` (e.g. with `seed_if_empty()` and `client()`) actually correct?**
  _`Database` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Employee CRUD and Audit` be split into smaller, more focused modules?**
  _Cohesion score 0.06612021857923497 - nodes in this community are weakly interconnected._