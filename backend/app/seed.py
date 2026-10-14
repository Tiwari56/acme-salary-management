"""Deterministic seed data: ``uv run python -m app.seed --count 10000 --seed 42 [--reset]``.

Salaries are generated as: job base (USD) x country labour-cost factor x per-person noise, then
converted to local currency and rounded to the nearest 100. That gives the dashboard realistic,
explainable patterns (e.g. Staff Engineers out-earn Support Specialists everywhere; India and
Brazil have lower USD-equivalent pay) instead of uniform noise.
"""

import argparse
import random
import time
from dataclasses import dataclass, field
from datetime import date, timedelta

from sqlalchemy import func, insert, select, text
from sqlalchemy.orm import Session

from app.config import load_settings
from app.db import Base, Database
from app.domain.currency import from_usd
from app.domain.reference import JOB_CATALOG, currency_for
from app.models import Employee, SalaryChange
from app.services.employees import INITIAL_SALARY_REASON, employee_code_for

COUNTRY_WEIGHTS = {"US": 30, "IN": 25, "GB": 12, "DE": 10, "CA": 8, "BR": 6, "AU": 5, "SG": 4}
LABOUR_FACTOR = {
    "US": 1.00, "GB": 0.78, "DE": 0.82, "CA": 0.80, "AU": 0.84, "SG": 0.76, "IN": 0.28, "BR": 0.32,
}  # fmt: skip
DEPARTMENT_WEIGHTS = {
    "Engineering": 35, "Sales": 15, "Customer Support": 15, "Operations": 8, "Product": 8,
    "Marketing": 7, "Finance": 6, "Human Resources": 6,
}  # fmt: skip
BASE_SALARY_USD = {
    "Software Engineer": 120_000, "Senior Software Engineer": 160_000, "Staff Engineer": 210_000,
    "Engineering Manager": 200_000, "QA Engineer": 95_000,
    "Product Manager": 140_000, "Senior Product Manager": 175_000, "Product Designer": 120_000,
    "Sales Development Representative": 65_000, "Account Executive": 110_000,
    "Sales Manager": 150_000,
    "Marketing Specialist": 75_000, "Marketing Manager": 125_000,
    "Accountant": 75_000, "Financial Analyst": 90_000, "Finance Manager": 140_000,
    "HR Generalist": 70_000, "Recruiter": 80_000, "HR Manager": 120_000,
    "Operations Analyst": 75_000, "Operations Manager": 120_000,
    "Support Specialist": 55_000, "Support Team Lead": 75_000,
}  # fmt: skip
EMPLOYMENT_WEIGHTS = {"full_time": 88, "part_time": 5, "contractor": 7}
PART_TIME_FACTOR = 0.6

FIRST_NAMES = {
    "US": ["James", "Mary", "Michael", "Jennifer", "David", "Linda", "Chris", "Sarah", "Daniel",
           "Emily", "Matthew", "Ashley", "Andrew", "Jessica", "Joshua", "Taylor", "Ryan", "Megan"],
    "GB": ["Oliver", "Amelia", "George", "Isla", "Harry", "Ava", "Jack", "Emily", "Charlie",
           "Sophie", "Thomas", "Grace", "Oscar", "Lily", "William", "Freya"],
    "DE": ["Lukas", "Anna", "Leon", "Lena", "Finn", "Hannah", "Jonas", "Mia", "Paul", "Lea",
           "Felix", "Laura", "Maximilian", "Sophie", "Elias", "Marie"],
    "IN": ["Aarav", "Priya", "Vivaan", "Ananya", "Aditya", "Diya", "Arjun", "Isha", "Rohan",
           "Kavya", "Siddharth", "Neha", "Rahul", "Pooja", "Karan", "Sneha", "Vikram", "Aditi"],
    "CA": ["Liam", "Olivia", "Noah", "Emma", "Ethan", "Charlotte", "Lucas", "Chloe", "Benjamin",
           "Zoe", "Logan", "Madison", "Nathan", "Avery"],
    "AU": ["Jack", "Charlotte", "William", "Olivia", "Oliver", "Mia", "Thomas", "Isla", "Lachlan",
           "Ruby", "Cooper", "Matilda", "Riley", "Chloe"],
    "SG": ["Wei Ling", "Jun Jie", "Hui Min", "Zhi Hao", "Xin Yi", "Kai Xuan", "Mei Ling", "Jia Hui",
           "Arun", "Siti", "Farhan", "Nurul", "Ethan", "Chloe"],
    "BR": ["Miguel", "Alice", "Arthur", "Sophia", "Heitor", "Helena", "Bernardo", "Valentina",
           "Theo", "Laura", "Davi", "Isabella", "Gabriel", "Manuela"],
}  # fmt: skip
LAST_NAMES = {
    "US": ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson",
           "Anderson", "Thomas", "Moore", "Martin", "Lee", "Thompson", "White", "Harris", "Clark"],
    "GB": ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Evans", "Thomas", "Roberts",
           "Walker", "Wright", "Hughes", "Green", "Hall", "Wood", "Clarke"],
    "DE": ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
           "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Neumann", "Braun"],
    "IN": ["Sharma", "Verma", "Gupta", "Patel", "Iyer", "Reddy", "Nair", "Singh", "Kumar", "Das",
           "Mehta", "Joshi", "Rao", "Banerjee", "Pillai", "Chopra", "Desai", "Kulkarni"],
    "CA": ["Tremblay", "Roy", "Gagnon", "Martin", "Wilson", "MacDonald", "Taylor", "Campbell",
           "Anderson", "Leblanc", "Thompson", "Côté", "Morin", "Bouchard"],
    "AU": ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Nguyen", "Johnson",
           "Martin", "White", "Anderson", "Walker", "Thompson", "Kelly"],
    "SG": ["Tan", "Lim", "Lee", "Ng", "Ong", "Wong", "Goh", "Chua", "Chan", "Koh", "Teo",
           "Kumar", "Rahman", "Abdullah"],
    "BR": ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
           "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"],
}  # fmt: skip

