from datetime import UTC, date, datetime

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _now() -> datetime:
    return datetime.now(UTC)


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(16), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    job_title: Mapped[str] = mapped_column(String(100), index=True)
    department: Mapped[str] = mapped_column(String(100), index=True)
    country: Mapped[str] = mapped_column(String(2), index=True)
    employment_type: Mapped[str] = mapped_column(String(20))
    hire_date: Mapped[date] = mapped_column(Date)
    # Annual base salary, whole units of the country's currency. Never float money.
    salary: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    salary_changes: Mapped[list["SalaryChange"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        Index("ix_employees_country_job_title", "country", "job_title"),
        Index("ix_employees_last_first", "last_name", "first_name"),
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class SalaryChange(Base):
    """Append-only audit trail of salary changes."""

    __tablename__ = "salary_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    previous_salary: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    new_salary: Mapped[int] = mapped_column(BigInteger)
    effective_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, server_default=func.now()
    )

    employee: Mapped[Employee] = relationship(back_populates="salary_changes")
