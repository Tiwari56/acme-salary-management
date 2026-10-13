# How AI was used

**Tool:** Claude Code (Claude Opus 5.5) as an agentic pair-programmer in the terminal / VS Code.
It wrote most of the code; the human set direction, made the product and stack decisions, and
reviewed. Everything was checked by running it (tests, lint, type-check, real HTTP calls,
screenshots) rather than taken on trust.

## Working agreement

1. **Requirements before code.** The first commit is `docs/REQUIREMENTS.md`, the second is
   `docs/DESIGN.md`. Code followed the design, and where measurement contradicted the design, the
   design doc was corrected (see below).
2. **Human decides; AI proposes.** Stack (Python/FastAPI, for the role) and hosting (Vercel) were
   asked of and decided by the human. The AI raised the consequence (Vercel's filesystem is
   ephemeral, so production uses Postgres) instead of silently picking SQLite and shipping something
   that loses data.
3. **Layered so it's checkable.** Pure `domain/` functions (money, stats) first, with tests, then
   services, then HTTP. Each layer was committed once its tests passed.
4. **Verify by running.** Every step ended with a command: `pytest`, `ruff`, `tsc`, `oxlint`,
   `vitest`, `vite build`, curl against the real Vercel entrypoint, headless-Chrome screenshots.

## Prompts

The initial prompt was the assessment brief itself, pasted verbatim. Follow-up steering, paraphrased:

- *Which backend stack / where to deploy?* → "Python (FastAPI)", "Vercel".
- Standing instructions to the agent: write requirements first; incremental commits per
  meaningful step; money as integers, never floats; tests must be fast and deterministic (in-memory
  DB, seeded RNG, injected clock); keep the HR Manager persona in mind for every UI decision.

## Where AI output was wrong or needed correcting

These are the useful part: what verification caught.

| Issue | How it was caught | Fix |
|-------|-------------------|-----|
| Frontend test run took **903 s**. The `@tabler/icons-react` barrel re-exports 6,239 modules, each transformed by Vite | Ran the suite and read the timing breakdown ("transform 100%") instead of just checking pass/fail | Alias the package to a shim that re-exports only the 13 icons used → **2 s** |
| Design doc claimed in-Python aggregation was fine "up to ~1M rows" | Benchmarked at 100k: ~300 ms, linear | Corrected to ~50–100k and documented the migration path ([PERFORMANCE.md](PERFORMANCE.md)) |
| DB init + auto-seed used FastAPI's lifespan hook, which serverless runtimes may never fire. Importing the app also created a local `salary.db` as a side effect | Code review before writing the Vercel entrypoint | Lazy, thread-safe, once-per-process init on first DB use, with a test |
| A sortable-header component was defined inside the page's render function (remounts on each render) | `oxlint` `react(static-components)` warning | Hoisted to module scope; added `aria-sort` while there |
| Histogram drew vertical gridlines (Mantine's `gridAxis` naming is the opposite of the intuitive reading) | Looked at a screenshot of the real page | `gridAxis="x"` → horizontal lines to read counts against |
| Validators were initially written as `classmethod(lambda …)`. It worked, but was unreadable | Self-review | Plain `@field_validator` methods |
| Compact USD labels rendered `$10K` locally but `$10.0K` on Node 22: ICU versions differ when `minimumFractionDigits` is left implicit (browsers vary the same way) | First GitHub Actions run failed; reproduced locally on Node 22 | Set `minimumFractionDigits: 0` explicitly |
| uv silently picked Python 3.14 while Vercel runs 3.12 | Noticed the venv path | Pinned `.python-version` = 3.12 and `requires-python <3.13` |

## Independent architecture check

After the build, [graphify](https://github.com/Graphify-Labs/graphify) built a knowledge graph of the
repo ([KNOWLEDGE_GRAPH.md](KNOWLEDGE_GRAPH.md)). Clustering, done without any knowledge of the
intended design, found the same layers as DESIGN.md: the three pure `domain/` modules as tight
separate clusters, employees and insights each as their own service + router cluster, and no import
cycles. That gives some evidence beyond the AI's own say-so that the code matches the stated
architecture. The graph also surfaced its own limits (paths via shared stdlib imports), which are
written up there rather than glossed over.

## Decisions deliberately kept human-owned

- **Scope cuts** in REQUIREMENTS.md (no auth, no payroll engine, no pay-equity analysis) are
  product judgements about what a v1 should be. The AI drafted the reasoning; the call is the
  human's.
- **Fixed FX rates** over live rates: a product decision (stable reporting), not a technical one.
- **Constrained job-title catalog** over free text: trades flexibility for analysable data.

## What I'd do with more time

Authentication (the first thing to add before real use), Excel import/export for migration,
moving aggregation into SQL past ~100k employees, a Playwright end-to-end test of the
create → raise → insights flow, and an audit log of *who* changed a salary once there are users.
