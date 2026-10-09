from tests.conftest import TODAY, employee_payload


class TestCreate:
    def test_creates_employee_with_code_currency_and_usd(self, client):
        response = client.post("/api/employees", json=employee_payload())
        assert response.status_code == 201
        body = response.json()
        assert body["employee_code"] == "EMP000001"
        assert body["full_name"] == "Priya Sharma"
        assert body["currency"] == "INR"
        assert body["salary_usd"] == 28_800  # 2.4M INR * 0.012

    def test_records_initial_salary_in_history(self, client, make_employee):
        emp = make_employee(salary=1_000_000)
        history = client.get(f"/api/employees/{emp['id']}/salary-history").json()
        assert len(history) == 1
        assert history[0]["previous_salary"] is None
        assert history[0]["new_salary"] == 1_000_000
        assert history[0]["reason"] == "Initial salary"

    def test_email_is_normalised_and_unique_case_insensitively(self, client):
        assert (
            client.post("/api/employees", json=employee_payload(email="A@acme.example")).json()[
                "email"
            ]
            == "a@acme.example"
        )
        dup = client.post("/api/employees", json=employee_payload(email="a@ACME.example"))
        assert dup.status_code == 409

    def test_country_code_is_case_insensitive(self, client):
        response = client.post("/api/employees", json=employee_payload(country="us"))
        assert response.json()["country"] == "US"

    def test_rejects_invalid_input(self, client):
        cases = [
            {"salary": 0},
            {"salary": -5},
            {"country": "XX"},
            {"email": "not-an-email"},
            {"first_name": "   "},
            {"job_title": "Astronaut"},
            {"department": "Sales", "job_title": "Staff Engineer"},  # title not in department
            {"employment_type": "intern"},
        ]
        for override in cases:
            response = client.post("/api/employees", json=employee_payload(**override))
            assert response.status_code == 422, override


class TestReadAndDelete:
    def test_get_returns_employee(self, client, make_employee):
        emp = make_employee()
        assert client.get(f"/api/employees/{emp['id']}").json()["email"] == emp["email"]

    def test_get_missing_returns_404(self, client):
        assert client.get("/api/employees/999").status_code == 404

    def test_delete_removes_employee_and_history(self, client, make_employee):
        emp = make_employee()
        assert client.delete(f"/api/employees/{emp['id']}").status_code == 204
        assert client.get(f"/api/employees/{emp['id']}").status_code == 404
        assert client.get(f"/api/employees/{emp['id']}/salary-history").status_code == 404
        assert client.delete(f"/api/employees/{emp['id']}").status_code == 404


class TestUpdate:
    def test_partial_update_changes_only_given_fields(self, client, make_employee):
        emp = make_employee()
        updated = client.patch(f"/api/employees/{emp['id']}", json={"last_name": "Iyer"}).json()
        assert updated["last_name"] == "Iyer"
        assert updated["first_name"] == emp["first_name"]
        assert updated["salary"] == emp["salary"]

    def test_salary_change_appends_history(self, client, make_employee):
        emp = make_employee(salary=1_000_000)
        response = client.patch(
            f"/api/employees/{emp['id']}",
            json={"salary": 1_100_000, "salary_change_reason": "Annual review"},
        )
        assert response.status_code == 200
        history = client.get(f"/api/employees/{emp['id']}/salary-history").json()
        assert [h["new_salary"] for h in history] == [1_100_000, 1_000_000]  # newest first
        latest = history[0]
        assert latest["previous_salary"] == 1_000_000
        assert latest["reason"] == "Annual review"
        assert latest["effective_date"] == TODAY.isoformat()

    def test_salary_change_honours_effective_date(self, client, make_employee):
        emp = make_employee()
        client.patch(
            f"/api/employees/{emp['id']}",
            json={
                "salary": emp["salary"] + 100,
                "salary_change_reason": "Promotion",
                "salary_effective_date": "2026-04-01",
            },
        )
        history = client.get(f"/api/employees/{emp['id']}/salary-history").json()
        assert history[0]["effective_date"] == "2026-04-01"

    def test_salary_change_requires_reason(self, client, make_employee):
        emp = make_employee()
        response = client.patch(f"/api/employees/{emp['id']}", json={"salary": 5})
        assert response.status_code == 422
        assert "reason" in response.json()["detail"]

    def test_unchanged_salary_does_not_create_history(self, client, make_employee):
        emp = make_employee()
        client.patch(f"/api/employees/{emp['id']}", json={"salary": emp["salary"]})
        assert len(client.get(f"/api/employees/{emp['id']}/salary-history").json()) == 1

    def test_job_title_must_match_department_after_merge(self, client, make_employee):
        emp = make_employee(department="Engineering", job_title="Software Engineer")
        bad = client.patch(f"/api/employees/{emp['id']}", json={"department": "Sales"})
        assert bad.status_code == 422
        ok = client.patch(
            f"/api/employees/{emp['id']}",
            json={"department": "Sales", "job_title": "Account Executive"},
        )
        assert ok.status_code == 200

    def test_cannot_take_another_employees_email(self, client, make_employee):
        a = make_employee(email="a@acme.example")
        make_employee(email="b@acme.example")
        response = client.patch(f"/api/employees/{a['id']}", json={"email": "B@acme.example"})
        assert response.status_code == 409

    def test_update_missing_returns_404(self, client):
        assert client.patch("/api/employees/42", json={"last_name": "X"}).status_code == 404


