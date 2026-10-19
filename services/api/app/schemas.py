from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .simulation import (
    CALCULATION_VERSION,
    MAX_FEE_RATE,
    MAX_RETURN,
    MAX_YEARS,
    MIN_RETURN,
    MIN_YEARS,
    Comparison,
    SimulationResult,
    compare_with_baseline,
)

# Money values are rounded to cents only here, at the API boundary.
_CENTS = 2


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    initial_balance: float = Field(0, ge=0, le=1e9, allow_inf_nan=False, description="CAD, hypothetical")
    monthly_contribution: float = Field(0, ge=0, le=1e7, allow_inf_nan=False, description="CAD, hypothetical")
    years: int = Field(20, ge=MIN_YEARS, le=MAX_YEARS)
    annual_nominal_return: float = Field(
        0.05, ge=MIN_RETURN, le=MAX_RETURN, allow_inf_nan=False, description="Fixed nominal rate, e.g. 0.05"
    )
    break_start_month: int = Field(0, ge=0, le=MAX_YEARS * 12)
    break_months: int = Field(0, ge=0, le=MAX_YEARS * 12)
    monthly_fee_rate: float = Field(0, ge=0, le=MAX_FEE_RATE, allow_inf_nan=False)
    age: int | None = Field(None, ge=13, le=120, description="Optional; used only to show an end age")


class SeriesPointOut(BaseModel):
    year: int
    balance: float
    contributions: float
    modeled_growth: float


class ScenarioOut(BaseModel):
    ending_balance: float
    total_contributions: float
    modeled_growth: float
    annual_series: list[SeriesPointOut]


class Assumptions(BaseModel):
    nominal_rate: float
    monthly_fee_rate: float
    compounding: str = "monthly"
    contribution_timing: str = "end_of_month"
    taxes_included: bool = False
    inflation_included: bool = False
    guaranteed: bool = False


class BreakPreset(BaseModel):
    break_months: int
    ending_balance: float
    difference_from_baseline: float


class SimulationResponse(ScenarioOut):
    baseline: ScenarioOut
    difference_from_baseline: float
    break_presets: list[BreakPreset]
    end_age: int | None
    assumptions: Assumptions
    calculation_version: str = CALCULATION_VERSION
    disclaimer: str = (
        "Hypothetical illustration using a fixed assumed rate. Not a forecast, not a guarantee, "
        "and not financial advice. Real investments can lose value."
    )


def _r(x: float) -> float:
    return round(x, _CENTS)


def _scenario_out(res: SimulationResult) -> ScenarioOut:
    return ScenarioOut(
        ending_balance=_r(res.ending_balance),
        total_contributions=_r(res.total_contributions),
        modeled_growth=_r(res.modeled_growth),
        annual_series=[
            SeriesPointOut(
                year=p.year,
                balance=_r(p.balance),
                contributions=_r(p.contributions),
                modeled_growth=_r(p.balance - p.contributions),
            )
            for p in res.annual_series
        ],
    )


def build_response(req: SimulationRequest) -> tuple[SimulationResponse, Comparison]:
    kwargs = dict(
        initial_balance=req.initial_balance,
        monthly_contribution=req.monthly_contribution,
        years=req.years,
        annual_nominal_return=req.annual_nominal_return,
        break_start_month=req.break_start_month,
        monthly_fee_rate=req.monthly_fee_rate,
    )
    cmp = compare_with_baseline(break_months=req.break_months, **kwargs)

    presets = []
    for months in (12, 24):
        c = compare_with_baseline(break_months=months, **kwargs)
        presets.append(
            BreakPreset(
                break_months=months,
                ending_balance=_r(c.scenario.ending_balance),
                difference_from_baseline=_r(c.difference),
            )
        )

    out = _scenario_out(cmp.scenario)
    response = SimulationResponse(
        **out.model_dump(),
        baseline=_scenario_out(cmp.baseline),
        difference_from_baseline=_r(cmp.difference),
        break_presets=presets,
        end_age=req.age + req.years if req.age is not None else None,
        assumptions=Assumptions(nominal_rate=req.annual_nominal_return, monthly_fee_rate=req.monthly_fee_rate),
    )
    return response, cmp
