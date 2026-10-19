"""Educational assistant. Guardrails run first; the answer is deterministic unless an LLM provider is
plugged in. Numbers in scenario explanations always come from the server-side simulation result."""

from __future__ import annotations

import re
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from ..lessons import all_lessons
from ..schemas import SimulationRequest, SimulationResponse, build_response

PROMPT_VERSION = "fallback-1"

EDUCATION_NOTE = "Education, not financial advice."

_SENSITIVE = re.compile(
    r"\b\d{3}[- ]?\d{3}[- ]?\d{3}\b|\b\d{12,19}\b|password|passcode|\bpin\b|\bsin\b|social insurance",
    re.I,
)
_PICKS = re.compile(
    r"\b(which|what|best)\b.*\b(stock|stocks|etf|etfs|fund|funds|crypto|coin)\b.*\b(buy|pick|choose|invest in)\b"
    r"|\bshould i (buy|sell)\b|\bwhat should i buy\b|\btime the market\b|\bwhen (to|should i) (buy|sell)\b",
    re.I,
)
_GUARANTEE = re.compile(r"\bguarantee|\bsure thing\b|\brisk[- ]free\b|\bwill i (be rich|make money)\b", re.I)
_INJECTION = re.compile(r"ignore (all |your |previous )+(instructions|rules)|system prompt|you are now", re.I)

_TOPICS = {
    "compound-growth": ("compound", "growth", "interest"),
    "risk-and-diversification": ("risk", "diversif"),
    "etfs-vs-individual-stocks": ("etf", "stock", "fund"),
    "emergency-savings-before-investing": ("emergency", "savings"),
    "canadian-registered-accounts": ("tfsa", "rrsp", "fhsa", "registered", "account"),
}


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=1000)
    scenario: SimulationRequest | None = None  # inputs only; the server recomputes the numbers


class ChatResponse(BaseModel):
    answer: str
    key_terms: list[str] = []
    lesson_links: list[str] = []  # lesson slugs
    check_your_understanding: str | None = None
    refused: bool = False
    source: str = "deterministic-fallback"
    prompt_version: str = PROMPT_VERSION
    disclaimer: str = EDUCATION_NOTE


class LLMProvider(Protocol):
    """Provider-agnostic adapter. Implementations must receive only the question and the
    read-only server result, never user profile data, and keys must stay server-side."""

    def explain(self, question: str, result: SimulationResponse | None) -> str: ...


def _refusal(text: str, lessons: list[str]) -> ChatResponse:
    return ChatResponse(answer=text, lesson_links=lessons, refused=True)


def check_guardrails(message: str) -> ChatResponse | None:
    if _SENSITIVE.search(message):
        return _refusal(
            "Please don't share account numbers, passwords, your SIN or other sensitive details here. "
            "I can't use them and don't need them. Ask me a general question instead.",
            [],
        )
    if _INJECTION.search(message):
        return _refusal("I can only help with financial education questions, and I can't change my rules.", [])
    if _PICKS.search(message):
        return _refusal(
            "I can't recommend specific investments or when to buy or sell. I can explain how funds, "
            "stocks and diversification work so you can discuss choices with a registered professional.",
            ["etfs-vs-individual-stocks", "risk-and-diversification"],
        )
    if _GUARANTEE.search(message):
        return _refusal(
            "No investment return is guaranteed, and values can fall as well as rise. "
            "Future You uses a fixed assumed rate purely for illustration.",
            ["risk-and-diversification"],
        )
    return None


def _money(x: float) -> str:
    return f"${x:,.2f} CAD"


def explain_scenario(res: SimulationResponse) -> str:
    parts = [
        f"In this hypothetical scenario (fixed assumed rate of {res.assumptions.nominal_rate:.1%}), "
        f"the modeled ending balance is {_money(res.ending_balance)} from {_money(res.total_contributions)} "
        f"of total contributions."
    ]
    if res.modeled_growth >= 0:
        parts.append(f"The modeled growth is {_money(res.modeled_growth)}.")
    else:
        parts.append(f"The modeled result is {_money(-res.modeled_growth)} below what was contributed.")
    if res.difference_from_baseline > 0:
        parts.append(
            f"Compared with contributing without a pause, the ending balance is {_money(res.difference_from_baseline)} "
            "lower. That gap reflects both the contributions not made and the hypothetical growth those "
            "contributions would have had."
        )
    else:
        parts.append("There is no difference from continuous contributions in this scenario.")
    parts.append("Inflation, taxes and market ups and downs are not included. This is not a forecast.")
    return " ".join(parts)


def _match_lessons(message: str) -> list[str]:
    lowered = message.lower()
    available = all_lessons()
    return [s for s, words in _TOPICS.items() if s in available and any(w in lowered for w in words)]


def answer(req: ChatRequest, provider: LLMProvider | None = None) -> ChatResponse:
    blocked = check_guardrails(req.message)
    if blocked:
        return blocked

    result = build_response(req.scenario)[0] if req.scenario else None
    lessons = _match_lessons(req.message)
    wants_scenario = result is not None and re.search(r"scenario|why|change|differ|explain", req.message, re.I)

    if wants_scenario:
        text = explain_scenario(result)
        lessons = lessons or ["compound-growth"]
    elif lessons:
        lesson = all_lessons()[lessons[0]]
        text = f"{lesson.title}: see the short lesson below for the basics. {EDUCATION_NOTE}"
        if lesson.status == "draft":
            text += " (This lesson is a draft and hasn't been source-reviewed yet.)"
    else:
        text = (
            "I can explain ideas like compounding, diversification, ETFs, emergency savings and Canadian "
            "registered accounts, or walk through your Future You scenario. Try one of those."
        )

    source = "deterministic-fallback"
    if provider is not None:
        try:
            text = provider.explain(req.message, result)
            source = "llm"
        except Exception:  # any provider failure degrades to the deterministic answer
            pass

    return ChatResponse(
        answer=text,
        lesson_links=lessons,
        key_terms=[t for t in ("compounding", "contribution", "nominal return") if wants_scenario],
        check_your_understanding=(
            "If contributions pause for a year, why is the final gap bigger than the missed contributions alone?"
            if wants_scenario
            else None
        ),
        source=source,
    )
