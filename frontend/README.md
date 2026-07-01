# InterviewAI — Frontend

The React + TypeScript frontend for **InterviewAI**, an AI-powered mock interview web application that helps users practice and improve their interview skills with real-time NLP-driven feedback.

---

## ✨ Features

- **User Authentication** — Sign up, log in, and session management via Supabase Auth
- **Interactive Dashboard** — Start new mock interviews with category-based question selection
- **Dynamic Interview Flow** — Answer questions via text input within a guided, timed session
- **AI-Powered Feedback** — Receive detailed scores on semantic relevance, sentiment, keyword usage, and clarity
- **Results Dashboard** — View per-question breakdowns, overall session scores, matched keywords, and actionable improvement tips

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | [React 18](https://react.dev/) + TypeScript      |
| Build Tool     | [Vite](https://vitejs.dev/)                       |
| Styling        | [Tailwind CSS](https://tailwindcss.com/)          |
| Routing        | [React Router v6](https://reactrouter.com/)       |
| Auth & DB      | [Supabase](https://supabase.com/)                 |
| HTTP Client    | [Axios](https://axios-http.com/)                  |

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── AnswerInput.tsx      # Text input component for answers
│   │   ├── InterviewCard.tsx    # Card UI for each interview question
│   │   ├── LoadingSpinner.tsx   # Animated loading indicator
│   │   ├── Navbar.tsx           # Top navigation bar with auth state
│   │   └── ScoreGauge.tsx       # Circular gauge for score visualization
│   ├── hooks/
│   │   └── useAuth.tsx          # Auth context provider & hook (Supabase)
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing page
│   │   ├── LoginPage.tsx        # User login
│   │   ├── SignupPage.tsx       # User registration
│   │   ├── DashboardPage.tsx    # Interview launcher & category selection
│   │   ├── InterviewPage.tsx    # Live interview session
│   │   └── ResultsPage.tsx      # Post-interview feedback & scores
│   ├── services/
│   │   ├── api.ts               # Axios API client for backend endpoints
│   │   └── supabase.ts          # Supabase client initialization
│   ├── App.tsx                  # Root app with routing & auth guards
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables (Supabase keys, API URL)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- The **backend** server must be running (see the root `README.md`)

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file (or verify the existing one) in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Run Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 🔗 API Integration

The frontend communicates with the FastAPI backend at the URL defined in `VITE_API_URL`. Key endpoints consumed:

| Method | Endpoint            | Purpose                                  |
|--------|---------------------|------------------------------------------|
| GET    | `/questions`        | Fetch random questions (with optional category filter) |
| POST   | `/analyze`          | Analyze a single question-answer pair    |
| POST   | `/analyze-session`  | Batch-analyze all answers in a session   |

---

## 📄 Available Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start the Vite development server  |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run ESLint                         |
