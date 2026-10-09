from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.deps import get_session, get_today
from app.schemas import EmployeeCreate, EmployeeOut, EmployeePage, EmployeeUpdate, SalaryChangeOut
from app.services import employees as svc

router = APIRouter(prefix="/api/employees", tags=["employees"])

SessionDep = Annotated[Session, Depends(get_session)]
TodayDep = Annotated[date, Depends(get_today)]


@router.get("", response_model=EmployeePage)
def list_employees(
    session: SessionDep,
    q: Annotated[str | None, Query(max_length=100)] = None,
    country: str | None = None,
    department: str | None = None,
    job_title: str | None = None,
    sort: svc.SortKey = "name",
    order: Literal["asc", "desc"] = "asc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> EmployeePage:
    filters = svc.EmployeeFilters(q=q, country=country, department=department, job_title=job_title)
    items, total = svc.list_employees(
        session, filters, sort=sort, order=order, page=page, page_size=page_size
    )
    return EmployeePage(
        items=[svc.to_out(e) for e in items], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(data: EmployeeCreate, session: SessionDep, today: TodayDep) -> EmployeeOut:
    return svc.to_out(svc.create_employee(session, data, today=today))


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, session: SessionDep) -> EmployeeOut:
    return svc.to_out(svc.get_employee(session, employee_id))


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, data: EmployeeUpdate, session: SessionDep, today: TodayDep
) -> EmployeeOut:
    return svc.to_out(svc.update_employee(session, employee_id, data, today=today))


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, session: SessionDep) -> Response:
    svc.delete_employee(session, employee_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{employee_id}/salary-history", response_model=list[SalaryChangeOut])
def salary_history(employee_id: int, session: SessionDep) -> list[SalaryChangeOut]:
    return [SalaryChangeOut.model_validate(c) for c in svc.salary_history(session, employee_id)]
