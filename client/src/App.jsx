import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [auth, setAuth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState('chat'); // 'chat' or 'admin'

  useEffect(() => {
    const token = localStorage.getItem('ciq_token');
    if (!token) { setChecking(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setAuth({ token, user: data.user }))
      .catch(() => { localStorage.removeItem('ciq_token'); localStorage.removeItem('ciq_session'); })
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ciq_token');
    localStorage.removeItem('ciq_session');
    setAuth(null);
    setView('chat');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(150deg, #dde8d8 0%, #c8d9be 30%, #b5c9a8 60%, #a3b895 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#588157 transparent' }} />
      </div>
    );
  }

  if (!auth) {
    return <AuthPage lang={lang} setLang={setLang} onAuth={setAuth} />;
  }

  if (view === 'admin' && auth.user?.role === 'admin') {
    return <AdminPage auth={auth} lang={lang} onBack={() => setView('chat')} />;
  }

  return <ChatPage lang={lang} setLang={setLang} auth={auth} onLogout={handleLogout} onAdmin={() => setView('admin')} />;
}
