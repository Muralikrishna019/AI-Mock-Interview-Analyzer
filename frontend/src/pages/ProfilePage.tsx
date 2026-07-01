import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import ScoreGauge from '../components/ScoreGauge';
import LoadingSpinner from '../components/LoadingSpinner';

interface SessionRow {
  id: string;
  interview_type: string;
  interview_title: string;
  overall_score: number;
  completed_at: string;
  status: string;
  question_ids: number[];
}

interface ResultRow {
  id: string;
  question_text: string;
  answer_text: string;
  input_mode: string;
  semantic_relevance: number;
  sentiment: number;
  keyword_match: number;
  clarity: number;
  delivery: number | null;
  overall_score: number;
  matched_keywords: string[];
  feedback: string[];
  sentiment_label: string;
  word_count: number;
}

const TYPE_ICONS: Record<string, string> = {
  technical: '💻',
  behavioral: '🤝',
  hr: '🎯',
  fullstack: '🌐',
  ml: '🧠',
};

const TYPE_LABELS: Record<string, string> = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  hr: 'HR',
  fullstack: 'Full Stack',
  ml: 'Data Science & ML',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function scoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#6366f1';
  return '#f59e0b';
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ResultRow[]>>({});
  const [loadingResults, setLoadingResults] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Fetch all sessions on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (!error && data) setSessions(data as SessionRow[]);
      setLoading(false);
    })();
  }, [user]);

  // Fetch per-question results when a session is expanded
  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);

    if (results[sessionId]) return; // already cached

    setLoadingResults(sessionId);
    const { data, error } = await supabase
      .from('interview_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });

    if (!error && data) {
      setResults(prev => ({ ...prev, [sessionId]: data as ResultRow[] }));
    }
    setLoadingResults(null);
  };

  // Derive unique interview types for filters
  const uniqueTypes = Array.from(new Set(sessions.map(s => s.interview_type))).sort();

  // Filtered sessions
  const filteredSessions = activeFilter === 'all'
    ? sessions
    : sessions.filter(s => s.interview_type === activeFilter);

  // Derived stats (from ALL sessions, not filtered)
  const totalInterviews = sessions.length;
  const avgScore = totalInterviews > 0
    ? Math.round(sessions.reduce((s, r) => s + (r.overall_score ?? 0), 0) / totalInterviews)
    : 0;
  const bestScore = totalInterviews > 0
    ? Math.round(Math.max(...sessions.map(s => s.overall_score ?? 0)))
    : 0;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* ── Profile Card ───────────────────────────────────────────── */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: 'white',
              flexShrink: 0,
            }}>
              {user?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontWeight: 900, fontSize: '1.75rem', marginBottom: 4 }}>
                <span className="gradient-text">{user?.email?.split('@')[0]}</span>
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>{user?.email}</p>
              <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>Member since {memberSince}</p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(99,102,241,0.15)',
          }}>
            {[
              [String(totalInterviews), 'Interviews'],
              [avgScore > 0 ? String(avgScore) : '—', 'Avg Score'],
              [bestScore > 0 ? String(bestScore) : '—', 'Best Score'],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }} className="gradient-text">{val}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Interview History ───────────────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.25rem' }}>
            📋 Interview <span className="gradient-text">History</span>
          </h2>

          {/* ── Filter Buttons ──────────────────────────────────────── */}
          {!loading && sessions.length > 0 && uniqueTypes.length > 1 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              marginBottom: '1.25rem',
            }}>
              {/* "All" button */}
              <button
                onClick={() => setActiveFilter('all')}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  border: activeFilter === 'all'
                    ? '1px solid #6366f1'
                    : '1px solid rgba(99,102,241,0.25)',
                  background: activeFilter === 'all'
                    ? 'rgba(99,102,241,0.25)'
                    : 'rgba(99,102,241,0.06)',
                  color: activeFilter === 'all' ? '#a5b4fc' : '#64748b',
                }}
              >
                All ({sessions.length})
              </button>

              {uniqueTypes.map(type => {
                const count = sessions.filter(s => s.interview_type === type).length;
                const isActive = activeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      border: isActive
                        ? '1px solid #6366f1'
                        : '1px solid rgba(99,102,241,0.25)',
                      background: isActive
                        ? 'rgba(99,102,241,0.25)'
                        : 'rgba(99,102,241,0.06)',
                      color: isActive ? '#a5b4fc' : '#64748b',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span>{TYPE_ICONS[type] ?? '📝'}</span>
                    {TYPE_LABELS[type] ?? type} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <LoadingSpinner message="Loading your interviews…" />
          ) : sessions.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎤</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>No interviews yet</h3>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Complete your first mock interview to see your history here.
              </p>
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                Start an Interview →
              </button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                No interviews found for this filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredSessions.map((session) => {
                const isExpanded = expandedId === session.id;
                const sessionResults = results[session.id];
                const isLoadingThis = loadingResults === session.id;
                const color = scoreColor(session.overall_score ?? 0);

                return (
                  <div key={session.id} className="glass-card" style={{
                    overflow: 'hidden',
                    borderColor: isExpanded ? 'rgba(99,102,241,0.4)' : undefined,
                  }}>
                    {/* Session header (clickable) */}
                    <button
                      onClick={() => toggleExpand(session.id)}
                      style={{
                        width: '100%', background: 'transparent', border: 'none',
                        color: '#f1f5f9', padding: '1.25rem 1.5rem', textAlign: 'left',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                          {TYPE_ICONS[session.interview_type] ?? '📝'}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                            {session.interview_title}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {formatDate(session.completed_at)} · {session.question_ids?.length ?? '?'} questions
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{
                          width: 48, height: 48,
                          border: `3px solid ${color}`,
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 0 12px ${color}33`,
                        }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color }}>
                            {Math.round(session.overall_score ?? 0)}
                          </span>
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded per-question details */}
                    {isExpanded && (
                      <div style={{
                        padding: '0 1.5rem 1.5rem',
                        borderTop: '1px solid rgba(99,102,241,0.1)',
                      }}>
                        {isLoadingThis ? (
                          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                            <LoadingSpinner message="Loading details…" />
                          </div>
                        ) : !sessionResults || sessionResults.length === 0 ? (
                          <p style={{ color: '#475569', padding: '1rem 0', textAlign: 'center', fontSize: '0.875rem' }}>
                            No detailed results available for this session.
                          </p>
                        ) : (
                          <>
                            {/* Session-level score gauges */}
                            <div style={{
                              display: 'flex', gap: 20, flexWrap: 'wrap',
                              justifyContent: 'center', padding: '1.25rem 0',
                            }}>
                              {(() => {
                                const avg = (key: keyof ResultRow) => {
                                  const vals = sessionResults
                                    .map(r => r[key] as number)
                                    .filter(v => v != null && !isNaN(v));
                                  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                                };
                                return (
                                  <>
                                    <ScoreGauge label="Semantic" score={avg('semantic_relevance')} size={80} />
                                    <ScoreGauge label="Confidence" score={avg('sentiment')} size={80} />
                                    <ScoreGauge label="Keywords" score={avg('keyword_match')} size={80} />
                                    <ScoreGauge label="Clarity" score={avg('clarity')} size={80} />
                                  </>
                                );
                              })()}
                            </div>

                            {/* Per-question list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                              {sessionResults.map((r, i) => (
                                <QuestionResult key={r.id} result={r} index={i} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-component: single question result ──────────────────────────── */
function QuestionResult({ result: r, index: i }: { result: ResultRow; index: number }) {
  const [open, setOpen] = useState(false);
  const color = scoreColor(r.overall_score);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.15)',
      border: '1px solid rgba(99,102,241,0.1)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: '#f1f5f9', padding: '0.75rem 1rem', textAlign: 'left',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: '0.875rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: '#94a3b8', marginRight: 8 }}>Q{i + 1}</span>
          <span style={{ fontWeight: 600 }}>
            {r.question_text.length > 70 ? r.question_text.substring(0, 70) + '…' : r.question_text}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, color }}>{Math.round(r.overall_score)}</span>
          <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(99,102,241,0.08)' }}>
          {/* Score gauges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '0.75rem', justifyContent: 'space-around' }}>
            <ScoreGauge label="Semantic" score={r.semantic_relevance} size={68} />
            <ScoreGauge label="Confidence" score={r.sentiment} size={68} />
            <ScoreGauge label="Keywords" score={r.keyword_match} size={68} />
            <ScoreGauge label="Clarity" score={r.clarity} size={68} />
            {r.delivery != null && <ScoreGauge label="Delivery" score={r.delivery} size={68} />}
          </div>

          {/* Answer */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <p style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your Answer</p>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{r.answer_text}</p>
            <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: 6 }}>
              {r.word_count} words · {r.sentiment_label} tone · {r.matched_keywords?.length ?? 0} keywords matched
            </p>
          </div>

          {/* Keywords */}
          {r.matched_keywords && r.matched_keywords.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 4 }}>✅ Matched keywords:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {r.matched_keywords.map(kw => (
                  <span key={kw} style={{
                    background: 'rgba(16,185,129,0.1)', color: '#6ee7b7',
                    border: '1px solid rgba(16,185,129,0.3)',
                    padding: '2px 7px', borderRadius: 6, fontSize: '0.7rem',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {r.feedback && r.feedback.length > 0 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 4 }}>💬 Feedback:</p>
              <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
                {r.feedback.map((fb, j) => (
                  <li key={j} style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 3, lineHeight: 1.5 }}>{fb}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
