# Requirements — ACME Salary Management

**Persona:** HR Manager at ACME (≈10,000 employees across multiple countries).
**Today:** salary data lives in Excel workbooks — tedious to update, error-prone, and painful to answer
"how do we pay people?" questions (every answer is a pivot table someone has to rebuild).

## Goal

Give the HR Manager a single web application where they can **(1) maintain employee salary records** and
**(2) get trustworthy answers about how the org pays people** in seconds, without spreadsheets.

Success looks like:
- Finding and updating any employee's salary takes < 30 seconds.
- Common pay questions ("What's the median salary for engineers in India?", "Which country costs us the
  most?", "How wide is the pay range for a given role?") are answered on one screen, without exports.
- Every salary change leaves a trail (who-changed-what is the #1 thing Excel loses).

## In scope (v1)

| # | Feature | Why it matters to the HR Manager |
|---|---------|----------------------------------|
| 1 | **Employee directory** — server-side search (name / email / employee code), filter by country, department, job title; sort; pagination | Replaces scrolling a 10k-row sheet. Must stay fast at 10k+. |
| 2 | **Create / edit / delete employee** with validation (required fields, positive salary, unique email, valid country) | Core data maintenance; validation stops the "typo in a cell" class of errors. |
| 3 | **Salary in local currency**, with a USD-normalised view for cross-country comparison | People are paid in local currency; comparisons only make sense in one currency. |
| 4 | **Salary history** — every salary change is recorded with effective date and reason | Audit trail; answers "when did this person last get a raise?" |
| 5 | **Pay insights dashboard** — headcount, total annual payroll (USD), median/average; breakdowns by country and department; min / median / max / avg by job title within a country; salary distribution | These are the questions HR is actually asked by leadership. Median is shown alongside mean because pay is skewed. |
| 6 | **Seed script** generating 10,000 realistic, deterministic employees | Required; deterministic so tests and demos are reproducible. |

## Deliberately out of scope (and why)

| Left out | Reasoning |
|----------|-----------|
| **Authentication / RBAC** | Single persona (HR Manager). Auth is important for production but adds no signal to this exercise; the architecture leaves a clear seam (FastAPI dependency) to add it. Called out as the first thing to add before real use. |
| **Payroll processing** (tax, deductions, payslips, bank transfers) | That is a payroll *engine* — a different product with country-specific legal rules. This tool manages *compensation data*. |
| **Live FX rates** | Conversion uses a fixed, dated reference rate table. Live rates make numbers shift day-to-day, which confuses comparisons; HR typically uses a fixed budget rate. |
| **Bulk Excel import/export** | Valuable for migration, but the brief prioritises managing data in-app. Seeding covers the "initial load" need. First candidate for v2. |
| **Bonus, equity, benefits, total-comp** | Base salary is the core question. Data model can grow `compensation_components` later. |
| **Gender / demographic pay-equity analysis** | Highly valuable, but needs sensitive data with consent, legal review and careful statistical treatment (controlled vs. uncontrolled gap). Doing it badly is worse than not doing it. |
| **Approval workflows, multi-user collaboration, notifications** | Single-user persona for v1. |
| **Org chart / manager hierarchy** | Not needed to answer pay questions. |

## Non-functional requirements

- **Performance:** list/search/filter responses < 200 ms at 10k rows (indexed columns, server-side pagination);
  insights computed in a single query + in-memory aggregation (10k rows ≈ milliseconds).
- **Correctness:** salaries stored as integers (whole currency units, annual) — no floating-point money.
- **Quality:** fast, deterministic unit + API tests (in-memory SQLite, seeded RNG).
- **Deployability:** one Vercel project serves UI + API; Postgres in production, SQLite locally.

## Key assumptions

- Salaries are **annual base salary** in the employee's **country currency**.
- One country ⇒ one currency (true for the countries in the seed set).
- Employee code is system-generated and immutable; email is unique.
