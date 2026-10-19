import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DEMO = {
    "initial_balance": 1000,
    "monthly_contribution": 200,
    "years": 20,
    "annual_nominal_return": 0.05,
    "break_start_month": 60,
    "break_months": 24,
    "age": 24,
}


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_run_demo_scenario():
    r = client.post("/api/v1/simulations/run", json=DEMO)
    assert r.status_code == 200
    body = r.json()
    assert len(body["annual_series"]) == 21
    assert body["difference_from_baseline"] > 0
    assert body["end_age"] == 44
    assert body["assumptions"]["inflation_included"] is False
    assert body["assumptions"]["guaranteed"] is False
    assert [p["break_months"] for p in body["break_presets"]] == [12, 24]
    assert body["calculation_version"] == "1.0"
    assert "not a forecast" in body["disclaimer"].lower()


def test_deterministic_outputs():
    a = client.post("/api/v1/simulations/run", json=DEMO).json()
    b = client.post("/api/v1/simulations/run", json=DEMO).json()
    assert a == b


def test_values_are_rounded_to_cents():
    body = client.post("/api/v1/simulations/run", json=DEMO).json()
    assert body["ending_balance"] == round(body["ending_balance"], 2)


@pytest.mark.parametrize(
    "patch",
    [
        {"years": 51},
        {"years": 0},
        {"initial_balance": -5},
        {"monthly_contribution": -1},
        {"annual_nominal_return": 0.5},
        {"break_months": -1},
        {"unknown_field": 1},
        {"initial_balance": "abc"},
    ],
)
def test_invalid_requests_return_422(patch):
    r = client.post("/api/v1/simulations/run", json={**DEMO, **patch})
    assert r.status_code == 422
    assert "detail" in r.json()


def test_nan_and_infinity_rejected():
    for raw in ('{"initial_balance": NaN}', '{"monthly_contribution": Infinity}'):
        r = client.post("/api/v1/simulations/run", content=raw, headers={"Content-Type": "application/json"})
        assert r.status_code == 422


def test_lessons_list_and_detail():
    lessons = client.get("/api/v1/lessons").json()
    assert len(lessons) == 5
    assert all(l["status"] == "draft" and l["sources"] == [] for l in lessons)
    detail = client.get("/api/v1/lessons/compound-growth")
    assert detail.status_code == 200 and detail.json()["content_md"]
    assert client.get("/api/v1/lessons/nope").status_code == 404


def test_cors_restricted():
    r = client.options(
        "/api/v1/simulations/run",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in r.headers
