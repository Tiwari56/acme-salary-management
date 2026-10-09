from fastapi import APIRouter

from app.domain.currency import RATES_AS_OF
from app.domain.reference import COUNTRIES, EMPLOYMENT_TYPES, JOB_CATALOG
from app.schemas import CountryMeta, Meta

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/meta", response_model=Meta)
def meta() -> Meta:
    return Meta(
        countries=[
            CountryMeta(code=c.code, name=c.name, currency=c.currency) for c in COUNTRIES.values()
        ],
        departments={d: list(titles) for d, titles in JOB_CATALOG.items()},
        employment_types=list(EMPLOYMENT_TYPES),
        rates_as_of=RATES_AS_OF,
    )


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
