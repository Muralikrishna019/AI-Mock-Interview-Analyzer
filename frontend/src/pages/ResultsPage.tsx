import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeSession } from '../services/api';
import type { Question, AnalyzeResult, SessionResult } from '../services/api';
import ScoreGauge from '../components/ScoreGauge';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface LocationState {
  interviewType: string;
  interviewTitle: string;
  questions: Question[];
  answers: string[];
}

const METRIC_LABELS: Record<string, string> = {
  semantic_relevance: 'Semantic Relevance',
  sentiment:          'Confidence & Tone',
  keyword_match:      'Keyword Match',
  clarity:            'Clarity',
  delivery:           'Delivery',
};

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state    = location.state as LocationState | null;

  const [result, setResult]       = useState<SessionResult | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<number | null>(0);
  const [saved, setSaved]         = useState(false);

  // Guard against React.StrictMode double-invoking the effect
  const hasRun = useRef(false);

  useEffect(() => {
    if (!state || !state.questions || state.questions.length === 0) {
      navigate('/dashboard');
      return;
    }
    if (hasRun.current) return;  // already ran once
    hasRun.current = true;
    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async () => {
    if (!state) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        answers: state.questions.map((q, i) => ({
          question_id: q.id,
          answer_text: state.answers[i] || 'I did not answer this question.',
          input_mode: 'text' as const,
        })),
      };
      const sessionResult = await analyzeSession(payload);
      setResult(sessionResult);

      // Save to Supabase
      if (user) await saveToSupabase(sessionResult);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Analysis failed: ${msg}. Make sure the Python backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async (sessionResult: SessionResult) => {
    if (!state || !user) return;
    try {
      // Create session
      const { data: session } = await supabase.from('interview_sessions').insert({
        user_id:         user.id,
        interview_type:  state.interviewType,
        interview_title: state.interviewTitle,
        question_ids:    state.questions.map(q => q.id),
        status:          'completed',
        overall_score:   sessionResult.session_scores.overall,
        completed_at:    new Date().toISOString(),
      }).select('id').single();

      if (session) {
        // Save per-question results
        const rows = sessionResult.results.map((r: AnalyzeResult) => ({
          session_id:          session.id,
          user_id:             user.id,
          question_id:         state.questions.find(q => q.question === r.question)?.id ?? 0,
          question_text:       r.question,
          answer_text:         r.answer,
          input_mode:          r.input_mode,
          semantic_relevance:  r.scores.semantic_relevance,
          sentiment:           r.scores.sentiment,
          keyword_match:       r.scores.keyword_match,
          clarity:             r.scores.clarity,
          delivery:            r.scores.delivery ?? null,
          overall_score:       r.scores.overall,
          matched_keywords:    r.matched_keywords,
          feedback:            r.feedback,
          sentiment_label:     r.sentiment_label,
          word_count:          r.word_count,
        }));
        await supabase.from('interview_results').insert(rows);
        setSaved(true);
      }
    } catch (err) {
      console.error('Failed to save results:', err);
    }
  };

  if (loading) {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner message="AI is analyzing your answers…" />
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
            This may take 10–30 seconds
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#fca5a5', marginBottom: 12 }}>Analysis Failed</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>{error}</p>
          <button className="btn-primary" onClick={runAnalysis}>Retry Analysis</button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginLeft: 12 }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const { session_scores, results } = result;

  // Derive strengths and weaknesses from per-question feedback
  const allFeedback = results.flatMap(r => r.feedback);
  const strengths  = allFeedback.filter(f => f.toLowerCase().includes('good') || f.toLowerCase().includes('excellent') || f.toLowerCase().includes('great'));
  const weaknesses = allFeedback.filter(f => f.toLowerCase().includes('too') || f.toLowerCase().includes('missing') || f.toLowerCase().includes('more') || f.toLowerCase().includes('short') || f.toLowerCase().includes('low'));

  const overallColor = session_scores.overall >= 70 ? '#10b981' : session_scores.overall >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>
            {session_scores.overall >= 70 ? '🏆' : session_scores.overall >= 50 ? '👍' : '📈'}
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: 8 }}>
            Interview <span className="gradient-text">Complete!</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>{state?.interviewTitle} · {results.length} questions analyzed</p>
          {saved && <p style={{ color: '#6ee7b7', fontSize: '0.8rem', marginTop: 4 }}>✓ Results saved to your profile</p>}
        </div>

        {/* Overall score + metrics */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            {/* Big overall score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 130, height: 130,
                border: `8px solid ${overallColor}`,
                borderRadius: '50%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: `0 0 30px ${overallColor}44`,
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: overallColor }}>
                  {Math.round(session_scores.overall)}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>/ 100</span>
              </div>
              <p style={{ fontWeight: 700, color: overallColor }}>Overall Score</p>
            </div>

            {/* 4 metric gauges */}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              <ScoreGauge label="Semantic" score={session_scores.semantic_relevance} />
              <ScoreGauge label="Confidence" score={session_scores.sentiment} />
              <ScoreGauge label="Keywords" score={session_scores.keyword_match} />
              <ScoreGauge label="Clarity" score={session_scores.clarity} />
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
          {/* Strengths */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#10b981', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✅</span> Strengths
            </h3>
            {strengths.length > 0 ? (
              <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
                {strengths.slice(0, 4).map((s, i) => (
                  <li key={i} style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 8, lineHeight: 1.6 }}>{s}</li>
                ))}
              </ul>
            ) : <p style={{ color: '#475569', fontSize: '0.875rem' }}>Keep practicing to build strengths!</p>}
          </div>

          {/* Areas to improve */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎯</span> To Improve
            </h3>
            {weaknesses.length > 0 ? (
              <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
                {weaknesses.slice(0, 4).map((w, i) => (
                  <li key={i} style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 8, lineHeight: 1.6 }}>{w}</li>
                ))}
              </ul>
            ) : <p style={{ color: '#475569', fontSize: '0.875rem' }}>Great job — minimal areas to improve!</p>}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.1rem' }}>
            📋 Question-by-Question Breakdown
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Question header */}
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.2)',
                    border: 'none', color: '#f1f5f9',
                    padding: '1rem 1.25rem', textAlign: 'left',
                    cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: 8 }}>Q{i+1}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {r.question.length > 80 ? r.question.substring(0, 80) + '…' : r.question}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontWeight: 800, fontSize: '1.1rem',
                      color: r.scores.overall >= 70 ? '#10b981' : r.scores.overall >= 50 ? '#6366f1' : '#f59e0b',
                    }}>
                      {Math.round(r.scores.overall)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{expanded === i ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded === i && (
                  <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                    {/* Scores row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: '1rem', justifyContent: 'space-around' }}>
                      {Object.entries(r.scores).filter(([k]) => k !== 'overall').map(([k, v]) => (
                        <ScoreGauge key={k} label={METRIC_LABELS[k] ?? k} score={v as number} size={80} />
                      ))}
                    </div>

                    {/* Your answer */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Your Answer</p>
                      <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{r.answer}</p>
                      <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: 6 }}>
                        {r.word_count} words · {r.sentiment_label} tone · {r.matched_keywords.length} keywords matched
                      </p>
                    </div>

                    {/* Matched keywords */}
                    {r.matched_keywords.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 6 }}>✅ Matched keywords:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {r.matched_keywords.map(kw => (
                            <span key={kw} style={{
                              background: 'rgba(16,185,129,0.1)', color: '#6ee7b7',
                              border: '1px solid rgba(16,185,129,0.3)',
                              padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem',
                            }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback bullets */}
                    <div>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 6 }}>💬 Feedback:</p>
                      <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
                        {r.feedback.map((fb, j) => (
                          <li key={j} style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4, lineHeight: 1.6 }}>{fb}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Try Another Interview →
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>
            📄 Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
