# InterviewAI — Project Explanation

## 1. Project Overview

**InterviewAI** is an AI-powered mock interview web application that helps users practice job interviews and receive instant, data-driven feedback on their answers. The system combines modern NLP techniques — sentence embeddings, sentiment analysis, keyword matching, and text clarity heuristics — to score each response across multiple dimensions and generate actionable improvement suggestions.

The application supports **250+ interview questions** across three major categories (**Technical**, **HR**, and **Behavioral**), and offers five distinct interview tracks:

| Track | Category | Questions | Focus |
|-------|----------|-----------|-------|
| Software Engineering Basics | Technical | 7 | OOP, algorithms, data structures, REST APIs, databases |
| Behavioral Excellence | Behavioral | 6 | STAR method, teamwork, conflict, leadership |
| HR & Culture Fit | HR | 7 | Self-introduction, strengths/weaknesses, career goals |
| Full Stack Developer | Mixed | 8 | APIs, Docker, version control + behavioral |
| Data Science & ML | Technical | 6 | ML concepts, supervised/unsupervised learning, Python |

---

## 2. Architecture

The project follows a **client–server architecture** with three main layers:

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                           │
└──────────────┬───────────────────────────────┬───────────────────┘
               │ HTTP (REST API)               │ Auth / DB
               ▼                               ▼
