from collections.abc import Iterator
from datetime import date

from fastapi import Request
from sqlalchemy.orm import Session


def get_session(request: Request) -> Iterator[Session]:
    yield from request.app.state.db.session()


def get_today() -> date:
    """Injectable clock so tests are deterministic."""
    return date.today()
