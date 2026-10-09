"""Reference data: countries, departments and the job-title catalog.

Kept in code (not the DB) for v1: it changes rarely and versioning it with the code keeps
validation, seeding and the UI in lockstep. A constrained catalog prevents the "Sr. Engineer" vs
"Senior Engineer" fragmentation that makes spreadsheet-based pay analysis unreliable.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Country:
    code: str  # ISO-3166 alpha-2
    name: str
    currency: str  # ISO-4217


COUNTRIES: dict[str, Country] = {
    c.code: c
    for c in (
        Country("US", "United States", "USD"),
        Country("GB", "United Kingdom", "GBP"),
        Country("DE", "Germany", "EUR"),
        Country("IN", "India", "INR"),
        Country("CA", "Canada", "CAD"),
        Country("AU", "Australia", "AUD"),
        Country("SG", "Singapore", "SGD"),
        Country("BR", "Brazil", "BRL"),
    )
}

# department -> job titles
JOB_CATALOG: dict[str, tuple[str, ...]] = {
    "Engineering": (
        "Software Engineer",
        "Senior Software Engineer",
        "Staff Engineer",
        "Engineering Manager",
        "QA Engineer",
    ),
    "Product": ("Product Manager", "Senior Product Manager", "Product Designer"),
    "Sales": ("Sales Development Representative", "Account Executive", "Sales Manager"),
    "Marketing": ("Marketing Specialist", "Marketing Manager"),
    "Finance": ("Accountant", "Financial Analyst", "Finance Manager"),
    "Human Resources": ("HR Generalist", "Recruiter", "HR Manager"),
    "Operations": ("Operations Analyst", "Operations Manager"),
    "Customer Support": ("Support Specialist", "Support Team Lead"),
}

DEPARTMENTS: tuple[str, ...] = tuple(JOB_CATALOG)

EMPLOYMENT_TYPES: tuple[str, ...] = ("full_time", "part_time", "contractor")


def currency_for(country_code: str) -> str:
    return COUNTRIES[country_code].currency


def is_valid_job(department: str, job_title: str) -> bool:
    return job_title in JOB_CATALOG.get(department, ())
