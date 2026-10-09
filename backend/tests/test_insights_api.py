import pytest


@pytest.fixture
def org(make_employee):
    """Small, hand-computable org."""
    make_employee(country="US", salary=100_000)
    make_employee(country="US", salary=200_000, department="Sales", job_title="Sales Manager")
    make_employee(country="US", salary=150_000)
    make_employee(country="IN", salary=2_500_000)  # 30,000 USD
    make_employee(country="IN", salary=5_000_000, job_title="Staff Engineer")  # 60,000 USD


def test_summary(client, org):
    s = client.get("/api/insights/summary").json()
    assert s["headcount"] == 5
    assert s["payroll_usd"] == 100_000 + 200_000 + 150_000 + 30_000 + 60_000
    assert s["median_usd"] == 100_000
    assert s["mean_usd"] == 108_000
    assert s["countries"] == 2


def test_summary_filtered_by_country(client, org):
    s = client.get("/api/insights/summary", params={"country": "in"}).json()
    assert s["headcount"] == 2
    assert s["median_usd"] == 45_000


def test_summary_of_empty_org_is_zeroes(client):
    s = client.get("/api/insights/summary").json()
    assert s["headcount"] == 0
    assert s["median_usd"] == 0


def test_by_country_reports_local_and_usd_sorted_by_payroll(client, org):
    rows = client.get("/api/insights/by-country").json()
    assert [r["country"] for r in rows] == ["US", "IN"]
    india = rows[1]
    assert india["currency"] == "INR"
    assert india["local"]["median"] == 3_750_000
    assert india["usd"]["min"] == 30_000
    assert india["usd"]["max"] == 60_000


def test_by_department_in_usd(client, org):
    rows = {r["department"]: r["usd"] for r in client.get("/api/insights/by-department").json()}
    assert rows["Sales"]["count"] == 1
    assert rows["Engineering"]["count"] == 4
    assert rows["Engineering"]["median"] == 80_000  # (60k + 100k) / 2


def test_by_job_title_within_country_in_local_currency(client, org):
    body = client.get("/api/insights/by-job-title", params={"country": "US"}).json()
    assert body["currency"] == "USD"
    titles = {i["job_title"]: i["local"] for i in body["items"]}
    assert titles["Software Engineer"] == {
        "count": 2, "total": 250_000, "min": 100_000, "max": 150_000,
        "mean": 125_000, "median": 125_000,
    }  # fmt: skip
    assert titles["Sales Manager"]["median"] == 200_000
    assert body["items"][0]["job_title"] == "Sales Manager"  # highest median first


def test_by_job_title_requires_valid_country(client):
    assert client.get("/api/insights/by-job-title").status_code == 422
    assert client.get("/api/insights/by-job-title", params={"country": "XX"}).status_code == 422


def test_distribution_buckets_usd_salaries(client, org):
    body = client.get("/api/insights/distribution", params={"bucket_size": 50_000}).json()
    counts = [b["count"] for b in body["buckets"]]
    # 30k,60k | 100k,150k,200k -> buckets [0,50k)=1, [50k,100k)=1, [100k,150k)=1, ...
    assert sum(counts) == 5
    assert body["buckets"][0] == {"lower": 0, "upper": 50_000, "count": 1}


def test_meta_exposes_reference_data(client):
    meta = client.get("/api/meta").json()
    assert {"code": "IN", "name": "India", "currency": "INR"} in meta["countries"]
    assert "Software Engineer" in meta["departments"]["Engineering"]
    assert meta["employment_types"] == ["full_time", "part_time", "contractor"]
