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
