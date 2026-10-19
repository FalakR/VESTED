import math

import pytest

from app.simulation import CALCULATION_VERSION, compare_with_baseline, run_simulation


def test_zero_rate_monthly_contributions():
    r = run_simulation(0, 100, 1, 0.0)
    assert r.ending_balance == pytest.approx(1200)
    assert r.total_contributions == pytest.approx(1200)
    assert r.modeled_growth == pytest.approx(0)


def test_zero_contributions_compounds_initial():
    r = run_simulation(1000, 0, 10, 0.06)
    assert r.ending_balance == pytest.approx(1000 * (1 + 0.06 / 12) ** 120)
    assert r.total_contributions == 1000


def test_zero_contributions_negative_rate_declines():
    r = run_simulation(1000, 0, 5, -0.10)
    assert r.ending_balance < 1000
    assert r.modeled_growth < 0


def test_break_covers_entire_horizon():
    r = run_simulation(1000, 100, 2, 0.05, break_start_month=0, break_months=24)
    assert r.total_contributions == 1000
    assert r.ending_balance == pytest.approx(1000 * (1 + 0.05 / 12) ** 24)


def test_break_after_horizon_matches_baseline():
    c = compare_with_baseline(1000, 100, 5, 0.05, break_start_month=600, break_months=12)
    assert c.difference == 0
    assert c.scenario.ending_balance == c.baseline.ending_balance


def test_break_reduces_ending_balance_for_positive_rate():
    c = compare_with_baseline(1000, 200, 20, 0.05, break_start_month=60, break_months=24)
    assert c.difference > 0
    assert c.scenario.total_contributions == pytest.approx(1000 + 200 * (240 - 24))


def test_negative_return_gives_lower_balance_than_zero_return():
    assert run_simulation(1000, 100, 10, -0.05).ending_balance < run_simulation(1000, 100, 10, 0.0).ending_balance


def test_fee_lowers_balance():
    assert run_simulation(1000, 100, 10, 0.05, monthly_fee_rate=0.001).ending_balance < run_simulation(
        1000, 100, 10, 0.05
    ).ending_balance


def test_annual_series_shape():
    r = run_simulation(1000, 100, 7, 0.05)
    assert [p.year for p in r.annual_series] == list(range(8))
    assert r.annual_series[0].balance == 1000
    assert r.annual_series[-1].balance == r.ending_balance


def test_deterministic():
    assert run_simulation(500, 50, 30, 0.04, 12, 6) == run_simulation(500, 50, 30, 0.04, 12, 6)


def test_calculation_version():
    assert CALCULATION_VERSION == "1.0"


@pytest.mark.parametrize(
    "kwargs",
    [
        dict(initial_balance=math.nan),
        dict(monthly_contribution=math.inf),
        dict(annual_nominal_return=-math.inf),
        dict(initial_balance=-1),
        dict(monthly_contribution=-1),
        dict(years=0),
        dict(years=51),
        dict(annual_nominal_return=0.16),
        dict(annual_nominal_return=-0.31),
        dict(break_months=-1),
        dict(break_start_month=-1),
        dict(monthly_fee_rate=-0.001),
    ],
)
def test_invalid_inputs_rejected(kwargs):
    base = dict(initial_balance=1000, monthly_contribution=100, years=10, annual_nominal_return=0.05)
    with pytest.raises(ValueError):
        run_simulation(**{**base, **kwargs})
