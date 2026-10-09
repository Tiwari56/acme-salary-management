from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import get_session
from app.domain.reference import COUNTRIES
from app.schemas import (
    CountryInsight,
    DepartmentInsight,
    Distribution,
    JobTitleInsights,
    Summary,
)
from app.services import insights as svc

router = APIRouter(prefix="/api/insights", tags=["insights"])

SessionDep = Annotated[Session, Depends(get_session)]


def _country(country: str | None = None) -> str | None:
    if country is None:
        return None
    code = country.upper()
    if code not in COUNTRIES:
        raise HTTPException(status_code=422, detail=f"unsupported country '{country}'")
    return code


def _required_country(country: str) -> str:
    return _country(country)  # type: ignore[return-value]


CountryDep = Annotated[str | None, Depends(_country)]


@router.get("/summary", response_model=Summary)
def summary(session: SessionDep, country: CountryDep) -> Summary:
    return svc.summary(session, country=country)


@router.get("/by-country", response_model=list[CountryInsight])
def by_country(session: SessionDep) -> list[CountryInsight]:
    return svc.by_country(session)


@router.get("/by-department", response_model=list[DepartmentInsight])
def by_department(session: SessionDep, country: CountryDep) -> list[DepartmentInsight]:
    return svc.by_department(session, country=country)


@router.get("/by-job-title", response_model=JobTitleInsights)
def by_job_title(
    session: SessionDep, country: Annotated[str, Depends(_required_country)]
) -> JobTitleInsights:
    return svc.by_job_title(session, country=country)


@router.get("/distribution", response_model=Distribution)
def distribution(
    session: SessionDep,
    country: CountryDep,
    department: str | None = None,
    bucket_size: Annotated[int, Query(ge=1_000, le=100_000)] = 10_000,
) -> Distribution:
    return svc.distribution(
        session, country=country, department=department, bucket_size=bucket_size
    )
