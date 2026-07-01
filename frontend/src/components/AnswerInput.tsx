import { useState, useRef, useEffect } from 'react';

interface AnswerInputProps {
  value: string;
  onChange: (val: string) => void;
  minWords?: number;
  maxWords?: number;
  disabled?: boolean;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export default function AnswerInput({ value, onChange, minWords = 20, maxWords = 150, disabled = false }: AnswerInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setHasSpeechAPI(!!SR);
  }, []);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const wordCountColor = wordCount < minWords ? '#f59e0b' : wordCount > maxWords ? '#ef4444' : '#10b981';

  const startRecording = () => {
    setMicError(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError('Speech Recognition not supported in this browser. Try Chrome.'); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) onChange(value + (value ? ' ' : '') + final.trim());
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      const err = (event as Event & { error: string }).error;
      if (err === 'not-allowed') setMicError('Microphone permission denied. Please allow microphone access.');
      else if (err === 'no-speech') setMicError('No speech detected. Try again.');
      else setMicError(`Speech error: ${err}`);
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value + (interimText ? ' ' + interimText : '')}
          onChange={e => {
            // Only update if not recording (recording fills via speech)
            if (!isRecording) onChange(e.target.value);
          }}
          disabled={disabled}
          placeholder="Type your answer here, or use the record button to speak your answer..."
          rows={6}
          className="input-field"
          style={{ resize: 'vertical', lineHeight: 1.7, fontSize: '0.95rem', color: interimText ? '#94a3b8' : '#f1f5f9' }}
        />
        {isRecording && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 20, padding: '4px 10px',
          }}>
            <div className="recording-dot" />
            <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>Recording…</span>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        {/* Word count */}
        <span style={{ color: wordCountColor, fontSize: '0.8rem', fontWeight: 500 }}>
          {wordCount} words {wordCount < minWords ? `(min ${minWords})` : wordCount > maxWords ? `(max ${maxWords})` : '✓'}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}

          {/* Record / Stop */}
          {hasSpeechAPI && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: isRecording ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(99,102,241,0.4)',
                background: isRecording ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                color: isRecording ? '#ef4444' : '#a5b4fc',
                transition: 'all 0.2s',
              }}
            >
              {isRecording ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  Record Answer
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {micError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem',
        }}>
          ⚠️ {micError}
        </div>
      )}

      {/* Info when no speech API */}
      {!hasSpeechAPI && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8, padding: '10px 14px', color: '#fcd34d', fontSize: '0.85rem',
        }}>
          💡 Audio recording requires Chrome or Edge browser. You can still type your answers.
        </div>
      )}
    </div>
  );
}
