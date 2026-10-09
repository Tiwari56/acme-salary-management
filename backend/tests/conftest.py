from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import Settings
from app.db import Database
from app.deps import get_today
from app.main import create_app

TODAY = date(2026, 3, 15)


@pytest.fixture
def db() -> Database:
    database = Database("sqlite://")  # fresh in-memory DB per test => isolated & fast
    database.create_all()
    return database


@pytest.fixture
def session(db: Database) -> Iterator[Session]:
    with db.session_factory() as s:
        yield s


@pytest.fixture
def client(db: Database) -> Iterator[TestClient]:
    settings = Settings(database_url="sqlite://", auto_seed=False, cors_origins=())
    app = create_app(settings, db=db)
    app.dependency_overrides[get_today] = lambda: TODAY
    with TestClient(app) as c:
        yield c


def employee_payload(**overrides) -> dict:
    payload = {
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.sharma@acme.example",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "IN",
        "employment_type": "full_time",
        "hire_date": "2022-04-01",
        "salary": 2_400_000,
    }
    return payload | overrides


@pytest.fixture
def make_employee(client: TestClient):
    counter = iter(range(1, 10_000))

    def _make(**overrides) -> dict:
        overrides.setdefault("email", f"person{next(counter)}@acme.example")
        response = client.post("/api/employees", json=employee_payload(**overrides))
        assert response.status_code == 201, response.text
        return response.json()

    return _make
