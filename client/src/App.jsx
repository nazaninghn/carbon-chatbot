import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

async function autoLogin() {
  // Try existing token first
  const token = localStorage.getItem('ciq_token');
  if (token) {
    const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const data = await r.json();
      return { token, user: data.user };
    }
    localStorage.removeItem('ciq_token');
    localStorage.removeItem('ciq_session');
  }
  // Auto-register a guest account
  const guestId = localStorage.getItem('ciq_guest_id') || crypto.randomUUID();
  localStorage.setItem('ciq_guest_id', guestId);
  const r = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Guest',
      email: `guest_${guestId}@carboniq.app`,
      password: guestId,
      company: '',
    }),
  });
  if (r.ok) {
    const data = await r.json();
    localStorage.setItem('ciq_token', data.token);
    return { token: data.token, user: data.user };
  }
  // Guest already registered — login
  const r2 = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `guest_${guestId}@carboniq.app`, password: guestId }),
  });
  if (r2.ok) {
    const data = await r2.json();
    localStorage.setItem('ciq_token', data.token);
    return { token: data.token, user: data.user };
  }
  return null;
}

export default function App() {
  const [lang, setLang] = useState('tr');
  const [auth, setAuth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState('chat');

  useEffect(() => {
    autoLogin()
      .then(result => { if (result) setAuth(result); })
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ciq_token');
    localStorage.removeItem('ciq_session');
    setAuth(null);
    setView('chat');
  };

  if (checking || !auth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(150deg, #dde8d8 0%, #c8d9be 30%, #b5c9a8 60%, #a3b895 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#588157 transparent' }} />
        {!checking && <p className="text-sm" style={{ color: '#588157' }}>Connecting...</p>}
      </div>
    );
  }

  if (view === 'admin' && auth.user?.role === 'admin') {
    return <AdminPage auth={auth} lang={lang} onBack={() => setView('chat')} />;
  }

  return <ChatPage lang={lang} setLang={setLang} auth={auth} onLogout={handleLogout} onAdmin={() => setView('admin')} />;
}
