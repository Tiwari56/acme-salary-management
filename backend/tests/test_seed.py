from sqlalchemy import func, select

from app.domain.reference import COUNTRIES, EMPLOYMENT_TYPES, is_valid_job
from app.models import Employee, SalaryChange
from app.seed import generate, load, seed_if_empty


def test_generation_is_deterministic():
    assert generate(200, seed=7) == generate(200, seed=7)
    assert generate(200, seed=7) != generate(200, seed=8)


def test_generated_employees_are_valid():
    data = generate(1_000, seed=1)
    assert len(data.employees) == 1_000
    emails = [e["email"] for e in data.employees]
    assert len(set(emails)) == len(emails)
    for e in data.employees:
        assert e["country"] in COUNTRIES
        assert is_valid_job(e["department"], e["job_title"])
        assert e["employment_type"] in EMPLOYMENT_TYPES
        assert e["salary"] > 0
        assert e["email"].isascii()


def test_history_is_consistent_with_current_salary():
    data = generate(500, seed=3)
    by_emp: dict[int, list[dict]] = {}
    for change in data.salary_changes:
        by_emp.setdefault(change["employee_id"], []).append(change)
    for emp in data.employees:
        changes = by_emp[emp["id"]]
        assert changes[0]["previous_salary"] is None
        assert changes[0]["effective_date"] == emp["hire_date"]
        assert changes[-1]["new_salary"] == emp["salary"]
        for prev, nxt in zip(changes, changes[1:], strict=False):
            assert nxt["previous_salary"] == prev["new_salary"]
            assert nxt["effective_date"] >= prev["effective_date"]


def test_load_and_seed_if_empty(db, session):
    load(session, generate(50, seed=1))
    assert session.scalar(select(func.count()).select_from(Employee)) == 50
    assert session.scalar(select(func.count()).select_from(SalaryChange)) >= 50
    assert seed_if_empty(db, count=10) is False  # already populated -> no-op


def test_seed_if_empty_populates_empty_db(db, session):
    assert seed_if_empty(db, count=25, seed=1) is True
    assert session.scalar(select(func.count()).select_from(Employee)) == 25


def test_seeded_ids_do_not_block_new_employees(client, db):
    seed_if_empty(db, count=5, seed=1)
    from tests.conftest import employee_payload

    response = client.post("/api/employees", json=employee_payload())
    assert response.status_code == 201
    assert response.json()["employee_code"] == "EMP000006"
