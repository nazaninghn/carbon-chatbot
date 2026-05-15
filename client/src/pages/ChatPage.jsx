import { useState, useRef, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';
import VoiceButton from '../components/VoiceButton';
import FileUpload from '../components/FileUpload';
import ChatMessage from '../components/ChatMessage';

const TOTAL_QUESTIONS = 133;
const PHASES = [
  { id: 1, count: 21 },
  { id: 2, count: 14 },
  { id: 3, count: 29 },
  { id: 4, count: 15 },
  { id: 5, count: 28 },
  { id: 6, count: 27 },
  { id: 7, count: 5  },
];
const PHASE_OFFSETS = PHASES.reduce((acc, p, i) => {
  acc[p.id] = PHASES.slice(0, i).reduce((s, x) => s + x.count, 0);
  return acc;
}, {});

const G = {
  sidebar:      'rgba(255,255,255,0.42)',
  sidebarBorder:'rgba(255,255,255,0.75)',
  sidebarHover: 'rgba(255,255,255,0.55)',
  chat:         'rgba(255,255,255,0.88)',
  chatBorder:   'rgba(255,255,255,0.8)',
  input:        'rgba(255,255,255,0.75)',
  inputBorder:  'rgba(163,177,138,0.3)',
  header:       'rgba(255,255,255,0.7)',
  divider:      'rgba(163,177,138,0.14)',
};

const C = {
  pine:    '#344E41',
  hunter:  '#3A5A40',
  fern:    '#588157',
  sage:    '#A3B18A',
  text:    '#2d3b2e',
  textMid: 'rgba(52,78,65,0.55)',
  textDim: 'rgba(52,78,65,0.32)',
};

function buildReportHTML(lang, exportData) {
  const meta       = exportData?.summary?.reportMeta   || {};
  const emissions  = exportData?.summary?.emissions    || {};
  const assumptions= exportData?.summary?.assumptions  || [];
  const completeness = exportData?.summary?.dataCompleteness || {};
  const date = new Date().toLocaleDateString('tr-TR');

  const field = (label, val) => val
    ? `<div class="field"><label>${label}</label><span>${val}</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}"><head>
<meta charset="UTF-8">
<title>CarbonIQ — Karbon Raporu</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#2d3b2e;background:#fff;padding:40px;max-width:860px;margin:0 auto}
  .hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:3px solid #588157;margin-bottom:32px}
  .hdr h1{font-size:26px;font-weight:700;color:#344E41}
  .hdr .sub{font-size:13px;color:#A3B18A;margin-top:4px}
  .badge{background:#eef1ea;color:#344E41;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid #A3B18A}
  h2{font-size:15px;font-weight:700;color:#344E41;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #e4e0da}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .field{background:#f8f7f5;border:1px solid #e4e0da;border-radius:8px;padding:10px 14px}
  .field label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#A3B18A;display:block;margin-bottom:3px}
  .field span{font-size:13px;font-weight:500;color:#344E41}
  .em-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0}
  .em{background:#eef1ea;border:1px solid #A3B18A;border-radius:10px;padding:14px;text-align:center}
  .em.total{background:#344E41;border-color:#344E41}
  .em label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#588157;display:block;margin-bottom:6px}
  .em.total label{color:#A3B18A}
  .em span{font-size:20px;font-weight:700;color:#344E41}
  .em.total span{color:#fff}
  .em small{display:block;font-size:10px;color:#A3B18A;margin-top:2px}
  .em.total small{color:#A3B18A}
  .prog{display:flex;align-items:center;gap:12px;margin-top:4px}
  .prog-num{font-size:28px;font-weight:700;color:#588157}
  .prog-bar{flex:1;height:6px;background:#e4e0da;border-radius:3px;overflow:hidden}
  .prog-fill{height:100%;background:linear-gradient(90deg,#A3B18A,#588157);border-radius:3px}
  .assume{display:flex;align-items:flex-start;gap:8px;background:#fdf6e3;border:1px solid #f0e0a0;border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:12px;color:#7a6000}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e4e0da;font-size:11px;color:#A3B18A;display:flex;justify-content:space-between}
  @media print{body{padding:20px}}
</style></head><body>
<div class="hdr">
  <div><h1>Karbon Ayak İzi Raporu</h1><div class="sub">ISO 14064-1 Uyumlu · CarbonIQ</div></div>
  <div><div class="badge">ISO 14064-1 Compliant</div><div style="font-size:11px;color:#A3B18A;margin-top:6px;text-align:right">${date}</div></div>
</div>

<h2>${lang === 'tr' ? 'Şirket Bilgileri' : 'Company Information'}</h2>
<div class="grid2">
  ${field('Şirket Adı', meta.companyName)}
  ${field('VKN / Vergi No', meta.vkn)}
  ${field('Ülke', meta.country)}
  ${field('Şehir', meta.city)}
  ${field('Raporlama Yılı', meta.reportingYear)}
  ${field('Baz Yıl', meta.baselineYear)}
  ${field('Sektör', meta.sector)}
  ${field('Sınır Yaklaşımı', meta.boundaryApproach)}
  ${field('EF Veritabanı', meta.efDatabase)}
  ${field('Kapsam 3 Yaklaşımı', meta.scope3Approach)}
</div>

<h2>${lang === 'tr' ? 'Emisyon Özeti (tCO₂e)' : 'Emissions Summary (tCO₂e)'}</h2>
<div class="em-grid">
  <div class="em"><label>Kapsam 1</label><span>${(emissions.scope1||0).toFixed(2)}</span><small>Doğrudan</small></div>
  <div class="em"><label>Kapsam 2</label><span>${(emissions.scope2||0).toFixed(2)}</span><small>Dolaylı Enerji</small></div>
  <div class="em"><label>Kapsam 3</label><span>${(emissions.scope3||0).toFixed(2)}</span><small>Diğer Dolaylı</small></div>
  <div class="em total"><label>Toplam</label><span>${(emissions.total||0).toFixed(2)}</span><small>tCO₂e</small></div>
</div>

${completeness?.percentage !== undefined ? `
<h2>${lang === 'tr' ? 'Veri Tamamlanma' : 'Data Completeness'}</h2>
<div class="prog">
  <div class="prog-num">${completeness.percentage}%</div>
  <div class="prog-bar"><div class="prog-fill" style="width:${completeness.percentage}%"></div></div>
  <span style="font-size:12px;color:#A3B18A">${completeness.answeredQuestions||0}/${completeness.totalQuestions||133} soru</span>
</div>` : ''}

${assumptions.length ? `
<h2>${lang === 'tr' ? `Varsayımlar & Uyarılar (${assumptions.length})` : `Assumptions & Warnings (${assumptions.length})`}</h2>
${assumptions.map(a => `<div class="assume">⚠ ${typeof a === 'string' ? a : (a.content || a.text || '')}</div>`).join('')}` : ''}

<div class="footer">
  <span>CarbonIQ · ISO 14064-1 Karbon Envanter Raporu</span>
  <span>${lang === 'tr' ? 'Oluşturulma' : 'Generated'}: ${new Date().toLocaleString('tr-TR')}</span>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
}

// Question ID → human label map for report preview
const Q_LABELS = {
  tr: {
    A1: 'Şirket Adı', A2: 'Vergi No (VKN)', A3: 'Ülke / Şehir', A4: 'Raporlama Yılı',
    A5: 'Hazırlayan', A6: 'Rapor Amacı', A7: 'Çalışan Sayısı', A8: 'Ciro (TL)',
    B1: 'Baz Yıl', B2: 'Baz Yıl Emisyonu', B3: 'Baz Yıl Değişim',
    C1: 'Sektör', C2: 'Ana Faaliyet', C3: 'Tesis Sayısı',
    D1: 'Sınır Yaklaşımı', D2: 'EF Veritabanı', D3: 'Kapsam 3 Yaklaşımı', D4: 'Doğrulama',
  },
  en: {
    A1: 'Company Name', A2: 'Tax ID (VKN)', A3: 'Country / City', A4: 'Reporting Year',
    A5: 'Prepared By', A6: 'Report Purpose', A7: 'Employee Count', A8: 'Revenue',
    B1: 'Base Year', B2: 'Base Year Emissions', B3: 'Base Year Change',
    C1: 'Sector', C2: 'Main Activity', C3: 'Facility Count',
    D1: 'Boundary Approach', D2: 'EF Database', D3: 'Scope 3 Approach', D4: 'Verification',
  },
};


export default function ChatPage({ lang, setLang, auth, onLogout, onAdmin }) {
  const t = translations[lang];

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [ready, setReady]               = useState(false);
  const [started, setStarted]           = useState(false);
  const [restoring, setRestoring]       = useState(true);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [sidebarTab, setSidebarTab]     = useState('phases');
  const [sessions, setSessions]         = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportData, setExportData]     = useState(null);
  const [showExport, setShowExport]     = useState(false);
  const [exportTab, setExportTab]       = useState('summary');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const sessionRef     = useRef(null);
  const tokenRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Init: set token from auth prop, then restore session ──
  useEffect(() => {
    if (auth?.token) {
      tokenRef.current = auth.token;
      const savedSession = localStorage.getItem('ciq_session');
      if (savedSession) {
        restoreSession(auth.token, savedSession);
      } else {
        setRestoring(false);
      }
    } else {
      setRestoring(false);
    }
  }, [auth]);

  const applySession = useCallback((token, sessionId, session) => {
    tokenRef.current   = token;
    sessionRef.current = sessionId;
    if (session.messages?.length) {
      setMessages(session.messages.map(m => ({
        role:    m.role,
        content: m.content,
        ts:      new Date(m.timestamp || m.createdAt || Date.now()).getTime(),
      })));
    }
    if (session.currentPhase) setCurrentPhase(session.currentPhase);
    const qNum = session.messages?.filter(m => m.role === 'user').length || 0;
    setQuestionNumber(qNum);
    setReady(true);
    setStarted(true);
  }, []);

  const restoreSession = useCallback(async (token, sessionId) => {
    setRestoring(true);
    try {
      const me = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!me.ok) throw new Error('invalid token');
      const res = await fetch(`/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('session not found');
      const data = await res.json();
      applySession(token, sessionId, data.session || data);
    } catch {
      localStorage.removeItem('ciq_token');
      localStorage.removeItem('ciq_session');
    } finally {
      setRestoring(false);
    }
  }, [applySession]);

  const initChat = useCallback(async () => {
    setIsTyping(true);
    try {
      const token = tokenRef.current;
      if (!token) throw new Error('no token');

      const sess = await fetch('/api/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: `Rapor ${new Date().toLocaleDateString('tr-TR')}` }),
      });
      if (!sess.ok) throw new Error('session');
      sessionRef.current = (await sess.json()).session._id;
      localStorage.setItem('ciq_session', sessionRef.current);

      const start = await fetch('/api/chat/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: sessionRef.current, lang }),
      });
      if (!start.ok) throw new Error('start');
      const data = await start.json();

      if (data.message)        setMessages([{ role: 'assistant', content: data.message, ts: Date.now() }]);
      if (data.phase)          setCurrentPhase(data.phase);
      if (data.questionNumber) setQuestionNumber(data.questionNumber);
      setReady(true);
      setStarted(true);
    } catch (err) {
      console.error(err);
      setMessages([{ role: 'assistant', content: t.chat.connectionError, ts: Date.now() }]);
      setStarted(true);
    } finally {
      setIsTyping(false);
    }
  }, [lang, t]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isTyping || !ready) return;
    setMessages(p => [...p, { role: 'user', content: text.trim(), ts: Date.now() }]);
    setInput('');
    setIsTyping(true);
    try {
      const res  = await fetch('/api/chat/message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ message: text.trim(), sessionId: sessionRef.current, lang }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(p => [...p, { role: 'assistant', content: data.message, ts: Date.now() }]);
        if (data.phase)          setCurrentPhase(data.phase);
        if (data.questionNumber) setQuestionNumber(data.questionNumber);
      } else throw new Error('no message');
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: t.chat.errorRetry, ts: Date.now() }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [isTyping, ready, lang, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!started) { initChat(); return; }
    sendMessage(input);
  };

  // ── Session history ──
  const loadSessions = useCallback(async () => {
    if (!tokenRef.current) return;
    setSessionsLoading(true);
    try {
      const res  = await fetch('/api/sessions', { headers: { Authorization: `Bearer ${tokenRef.current}` } });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch { setSessions([]); }
    finally  { setSessionsLoading(false); }
  }, []);

  const switchSession = useCallback(async (sessionId) => {
    if (!tokenRef.current) return;
    setIsTyping(true);
    try {
      const res  = await fetch(`/api/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${tokenRef.current}` } });
      const data = await res.json();
      localStorage.setItem('ciq_session', sessionId);
      applySession(tokenRef.current, sessionId, data.session || data);
      setSidebarTab('phases');
      setSidebarOpen(false);
    } catch (err) { console.error(err); }
    finally       { setIsTyping(false); }
  }, [applySession]);

  const deleteSession = useCallback(async (e, sessionId) => {
    e.stopPropagation();
    if (!tokenRef.current) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      setSessions(p => p.filter(s => s._id !== sessionId));
      if (sessionRef.current === sessionId) {
        localStorage.removeItem('ciq_session');
        sessionRef.current = null;
        setMessages([]);
        setStarted(false);
        setReady(false);
        setCurrentPhase(1);
        setQuestionNumber(0);
      }
    } catch (err) { console.error(err); }
  }, []);

  // ── Export ──
  const openExport = useCallback(async () => {
    if (!tokenRef.current || !sessionRef.current) return;
    setExportLoading(true);
    try {
      const [sumRes, fullRes] = await Promise.all([
        fetch(`/api/sessions/${sessionRef.current}/summary`, { headers: { Authorization: `Bearer ${tokenRef.current}` } }),
        fetch(`/api/sessions/${sessionRef.current}`,         { headers: { Authorization: `Bearer ${tokenRef.current}` } }),
      ]);
      const summary = await sumRes.json();
      const full    = await fullRes.json();
      setExportData({ summary, session: full.session || full });
      setShowExport(true);
    } catch (err) { console.error(err); }
    finally       { setExportLoading(false); }
  }, []);

  const printReport = useCallback(() => {
    const w = window.open('', '_blank');
    w.document.write(buildReportHTML(lang, exportData));
    w.document.close();
  }, [lang, exportData]);

  // ── Progress ──
  const progressPct = TOTAL_QUESTIONS ? Math.round((questionNumber / TOTAL_QUESTIONS) * 100) : 0;
  const phaseProgressPct = (() => {
    const ph   = PHASES.find(p => p.id === currentPhase);
    if (!ph) return 0;
    const done = questionNumber - PHASE_OFFSETS[currentPhase];
    return Math.min(100, Math.round((Math.max(0, done) / ph.count) * 100));
  })();

  // ── SIDEBAR ───────────────────────────────────────────────────
  const SidebarContent = ({ onClose }) => (
    <div
      className="flex flex-col h-full"
      style={{
        background:          'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.38) 100%)',
        backdropFilter:       'blur(32px) saturate(180%) brightness(1.08)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%) brightness(1.08)',
        borderRight:          '1px solid rgba(255,255,255,0.7)',
        boxShadow:            'inset -1px 0 0 rgba(163,177,138,0.12), 2px 0 20px rgba(255,255,255,0.15)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 pt-7 pb-5" style={{ borderBottom: `1px solid ${G.divider}` }}>
        <img src="/LOGO.png" alt="CarbonIQ" className="h-10" />
        {onClose && (
          <button onClick={onClose} className="transition-opacity hover:opacity-100 opacity-50" style={{ color: C.pine }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${G.divider}` }}>
        <p className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: C.textDim }}>
          {lang === 'tr' ? 'Genel İlerleme' : 'Overall Progress'}
        </p>
        <div className="flex items-end justify-between mb-3">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: C.fern }}>
            {progressPct}<span className="text-xl font-normal" style={{ color: C.sage }}>%</span>
          </span>
          <span className="text-xs pb-1" style={{ color: C.textDim }}>
            {questionNumber}<span style={{ color: C.sage }}>/</span>{TOTAL_QUESTIONS}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(163,177,138,0.2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${C.sage}, ${C.fern})` }}
          />
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 px-3 pt-3 pb-1">
        {['phases', 'sessions'].map(tab => (
          <button
            key={tab}
            onClick={() => { setSidebarTab(tab); if (tab === 'sessions') loadSessions(); }}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-lg transition-all"
            style={{
              background: sidebarTab === tab ? 'rgba(255,255,255,0.8)' : 'transparent',
              color:      sidebarTab === tab ? C.hunter : C.textDim,
              border:     sidebarTab === tab ? '1px solid rgba(163,177,138,0.3)' : '1px solid transparent',
            }}
          >
            {tab === 'phases'
              ? (lang === 'tr' ? 'Fazlar' : 'Phases')
              : (lang === 'tr' ? 'Geçmiş' : 'History')}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {sidebarTab === 'phases' ? (
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {PHASES.map(p => {
            const isDone   = currentPhase > p.id;
            const isActive = currentPhase === p.id;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background:          isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                  border:              isActive ? '1px solid rgba(163,177,138,0.45)' : '1px solid rgba(255,255,255,0.6)',
                  backdropFilter:      'blur(10px)',
                  WebkitBackdropFilter:'blur(10px)',
                  boxShadow:           isActive ? '0 2px 12px rgba(88,129,87,0.12)' : '0 1px 4px rgba(52,78,65,0.05)',
                }}
              >
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isDone ? 'rgba(88,129,87,0.15)' : isActive ? C.fern : 'rgba(163,177,138,0.18)',
                    color:      isDone ? C.fern : isActive ? 'white' : C.textDim,
                    boxShadow:  isActive ? '0 2px 8px rgba(88,129,87,0.3)' : 'none',
                  }}
                >
                  {isDone
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    : p.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: isDone ? C.fern : isActive ? C.hunter : C.textMid }}>
                    {t.phases[p.id]}
                  </p>
                  {isActive && (
                    <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(163,177,138,0.25)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${phaseProgressPct}%`, background: C.fern }} />
                    </div>
                  )}
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: C.fern }} />}
              </div>
            );
          })}
        </nav>
      ) : (
        <div className="flex-1 px-3 py-2 overflow-y-auto">
          {/* New session button */}
          <button
            onClick={() => { setSidebarTab('phases'); setSidebarOpen(false); initChat(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold mb-3 transition-all"
            style={{ background: C.fern, color: 'white', boxShadow: '0 2px 10px rgba(88,129,87,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = C.hunter}
            onMouseLeave={e => e.currentTarget.style.background = C.fern}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {lang === 'tr' ? 'Yeni Rapor Başlat' : 'Start New Report'}
          </button>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: `${C.sage} transparent` }} />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-xs py-6" style={{ color: C.textDim }}>
              {lang === 'tr' ? 'Henüz rapor yok' : 'No reports yet'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {sessions.map(s => {
                const isCurrent = sessionRef.current === s._id;
                const date = new Date(s.updatedAt || s.createdAt).toLocaleDateString('tr-TR');
                return (
                  <div
                    key={s._id}
                    onClick={() => switchSession(s._id)}
                    className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isCurrent ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                      border:     isCurrent ? '1px solid rgba(163,177,138,0.45)' : '1px solid rgba(255,255,255,0.6)',
                    }}
                  >
                    {/* Status dot */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: s.status === 'completed' ? C.fern : isCurrent ? C.fern : C.sage,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: C.pine }}>
                        {s.title || `Rapor ${s._id.slice(-6)}`}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.textDim }}>
                        {lang === 'tr' ? `Faz ${s.currentPhase}` : `Phase ${s.currentPhase}`} · {date}
                      </p>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={(e) => deleteSession(e, s._id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                      style={{ color: C.textDim }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom */}
      <div className="px-5 py-4 space-y-1.5" style={{ borderTop: `1px solid ${G.divider}` }}>
        <button
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
          style={{ color: C.textMid }}
          onMouseEnter={e => e.currentTarget.style.background = G.sidebarHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="flex items-center gap-2 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            {lang === 'tr' ? 'Türkçe' : 'English'}
          </span>
          <span className="text-[11px]" style={{ color: C.sage }}>{lang === 'tr' ? 'EN' : 'TR'}</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.sage }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textDim }}>ISO 14064-1 Compliant</span>
        </div>

        {/* User info + logout */}
        {auth?.user && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl mt-1"
            style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.6)' }}
          >
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: C.pine }}>{auth.user.name}</p>
              <p className="text-[10px] truncate" style={{ color: C.textDim }}>{auth.user.email}</p>
            </div>
            {auth.user?.role === 'admin' && onAdmin && (
              <button
                onClick={onAdmin}
                title="Admin Panel"
                className="flex-shrink-0 ml-1 p-1.5 rounded-lg transition-all"
                style={{ color: C.fern }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88,129,87,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15 1.65 1.65 0 003 14.08V14a2 2 0 014 0v.09c0 .66.38 1.26 1 1.51z"/>
                </svg>
              </button>
            )}
            <button
              onClick={onLogout}
              title={lang === 'tr' ? 'Çıkış Yap' : 'Sign Out'}
              className="flex-shrink-0 ml-2 p-1.5 rounded-lg transition-all"
              style={{ color: C.textDim }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#b91c1c'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textDim; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN ─────────────────────────────────────────────────────
  return (
    <div className="relative h-screen overflow-hidden">

      {/* Static background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(150deg, #dde8d8 0%, #c8d9be 30%, #b5c9a8 60%, #a3b895 100%)' }}
      />

      {/* Layout */}
      <div className="relative h-full flex">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 xl:w-72 flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(52,78,65,0.4)', backdropFilter: 'blur(6px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-72 h-full shadow-2xl">
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Chat panel */}
        <main
          className="flex-1 flex flex-col min-w-0 m-3 rounded-2xl overflow-hidden"
          style={{
            background:          G.chat,
            backdropFilter:      'blur(24px) saturate(150%)',
            WebkitBackdropFilter:'blur(24px) saturate(150%)',
            border:              `1px solid ${G.chatBorder}`,
            boxShadow:           '0 8px 40px rgba(52,78,65,0.15)',
          }}
        >
          {/* Header */}
          <header
            className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5"
            style={{ background: G.header, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${G.divider}` }}
          >
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1" style={{ color: C.fern }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <img src="/LOGO.png" alt="CarbonIQ" className="h-6 lg:hidden" />

            {/* Desktop: phase badge + question count */}
            <div className="hidden lg:flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(163,177,138,0.2)', border: '1px solid rgba(163,177,138,0.35)', color: C.hunter }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.fern }} />
                {t.phases[currentPhase]}
              </div>
              {questionNumber > 0 && (
                <span className="text-sm" style={{ color: C.sage }}>
                  {lang === 'tr' ? `Soru ${questionNumber}/${TOTAL_QUESTIONS}` : `Question ${questionNumber}/${TOTAL_QUESTIONS}`}
                </span>
              )}
            </div>

            {/* Right: export + secure */}
            <div className="hidden lg:flex items-center gap-3">
              {started && sessionRef.current && (
                <button
                  onClick={openExport}
                  disabled={exportLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(163,177,138,0.18)', border: '1px solid rgba(163,177,138,0.3)', color: C.hunter }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(163,177,138,0.32)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(163,177,138,0.18)'}
                >
                  {exportLoading ? (
                    <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: `${C.sage} transparent` }} />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  )}
                  {lang === 'tr' ? 'Rapor Al' : 'Export'}
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: C.sage }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {lang === 'tr' ? 'Güvenli bağlantı' : 'Secure connection'}
              </div>
            </div>

            {/* Mobile: % pill */}
            <span
              className="lg:hidden text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(163,177,138,0.2)', color: C.fern }}
            >
              {progressPct}%
            </span>
          </header>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

              {/* Restoring spinner */}
              {restoring && (
                <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${C.fern} transparent` }} />
                  <p className="text-sm" style={{ color: C.textMid }}>
                    {lang === 'tr' ? 'Oturum yükleniyor…' : 'Loading session…'}
                  </p>
                </div>
              )}

              {/* Pre-start screen */}
              {!restoring && !started && (
                <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-7">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{
                      background:     'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(12px)',
                      border:         '1px solid rgba(163,177,138,0.4)',
                      boxShadow:      '0 8px 32px rgba(88,129,87,0.15)',
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.fern} strokeWidth="1.5">
                      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
                      <path d="M8 12l3 3 5-5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: C.pine }}>
                      {lang === 'tr' ? 'Karbon Raporlamasına Hazır Mısınız?' : 'Ready to Start Carbon Reporting?'}
                    </h2>
                    <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: C.textMid }}>
                      {lang === 'tr'
                        ? 'ISO 14064-1 uyumlu karbon envanterinizi birlikte oluşturalım. 133 adımlı süreçte sizi yönlendireceğim.'
                        : "Let's build your ISO 14064-1 compliant carbon inventory together. I'll guide you through 133 steps."}
                    </p>
                  </div>
                  <button
                    onClick={initChat}
                    className="px-10 py-3.5 text-sm font-semibold text-white rounded-full transition-all hover:-translate-y-0.5"
                    style={{ background: C.fern, boxShadow: '0 6px 20px rgba(88,129,87,0.35)' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.hunter}
                    onMouseLeave={e => e.currentTarget.style.background = C.fern}
                  >
                    {t.chat.startButton} →
                  </button>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {t.quickActions.slice(0, 3).map(a => (
                      <button
                        key={a}
                        onClick={initChat}
                        className="text-xs rounded-full px-4 py-1.5 transition-all"
                        style={{ border: '1px solid rgba(163,177,138,0.35)', background: 'rgba(255,255,255,0.4)', color: C.textMid }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.65)'; e.currentTarget.style.color = C.hunter; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = C.textMid; }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message list */}
              {!restoring && messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} onOptionClick={v => sendMessage(v)} lang={lang} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: C.fern, boxShadow: '0 3px 10px rgba(88,129,87,0.25)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                    </svg>
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(218,215,205,0.6)' }}
                  >
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 160, 320].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: C.sage, animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {!restoring && started && (
            <div
              className="flex-shrink-0 px-4 sm:px-6 py-4"
              style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${G.divider}` }}
            >
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <FileUpload
                    onUpload={file => {
                      setMessages(p => [...p, { role: 'user', content: `📎 ${file.name}`, ts: Date.now(), file }]);
                      sendMessage(`[File: ${file.name}]`);
                    }}
                    hint={t.chat.uploadHint}
                  />
                  <div className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={t.chat.placeholder}
                      disabled={isTyping || !ready}
                      className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none"
                      style={{ background: G.input, border: `1.5px solid ${G.inputBorder}`, backdropFilter: 'blur(8px)', color: C.text }}
                      onFocus={e => { e.target.style.borderColor = C.fern; e.target.style.boxShadow = '0 0 0 3px rgba(88,129,87,0.12)'; e.target.style.background = 'rgba(255,255,255,0.9)'; }}
                      onBlur={e => { e.target.style.borderColor = G.inputBorder; e.target.style.boxShadow = 'none'; e.target.style.background = G.input; }}
                    />
                  </div>
                  <VoiceButton onResult={sendMessage} lang={lang} hint={t.chat.voiceHint} recordingText={t.chat.recording} />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping || !ready}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: C.fern, boxShadow: '0 2px 8px rgba(88,129,87,0.3)' }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = C.hunter; }}
                    onMouseLeave={e => e.currentTarget.style.background = C.fern}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                  </button>
                </form>
                <p className="text-center text-[11px] mt-2.5" style={{ color: C.textDim }}>
                  {lang === 'tr' ? 'Seçenek numarasını veya yanıtınızı yazın' : 'Type an option number or your full answer'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Export modal — inlined to keep setShowExport directly in scope */}
      {showExport && exportData && (() => {
        const _meta    = exportData?.summary?.reportMeta       || {};
        const _ems     = exportData?.summary?.emissions        || {};
        const _compl   = exportData?.summary?.dataCompleteness || {};
        const _rd      = exportData?.summary?.reportData       || {};
        const _labels  = Q_LABELS[lang] || Q_LABELS.tr;
        const _entries = Object.entries(_rd).filter(([, v]) => v && String(v).trim());
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(52,78,65,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowExport(false); }}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#fff', boxShadow: '0 24px 64px rgba(52,78,65,0.3)', border: '1px solid rgba(163,177,138,0.3)', maxHeight: '90vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(163,177,138,0.14)' }}>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: C.pine }}>
                    {lang === 'tr' ? 'Rapor Dışa Aktar' : 'Export Report'}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: C.textDim }}>
                    {_meta.companyName || _rd.A1
                      ? `${_meta.companyName || _rd.A1} · ISO 14064-1`
                      : 'ISO 14064-1 Karbon Envanteri'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExport(false)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: C.textDim }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textDim; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Tab toggle */}
              <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
                {['summary', 'answers'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setExportTab(t)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: exportTab === t ? C.fern : 'transparent', color: exportTab === t ? 'white' : C.textMid }}
                  >
                    {t === 'summary'
                      ? (lang === 'tr' ? 'Özet' : 'Summary')
                      : (lang === 'tr' ? `Yanıtlar (${_entries.length})` : `Answers (${_entries.length})`)}
                  </button>
                ))}
              </div>

              {/* Content — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {exportTab === 'summary' && (
                  <>
                    <div className="p-4 rounded-xl" style={{ background: '#f8f7f5', border: '1px solid rgba(163,177,138,0.18)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium" style={{ color: C.pine }}>{lang === 'tr' ? 'Tamamlanma Durumu' : 'Completion Status'}</p>
                        <span className="text-sm font-bold" style={{ color: C.fern }}>{_compl.percentage ?? 0}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(163,177,138,0.2)' }}>
                        <div className="h-full rounded-full" style={{ width: `${_compl.percentage ?? 0}%`, background: `linear-gradient(90deg, ${C.sage}, ${C.fern})` }} />
                      </div>
                      <p className="text-[10px]" style={{ color: C.textDim }}>
                        {_compl.answeredQuestions ?? 0} / {_compl.totalQuestions ?? 133} {lang === 'tr' ? 'soru yanıtlandı' : 'questions answered'}
                      </p>
                    </div>
                    {(_meta.companyName || _rd.A1 || _meta.reportingYear || _rd.A4) && (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: lang === 'tr' ? 'Şirket' : 'Company',           val: _meta.companyName || _rd.A1 },
                          { label: lang === 'tr' ? 'Vergi No' : 'Tax ID',          val: _meta.vkn || _rd.A2 },
                          { label: lang === 'tr' ? 'Raporlama Yılı' : 'Rep. Year', val: _meta.reportingYear || _rd.A4 },
                          { label: lang === 'tr' ? 'Ülke' : 'Country',             val: _meta.country || _rd.A3 },
                          { label: lang === 'tr' ? 'Sektör' : 'Sector',            val: _meta.sector || _rd.C1 },
                          { label: lang === 'tr' ? 'Hazırlayan' : 'Preparer',      val: _meta.preparer || _rd.A5 },
                        ].filter(r => r.val).map(row => (
                          <div key={row.label} className="px-3 py-2 rounded-lg" style={{ background: '#f8f7f5', border: '1px solid #e4e0da' }}>
                            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: C.textDim }}>{row.label}</p>
                            <p className="text-xs font-medium truncate" style={{ color: C.pine }}>{row.val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>
                        {lang === 'tr' ? 'Emisyon Özeti (tCO₂e)' : 'Emissions (tCO₂e)'}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Kapsam 1', val: _ems.scope1, sub: lang === 'tr' ? 'Doğrudan' : 'Direct' },
                          { label: 'Kapsam 2', val: _ems.scope2, sub: lang === 'tr' ? 'Enerji' : 'Energy' },
                          { label: 'Kapsam 3', val: _ems.scope3, sub: lang === 'tr' ? 'Dolaylı' : 'Indirect' },
                          { label: lang === 'tr' ? 'Toplam' : 'Total', val: _ems.total, sub: 'tCO₂e', hi: true },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl p-3 text-center"
                            style={{ background: item.hi ? C.pine : '#eef1ea', border: item.hi ? 'none' : '1px solid rgba(163,177,138,0.3)' }}
                          >
                            <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: item.hi ? C.sage : C.textDim }}>{item.label}</p>
                            <p className="text-sm font-bold" style={{ color: item.hi ? 'white' : C.pine }}>{(item.val || 0).toFixed(1)}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: item.hi ? C.sage : C.textDim }}>{item.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {exportTab === 'answers' && (
                  <div>
                    {_entries.length === 0 ? (
                      <p className="text-center text-sm py-8" style={{ color: C.textDim }}>
                        {lang === 'tr' ? 'Henüz yanıt girilmedi' : 'No answers recorded yet'}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {_entries.map(([qId, val]) => (
                          <div key={qId} className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: '#f8f7f5', border: '1px solid #e4e0da' }}
                          >
                            <span className="flex-shrink-0 w-8 h-5 rounded text-[10px] font-bold flex items-center justify-center mt-0.5"
                              style={{ background: '#eef1ea', color: C.fern }}>
                              {qId}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] mb-0.5" style={{ color: C.textDim }}>{_labels[qId] || qId}</p>
                              <p className="text-xs font-medium truncate" style={{ color: C.pine }}>{String(val)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="px-6 pb-5 pt-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(163,177,138,0.14)' }}>
                <button
                  type="button" onClick={printReport}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: C.fern, boxShadow: '0 4px 14px rgba(88,129,87,0.35)' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.hunter}
                  onMouseLeave={e => e.currentTarget.style.background = C.fern}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
                  </svg>
                  {lang === 'tr' ? 'PDF Olarak Yazdır / Kaydet' : 'Print / Save as PDF'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