class TestList:
    def test_paginates_with_total(self, client, make_employee):
        for _ in range(5):
            make_employee()
        page = client.get("/api/employees", params={"page": 2, "page_size": 2}).json()
        assert page["total"] == 5
        assert page["page"] == 2
        assert len(page["items"]) == 2

    def test_rejects_oversized_pages(self, client):
        assert client.get("/api/employees", params={"page_size": 1000}).status_code == 422

    def test_filters_by_country_department_and_title(self, client, make_employee):
        make_employee(country="IN")
        make_employee(country="US", department="Sales", job_title="Account Executive")
        make_employee(country="US")
        assert client.get("/api/employees", params={"country": "us"}).json()["total"] == 2
        sales = client.get("/api/employees", params={"department": "Sales"}).json()
        assert sales["total"] == 1
        ae = client.get("/api/employees", params={"job_title": "Account Executive"}).json()
        assert ae["items"][0]["department"] == "Sales"

    def test_search_matches_all_terms_across_fields(self, client, make_employee):
        make_employee(first_name="Priya", last_name="Sharma")
        make_employee(first_name="Priya", last_name="Nair")
        make_employee(first_name="Rohan", last_name="Sharma")

        def names(q: str) -> set[str]:
            items = client.get("/api/employees", params={"q": q}).json()["items"]
            return {i["full_name"] for i in items}

        assert names("priya") == {"Priya Sharma", "Priya Nair"}
        assert names("PRIYA sharma") == {"Priya Sharma"}
        assert names("EMP000003") == {"Rohan Sharma"}

    def test_sorts_by_salary_usd_across_currencies(self, client, make_employee):
        make_employee(first_name="Rich", country="IN", salary=10_000_000)  # 120k USD
        make_employee(first_name="Mid", country="US", salary=100_000)
        make_employee(first_name="Low", country="GB", salary=50_000)  # 63.5k USD
        items = client.get("/api/employees", params={"sort": "salary_usd", "order": "desc"}).json()
        assert [i["first_name"] for i in items["items"]] == ["Rich", "Mid", "Low"]

    def test_default_sort_is_by_last_then_first_name(self, client, make_employee):
        make_employee(first_name="B", last_name="Zed")
        make_employee(first_name="B", last_name="Abe")
        make_employee(first_name="A", last_name="Abe")
        items = client.get("/api/employees").json()["items"]
        assert [i["full_name"] for i in items] == ["A Abe", "B Abe", "B Zed"]

    def test_rejects_unknown_sort_key(self, client):
        assert client.get("/api/employees", params={"sort": "password"}).status_code == 422
