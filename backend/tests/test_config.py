import pytest

from app.config import DEFAULT_SQLITE_URL, load_settings, normalize_database_url


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("postgres://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("postgresql://u:p@h/db?sslmode=require", "postgresql+psycopg://u:p@h/db?sslmode=require"),
        ("postgresql+psycopg://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("sqlite:///./x.db", "sqlite:///./x.db"),
    ],
)
def test_normalize_database_url(raw, expected):
    assert normalize_database_url(raw) == expected


def test_load_settings_defaults(monkeypatch):
    for var in ("DATABASE_URL", "POSTGRES_URL", "AUTO_SEED", "CORS_ORIGINS"):
        monkeypatch.delenv(var, raising=False)
    s = load_settings()
    assert s.database_url == DEFAULT_SQLITE_URL
    assert s.auto_seed is False


def test_load_settings_from_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://h/db")
    monkeypatch.setenv("AUTO_SEED", "true")
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example, https://b.example")
    s = load_settings()
    assert s.database_url == "postgresql+psycopg://h/db"
    assert s.auto_seed is True
    assert s.cors_origins == ("https://a.example", "https://b.example")


def test_auto_seed_runs_once_on_first_request():
    from fastapi.testclient import TestClient

    from app.config import Settings
    from app.db import Database
    from app.main import create_app

    db = Database("sqlite://")
    calls = []
    app = create_app(Settings("sqlite://", auto_seed=False, cors_origins=()), db=db)
    db.init_hooks.append(calls.append)
    with TestClient(app) as client:
        assert client.get("/api/employees").status_code == 200  # tables created lazily
        client.get("/api/employees")
    assert calls == [db]
