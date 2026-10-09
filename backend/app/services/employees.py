from dataclasses import dataclass
from datetime import date
from typing import Literal

from sqlalchemy import ColumnElement, Select, case, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.currency import USD_PER_UNIT, to_usd
from app.domain.reference import COUNTRIES, currency_for, is_valid_job
from app.models import Employee, SalaryChange
from app.schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.services.errors import BusinessRuleError, ConflictError, NotFoundError

SortKey = Literal[
    "name", "employee_code", "hire_date", "salary", "salary_usd", "country", "department",
    "job_title",
]  # fmt: skip

INITIAL_SALARY_REASON = "Initial salary"


@dataclass(frozen=True)
class EmployeeFilters:
    q: str | None = None
    country: str | None = None
    department: str | None = None
    job_title: str | None = None


def _salary_usd_expr() -> ColumnElement:
    """SQL expression for salary in USD, so the list can be sorted across currencies."""
    rate_by_country = {code: float(USD_PER_UNIT[c.currency]) for code, c in COUNTRIES.items()}
    return Employee.salary * case(rate_by_country, value=Employee.country, else_=0)


def _sort_columns(sort: SortKey) -> list[ColumnElement]:
    match sort:
        case "name":
            return [Employee.last_name, Employee.first_name]
        case "salary_usd":
            return [_salary_usd_expr()]
        case _:
            return [getattr(Employee, sort)]


def _apply_filters(stmt: Select, f: EmployeeFilters) -> Select:
    if f.country:
        stmt = stmt.where(Employee.country == f.country.upper())
    if f.department:
        stmt = stmt.where(Employee.department == f.department)
    if f.job_title:
        stmt = stmt.where(Employee.job_title == f.job_title)
    if f.q:
        # Every whitespace-separated term must match some field: "priya eng" narrows sensibly.
        for term in f.q.split():
            pattern = f"%{term.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Employee.first_name).like(pattern),
                    func.lower(Employee.last_name).like(pattern),
                    func.lower(Employee.email).like(pattern),
                    func.lower(Employee.employee_code).like(pattern),
                )
            )
    return stmt


def to_out(employee: Employee) -> EmployeeOut:
    currency = currency_for(employee.country)
    return EmployeeOut.model_validate(
        {
            **{c: getattr(employee, c) for c in EmployeeOut.model_fields if hasattr(employee, c)},
            "currency": currency,
            "salary_usd": to_usd(employee.salary, currency),
        }
    )


def list_employees(
    session: Session,
    filters: EmployeeFilters,
    *,
    sort: SortKey = "name",
    order: Literal["asc", "desc"] = "asc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Employee], int]:
    base = _apply_filters(select(Employee), filters)
    total = session.scalar(select(func.count()).select_from(base.subquery())) or 0
    columns = _sort_columns(sort)
    ordering = [c.desc() if order == "desc" else c.asc() for c in columns]
    ordering.append(Employee.id.asc())  # stable pagination
    rows = session.scalars(
        base.order_by(*ordering).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(rows), total


def get_employee(session: Session, employee_id: int) -> Employee:
    employee = session.get(Employee, employee_id)
    if employee is None:
        raise NotFoundError(f"employee {employee_id} not found")
    return employee


def _ensure_email_free(session: Session, email: str, exclude_id: int | None = None) -> None:
    stmt = select(Employee.id).where(func.lower(Employee.email) == email.lower())
    if exclude_id is not None:
        stmt = stmt.where(Employee.id != exclude_id)
    if session.scalar(stmt) is not None:
        raise ConflictError(f"email '{email}' is already in use")


def employee_code_for(employee_id: int) -> str:
    return f"EMP{employee_id:06d}"


def _commit(session: Session) -> None:
    try:
        session.commit()
    except IntegrityError as exc:  # race on unique email
        session.rollback()
        raise ConflictError("employee conflicts with an existing record") from exc


def create_employee(session: Session, data: EmployeeCreate, *, today: date) -> Employee:
    _ensure_email_free(session, data.email)
    employee = Employee(**data.model_dump(), employee_code="PENDING")
    employee.email = employee.email.lower()
    session.add(employee)
    session.flush()  # assigns id
    employee.employee_code = employee_code_for(employee.id)
    employee.salary_changes.append(
        SalaryChange(
            previous_salary=None,
            new_salary=data.salary,
            effective_date=min(data.hire_date, today),
            reason=INITIAL_SALARY_REASON,
        )
    )
    _commit(session)
    return employee


def update_employee(
    session: Session, employee_id: int, data: EmployeeUpdate, *, today: date
) -> Employee:
    employee = get_employee(session, employee_id)
    changes = data.model_dump(
        exclude_unset=True, exclude={"salary_change_reason", "salary_effective_date"}
    )

    department = changes.get("department", employee.department)
    job_title = changes.get("job_title", employee.job_title)
    if not is_valid_job(department, job_title):
        raise BusinessRuleError(f"'{job_title}' is not a job title in '{department}'")

    if "email" in changes:
        changes["email"] = changes["email"].lower()
        _ensure_email_free(session, changes["email"], exclude_id=employee.id)

    new_salary = changes.get("salary")
    if new_salary is not None and new_salary != employee.salary:
        reason = (data.salary_change_reason or "").strip()
        if not reason:
            raise BusinessRuleError("salary_change_reason is required when changing salary")
        employee.salary_changes.append(
            SalaryChange(
                previous_salary=employee.salary,
                new_salary=new_salary,
                effective_date=data.salary_effective_date or today,
                reason=reason,
            )
        )

    for field, value in changes.items():
        setattr(employee, field, value)
    _commit(session)
    return employee


def delete_employee(session: Session, employee_id: int) -> None:
    employee = get_employee(session, employee_id)
    session.delete(employee)
    session.commit()


def salary_history(session: Session, employee_id: int) -> list[SalaryChange]:
    get_employee(session, employee_id)
    stmt = (
        select(SalaryChange)
        .where(SalaryChange.employee_id == employee_id)
        .order_by(SalaryChange.effective_date.desc(), SalaryChange.id.desc())
    )
    return list(session.scalars(stmt).all())
