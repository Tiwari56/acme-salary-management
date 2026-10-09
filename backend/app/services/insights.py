"""Pay insights. One query fetches the minimal columns; aggregation happens in pure functions.

At 10k employees this is a few hundred KB and single-digit milliseconds, and it keeps a single
code path for SQLite (dev/tests) and Postgres (prod). See docs/DESIGN.md for the trade-off.
"""

from typing import NamedTuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.currency import RATES_AS_OF, to_usd
from app.domain.reference import COUNTRIES, currency_for
from app.domain.stats import SalaryStats, group_summaries, histogram, summarize
from app.models import Employee
from app.schemas import (
    CountryInsight,
    DepartmentInsight,
    Distribution,
    HistogramBucket,
    JobTitleInsight,
    JobTitleInsights,
    Stats,
    Summary,
)


class PayRow(NamedTuple):
    country: str
    department: str
    job_title: str
    salary: int
    salary_usd: int


def _rows(
    session: Session, *, country: str | None = None, department: str | None = None
) -> list[PayRow]:
    stmt = select(Employee.country, Employee.department, Employee.job_title, Employee.salary)
    if country:
        stmt = stmt.where(Employee.country == country)
    if department:
        stmt = stmt.where(Employee.department == department)
    return [PayRow(c, d, j, s, to_usd(s, currency_for(c))) for c, d, j, s in session.execute(stmt)]


def _stats(s: SalaryStats) -> Stats:
    return Stats(**s.__dict__)


def summary(session: Session, *, country: str | None = None) -> Summary:
    rows = _rows(session, country=country)
    s = summarize(r.salary_usd for r in rows)
    return Summary(
        headcount=s.count,
        payroll_usd=s.total,
        median_usd=s.median,
        mean_usd=s.mean,
        countries=len({r.country for r in rows}),
        rates_as_of=RATES_AS_OF,
    )


def by_country(session: Session) -> list[CountryInsight]:
    rows = _rows(session)
    local = group_summaries(rows, key=lambda r: r.country, value=lambda r: r.salary)
    usd = group_summaries(rows, key=lambda r: r.country, value=lambda r: r.salary_usd)
    items = [
        CountryInsight(
            country=code,
            country_name=COUNTRIES[code].name,
            currency=COUNTRIES[code].currency,
            local=_stats(local[code]),
            usd=_stats(usd[code]),
        )
        for code in local
    ]
    return sorted(items, key=lambda i: i.usd.total, reverse=True)


def by_department(session: Session, *, country: str | None = None) -> list[DepartmentInsight]:
    rows = _rows(session, country=country)
    usd = group_summaries(rows, key=lambda r: r.department, value=lambda r: r.salary_usd)
    items = [DepartmentInsight(department=d, usd=_stats(s)) for d, s in usd.items()]
    return sorted(items, key=lambda i: i.usd.median, reverse=True)


def by_job_title(session: Session, *, country: str) -> JobTitleInsights:
    """Stats in local currency: within one country, local currency is what HR reasons in."""
    rows = _rows(session, country=country)
    dept_of = {r.job_title: r.department for r in rows}
    local = group_summaries(rows, key=lambda r: r.job_title, value=lambda r: r.salary)
    items = [
        JobTitleInsight(job_title=t, department=dept_of[t], local=_stats(s))
        for t, s in local.items()
    ]
    return JobTitleInsights(
        country=country,
        currency=currency_for(country),
        items=sorted(items, key=lambda i: i.local.median, reverse=True),
    )


def distribution(
    session: Session,
    *,
    country: str | None = None,
    department: str | None = None,
    bucket_size: int = 10_000,
) -> Distribution:
    rows = _rows(session, country=country, department=department)
    buckets = histogram((r.salary_usd for r in rows), bucket_size=bucket_size, max_buckets=30)
    return Distribution(
        bucket_size=bucket_size,
        buckets=[HistogramBucket(**b.__dict__) for b in buckets],
    )
