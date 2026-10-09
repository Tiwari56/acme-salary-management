from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.domain.reference import COUNTRIES, EMPLOYMENT_TYPES, is_valid_job

EmploymentType = Literal["full_time", "part_time", "contractor"]
assert set(EmploymentType.__args__) == set(EMPLOYMENT_TYPES)  # type: ignore[attr-defined]

MAX_SALARY = 100_000_000_000  # sanity cap; INR/BRL salaries are large numbers but not this large
Name = Field(min_length=1, max_length=100)


def _check_country(value: str | None) -> str | None:
    if value is None:
        return value
    value = value.upper()
    if value not in COUNTRIES:
        raise ValueError(f"unsupported country '{value}'")
    return value


class EmployeeBase(BaseModel):
    first_name: str = Name
    last_name: str = Name
    email: EmailStr
    job_title: str
    department: str
    country: str
    employment_type: EmploymentType = "full_time"
    hire_date: date
    salary: int = Field(gt=0, le=MAX_SALARY, description="Annual, local currency, whole units")

    @field_validator("country")
    @classmethod
    def _valid_country(cls, v: str | None) -> str | None:
        return _check_country(v)

    @field_validator("first_name", "last_name", "job_title", "department")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @model_validator(mode="after")
    def _job_in_catalog(self):
        if not is_valid_job(self.department, self.job_title):
            raise ValueError(f"'{self.job_title}' is not a job title in '{self.department}'")
        return self


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    """Partial update. A salary change requires a reason (it goes into the audit trail)."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    job_title: str | None = None
    department: str | None = None
    country: str | None = None
    employment_type: EmploymentType | None = None
    hire_date: date | None = None
    salary: int | None = Field(default=None, gt=0, le=MAX_SALARY)
    salary_change_reason: str | None = Field(default=None, max_length=255)
    salary_effective_date: date | None = None

    @field_validator("country")
    @classmethod
    def _valid_country(cls, v: str | None) -> str | None:
        return _check_country(v)


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    job_title: str
    department: str
    country: str
    currency: str
    employment_type: str
    hire_date: date
    salary: int
    salary_usd: int
    created_at: datetime
    updated_at: datetime


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int


class SalaryChangeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    previous_salary: int | None
    new_salary: int
    effective_date: date
    reason: str
    created_at: datetime


# ---- insights ----


class Stats(BaseModel):
    count: int
    total: int
    min: int
    max: int
    mean: int
    median: int


class Summary(BaseModel):
    headcount: int
    payroll_usd: int
    median_usd: int
    mean_usd: int
    countries: int
    rates_as_of: str


class CountryInsight(BaseModel):
    country: str
    country_name: str
    currency: str
    local: Stats
    usd: Stats


class DepartmentInsight(BaseModel):
    department: str
    usd: Stats


class JobTitleInsight(BaseModel):
    job_title: str
    department: str
    local: Stats


class JobTitleInsights(BaseModel):
    country: str
    currency: str
    items: list[JobTitleInsight]


class HistogramBucket(BaseModel):
    lower: int
    upper: int
    count: int


class Distribution(BaseModel):
    currency: Literal["USD"] = "USD"
    bucket_size: int
    buckets: list[HistogramBucket]


class CountryMeta(BaseModel):
    code: str
    name: str
    currency: str


class Meta(BaseModel):
    countries: list[CountryMeta]
    departments: dict[str, list[str]]
    employment_types: list[str]
    rates_as_of: str
