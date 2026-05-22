import { useState } from 'react';

const C = {
  pine:    '#344E41',
  hunter:  '#3A5A40',
  fern:    '#588157',
  sage:    '#A3B18A',
  dust:    '#DAD7CD',
  text:    '#2d3b2e',
  textMid: 'rgba(52,78,65,0.55)',
  textDim: 'rgba(52,78,65,0.32)',
  error:   '#b91c1c',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
};

const FEATURE_ICONS = [
  // Shield-check — ISO compliance
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>,
  // Activity / waves — emissions
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>,
  // CPU / chip — AI guide
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="6" height="6" rx="1"/><path d="M3 9h2M3 15h2M19 9h2M19 15h2M9 3v2M15 3v2M9 19v2M15 19v2"/><rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>,
  // File-text — PDF report
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>,
];

const content = {
  tr: {
    heroTitle:   'Akıllı Karbon\nAsistanına Hoş Geldiniz',
    heroDesc:    'Sisteme giriş yaparak karbon ayak izi hesaplama, sera gazı azaltımı, sürdürülebilirlik raporlaması ve karbon yönetimi konularında uzman rehberlik alabilirsiniz.',
    tagline:     'Her soruyla, düşük karbonlu bir geleceğe bir adım daha yaklaşın.',
    features: [
      { label: 'ISO 14064-1 Uyumlu Raporlama' },
      { label: 'Kapsam 1, 2 ve 3 Emisyon Analizi' },
      { label: '133 Adımlı Yapay Zeka Rehberi' },
      { label: 'Profesyonel PDF Rapor Çıktısı' },
    ],
    loginTab:    'Giriş Yap',
    registerTab: 'Kayıt Ol',
    emailLabel:  'E-posta',
    emailPh:     'ornek@sirket.com',
    passLabel:   'Şifre',
    passPh:      '••••••••',
    loginBtn:    'Giriş Yap →',
    loggingIn:   'Giriş yapılıyor…',
    nameLabel:   'Ad Soyad',
    namePh:      'Adınız Soyadınız',
    companyLabel:'Şirket Adı (isteğe bağlı)',
    companyPh:   'Şirketinizin adı',
    registerBtn: 'Hesap Oluştur →',
    registering: 'Hesap oluşturuluyor…',
    forgotPass:  'Şifrenimi unuttum',
    noAccount:   'Hesabınız yok mu?',
    signupLink:  'Kayıt olun',
    hasAccount:  'Zaten hesabınız var mı?',
    signinLink:  'Giriş yapın',
    passPlaceholder: 'En az 8 karakter',
    errName:    'İsim gerekli',
    errEmail:   'E-posta gerekli',
    errPass:    'En az 8 karakter',
    errPassReq: 'Şifre gerekli',
  },
  en: {
    heroTitle:   'Welcome to the Intelligent Carbon Assistant',
    heroDesc:    'By signing in, you can receive expert guidance on carbon footprint calculation, greenhouse gas reduction, sustainability reporting, and carbon management solutions.',
    tagline:     'With every question, one step closer to a low-carbon future.',
    features: [
      { label: 'ISO 14064-1 Compliant Reporting' },
      { label: 'Scope 1, 2 & 3 Emission Analysis' },
      { label: '133-Step AI-Guided Process' },
      { label: 'Professional PDF Report Export' },
    ],
    loginTab:    'Sign In',
    registerTab: 'Register',
    emailLabel:  'Email',
    emailPh:     'example@company.com',
    passLabel:   'Password',
    passPh:      '••••••••',
    loginBtn:    'Sign In →',
    loggingIn:   'Signing in…',
    nameLabel:   'Full Name',
    namePh:      'Your Full Name',
    companyLabel:'Company Name (optional)',
    companyPh:   'Your company name',
    registerBtn: 'Create Account →',
    registering: 'Creating account…',
    forgotPass:  'Forgot password?',
    noAccount:   "Don't have an account?",
    signupLink:  'Register',
    hasAccount:  'Already have an account?',
    signinLink:  'Sign in',
    passPlaceholder: 'At least 8 characters',
    errName:    'Name required',
    errEmail:   'Email required',
    errPass:    'At least 8 characters',
    errPassReq: 'Password required',
  },
};

function InputField({ label, type = 'text', value, onChange, placeholder, error, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.textMid }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3 text-sm transition-all focus:outline-none"
        style={{
          background:     'rgba(255,255,255,0.75)',
          border:         `1.5px solid ${error ? C.errorBorder : focused ? C.fern : 'rgba(163,177,138,0.35)'}`,
          boxShadow:      focused && !error ? '0 0 0 3px rgba(88,129,87,0.1)' : 'none',
          color:          C.text,
          backdropFilter: 'blur(8px)',
        }}
      />
      {error && <p className="text-xs mt-1" style={{ color: C.error }}>{error}</p>}
    </div>
  );
}

