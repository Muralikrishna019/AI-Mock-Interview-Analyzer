interface InterviewCardProps {
  title: string;
  description: string;
  category: string;
  questionCount: string;
  icon: string;
  gradient: string;
  onStart: () => void;
  index?: number;
}

const categoryColors: Record<string, string> = {
  Technical:  'rgba(6, 182, 212, 0.15)',
  HR:         'rgba(99, 102, 241, 0.15)',
  Behavioral: 'rgba(139, 92, 246, 0.15)',
  Mixed:      'rgba(16, 185, 129, 0.15)',
  'Data Science': 'rgba(245, 158, 11, 0.15)',
};
const categoryText: Record<string, string> = {
  Technical:  '#06b6d4',
  HR:         '#a5b4fc',
  Behavioral: '#c4b5fd',
  Mixed:      '#6ee7b7',
  'Data Science': '#fcd34d',
};

export default function InterviewCard({
  title, description, category, questionCount, icon, gradient, onStart, index = 0,
}: InterviewCardProps) {
  return (
    <div
      className="glass-card animate-fade-in-up"
      style={{
        padding: '1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        animationDelay: `${index * 0.1}s`, opacity: 0,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 56, height: 56,
        background: gradient,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.75rem',
      }}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: '#f1f5f9' }}>
          {title}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 12 }}>
          {description}
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: categoryColors[category] || 'rgba(99,102,241,0.15)',
            color: categoryText[category] || '#a5b4fc',
            padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
          }}>
            {category}
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8',
            padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem',
          }}>
            {questionCount}
          </span>
        </div>
      </div>

      <button className="btn-primary" onClick={onStart} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Start Interview
      </button>
    </div>
  );
}
