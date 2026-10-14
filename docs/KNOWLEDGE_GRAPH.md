# Codebase Knowledge Graph (graphify)

The repo includes a knowledge graph of its own code and docs, built with
[graphify](https://github.com/Graphify-Labs/graphify). It's a second way to review the architecture:
it checks from the outside whether the layering described in [DESIGN.md](DESIGN.md) actually shows up
in the code's structure.

| File | What it is |
|------|------------|
| [graphify-out/graph.html](../graphify-out/graph.html) | Interactive graph. Download and open in a browser; no server needed |
| [graphify-out/GRAPH_REPORT.md](../graphify-out/GRAPH_REPORT.md) | Audit report: core nodes, communities, surprising links, open questions |
| [graphify-out/graph.json](../graphify-out/graph.json) | Raw graph (nodes, edges, communities) for tooling or GraphRAG |

## How it was built

- **Code (60 files):** parsed structurally (AST) with no LLM: classes, functions, imports, calls.
  This gave 520 nodes and 1,264 edges.
- **Docs (8 files) and the favicon:** read by two LLM sub-agents, which extracted concepts and the
  links between requirements, design decisions and code. This gave 49 nodes and 62 edges, using about
  87k tokens.
- **Every edge is labelled** `EXTRACTED` (stated in the source), `INFERRED` (reasoned, with a
  confidence score), or `AMBIGUOUS`. One sub-agent flagged its own edge (*Python 3.12 pin → Vercel*)
  as wrongly marked EXTRACTED, and it was relabelled INFERRED before the build.

**Result:** 589 nodes, 1,245 edges, 28 communities, no import cycles.

## What the graph shows

**Core abstractions** (most-connected nodes) are the ones the design is built around:
`Employee` (21 edges), the seed `generate()`, `Database`, `EmployeesPage`, `seed_if_empty()`, and
the three pure domain functions `to_usd()`, `summarize()` and `group_summaries()`.

**The communities match the intended layers.** Clustering found these without being told about the
architecture:

| Community | Matches |
|-----------|---------|
| Employee CRUD and Audit | `services/employees.py` + `routers/employees.py` + service errors |
| Insights API and Schemas | `services/insights.py` + `routers/insights.py` |
| Config, DB and Startup | `config.py`, `db.py`, `deps.py`, `create_app` |
| Salary Statistics · Currency Conversion · Job Catalog | the three pure `domain/` modules, each its own cluster |
| React UI and API Hooks | `features/*`, `api/hooks.ts`, `api/client.ts`, `lib/format.ts` |
| Docs, Requirements and CI | requirements ↔ design ↔ performance concepts |

The `domain/` modules come out as tight, separate clusters (cohesion 0.10–0.12, compared with
0.06–0.07 for the HTTP and UI layers). That is what you'd expect if they really are pure functions
with few dependencies, which is why they hold most of the unit tests.

**Doc-to-code traceability.** Three group relationships (hyperedges) tie requirements to their
implementation:
- *Currency handling:* the "local currency + USD view" requirement, integer money, the fixed FX
  table, currency derived from country, and USD sorting done in SQL.
- *Insights scaling:* the dashboard requirement, aggregation in Python, the 10k/100k benchmarks,
  and the corrected scaling claim.
- *Serverless adaptations:* the Vercel deployment, lazy DB init, `NullPool`, demo-mode auto-seed,
  and the Python version pin.

## Known limitations

These are reported as-is, following graphify's honesty rules:
- **57 edges point at external packages** (`fastapi`, `sqlalchemy`, stdlib…) that have no node of
  their own. This is expected; it is not missing code.
- **76 edges were collapsed** where the same pair is joined by several relations (e.g. calls +
  references + uses). The undirected graph keeps one edge per pair.
- **Shortest paths can be misleading.** A path from `update_employee()` to `summarize()` goes
  through their shared `dataclasses` import, not through any real data flow. Read the graph as a
  map of structure, not of runtime behaviour.
- **Weakly connected config nodes** (tsconfig options, npm scripts) form small clusters of their
  own. That's noise from config files, not a design smell.
- The UI community's low cohesion (0.06) is flagged in the report as a possible candidate for
  splitting. With only two pages, that's not worth doing yet.

## Rebuild or query

```bash
uv tool install graphifyy         # once
graphify update .                 # re-extract changed code (no LLM needed)
graphify query "how is salary history written?"
graphify explain "Employee"
graphify path "<node_id_a>" "<node_id_b>" --undirected
```

Changes to docs need the full `/graphify` pipeline (run through Claude Code) so their semantic
extraction is refreshed. The cache in `graphify-out/cache/` is gitignored.
