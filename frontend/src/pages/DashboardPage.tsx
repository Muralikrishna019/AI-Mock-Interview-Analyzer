import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import InterviewCard from '../components/InterviewCard';

const INTERVIEWS = [
  {
    id: 'technical',
    title:  'Interview 1',
    description: 'A balanced mock interview combining technical, behavioral, and situational questions to evaluate overall readiness. This session provides a quick assessment of problem-solving ability, communication skills, and basic domain knowledge with real-time AI feedback.',
    category: 'Technical',
    questionCount: '7 questions · ~15 min',
    icon: '💻',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.1))',
  },
  {
    id: 'behavioral',
    title: 'Interview 2',
    description: 'An intelligent interview experience where questions dynamically span across coding, HR, and real-world scenarios. The AI adapts to your responses, ensuring a personalized evaluation of your strengths, weaknesses, and decision-making skills.',
    category: 'Behavioral',
    questionCount: '6 questions · ~12 min',
    icon: '🤝',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1))',
  },
  {
    id: 'hr',
    title: 'Interview 3',
    description: 'A full-length mock interview replicating real company hiring processes by blending technical challenges, behavioral questions, and domain-specific discussions. It delivers in-depth performance analysis, helping you prepare confidently for actual interviews.',
    category: 'HR',
    questionCount: '7 questions · ~12 min',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))',
  },
];

const categoryMap: Record<string, string | undefined> = {
  technical:  'Technical',
  behavioral: 'Behavioral',
  hr:         'HR',
  fullstack:  undefined, // mixed
  ml:         'Technical', // filter within Technical
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const startInterview = (interviewId: string) => {
    const category = categoryMap[interviewId];
    const params = new URLSearchParams({ type: interviewId });
    if (category) params.set('category', category);
    navigate(`/interview?${params.toString()}`);
  };

  return (
    <div className="hero-bg" style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem' }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: 8 }}>
            Welcome back, <span className="gradient-text">{user?.email?.split('@')[0]}</span> 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Choose an interview type below and start practicing with AI feedback.
          </p>
        </div>

        {/* Interview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {INTERVIEWS.map((interview, i) => (
            <InterviewCard
              key={interview.id}
              title={interview.title}
              description={interview.description}
              category={interview.category}
              questionCount={interview.questionCount}
              icon={interview.icon}
              gradient={interview.gradient}
              onStart={() => startInterview(interview.id)}
              index={i}
            />
          ))}
        </div>

        {/* Tips section */}
        <div className="glass-card animate-fade-in-up" style={{ marginTop: 32, padding: '1.5rem 2rem' }}>
          <h3 style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 12, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💡 Tips for best results
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              '🎙️ Use Chrome or Edge for voice recording',
              '📝 Aim for 30–120 words per answer',
              '🔑 Include technical keywords in your answers',
              '✅ Speak clearly and at a moderate pace',
            ].map((tip, i) => (
              <p key={i} style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{tip}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
