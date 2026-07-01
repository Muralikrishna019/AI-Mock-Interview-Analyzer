import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchQuestions } from '../services/api';
import type { Question } from '../services/api';
import AnswerInput from '../components/AnswerInput';
import LoadingSpinner from '../components/LoadingSpinner';

const INTERVIEW_TITLES: Record<string, string> = {
  technical:  'Software Engineering Basics',
  behavioral: 'Behavioral Excellence',
  hr:         'HR & Culture Fit',
  fullstack:  'Full Stack Developer',
  ml:         'Data Science & ML',
};

const COUNT_MAP: Record<string, number> = {
  technical: 7, behavioral: 6, hr: 7, fullstack: 8, ml: 6,
};

export default function InterviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interviewType = searchParams.get('type') || 'technical';
  const category      = searchParams.get('category') || undefined;

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingSubmit, setLoadingSubmit]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const count = COUNT_MAP[interviewType] ?? 7;

  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const qs = await fetchQuestions(category, count);
      if (qs.length === 0) throw new Error('No questions received from backend.');
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(''));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to load questions: ${msg}. Make sure the Python backend is running on port 8000.`);
    } finally {
      setLoadingQuestions(false);
    }
  }, [category, count]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const handleNext = () => {
    const updated = [...answers];
    updated[currentIndex] = currentAnswer;
    setAnswers(updated);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setCurrentAnswer(updated[currentIndex + 1] || '');
    }
  };

  const handlePrev = () => {
    const updated = [...answers];
    updated[currentIndex] = currentAnswer;
    setAnswers(updated);
    setCurrentIndex(i => i - 1);
    setCurrentAnswer(updated[currentIndex - 1] || '');
  };

  const handleSubmit = async () => {
    const finalAnswers = [...answers];
    finalAnswers[currentIndex] = currentAnswer;

    // Validate at least something is filled
    const filled = finalAnswers.filter(a => a.trim().length > 5).length;
    if (filled === 0) { setError('Please answer at least one question before submitting.'); return; }

    setLoadingSubmit(true);
    setError(null);
    try {
      // Pass to results page via navigation state
      navigate('/results', {
        state: {
          interviewType,
          interviewTitle: INTERVIEW_TITLES[interviewType] || 'Mock Interview',
          questions,
          answers: finalAnswers,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLoadingSubmit(false);
    }
  };

  const isLast = currentIndex === questions.length - 1;
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const canProceed = wordCount >= (currentQ?.min_words ?? 5);

  if (loadingQuestions) {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="Loading interview questions…" />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: 500, padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#fca5a5', marginBottom: 12 }}>Backend Not Available</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20, lineHeight: 1.7 }}>{error}</p>
          <button className="btn-primary" onClick={loadQuestions}>Retry</button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginLeft: 12 }}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {INTERVIEW_TITLES[interviewType] || 'Mock Interview'}
            </p>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem' }}>
              Question <span className="gradient-text">{currentIndex + 1}</span> of {questions.length}
            </h1>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ✕ Exit
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-bar" style={{ marginBottom: '2rem' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        {currentQ && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            {/* Category tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <span style={{
                background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
              }}>
                {currentQ.category}
              </span>
              <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                Target: {currentQ.min_words}–{currentQ.max_words} words
              </span>
            </div>

            {/* Question text */}
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1.5rem', color: '#f1f5f9' }}>
              {currentQ.question}
            </h2>

            {/* Suggested keywords (subtle hint) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: 6 }}>💡 Consider covering:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {currentQ.keywords.slice(0, 5).map(kw => (
                  <span key={kw} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem',
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Answer Input */}
            <AnswerInput
              value={currentAnswer}
              onChange={setCurrentAnswer}
              minWords={currentQ.min_words}
              maxWords={currentQ.max_words}
              disabled={loadingSubmit}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={handlePrev}
            disabled={currentIndex === 0 || loadingSubmit}
            style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loadingSubmit}
              style={{ minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loadingSubmit ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing…
                </>
              ) : '🎯 Submit Interview'}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceed || loadingSubmit}
              title={!canProceed ? `Write at least ${currentQ?.min_words} words to continue` : ''}
            >
              Next →
            </button>
          )}
        </div>

        {!canProceed && currentAnswer.trim().length > 0 && (
          <p style={{ color: '#f59e0b', fontSize: '0.8rem', textAlign: 'right', marginTop: 8 }}>
            Write at least {currentQ?.min_words} words to continue ({wordCount}/{currentQ?.min_words})
          </p>
        )}
      </div>
    </div>
  );
}
