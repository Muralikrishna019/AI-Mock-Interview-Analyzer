import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: '🎯', title: 'AI-Powered Scoring', desc: 'Get scored on semantic relevance, clarity, keyword match, and more.' },
    { icon: '🎙️', title: 'Voice & Text Input', desc: 'Answer by typing or speaking — Web Speech API converts speech to text.' },
    { icon: '📊', title: 'Detailed Feedback', desc: 'Receive per-question breakdowns with strengths, weaknesses, and tips.' },
    { icon: '🧠', title: 'Diverse Question Bank', desc: '250+ questions spanning Technical, HR, and Behavioral categories.' },
    { icon: '🔒', title: 'Secure & Private', desc: 'Powered by Supabase Auth. Your interview data stays yours.' },
    { icon: '⚡', title: 'Real-Time Evaluation', desc: 'NLP models evaluate your answers instantly using your own analyzer.' },
  ];

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', paddingTop: 80 }}>
      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <div className="animate-fade-in-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 24,
        }}>
          <span style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 500 }}>✨ AI-Powered Interview Coach</span>
        </div>

        <h1 className="animate-fade-in-up gradient-text" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 900, lineHeight: 1.15,
          marginBottom: '1.5rem', animationDelay: '0.1s', opacity: 0,
        }}>
          Ace Your Next Interview<br/>with AI Feedback
        </h1>

        <p className="animate-fade-in-up" style={{
          color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.7,
          maxWidth: 620, margin: '0 auto 2.5rem',
          animationDelay: '0.2s', opacity: 0,
        }}>
          Practice real interview questions, speak or type your answers, and get instant AI-powered
          scoring across 5 dimensions — just like a real interview coach.
        </p>

        <div className="animate-fade-in-up" style={{
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          animationDelay: '0.3s', opacity: 0,
        }}>
          {user ? (
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 32px' }}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 32px' }}>
                Start Free →
              </Link>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 32px' }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 2rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[['250+', 'Questions'], ['5', 'AI Metrics'], ['3', 'Categories']].map(([num, lbl]) => (
            <div key={lbl} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }} className="gradient-text">{num}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 6rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '2rem', marginBottom: '3rem' }}>
          Everything You Need to <span className="gradient-text">Prepare</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card animate-fade-in-up" style={{
              padding: '1.5rem', display: 'flex', gap: 16, alignItems: 'flex-start',
              animationDelay: `${i * 0.1}s`, opacity: 0,
            }}>
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 6, color: '#f1f5f9' }}>{f.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '0 2rem 6rem' }}>
        {!user && (
          <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: 12 }}>
              Ready to <span className="gradient-text">Level Up?</span>
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>Join now and start practicing with AI-powered feedback.</p>
            <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 36px' }}>
              Create Free Account →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
