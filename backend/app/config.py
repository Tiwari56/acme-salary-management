import os
from dataclasses import dataclass

DEFAULT_SQLITE_URL = "sqlite:///./salary.db"


def normalize_database_url(url: str) -> str:
    """Map provider-style Postgres URLs (Neon/Heroku/Vercel: ``postgres://``) onto the
    SQLAlchemy psycopg3 dialect. Other URLs pass through unchanged."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


@dataclass(frozen=True)
class Settings:
    database_url: str
    auto_seed: bool
    cors_origins: tuple[str, ...]


def load_settings() -> Settings:
    raw_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or DEFAULT_SQLITE_URL
    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return Settings(
        database_url=normalize_database_url(raw_url),
        auto_seed=os.getenv("AUTO_SEED", "").lower() in {"1", "true", "yes"},
        cors_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
    )
