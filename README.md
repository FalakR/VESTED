# HerVest

Women-first financial education app. **Educational, hypothetical simulations only**: no trading, no account linking, no personalized securities advice.

## Status
- [x] Backend (FastAPI): deterministic Future You engine, `/api/v1/simulations/run`, lessons API, guardrailed assistant with deterministic fallback
- [x] Frontend (Next.js 16): landing, onboarding, home, Future You (chart + table + comparisons), Learn, Ask HerVest, profile/privacy; HerCircles is an honest placeholder
- [ ] PostgreSQL / auth / saved scenarios (P1)

## Run the API
```
cd services/api
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m pytest
.venv\Scripts\python -m uvicorn app.main:app --reload
```
Docs at http://localhost:8000/docs

## Run the web app
```n cd apps/web; npm install; npm run dev   # http://localhost:3000 (API must be on :8000)
```n
## Decisions / defaults
- Months are 0-indexed; `break_start_month=60` pauses contributions right after year 5.
- `contributions` = invested capital (initial balance + contributions made); `modeled_growth` can be negative and must not be labelled "earnings".
- Values are rounded to cents only at the API boundary.
- The assistant accepts scenario *inputs* and recomputes server-side, so clients can't supply numbers for the AI to explain.
- Lessons are `status: draft` with no sources until a human verifies Canadian primary sources.
- No LLM provider is wired in yet; `LLMProvider` in `app/ai/assistant.py` is the adapter seam.

## Remaining risks / P1
Rate limiting, DB + migrations, auth, RAG over verified sources, prompt-injection eval suite, legal/privacy review (PIPEDA, CASL, securities rules).

