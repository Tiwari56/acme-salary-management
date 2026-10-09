from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings, load_settings
from app.db import Database
from app.routers import employees, insights, meta
from app.services.errors import BusinessRuleError, ConflictError, NotFoundError, ServiceError

_STATUS = {NotFoundError: 404, ConflictError: 409, BusinessRuleError: 422}


def create_app(settings: Settings | None = None, db: Database | None = None) -> FastAPI:
    settings = settings or load_settings()
    db = db or Database(settings.database_url)

    if settings.auto_seed:
        from app.seed import seed_if_empty

        db.init_hooks.append(seed_if_empty)

    app = FastAPI(title="ACME Salary Management API", version="1.0.0")
    app.state.db = db

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ServiceError)
    async def service_error_handler(_: Request, exc: ServiceError) -> JSONResponse:
        return JSONResponse(status_code=_STATUS.get(type(exc), 400), content={"detail": str(exc)})

    app.include_router(employees.router)
    app.include_router(insights.router)
    app.include_router(meta.router)
    return app


app = create_app()
