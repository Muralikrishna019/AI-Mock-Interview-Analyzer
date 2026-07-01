# InterviewAI – AI-Powered Mock Interview App

A full-stack web app with React+Vite frontend, FastAPI Python backend, and Supabase authentication.

## Prerequisites

**⚠️ Important:** Unzip `sbert_model.zip` into a folder called `sbert_model/` at `d:\nlp(project)\sbert_model\` before starting the backend.

---

## 1. Start the Python Backend

```bash
# From d:\nlp(project)
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The backend runs at **http://localhost:8000**

---

## 2. Start the React Frontend

Open a **new terminal**:

```bash
# From d:\nlp(project)
cd frontend
npm install
npm run dev
```

The frontend runs at **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/`                | Health check |
| GET  | `/questions`       | Get random questions (`?category=Technical&count=7`) |
| POST | `/analyze`         | Analyze single Q&A pair |
| POST | `/analyze-session` | Analyze full session (batch) |

---

## Project Structure

```
nlp(project)/
├── analyzer.py          # ← existing (DO NOT MODIFY)
├── question_bank.json   # ← existing (DO NOT MODIFY)
├── weights.pkl          # ← existing
├── sbert_model/         # ← unzip from sbert_model.zip
├── backend/
│   ├── app.py           # FastAPI server
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/       # HomePage, LoginPage, SignupPage, DashboardPage, InterviewPage, ResultsPage
    │   ├── components/  # Navbar, InterviewCard, AnswerInput, ScoreGauge, LoadingSpinner
    │   ├── hooks/       # useAuth.tsx
    │   └── services/    # api.ts, supabase.ts
    └── .env             # Supabase credentials (already filled in)
```
