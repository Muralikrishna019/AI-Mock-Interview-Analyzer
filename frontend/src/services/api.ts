import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

export interface Question {
  id: number;
  question: string;
  keywords: string[];
  category: string;
  min_words: number;
  max_words: number;
}

export interface AnalyzeRequest {
  question_id: number;
  answer_text: string;
  input_mode?: 'text' | 'audio';
  duration_seconds?: number;
}

export interface Scores {
  semantic_relevance: number;
  sentiment: number;
  keyword_match: number;
  clarity: number;
  delivery?: number;
  overall: number;
}

export interface AnalyzeResult {
  question: string;
  answer: string;
  input_mode: string;
  scores: Scores;
  sentiment_label: string;
  matched_keywords: string[];
  word_count: number;
  filler_count: number;
  feedback: string[];
  category: string;
  audio_metrics?: Record<string, number>;
}

export interface SessionPayload {
  answers: Array<{ question_id: number; answer_text: string; input_mode?: string }>;
}

export interface SessionResult {
  results: AnalyzeResult[];
  session_scores: {
    semantic_relevance: number;
    sentiment: number;
    keyword_match: number;
    clarity: number;
    overall: number;
  };
  total_questions: number;
}

// Get random questions (with optional category filter)
export const fetchQuestions = async (category?: string, count: number = 7): Promise<Question[]> => {
  const params: Record<string, string | number> = { count };
  if (category) params.category = category;
  const res = await api.get<Question[]>('/questions', { params });
  return res.data;
};

// Analyze a single question-answer pair
export const analyzeAnswer = async (payload: AnalyzeRequest): Promise<AnalyzeResult> => {
  const res = await api.post<AnalyzeResult>('/analyze', payload);
  return res.data;
};

// Analyze a full session (batch)
export const analyzeSession = async (payload: SessionPayload): Promise<SessionResult> => {
  const res = await api.post<SessionResult>('/analyze-session', payload);
  return res.data;
};

export default api;
