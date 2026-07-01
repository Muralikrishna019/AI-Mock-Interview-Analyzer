import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(15, 15, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }} className="gradient-text">
            InterviewAI
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" style={{ color: '#94a3b8', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                Dashboard
              </Link>
              <Link to="/profile" style={{ color: '#94a3b8', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                Profile
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8, padding: '4px 12px',
                    fontSize: '0.85rem', color: '#a5b4fc',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}>
                    {user.email?.split('@')[0]}
                  </div>
                </Link>
                <button onClick={handleSignOut} className="btn-danger" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#94a3b8', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                Login
              </Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px', textDecoration: 'none', borderRadius: 8 }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
