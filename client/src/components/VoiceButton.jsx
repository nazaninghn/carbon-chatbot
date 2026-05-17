import { useState, useRef } from 'react';

export default function VoiceButton({ onResult, lang, hint, recordingText }) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const toggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(lang === 'tr' ? 'Tarayıcınız sesi desteklemiyor (Chrome kullanın)' : 'Browser not supported — use Chrome');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'tr' ? 'tr-TR' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (e) => {
      setIsRecording(false);
      if (e.error === 'not-allowed') {
        setError(lang === 'tr' ? 'Mikrofon izni reddedildi' : 'Microphone permission denied');
      } else if (e.error === 'no-speech') {
        setError(lang === 'tr' ? 'Ses algılanamadı' : 'No speech detected');
      } else {
        setError(lang === 'tr' ? 'Ses hatası: ' + e.error : 'Voice error: ' + e.error);
      }
      setTimeout(() => setError(''), 3000);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 text-white scale-110 animate-pulse'
            : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200'
        }`}
        title={hint}
      >
        {isRecording ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
          {recordingText || '🎙 Listening...'}
        </div>
      )}

      {error && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
          {error}
        </div>
      )}
    </div>
  );
}
