import sys
import os
import random
import json
import traceback

# Add project root to path so analyzer.py can be imported from d:\nlp(project)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

# Import the real analyzer
import analyzer

app = FastAPI(title="InterviewAI Backend", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so unhandled errors still return JSON with CORS headers."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

# ── Pydantic Models ────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    question_id: int
    answer_text: str
    input_mode: Optional[str] = "text"
    duration_seconds: Optional[float] = 0.0
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "wav"


class SessionAnswer(BaseModel):
    question_id: int
    answer_text: str
    input_mode: Optional[str] = "text"
    duration_seconds: Optional[float] = 0.0


class SessionRequest(BaseModel):
    answers: List[SessionAnswer]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "InterviewAI backend running", "questions_loaded": len(analyzer.QUESTION_BANK)}


@app.get("/questions")
def get_questions(category: Optional[str] = None, count: int = 7):
    """
    Return `count` random questions, optionally filtered by category.
    """
    bank = analyzer.QUESTION_BANK

    if category:
        filtered = [q for q in bank if q.get("category", "").lower() == category.lower()]
        if not filtered:
            # Fallback to all questions if category not found
            filtered = bank
    else:
        filtered = bank

    count = max(1, min(count, len(filtered)))
    selected = random.sample(filtered, count)

    return [
        {
            "id":          q["id"],
            "question":    q["question"],
            "keywords":    q.get("keywords", []),
            "category":    q.get("category", "General"),
            "min_words":   q.get("min_words", 20),
            "max_words":   q.get("max_words", 150),
        }
        for q in selected
    ]


@app.post("/analyze")
def analyze_single(req: AnalyzeRequest):
    """
    Analyze a single question-answer pair using the real analyzer.py
    """
    if not req.answer_text or len(req.answer_text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Answer is too short or empty")

    result = analyzer.analyze_answer(
        question_id=req.question_id,
        answer_text=req.answer_text,
        input_mode=req.input_mode or "text",
        duration_seconds=req.duration_seconds or 0.0,
        audio_base64=req.audio_base64,
        audio_format=req.audio_format or "wav",
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/analyze-session")
def analyze_session(req: SessionRequest):
    """
    Analyze all answers in a session (batch). Returns per-question results
    + aggregated session-level scores.
    """
    if not req.answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    results = []
    for ans in req.answers:
        answer_text = ans.answer_text.strip() if ans.answer_text else ""
        if not answer_text or len(answer_text) < 3:
            answer_text = "I did not answer this question."

        result = analyzer.analyze_answer(
            question_id=ans.question_id,
            answer_text=answer_text,
            input_mode=ans.input_mode or "text",
            duration_seconds=ans.duration_seconds or 0.0,
        )

        if "error" not in result:
            results.append(result)

    if not results:
        raise HTTPException(status_code=400, detail="All answers failed analysis")

    # Aggregate session scores (average across all answered questions)
    def avg(key: str):
        vals = [r["scores"][key] for r in results if key in r.get("scores", {})]
        return round(sum(vals) / len(vals), 1) if vals else 0.0

    session_scores = {
        "semantic_relevance": avg("semantic_relevance"),
        "sentiment":          avg("sentiment"),
        "keyword_match":      avg("keyword_match"),
        "clarity":            avg("clarity"),
        "overall":            avg("overall"),
    }

    return {
        "results":        results,
        "session_scores": session_scores,
        "total_questions": len(req.answers),
    }


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
