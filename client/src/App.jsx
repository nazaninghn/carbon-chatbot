import { useState, useEffect, useRef } from 'react';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

// Demo credentials — override via VITE_DEMO_EMAIL / VITE_DEMO_PASS in .env
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'demo@carboniq.app';
const DEMO_PASS  = import.meta.env.VITE_DEMO_PASS  || 'carboniq2024';
const DEMO_NAME  = import.meta.env.VITE_DEMO_NAME  || 'Demo User';

async function getAuth() {
  // 1. Valid token already in storage?
  const stored = localStorage.getItem('ciq_token');
  if (stored) {
    const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored}` } });
    if (r.ok) { const d = await r.json(); return { token: stored, user: d.user }; }
    localStorage.removeItem('ciq_token');
    localStorage.removeItem('ciq_session');
  }
  // 2. Try login
  const login = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASS }),
  });
  if (login.ok) {
    const d = await login.json();
    localStorage.setItem('ciq_token', d.token);
    return { token: d.token, user: d.user };
  }
  // 3. Register demo account (first ever visit)
  const reg = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASS }),
  });
  if (reg.ok) {
    const d = await reg.json();
    localStorage.setItem('ciq_token', d.token);
    return { token: d.token, user: d.user };
  }
  return null;
}

export default function App() {
  const [lang, setLang]   = useState('tr');
  const [auth, setAuth]   = useState(null);
  const [ready, setReady] = useState(false);
  const [view, setView]   = useState('chat');
  const retryRef    = useRef(null);
  const retryCount  = useRef(0);
  const MAX_RETRIES = 20; // ~60 s of attempts before giving up

  const tryConnect = () => {
    getAuth()
      .then(result => {
        if (result) { retryCount.current = 0; setAuth(result); setReady(true); }
        else if (retryCount.current < MAX_RETRIES) {
          // Backend waking up (Render free tier) — retry with backoff
          retryCount.current++;
          const delay = Math.min(3000 * retryCount.current, 15000);
          retryRef.current = setTimeout(tryConnect, delay);
        } else {
          setReady(true); // show app anyway; individual fetches will fail gracefully
        }
      })
      .catch(() => {
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          retryRef.current = setTimeout(tryConnect, 3000);
        } else {
          setReady(true);
        }
      });
  };

  useEffect(() => {
    tryConnect();
    return () => clearTimeout(retryRef.current);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'linear-gradient(150deg,#dde8d8 0%,#c8d9be 30%,#b5c9a8 60%,#a3b895 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#588157 transparent' }} />
        <p className="text-sm" style={{ color: '#588157' }}>Loading...</p>
      </div>
    );
  }

  if (view === 'admin' && auth?.user?.role === 'admin') {
    return <AdminPage auth={auth} lang={lang} onBack={() => setView('chat')} />;
  }

  return (
    <ChatPage
      lang={lang} setLang={setLang}
      auth={auth}
      onLogout={() => { localStorage.removeItem('ciq_token'); localStorage.removeItem('ciq_session'); setAuth(null); setReady(false); tryConnect(); }}
      onAdmin={() => setView('admin')}
    />
  );
}