┌──────────────────────────┐     ┌──────────────────────────────┐
│   FastAPI Backend        │     │       Supabase Cloud         │
│   (Python, port 8000)    │     │  ┌────────────────────────┐  │
│  ┌────────────────────┐  │     │  │  Authentication (Auth) │  │
│  │    analyzer.py      │  │     │  │  PostgreSQL Database   │  │
│  │  (NLP Engine)       │  │     │  │  Row Level Security    │  │
│  └────────────────────┘  │     │  └────────────────────────┘  │
└──────────────────────────┘     └──────────────────────────────┘
```

### 2.1 Frontend (React + TypeScript + Vite)

- **Framework:** React 18 with TypeScript, built by Vite
- **Styling:** Tailwind CSS with custom glassmorphism design
- **Routing:** React Router v6 with protected and public-only routes
- **State Management:** React Context (for auth) + local component state
- **HTTP Client:** Axios for backend API communication
- **Auth:** Supabase client-side SDK (`@supabase/supabase-js`)

### 2.2 Backend (FastAPI + Python)

- **Framework:** FastAPI (async Python web framework)
- **Server:** Uvicorn ASGI server with hot reload
- **CORS:** Configured for `localhost:5173` (Vite dev server)
- **Endpoints:** RESTful JSON API serving questions and analysis results

### 2.3 NLP Engine (`analyzer.py`)

The heart of the project — a Python module that performs multi-dimensional answer evaluation using pre-trained transformer models and classical NLP techniques.

### 2.4 Database & Auth (Supabase)

- **Authentication:** Email/password sign-up and sign-in via Supabase Auth
- **Database:** PostgreSQL with two main tables:
  - `interview_sessions` — stores session metadata (user, type, title, overall score)
  - `interview_results` — stores per-question analysis results (scores, feedback, keywords)
- **Security:** Row Level Security (RLS) ensures users can only access their own data

---

## 3. NLP Analysis Pipeline — How It Works

When a user submits an answer, `analyzer.py` evaluates it across **four scoring dimensions** (five if audio mode is used). Each score is normalized to a 0–100 scale.

### 3.1 Semantic Relevance Score

**Purpose:** Measures how closely the answer relates to the question topic.

**Method:**
1. Both the question and answer are encoded into dense vector embeddings using **SBERT** (Sentence-BERT), specifically the `all-MiniLM-L6-v2` model.
2. The **cosine similarity** between the two vectors is computed.
3. The result is clamped to `[0.0, 1.0]` and scaled to 0–100.

**Why it works:** SBERT captures meaning beyond keyword overlap. For example, "version control" and "Git branching strategy" will have high similarity even without shared words.

### 3.2 Sentiment & Confidence Score

**Purpose:** Evaluates whether the candidate sounds confident and positive.

**Method:**
1. The answer (first 512 tokens) is passed through a **DistilBERT** sentiment classifier (`distilbert-base-uncased-finetuned-sst-2-english`).
2. The model outputs a label (`POSITIVE` or `NEGATIVE`) and a confidence score.
3. If `POSITIVE`, the confidence is used directly; if `NEGATIVE`, the score is `1 - confidence`.
4. Scaled to 0–100.

**Why it matters:** Interviewers evaluate not just *what* you say, but *how* you say it. Uncertain or negative tones lower this score.

### 3.3 Keyword Match Score

**Purpose:** Checks whether the answer includes domain-specific terms expected for the question.

**Method:**
1. Each question in the question bank has a curated list of `keywords` (e.g., `["encapsulation", "inheritance", "polymorphism"]` for an OOP question).
2. The answer is preprocessed — lowercased, stop words removed, lemmatized using NLTK's `WordNetLemmatizer`.
3. Each expected keyword is checked against both the raw lowercased answer and the lemmatized form.
4. Score = `matched keywords / total expected keywords`, scaled to 0–100.

**Why it matters:** Technical answers need to use the right terminology. This score rewards precise vocabulary.

### 3.4 Clarity Score

**Purpose:** Measures how well-structured and readable the answer is.

**Method — a weighted composite of three sub-scores:**

| Sub-score | Weight | Evaluation |
|-----------|--------|------------|
| **Length Score** | 40% | Penalizes answers that are too short (below `min_words`) or too long (above `max_words`) for the question. |
| **Structure Score** | 30% | Evaluates average sentence length. Ideal: 10–25 words/sentence. Fragments (< 5) or run-ons (> 25) are penalized. |
| **Filler Score** | 30% | Counts filler words (`um`, `uh`, `like`, `basically`, `you know`, etc.). More fillers = lower score. |

### 3.5 Delivery Score (Audio Mode Only)

**Purpose:** When the user answers via voice, this evaluates speaking pace and filler usage.

**Method:**
1. Audio is transcribed using **Google Speech Recognition** (via `speech_recognition` library).
2. **Words Per Minute (WPM)** is calculated from word count and duration.
3. Ideal pace: 100–150 WPM. Too fast or too slow is penalized.
4. Filler word ratio is computed and penalized.
5. Delivery = `0.5 × pace_score + 0.5 × filler_score`.

### 3.6 Overall Score Calculation

The final score is a **weighted sum** of all individual scores. The weights are stored in `weights.pkl` and differ for text vs. audio:

**Text mode:** `overall = (semantic × w_s + sentiment × w_sent + keyword × w_k + clarity × w_c) × 100`

**Audio mode:** `overall = (semantic × w_s + sentiment × w_sent + keyword × w_k + clarity × w_c + delivery × w_d) × 100`

### 3.7 Feedback Generation

After scoring, the system generates human-readable feedback strings based on score thresholds:

- **Semantic < 0.3** → "Your answer does not address the question."
- **Sentiment < 0.4** → "Your tone seems uncertain."
- **Keyword < 0.3** → Lists missing domain terms.
- **Word count** below/above target → Advises on length.
- **Audio WPM > 170** → "Too fast. Aim for 100–150 WPM."

---

## 4. Data Files

| File | Purpose |
|------|---------|
| `question_bank.json` | 250+ questions with `id`, `question`, `keywords[]`, `category`, `min_words`, `max_words` |
| `weights.pkl` | Pickled dictionary with scoring weights for text and audio modes |
| `sbert_model/` | Local copy of the `all-MiniLM-L6-v2` SBERT model (unzipped from `sbert_model.zip`) |
| `test_cases_750.json` | 750 test cases for validating the analyzer |

---

## 5. User Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│  Home Page   │─────▶│  Sign Up /   │─────▶│    Dashboard     │
│  (Landing)   │      │  Log In      │      │  (Choose Track)  │
└─────────────┘      └─────────────┘      └───────┬─────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │  Interview Page   │
                                          │  (Q1 → Q2 → Qn)  │
                                          │  Type/Speak Answer│
                                          └───────┬─────────┘
                                                    │ Submit
                                                    ▼
                                          ┌─────────────────┐
                                          │  Results Page     │
                                          │  • Overall Score  │
                                          │  • Per-Q Scores   │
                                          │  • Feedback       │
                                          │  • Strengths &    │
                                          │    Weaknesses     │
                                          └─────────────────┘
```

