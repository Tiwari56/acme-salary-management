from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool, StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str) -> Engine:
    if url.startswith("sqlite"):
        kwargs: dict = {"connect_args": {"check_same_thread": False}}
        if ":memory:" in url or url == "sqlite://":
            kwargs["poolclass"] = StaticPool  # share one in-memory DB across connections
        return create_engine(url, **kwargs)
    # Serverless: each invocation may be a fresh process; let the provider's pooler
    # (e.g. Neon pgbouncer) do pooling rather than holding idle connections.
    return create_engine(url, poolclass=NullPool, pool_pre_ping=True)


class Database:
    def __init__(self, url: str):
        self.engine = make_engine(url)
        self.session_factory = sessionmaker(bind=self.engine, expire_on_commit=False)

    def create_all(self) -> None:
        from app import models  # noqa: F401  (register tables)

        Base.metadata.create_all(self.engine)

    def session(self) -> Iterator[Session]:
        with self.session_factory() as session:
            yield session