RAISE_REASONS = ("Annual review", "Promotion", "Market adjustment", "Retention adjustment")
HIRE_START = date(2012, 1, 1)
HIRE_END = date(2026, 6, 30)


@dataclass
class SeedData:
    employees: list[dict] = field(default_factory=list)
    salary_changes: list[dict] = field(default_factory=list)


def _pick(rng: random.Random, weights: dict[str, int]) -> str:
    return rng.choices(list(weights), weights=list(weights.values()))[0]


def _pick_title(rng: random.Random, department: str) -> str:
    titles = JOB_CATALOG[department]
    # Earlier titles in the catalog are more junior/common: weight n, n-1, ..., 1
    return rng.choices(titles, weights=range(len(titles) + 1, 1, -1))[0]


def _ascii_slug(value: str) -> str:
    table = str.maketrans({"ü": "u", "ö": "o", "ä": "a", "ô": "o", "é": "e", " ": ""})
    return value.lower().translate(table)


def _round_to(value: int, step: int = 100) -> int:
    return max(step, int(round(value / step)) * step)


def generate(count: int, seed: int) -> SeedData:
    """Pure, deterministic generator: same (count, seed) => identical output."""
    rng = random.Random(seed)
    data = SeedData()
    span_days = (HIRE_END - HIRE_START).days
    for emp_id in range(1, count + 1):
        country = _pick(rng, COUNTRY_WEIGHTS)
        department = _pick(rng, DEPARTMENT_WEIGHTS)
        title = _pick_title(rng, department)
        employment_type = _pick(rng, EMPLOYMENT_WEIGHTS)
        first = rng.choice(FIRST_NAMES[country])
        last = rng.choice(LAST_NAMES[country])
        hire_date = HIRE_START + timedelta(days=rng.randrange(span_days))

        usd = BASE_SALARY_USD[title] * LABOUR_FACTOR[country] * rng.lognormvariate(0, 0.12)
        if employment_type == "part_time":
            usd *= PART_TIME_FACTOR
        salary = _round_to(from_usd(int(usd), currency_for(country)))

        data.employees.append(
            {
                "id": emp_id,
                "employee_code": employee_code_for(emp_id),
                "first_name": first,
                "last_name": last,
                "email": f"{_ascii_slug(first)}.{_ascii_slug(last)}.{emp_id}@acme.example",
                "job_title": title,
                "department": department,
                "country": country,
                "employment_type": employment_type,
                "hire_date": hire_date,
                "salary": salary,
            }
        )
        data.salary_changes.extend(_history(rng, emp_id, hire_date, salary))
    return data


def _history(rng: random.Random, emp_id: int, hire_date: date, current: int) -> list[dict]:
    """Walk backwards from the current salary to build 0-3 plausible raises after hire."""
    years = (HIRE_END - hire_date).days // 365
    n_raises = min(years, rng.choice((0, 1, 1, 2, 2, 3)))
    raises = []
    salary = current
    for i in range(n_raises):
        pct = rng.uniform(0.03, 0.15)
        previous = _round_to(int(salary / (1 + pct)))
        effective = HIRE_END - timedelta(days=365 * i + rng.randrange(0, 200))
        raises.append((previous, salary, max(effective, hire_date + timedelta(days=1))))
        salary = previous
    changes = [
        {
            "employee_id": emp_id,
            "previous_salary": None,
            "new_salary": salary,
            "effective_date": hire_date,
            "reason": INITIAL_SALARY_REASON,
        }
    ]
    for previous, new, effective in reversed(raises):
        changes.append(
            {
                "employee_id": emp_id,
                "previous_salary": previous,
                "new_salary": new,
                "effective_date": effective,
                "reason": rng.choice(RAISE_REASONS),
            }
        )
    return changes


def load(session: Session, data: SeedData, batch_size: int = 1_000) -> None:
    # One multi-row INSERT ... VALUES per batch, not executemany: against a remote database
    # (e.g. Neon at ~600 ms RTT) per-row round trips turned a 1 s seed into hours.
    # 1,000 rows x 11 columns stays well under Postgres' and SQLite's bind-parameter limits.
    for model, rows in ((Employee, data.employees), (SalaryChange, data.salary_changes)):
        for start in range(0, len(rows), batch_size):
            session.execute(insert(model).values(rows[start : start + batch_size]))
    if session.bind.dialect.name == "postgresql":
        # Explicit ids were inserted; move the sequence past them.
        session.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('employees', 'id'), "
                "(SELECT MAX(id) FROM employees))"
            )
        )
    session.commit()


def seed_if_empty(db: Database, count: int = 10_000, seed: int = 42) -> bool:
    with db.session_factory() as session:
        if session.scalar(select(func.count()).select_from(Employee)):
            return False
        load(session, generate(count, seed))
        return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--reset", action="store_true", help="drop and recreate all tables first")
    args = parser.parse_args()

    db = Database(load_settings().database_url)
    if args.reset:
        Base.metadata.drop_all(db.engine)
    db.create_all()
    started = time.perf_counter()
    if not seed_if_empty(db, count=args.count, seed=args.seed):
        print("Database already has employees; use --reset to reseed.")
        return
    print(f"Seeded {args.count} employees in {time.perf_counter() - started:.2f}s")


if __name__ == "__main__":
    main()