1. **Home Page** — Landing page with feature highlights and call-to-action.
2. **Sign Up / Log In** — Email + password authentication via Supabase.
3. **Dashboard** — Displays 5 interview track cards. User clicks "Start" on one.
4. **Interview Page** — Questions are loaded from the backend. User types their answer (with a live word counter and keyword hints). Navigation buttons let them go forward/backward and finally submit.
5. **Results Page** — All answers are sent to `/analyze-session`. The backend runs each through the NLP pipeline. Results show:
   - Large circular overall score gauge
   - Four metric gauges (Semantic, Confidence, Keywords, Clarity)
   - Strengths & areas to improve (extracted from feedback)
   - Expandable per-question breakdowns (scores, answer text, matched keywords, feedback bullets)
   - Results are **saved to Supabase** for the user's history.

---

## 6. API Endpoints

### `GET /`
Health check. Returns `{ status, questions_loaded }`.

### `GET /questions?category=<str>&count=<int>`
Returns `count` random questions, optionally filtered by `category`. Each question includes: `id`, `question`, `keywords`, `category`, `min_words`, `max_words`.

### `POST /analyze`
Analyzes a **single** question-answer pair.

**Request body:**
```json
{
  "question_id": 42,
  "answer_text": "Polymorphism allows objects to...",
  "input_mode": "text",
  "duration_seconds": 0
}
```

**Response:** Scores, sentiment label, matched keywords, word count, filler count, feedback array.

### `POST /analyze-session`
Batch-analyzes **all** answers in a session.

**Request body:**
```json
{
  "answers": [
    { "question_id": 1, "answer_text": "...", "input_mode": "text" },
    { "question_id": 5, "answer_text": "...", "input_mode": "text" }
  ]
}
```

**Response:** Array of per-question results + aggregated `session_scores` (averages across all questions).

---

## 7. Technologies Used

### Backend / NLP
| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | Core language |
| **FastAPI** | Web framework for REST API |
| **Uvicorn** | ASGI server |
| **Sentence-Transformers (SBERT)** | Semantic similarity via `all-MiniLM-L6-v2` |
| **Hugging Face Transformers** | Sentiment analysis via DistilBERT |
| **NLTK** | Tokenization, lemmatization, stopword removal |
| **SpeechRecognition** | Audio-to-text transcription (Google API) |
| **pydub** | Audio format conversion |
| **NumPy** | Numerical operations |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Supabase JS SDK** | Auth and database access |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Supabase** | Authentication + PostgreSQL database |

---

## 8. Project Structure

```
nlp(project)/
│
├── analyzer.py                # NLP analysis engine (SBERT, DistilBERT, NLTK)
├── question_bank.json         # 250+ curated interview questions
├── question_bank_250.json     # Backup of question bank
├── weights.pkl                # Scoring weight coefficients (text & audio)
├── sbert_model.zip            # Compressed SBERT model
├── sbert_model/               # Extracted SBERT model (from zip)
├── test_cases_750.json        # Test cases for validation
├── README.md                  # Root project README
├── explanation.md             # This file — full project explanation
│
├── backend/
│   ├── app.py                 # FastAPI application (endpoints, CORS, Pydantic models)
│   └── requirements.txt       # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── App.tsx             # Root component with routing and auth guards
    │   ├── main.tsx            # Entry point (ReactDOM.createRoot)
    │   ├── index.css           # Global styles (dark theme, glassmorphism, animations)
    │   │
    │   ├── pages/
    │   │   ├── HomePage.tsx        # Landing page with features and CTA
    │   │   ├── LoginPage.tsx       # Email/password sign-in form
    │   │   ├── SignupPage.tsx      # Email/password registration form
    │   │   ├── DashboardPage.tsx   # Interview track selection (5 cards)
    │   │   ├── InterviewPage.tsx   # Live interview session with Q&A flow
    │   │   └── ResultsPage.tsx     # Score visualization and feedback display
    │   │
    │   ├── components/
    │   │   ├── Navbar.tsx          # Top navigation bar with auth state
    │   │   ├── AnswerInput.tsx     # Text area with word counter and voice input
    │   │   ├── InterviewCard.tsx   # Dashboard card for each interview track
    │   │   ├── ScoreGauge.tsx      # Circular SVG gauge for score display
    │   │   └── LoadingSpinner.tsx  # Animated loading indicator
    │   │
    │   ├── hooks/
    │   │   └── useAuth.tsx         # Auth context provider (Supabase session)
    │   │
    │   └── services/
    │       ├── api.ts              # Axios API client (fetchQuestions, analyze*)
    │       └── supabase.ts         # Supabase client initialization
    │
    ├── .env                        # Environment variables (API URL, Supabase keys)
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 9. How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- Unzip `sbert_model.zip` into `sbert_model/` in the project root

### Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173** with the backend API at **http://localhost:8000**.
