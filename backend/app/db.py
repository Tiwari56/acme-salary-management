import threading
from collections.abc import Callable, Iterator

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
        self.init_hooks: list[Callable[[Database], object]] = []
        self._ready = False
        self._lock = threading.Lock()

    def ensure_ready(self) -> None:
        """Create tables and run init hooks (e.g. auto-seed) once, on first use.

        Lazy rather than at import or in an ASGI lifespan: serverless runtimes don't reliably run
        lifespan events, and importing the app shouldn't touch the database.
        """
        if self._ready:
            return
        with self._lock:
            if self._ready:
                return
            self.create_all()
            for hook in self.init_hooks:
                hook(self)
            self._ready = True

    def create_all(self) -> None:
        from app import models  # noqa: F401  (register tables)

        Base.metadata.create_all(self.engine)

    def session(self) -> Iterator[Session]:
        self.ensure_ready()
        with self.session_factory() as session:
            yield session
