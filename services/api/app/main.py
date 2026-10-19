from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .ai.assistant import ChatRequest, ChatResponse, answer
from .lessons import Lesson, all_lessons
from .schemas import SimulationRequest, SimulationResponse, build_response

app = FastAPI(
    title="HerVest API",
    version="0.1.0",
    description="Educational, hypothetical simulations only. No trading, no advice.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("HERVEST_CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    # Drop echoed input/ctx: NaN/Infinity can't be JSON-encoded, and user input shouldn't be reflected back.
    detail = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})


def ai_enabled() -> bool:
    return os.getenv("HERVEST_AI_ENABLED", "false").lower() == "true"


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "ai_enabled": ai_enabled()}


@app.post("/api/v1/simulations/run", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest) -> SimulationResponse:
    return build_response(req)[0]


@app.get("/api/v1/lessons", response_model=list[Lesson])
def list_lessons() -> list[Lesson]:
    return [l.model_copy(update={"content_md": ""}) for l in all_lessons().values()]


@app.get("/api/v1/lessons/{slug}", response_model=Lesson)
def get_lesson(slug: str) -> Lesson:
    lesson = all_lessons().get(slug)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@app.post("/api/v1/assistant/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    # Feature flag off => guardrails + deterministic answers only. No LLM adapter is wired in yet.
    return answer(req, provider=None)