// ── Decorative left panel ─────────────────────────────────────
function HeroPanel({ lang, tx }) {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${C.hunter} 0%, ${C.pine} 50%, #243d2f 100%)`,
        minHeight: '100vh',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute" style={{
        width: 420, height: 420,
        borderRadius: '50%',
        background: 'rgba(163,177,138,0.08)',
        top: -100, right: -120,
      }} />
      <div className="absolute" style={{
        width: 280, height: 280,
        borderRadius: '50%',
        background: 'rgba(88,129,87,0.12)',
        bottom: 80, left: -80,
      }} />
      <div className="absolute" style={{
        width: 180, height: 180,
        borderRadius: '50%',
        border: '1px solid rgba(163,177,138,0.15)',
        top: '35%', right: 40,
      }} />
      <div className="absolute" style={{
        width: 90, height: 90,
        borderRadius: '50%',
        border: '1px solid rgba(163,177,138,0.12)',
        top: '38%', right: 85,
      }} />

      {/* Top: logo */}
      <div className="relative z-10">
        <img src="/LOGO.png" alt="CarbonIQ" className="h-12" />
      </div>

      {/* Middle: hero content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 w-fit"
          style={{ background: 'rgba(163,177,138,0.18)', border: '1px solid rgba(163,177,138,0.25)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.sage }} />
          <span className="text-xs font-medium" style={{ color: C.sage }}>ISO 14064-1 Compliant</span>
        </div>

        <h1
          className="font-serif text-4xl xl:text-5xl font-normal leading-tight mb-6"
          style={{ color: 'white', letterSpacing: '-0.5px', whiteSpace: 'pre-line' }}
        >
          {tx.heroTitle}
        </h1>

        <p className="text-sm leading-relaxed mb-10 max-w-sm" style={{ color: 'rgba(218,215,205,0.75)' }}>
          {tx.heroDesc}
        </p>

        {/* Feature list */}
        <div className="space-y-3">
          {tx.features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(163,177,138,0.15)',
                  border:     '1px solid rgba(163,177,138,0.22)',
                  color:      '#A3B18A',
                }}
              >
                {FEATURE_ICONS[i]}
              </div>
              <span className="text-sm" style={{ color: 'rgba(218,215,205,0.88)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: tagline */}
      <div className="relative z-10">
        <div className="h-px mb-6" style={{ background: 'rgba(163,177,138,0.2)' }} />
        <p className="text-sm italic" style={{ color: 'rgba(163,177,138,0.7)' }}>
          "{tx.tagline}"
        </p>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function AuthPage({ lang, setLang, onAuth }) {
  const [tab, setTab]             = useState('login');
  const [loading, setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors]     = useState({});

  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany]   = useState('');
  const [regErrors, setRegErrors]     = useState({});

  const tx = content[lang] || content.tr;

  const reset = () => { setGlobalError(''); setLoginErrors({}); setRegErrors({}); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const errs = {};
    if (!loginEmail.trim())    errs.email    = tx.errEmail;
    if (!loginPassword.trim()) errs.password = tx.errPassReq;
    if (Object.keys(errs).length) { setLoginErrors(errs); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.message || 'Login failed'); return; }
      localStorage.setItem('ciq_token', data.token);
      onAuth({ token: data.token, user: data.user });
    } catch { setGlobalError(lang === 'tr' ? 'Sunucuya bağlanılamadı' : 'Could not connect'); }
    finally   { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const errs = {};
    if (!regName.trim())                       errs.name     = tx.errName;
    if (!regEmail.trim())                      errs.email    = tx.errEmail;
    if (!regPassword || regPassword.length < 8) errs.password = tx.errPass;
    if (Object.keys(errs).length) { setRegErrors(errs); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), email: regEmail.trim(), password: regPassword, company: regCompany.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.message || 'Registration failed'); return; }
      localStorage.setItem('ciq_token', data.token);
      onAuth({ token: data.token, user: data.user });
    } catch { setGlobalError(lang === 'tr' ? 'Sunucuya bağlanılamadı' : 'Could not connect'); }
    finally   { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#f2f0ec' }}>

      {/* ── Left hero panel ── */}
      <HeroPanel lang={lang} tx={tx} />

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center px-6 py-10 relative"
        style={{ background: 'linear-gradient(160deg, #f2f0ec 0%, #e8ede4 100%)' }}
      >
        {/* Lang toggle */}
        <button
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          className="absolute top-6 right-6 text-xs px-3 py-1.5 rounded-full transition-all"
          style={{
            background:     'rgba(255,255,255,0.7)',
            border:         '1px solid rgba(163,177,138,0.3)',
            color:          C.textMid,
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src="/LOGO.png" alt="CarbonIQ" className="h-10 mx-auto" />
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-sm"
          style={{
            background:          'rgba(255,255,255,0.85)',
            backdropFilter:      'blur(24px)',
            WebkitBackdropFilter:'blur(24px)',
            border:              '1px solid rgba(255,255,255,0.9)',
            borderRadius:        '20px',
            boxShadow:           '0 8px 40px rgba(52,78,65,0.12)',
          }}
        >
          {/* Card header */}
          <div className="px-7 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(163,177,138,0.12)' }}>
            <h2 className="text-lg font-semibold" style={{ color: C.pine }}>
              {tab === 'login'
                ? (lang === 'tr' ? 'Hesabınıza Giriş Yapın' : 'Sign In to Your Account')
                : (lang === 'tr' ? 'Yeni Hesap Oluşturun' : 'Create a New Account')}
            </h2>
            <p className="text-xs mt-1" style={{ color: C.textDim }}>
              ISO 14064-1 {lang === 'tr' ? 'Karbon Raporlama Sistemi' : 'Carbon Reporting System'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-2 mx-5 mt-4 rounded-xl" style={{ background: 'rgba(163,177,138,0.1)' }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); reset(); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: tab === t ? 'white' : 'transparent',
                  color:      tab === t ? C.pine : C.textMid,
                  boxShadow:  tab === t ? '0 2px 8px rgba(52,78,65,0.08)' : 'none',
                }}
              >
                {t === 'login' ? tx.loginTab : tx.registerTab}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {globalError && (
            <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl text-xs" style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.error }}>
              {globalError}
            </div>
          )}

          {/* Login form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="px-7 pt-5 pb-7 space-y-4">
              <InputField
                label={tx.emailLabel} type="email" value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginErrors(p => ({ ...p, email: '' })); }}
                placeholder={tx.emailPh} error={loginErrors.email} autoComplete="email"
              />
              <InputField
                label={lang === 'tr' ? 'Şifre' : 'Password'} type="password" value={loginPassword}
                onChange={e => { setLoginPassword(e.target.value); setLoginErrors(p => ({ ...p, password: '' })); }}
                placeholder="••••••••" error={loginErrors.password} autoComplete="current-password"
              />

              <div className="flex justify-end">
                <button type="button" className="text-xs transition-colors" style={{ color: C.sage }}
                  onMouseEnter={e => e.currentTarget.style.color = C.fern}
                  onMouseLeave={e => e.currentTarget.style.color = C.sage}
                >
                  {tx.forgotPass}
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: C.fern, boxShadow: '0 4px 16px rgba(88,129,87,0.35)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = C.hunter; }}
                onMouseLeave={e => e.currentTarget.style.background = C.fern}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      {tx.loggingIn}
                    </span>
                  : tx.loginBtn}
              </button>

              <p className="text-center text-xs" style={{ color: C.textDim }}>
                {tx.noAccount}{' '}
                <button type="button" onClick={() => { setTab('register'); reset(); }}
                  className="font-semibold transition-colors" style={{ color: C.fern }}
                  onMouseEnter={e => e.currentTarget.style.color = C.hunter}
                  onMouseLeave={e => e.currentTarget.style.color = C.fern}
                >
                  {tx.signupLink}
                </button>
              </p>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="px-7 pt-5 pb-7 space-y-3.5">
              <InputField
                label={tx.nameLabel} value={regName}
                onChange={e => { setRegName(e.target.value); setRegErrors(p => ({ ...p, name: '' })); }}
                placeholder={tx.namePh} error={regErrors.name} autoComplete="name"
              />
              <InputField
                label={tx.emailLabel} type="email" value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({ ...p, email: '' })); }}
                placeholder={tx.emailPh} error={regErrors.email} autoComplete="email"
              />
              <InputField
                label={lang === 'tr' ? 'Şifre' : 'Password'} type="password" value={regPassword}
                onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({ ...p, password: '' })); }}
                placeholder={tx.passPlaceholder} error={regErrors.password} autoComplete="new-password"
              />
              <InputField
                label={tx.companyLabel} value={regCompany}
                onChange={e => setRegCompany(e.target.value)}
                placeholder={tx.companyPh} autoComplete="organization"
              />

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 mt-1"
                style={{ background: C.fern, boxShadow: '0 4px 16px rgba(88,129,87,0.35)' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = C.hunter; }}
                onMouseLeave={e => e.currentTarget.style.background = C.fern}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      {tx.registering}
                    </span>
                  : tx.registerBtn}
              </button>

              <p className="text-center text-xs" style={{ color: C.textDim }}>
                {tx.hasAccount}{' '}
                <button type="button" onClick={() => { setTab('login'); reset(); }}
                  className="font-semibold transition-colors" style={{ color: C.fern }}
                  onMouseEnter={e => e.currentTarget.style.color = C.hunter}
                  onMouseLeave={e => e.currentTarget.style.color = C.fern}
                >
                  {tx.signinLink}
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-[11px]" style={{ color: C.textDim }}>
          © 2025 CarbonIQ · ISO 14064-1 Compliant
        </p>
      </div>
    </div>
  );
}
