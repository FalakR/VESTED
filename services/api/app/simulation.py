"""Deterministic "Future You" simulation engine. Pure Python, no I/O, no randomness.

Monthly model (months are 0-indexed; contributions land at the END of each month):

    balance = balance * (1 + annual_nominal_return / 12) * (1 - monthly_fee_rate)
    if month not in break window: balance += monthly_contribution

The break window is months [break_start_month, break_start_month + break_months).
`break_start_month=60` therefore pauses contributions starting right after year 5.

"contributions" is invested capital: the initial balance plus every contribution made.
All values are unrounded internally; rounding happens only at the API boundary.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

CALCULATION_VERSION = "1.0"

MIN_YEARS, MAX_YEARS = 1, 50
MIN_RETURN, MAX_RETURN = -0.30, 0.15
MAX_FEE_RATE = 0.10


@dataclass(frozen=True)
class SeriesPoint:
    year: int
    balance: float
    contributions: float


@dataclass(frozen=True)
class SimulationResult:
    ending_balance: float
    total_contributions: float
    modeled_growth: float  # may be negative; callers must not present a negative value as "earnings"
    annual_series: list[SeriesPoint]


@dataclass(frozen=True)
class Comparison:
    scenario: SimulationResult
    baseline: SimulationResult
    difference: float  # baseline ending balance - scenario ending balance


def _require_finite(name: str, value: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number")
    if not math.isfinite(value):
        raise ValueError(f"{name} must be finite")
    return float(value)


def _require_int(name: str, value: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be an integer")
    return value


def run_simulation(
    initial_balance: float,
    monthly_contribution: float,
    years: int,
    annual_nominal_return: float,
    break_start_month: int = 0,
    break_months: int = 0,
    monthly_fee_rate: float = 0.0,
) -> SimulationResult:
    initial = _require_finite("initial_balance", initial_balance)
    contribution = _require_finite("monthly_contribution", monthly_contribution)
    rate = _require_finite("annual_nominal_return", annual_nominal_return)
    fee = _require_finite("monthly_fee_rate", monthly_fee_rate)
    years = _require_int("years", years)
    break_start = _require_int("break_start_month", break_start_month)
    break_len = _require_int("break_months", break_months)

    if initial < 0:
        raise ValueError("initial_balance must be >= 0")
    if contribution < 0:
        raise ValueError("monthly_contribution must be >= 0")
    if not MIN_YEARS <= years <= MAX_YEARS:
        raise ValueError(f"years must be between {MIN_YEARS} and {MAX_YEARS}")
    if not MIN_RETURN <= rate <= MAX_RETURN:
        raise ValueError(f"annual_nominal_return must be between {MIN_RETURN} and {MAX_RETURN}")
    if not 0 <= fee <= MAX_FEE_RATE:
        raise ValueError(f"monthly_fee_rate must be between 0 and {MAX_FEE_RATE}")
    if break_start < 0 or break_len < 0:
        raise ValueError("break_start_month and break_months must be >= 0")

    monthly_growth = 1 + rate / 12
    keep = 1 - fee
    break_end = break_start + break_len

    balance = initial
    contributed = initial
    series = [SeriesPoint(0, balance, contributed)]

    for month in range(years * 12):
        balance = balance * monthly_growth * keep
        if not break_start <= month < break_end:
            balance += contribution
            contributed += contribution
        if (month + 1) % 12 == 0:
            series.append(SeriesPoint((month + 1) // 12, balance, contributed))

    return SimulationResult(
        ending_balance=balance,
        total_contributions=contributed,
        modeled_growth=balance - contributed,
        annual_series=series,
    )


def compare_with_baseline(
    initial_balance: float,
    monthly_contribution: float,
    years: int,
    annual_nominal_return: float,
    break_start_month: int = 0,
    break_months: int = 0,
    monthly_fee_rate: float = 0.0,
) -> Comparison:
    args = (initial_balance, monthly_contribution, years, annual_nominal_return)
    scenario = run_simulation(*args, break_start_month, break_months, monthly_fee_rate)
    baseline = run_simulation(*args, break_start_month, 0, monthly_fee_rate)
    return Comparison(scenario, baseline, baseline.ending_balance - scenario.ending_balance)
