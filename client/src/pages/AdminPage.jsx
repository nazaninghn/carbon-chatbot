import { useState, useEffect, useCallback } from 'react';

const C = {
  pine: '#344E41',
  fern: '#588157',
  sage: '#A3B18A',
  dust: '#DAD7CD',
};

export default function AdminPage({ auth, lang, onBack }) {
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab]           = useState('dashboard');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Stable headers — derived from auth.token which is stable for the session
  const token = auth?.token || '';

  // useCallback so loadData has a stable reference for the dependency array
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/stats',    { headers }),
        fetch('/api/admin/users',    { headers }),
        fetch('/api/admin/sessions', { headers }),
      ]);
      if (statsRes.ok)    setStats(await statsRes.json());
      else                setError(`Stats: ${statsRes.status} ${statsRes.statusText}`);
      if (usersRes.ok)    { const d = await usersRes.json();    setUsers(d.users || []); }
      if (sessionsRes.ok) { const d = await sessionsRes.json(); setSessions(d.sessions || []); }
    } catch (e) {
      console.error(e);
      setError(lang === 'tr' ? 'Sunucuya bağlanılamadı' : 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  }, [token, lang]);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteUser = async (id) => {
    if (!confirm(lang === 'tr'
      ? 'Bu kullanıcıyı silmek istediğinizden emin misiniz?'
      : 'Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || `Delete failed (${res.status})`);
        return;
      }
      loadData();
    } catch { alert(lang === 'tr' ? 'Silme başarısız oldu' : 'Delete failed'); }
  };

  const deleteSession = async (id) => {
    if (!confirm(lang === 'tr'
      ? 'Bu oturumu silmek istediğinizden emin misiniz?'
      : 'Are you sure you want to delete this session?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || `Delete failed (${res.status})`);
        return;
      }
      loadData();
    } catch { alert(lang === 'tr' ? 'Silme başarısız oldu' : 'Delete failed'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f0ec' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${C.fern} transparent` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f2f0ec' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(163,177,138,0.2)' }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: C.pine }}>
            ← {lang === 'tr' ? 'Geri' : 'Back'}
          </button>
          <h1 className="text-lg font-semibold" style={{ color: C.pine }}>Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.fern }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {auth.user?.email}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Global error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
            ⚠ {error}
            <button onClick={loadData} className="ml-3 underline text-xs">
              {lang === 'tr' ? 'Tekrar dene' : 'Retry'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'rgba(163,177,138,0.15)' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'users',     label: lang === 'tr' ? '👥 Kullanıcılar' : '👥 Users' },
            { id: 'sessions',  label: lang === 'tr' ? '💬 Oturumlar'    : '💬 Sessions' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? 'white' : 'transparent',
                color:      tab === t.id ? C.pine  : C.fern,
                boxShadow:  tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: lang === 'tr' ? 'Toplam Kullanıcı' : 'Total Users',      value: stats.users,          icon: '👥', color: '#588157' },
                { label: lang === 'tr' ? 'Toplam Oturum'   : 'Total Sessions',    value: stats.sessions,       icon: '💬', color: '#3A5A40' },
                { label: lang === 'tr' ? 'Aktif Oturum'    : 'Active Sessions',   value: stats.activeSessions, icon: '🟢', color: '#A3B18A' },
                { label: 'Knowledge Chunks',                                        value: stats.knowledgeChunks,icon: '🧠', color: '#344E41' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(163,177,138,0.2)', backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-3xl font-bold" style={{ color: s.color }}>{s.value ?? '—'}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: C.fern }}>{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: C.sage }}>
              {error
                ? (lang === 'tr' ? 'İstatistikler yüklenemedi.' : 'Failed to load statistics.')
                : (lang === 'tr' ? 'İstatistik yok.'            : 'No statistics available.')}
              <button onClick={loadData} className="block mx-auto mt-3 underline text-xs" style={{ color: C.fern }}>
                {lang === 'tr' ? 'Yenile' : 'Refresh'}
              </button>
            </div>
          )
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(163,177,138,0.2)' }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(163,177,138,0.15)' }}>
              <span className="text-sm font-semibold" style={{ color: C.pine }}>
                {users.length} {lang === 'tr' ? 'kullanıcı' : 'users'}
              </span>
              <button onClick={loadData} className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(163,177,138,0.15)', color: C.fern }}>
                ↻ {lang === 'tr' ? 'Yenile' : 'Refresh'}
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(163,177,138,0.1)' }}>
              {users.map(u => (
                <div key={u._id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.pine }}>{u.name}</p>
                    <p className="text-xs" style={{ color: C.fern }}>{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    <span className="text-[10px]" style={{ color: C.sage }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                    {u.role !== 'admin' && (
                      <button onClick={() => deleteUser(u._id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="px-5 py-8 text-center text-sm" style={{ color: C.sage }}>
                  {lang === 'tr' ? 'Henüz kullanıcı yok' : 'No users yet'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sessions */}
        {tab === 'sessions' && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(163,177,138,0.2)' }}>
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(163,177,138,0.15)' }}>
              <span className="text-sm font-semibold" style={{ color: C.pine }}>
                {sessions.length} {lang === 'tr' ? 'oturum' : 'sessions'}
              </span>
              <button onClick={loadData} className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(163,177,138,0.15)', color: C.fern }}>
                ↻ {lang === 'tr' ? 'Yenile' : 'Refresh'}
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(163,177,138,0.1)' }}>
              {sessions.map(s => (
                <div key={s._id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.pine }}>{s.title || 'Untitled'}</p>
                    <p className="text-xs" style={{ color: C.fern }}>
                      {lang === 'tr' ? 'Aşama' : 'Phase'} {s.currentPhase} · {s.messages ?? 0} {lang === 'tr' ? 'mesaj' : 'messages'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                    <span className="text-[10px]" style={{ color: C.sage }}>
                      {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                    </span>
                    <button onClick={() => deleteSession(s._id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="px-5 py-8 text-center text-sm" style={{ color: C.sage }}>
                  {lang === 'tr' ? 'Henüz oturum yok' : 'No sessions yet'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
