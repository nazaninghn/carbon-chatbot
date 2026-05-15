const express = require('express');
const User    = require('../models/User');
const Session = require('../models/Session');
const router  = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
function checkAuth(req, res, next) {
  if (req.query.key === 'carboniq2024') return next();
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    if (user === 'admin' && pass === 'Admin@2024') return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="CarbonIQ Admin"');
  res.status(401).send('Authentication required');
}
router.use(checkAuth);

// ── Question labels ───────────────────────────────────────────────────────────
const Q_LABELS = {
  A1:'Şirket Adı', A2:'Vergi No (VKN)', A3:'Ülke / Şehir', A4:'Raporlama Yılı',
  A5:'Hazırlayan', A6:'Rapor Amacı', A7:'Çalışan Sayısı', A8:'Ciro',
  B1:'Baz Yıl', B2:'Baz Yıl Emisyonu', B3:'Baz Yıl Değişim',
  B4:'Metodoloji', B5:'Sektör (Baz)', B6:'Baz Yıl Notu',
  C1:'Sektör', C2:'Ana Faaliyet', C3:'Tesis Sayısı',
  D1:'Sınır Yaklaşımı', D2:'EF Veritabanı', D3:'Kapsam 3', D4:'Doğrulama',
};

const PHASE_NAMES = {
  1:'Şirket Tanıma', 2:'Org. Sınırı', 3:'Kapsam 1',
  4:'Kapsam 2', 5:'Kapsam 3', 6:'Kabuller', 7:'Rapor',
};

// ── Extract Q&A journey from messages ─────────────────────────────────────────
// Returns [{qId, phase, attempts:[{answer, valid, ts}], savedValue}]
function extractJourney(messages, reportData) {
  const byQuestion = {}; // qId → {attempts:[]}

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const qId = msg.metadata?.questionId;
    if (!qId) continue;

    // Find the next assistant message (validation response)
    let validationStatus = null;
    let validationContent = '';
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === 'assistant') {
        validationStatus = messages[j].metadata?.validationStatus || null;
        validationContent = messages[j].content || '';
        break;
      }
    }

    if (!byQuestion[qId]) {
      byQuestion[qId] = {
        qId,
        phase: msg.metadata?.phase || 1,
        attempts: [],
      };
    }

    byQuestion[qId].attempts.push({
      answer:     msg.content,
      valid:      validationStatus === 'valid',
      status:     validationStatus,
      ts:         msg.timestamp,
      valMsg:     validationContent,
    });
  }

  // Merge with reportData to get final saved values
  const rd = reportData || {};
  return Object.values(byQuestion).map(q => ({
    ...q,
    savedValue: rd[q.qId] ?? null,
    label:      Q_LABELS[q.qId] || q.qId,
    retries:    Math.max(0, q.attempts.length - 1),
  }));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const [users, sessions, activeCount] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).lean(),
    Session.find().sort({ updatedAt: -1 }).lean(),
    Session.countDocuments({ status: 'active' }),
  ]);

  const totalMessages = sessions.reduce((s, x) => s + (x.messages?.length || 0), 0);
  const totalAnswers  = sessions.reduce((s, x) => s + Object.keys(x.reportData || {}).length, 0);

  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u; });

  const sessionsByUser = {};
  sessions.forEach(s => {
    const uid = String(s.userId);
    if (!sessionsByUser[uid]) sessionsByUser[uid] = [];
    sessionsByUser[uid].push(s);
  });

  res.send(renderPage('Dashboard', `
    <div class="stats">
      <div class="stat"><span class="stat-num">${users.length}</span><span class="stat-label">Kullanıcı</span></div>
      <div class="stat"><span class="stat-num">${sessions.length}</span><span class="stat-label">Oturum</span></div>
      <div class="stat"><span class="stat-num">${activeCount}</span><span class="stat-label">Aktif</span></div>
      <div class="stat"><span class="stat-num">${totalMessages}</span><span class="stat-label">Mesaj</span></div>
      <div class="stat"><span class="stat-num">${totalAnswers}</span><span class="stat-label">Kayıtlı Cevap</span></div>
    </div>

    <div class="section">
      <h3>Kullanıcılar</h3>
      <table>
        <tr>
          <th>Kullanıcı</th><th>Email</th><th>Şirket</th>
          <th>Oturum</th><th>İlerleme</th><th>Son Aktif</th><th></th>
        </tr>
        ${users.map(u => {
          const uSess   = sessionsByUser[String(u._id)] || [];
          const answers = uSess.reduce((s, x) => s + Object.keys(x.reportData || {}).length, 0);
          const pct     = Math.min(Math.round((answers / 133) * 100), 100);
          const last    = uSess[0]?.updatedAt || u.lastLogin || u.createdAt;
          return `<tr>
            <td><a href="/admin/users/${u._id}"><strong>${esc(u.name)}</strong></a></td>
            <td style="color:#888">${esc(u.email)}</td>
            <td>${esc(u.company || '—')}</td>
            <td style="text-align:center">${uSess.length}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>
                <span style="font-size:11px;color:#588157;font-weight:600;white-space:nowrap">${answers}/133</span>
              </div>
            </td>
            <td style="font-size:12px;color:#999">${timeAgo(last)}</td>
            <td><a href="/admin/users/${u._id}" class="btn-sm">Takip Et →</a></td>
          </tr>`;
        }).join('')}
      </table>
    </div>

    <div class="section">
      <h3>Son Oturumlar</h3>
      <table>
        <tr><th>Başlık</th><th>Kullanıcı</th><th>Faz</th><th>Cevap</th><th>Durum</th><th>Güncelleme</th><th></th></tr>
        ${sessions.slice(0, 25).map(s => {
          const u = userMap[String(s.userId)];
          const a = Object.keys(s.reportData || {}).length;
          return `<tr>
            <td><a href="/admin/sessions/${s._id}">${esc(s.title || 'Untitled')}</a></td>
            <td>${u ? `<a href="/admin/users/${u._id}">${esc(u.name)}</a>` : '—'}</td>
            <td>Faz ${s.currentPhase || 1}</td>
            <td><span class="pill ${a > 0 ? 'g' : 'gr'}">${a}</span></td>
            <td><span class="badge ${s.status === 'active' ? 'ba' : ''}">${s.status}</span></td>
            <td style="font-size:12px;color:#999">${timeAgo(s.updatedAt || s.createdAt)}</td>
            <td>
              <a href="/admin/sessions/${s._id}" class="btn-sm">Gör</a>
              <a href="/admin/sessions/${s._id}/delete" class="del" onclick="return confirm('Sil?')">✕</a>
            </td>
          </tr>`;
        }).join('')}
      </table>
    </div>
  `));
});

// ── User Detail — complete tracking ──────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  const [user, sessions] = await Promise.all([
    User.findById(req.params.id).select('-password').lean(),
    Session.find({ userId: req.params.id }).sort({ updatedAt: -1 }).lean(),
  ]);
  if (!user) return res.status(404).send('Kullanıcı bulunamadı');

  const totalAnswers = sessions.reduce((s, x) => s + Object.keys(x.reportData || {}).length, 0);
  const totalPct     = Math.min(Math.round((totalAnswers / 133) * 100), 100);
  const totalRetries = sessions.reduce((sum, s) => {
    const j = extractJourney(s.messages || [], s.reportData);
    return sum + j.reduce((r, q) => r + q.retries, 0);
  }, 0);

  const sessionsHTML = sessions.map((s, si) => {
    const journey = extractJourney(s.messages || [], s.reportData);
    const answers  = Object.keys(s.reportData || {}).length;
    const pct      = Math.min(Math.round((answers / 133) * 100), 100);
    const retries  = journey.reduce((r, q) => r + q.retries, 0);

    // Group by phase
    const byPhase = {};
    journey.forEach(q => {
      const ph = q.phase || 1;
      if (!byPhase[ph]) byPhase[ph] = [];
      byPhase[ph].push(q);
    });

    const journeyHTML = Object.entries(byPhase).map(([ph, qs]) => `
      <div class="phase-block">
        <div class="phase-label">📌 Faz ${ph} — ${PHASE_NAMES[ph] || ''}</div>
        <table class="inner-table">
          <tr>
            <th style="width:70px">Soru</th>
            <th style="width:160px">Alan</th>
            <th>Kullanıcı Ne Girdi</th>
            <th style="width:80px">Sonuç</th>
            <th style="width:110px">Kaydedilen</th>
            <th style="width:60px">Deneme</th>
            <th style="width:90px">Zaman</th>
          </tr>
          ${qs.map(q => {
            const lastAttempt = q.attempts[q.attempts.length - 1];
            const firstAttempt = q.attempts[0];
            const allAnswers  = q.attempts.map((a, i) =>
              q.attempts.length > 1
                ? `<div class="attempt ${a.valid ? 'a-ok' : 'a-err'}">
                    ${i > 0 ? `<span class="retry-n">Deneme ${i+1}</span>` : ''}
                    ${esc(a.answer)}
                   </div>`
                : esc(a.answer)
            ).join('');

            return `<tr>
              <td><span class="qid">${esc(q.qId)}</span></td>
              <td style="font-size:11px;color:#888">${esc(q.label)}</td>
              <td class="answer-cell">${allAnswers}</td>
              <td style="text-align:center">
                ${lastAttempt?.valid
                  ? '<span class="ok-badge">✅ Kabul</span>'
                  : '<span class="err-badge">⚠ Beklemede</span>'}
              </td>
              <td>
                ${q.savedValue !== null
                  ? `<span class="saved-val">${esc(String(q.savedValue))}</span>`
                  : '<span style="color:#ccc;font-size:11px">—</span>'}
              </td>
              <td style="text-align:center">
                ${q.retries > 0
                  ? `<span class="retry-badge">${q.attempts.length}x</span>`
                  : '<span style="color:#ccc">1x</span>'}
              </td>
              <td style="font-size:11px;color:#bbb">
                ${firstAttempt?.ts ? new Date(firstAttempt.ts).toLocaleTimeString('tr-TR') : ''}
              </td>
            </tr>`;
          }).join('')}
        </table>
      </div>
    `).join('');

    return `
      <div class="session-card" id="s${si}">
        <div class="session-hdr">
          <div>
            <a href="/admin/sessions/${s._id}" class="session-title">${esc(s.title || 'Untitled')}</a>
            <span class="session-meta">
              Faz ${s.currentPhase} &nbsp;·&nbsp; ${s.messages?.length || 0} mesaj
              &nbsp;·&nbsp; ${new Date(s.createdAt).toLocaleDateString('tr-TR')}
              ${retries > 0 ? `&nbsp;·&nbsp; <span style="color:#f59e0b">⚠ ${retries} hatalı deneme</span>` : ''}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="pbar" style="width:120px"><div class="pfill" style="width:${pct}%"></div></div>
            <span style="font-size:12px;color:#588157;font-weight:700">${answers}/133 (${pct}%)</span>
            <span class="badge ${s.status === 'active' ? 'ba' : ''}">${s.status}</span>
            <a href="/admin/sessions/${s._id}/delete" class="del" onclick="return confirm('Sil?')">✕</a>
          </div>
        </div>
        <div class="journey-body">
          ${journey.length === 0
            ? '<p style="color:#ccc;font-size:13px;padding:8px">Bu oturumda henüz soru cevaplanmadı.</p>'
            : journeyHTML}
        </div>
      </div>`;
  }).join('');

  res.send(renderPage(`Kullanıcı: ${user.name}`, `
    <!-- Profile -->
    <div class="profile-card">
      <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div style="flex:1">
        <div class="profile-name">${esc(user.name)}</div>
        <div class="profile-sub">${esc(user.email)} ${user.company ? `· ${esc(user.company)}` : ''}</div>
        <div style="margin-top:6px">
          <span class="badge ${user.role === 'admin' ? 'badm' : ''}">${user.role}</span>
          &ensp;Kayıt: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}
          ${user.lastLogin ? `&ensp;Son giriş: ${new Date(user.lastLogin).toLocaleString('tr-TR')}` : ''}
        </div>
      </div>
      <div class="profile-stats">
        <div class="pstat"><span>${sessions.length}</span>Oturum</div>
        <div class="pstat"><span>${totalAnswers}</span>Cevap</div>
        <div class="pstat"><span style="color:${totalRetries>0?'#f59e0b':'#588157'}">${totalRetries}</span>Hatalı</div>
        <div class="pstat"><span>${totalPct}%</span>Tamamlama</div>
      </div>
    </div>

    <!-- Overall progress -->
    <div style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px;color:#888">
        <span>Genel ilerleme (${totalAnswers} / 133 soru)</span>
        <span style="color:#588157;font-weight:700">${totalPct}%</span>
      </div>
      <div class="pbar" style="height:10px;border-radius:5px">
        <div class="pfill" style="width:${totalPct}%"></div>
      </div>
    </div>

    <!-- Sessions + journey -->
    <div class="section">
      <h3>Soru-Cevap Takibi (${sessions.length} oturum)</h3>
      ${sessions.length === 0
        ? '<p style="color:#aaa;font-size:13px">Henüz oturum yok.</p>'
        : sessionsHTML}
    </div>

    <div style="margin-top:8px;display:flex;gap:16px">
      <a href="/admin" class="back">← Dashboard</a>
      ${user.role !== 'admin'
        ? `<a href="/admin/users/${user._id}/delete" class="del" onclick="return confirm('Kullanıcı ve tüm verileri silinsin mi?')">Kullanıcıyı Sil</a>`
        : ''}
    </div>
  `));
});

// ── Session Detail ────────────────────────────────────────────────────────────
router.get('/sessions/:id', async (req, res) => {
  const session = await Session.findById(req.params.id).lean();
  if (!session) return res.status(404).send('Bulunamadı');

  const user    = await User.findById(session.userId).select('name email').lean();
  const journey = extractJourney(session.messages || [], session.reportData);
  const answers = Object.keys(session.reportData || {}).length;
  const pct     = Math.min(Math.round((answers / 133) * 100), 100);
  const retries = journey.reduce((r, q) => r + q.retries, 0);

  const byPhase = {};
  journey.forEach(q => {
    const ph = q.phase || 1;
    if (!byPhase[ph]) byPhase[ph] = [];
    byPhase[ph].push(q);
  });

  const journeyHTML = Object.entries(byPhase).map(([ph, qs]) => `
    <div class="phase-block">
      <div class="phase-label">📌 Faz ${ph} — ${PHASE_NAMES[ph] || ''}</div>
      <table class="inner-table">
        <tr>
          <th style="width:70px">Soru</th><th style="width:160px">Alan</th>
          <th>Girilen Cevap(lar)</th>
          <th style="width:80px">Sonuç</th><th style="width:110px">Kaydedilen</th>
          <th style="width:60px">Deneme</th>
        </tr>
        ${qs.map(q => {
          const last = q.attempts[q.attempts.length - 1];
          const allAnswers = q.attempts.map((a, i) =>
            q.attempts.length > 1
              ? `<div class="attempt ${a.valid ? 'a-ok' : 'a-err'}">
                  ${i > 0 ? `<span class="retry-n">Deneme ${i+1}:</span> ` : ''}
                  ${esc(a.answer)}
                 </div>`
              : esc(a.answer)
          ).join('');
          return `<tr>
            <td><span class="qid">${esc(q.qId)}</span></td>
            <td style="font-size:11px;color:#888">${esc(q.label)}</td>
            <td class="answer-cell">${allAnswers}</td>
            <td style="text-align:center">
              ${last?.valid ? '<span class="ok-badge">✅</span>' : '<span class="err-badge">⚠</span>'}
            </td>
            <td>${q.savedValue !== null ? `<span class="saved-val">${esc(String(q.savedValue))}</span>` : '<span style="color:#ccc">—</span>'}</td>
            <td style="text-align:center">${q.retries > 0 ? `<span class="retry-badge">${q.attempts.length}x</span>` : '1x'}</td>
          </tr>`;
        }).join('')}
      </table>
    </div>
  `).join('');

  res.send(renderPage(`Oturum: ${session.title || 'Untitled'}`, `
    <div class="meta-bar">
      <span>👤 ${user ? `<a href="/admin/users/${user._id}">${esc(user.name)}</a> (${esc(user.email)})` : '—'}</span>
      <span>📊 Faz ${session.currentPhase} · Soru ${session.currentQuestion}</span>
      <span>${answers}/133 cevap (${pct}%)</span>
      ${retries > 0 ? `<span style="color:#f59e0b">⚠ ${retries} hatalı deneme</span>` : ''}
      <span class="badge ${session.status === 'active' ? 'ba' : ''}">${session.status}</span>
      <span style="font-size:12px;color:#bbb">${new Date(session.createdAt).toLocaleString('tr-TR')}</span>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">🎯 Soru-Cevap Takibi</div>
        <div class="pbar" style="margin-bottom:14px"><div class="pfill" style="width:${pct}%"></div></div>
        ${journey.length === 0
          ? '<p style="color:#ccc;font-size:13px">Henüz cevap yok.</p>'
          : journeyHTML}
      </div>
      <div class="panel">
        <div class="panel-title">💬 Ham Sohbet (${session.messages?.length || 0} mesaj)</div>
        <div class="chat-log">
          ${(session.messages || []).map(m => `
            <div class="msg ${m.role}">
              <div class="msg-role">${m.role === 'user' ? '👤 Kullanıcı' : '🤖 AI'}
                ${m.metadata?.questionId ? `<span class="qid" style="margin-left:6px">${m.metadata.questionId}</span>` : ''}
                ${m.metadata?.validationStatus ? `<span class="pill ${m.metadata.validationStatus === 'valid' ? 'g' : 'gr'}" style="margin-left:4px;font-size:9px">${m.metadata.validationStatus}</span>` : ''}
              </div>
              <div class="msg-text">${esc(m.content).replace(/\n/g, '<br>')}</div>
              ${m.timestamp ? `<div class="msg-time">${new Date(m.timestamp).toLocaleTimeString('tr-TR')}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;gap:16px;align-items:center">
      <a href="/admin" class="back">← Dashboard</a>
      ${user ? `<a href="/admin/users/${user._id}" class="back">← Kullanıcı</a>` : ''}
      <a href="/admin/sessions/${session._id}/delete" class="del" onclick="return confirm('Oturumu sil?')">Oturumu Sil</a>
    </div>
  `));
});

// ── Delete routes ─────────────────────────────────────────────────────────────
router.get('/sessions/:id/delete', async (req, res) => {
  await Session.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});
router.get('/users/:id/delete', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await Session.deleteMany({ userId: req.params.id });
  res.redirect('/admin/users');
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function timeAgo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'şimdi';
  if (mins < 60)  return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}sa önce`;
  const days = Math.floor(hrs / 24);
  return `${days}g önce`;
}

function renderPage(title, content) {
  return `<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CarbonIQ Admin — ${esc(title)}</title>
<meta name="theme-color" content="#344E41">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#f2f5f1;color:#333;min-height:100vh;font-size:14px}

/* ── Header ── */
.header{background:#344E41;color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 10px rgba(0,0,0,.25);gap:12px}
.brand{font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;white-space:nowrap}
.header nav{display:flex;flex-wrap:wrap;gap:4px}
.header nav a{color:rgba(255,255,255,.6);text-decoration:none;font-size:12px;padding:5px 10px;border-radius:6px;font-weight:500;transition:all .15s;white-space:nowrap}
.header nav a:hover,.header nav a.active{color:#fff;background:rgba(255,255,255,.12)}

/* ── Layout ── */
.container{max-width:1400px;margin:0 auto;padding:16px}
.page-title{font-size:18px;font-weight:700;color:#344E41;margin-bottom:16px}

/* ── Stats ── */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:20px}
.stat{background:#fff;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid #e4e0da;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.stat-num{display:block;font-size:26px;font-weight:700;color:#344E41;line-height:1}
.stat-label{font-size:10px;color:#aaa;margin-top:5px;text-transform:uppercase;letter-spacing:.04em}

/* ── Section ── */
.section{margin-bottom:20px}
.section>h3{font-size:11px;font-weight:700;color:#344E41;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #A3B18A;text-transform:uppercase;letter-spacing:.05em}

/* ── Tables ── */
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px;border:1px solid #e4e0da;box-shadow:0 1px 4px rgba(0,0,0,.04)}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px;min-width:500px}
th{background:#f8f7f5;text-align:left;padding:8px 12px;font-weight:700;color:#666;font-size:10px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e4e0da;white-space:nowrap}
td{padding:8px 12px;border-top:1px solid #f0ede8;vertical-align:middle}
tr:hover td{background:#fafaf8}

.inner-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:6px}
.inner-table{border-collapse:collapse;background:#fff;font-size:12px;width:100%;min-width:400px}
.inner-table th{background:#f0f4ef;font-size:9px;padding:6px 10px}
.inner-table td{padding:6px 10px;border-top:1px solid #f0ede8}

/* ── Links & badges ── */
a{color:#588157;text-decoration:none}
a:hover{text-decoration:underline}
.badge{font-size:10px;padding:2px 7px;border-radius:10px;background:#f0f0f0;color:#666;font-weight:700;white-space:nowrap}
.ba{background:#d1fae5;color:#065f46}
.badm{background:#fef3c7;color:#92400e}
.pill{display:inline-block;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px}
.g{background:#d1fae5;color:#065f46}
.gr{background:#f0f0f0;color:#aaa}
.qid{display:inline-block;font-family:monospace;font-size:11px;font-weight:700;background:#eef1ea;color:#344E41;padding:1px 5px;border-radius:4px}
.del{color:#dc2626;font-size:12px;text-decoration:none;margin-left:6px}
.del:hover{color:#991b1b}
.btn-sm{font-size:12px;font-weight:600;color:#588157;white-space:nowrap;background:#eef1ea;padding:3px 8px;border-radius:6px}
.back{font-size:13px;color:#588157;display:inline-flex;align-items:center;gap:4px}

/* ── Progress bar ── */
.pbar{height:7px;background:#e4e0da;border-radius:4px;overflow:hidden;flex:1;min-width:60px}
.pfill{height:100%;background:linear-gradient(90deg,#A3B18A,#588157);border-radius:4px;transition:width .4s}

/* ── Profile card ── */
.profile-card{display:flex;align-items:flex-start;gap:14px;background:#fff;border-radius:14px;padding:16px 18px;border:1px solid #e4e0da;margin-bottom:18px;box-shadow:0 1px 6px rgba(0,0,0,.05);flex-wrap:wrap}
.avatar{width:46px;height:46px;border-radius:50%;background:#344E41;color:#fff;font-size:19px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.profile-info{flex:1;min-width:180px}
.profile-name{font-size:16px;font-weight:700;color:#344E41}
.profile-sub{font-size:12px;color:#888;margin-top:2px;word-break:break-all}
.profile-stats{display:flex;gap:14px;flex-wrap:wrap;width:100%}
.pstat{text-align:center;min-width:60px}
.pstat span{display:block;font-size:20px;font-weight:700;color:#344E41}
.pstat{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.04em}

/* ── Session card ── */
.session-card{background:#fff;border-radius:12px;border:1px solid #e4e0da;margin-bottom:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.session-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 14px;background:#fafaf8;border-bottom:1px solid #f0ede8;gap:10px;flex-wrap:wrap}
.session-hdr-left{flex:1;min-width:0}
.session-hdr-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-shrink:0}
.session-title{font-size:13px;font-weight:700;color:#344E41;display:block;margin-bottom:2px;word-break:break-word}
.session-meta{font-size:11px;color:#bbb;line-height:1.5}
.journey-body{padding:10px 14px}

/* ── Phase block ── */
.phase-block{margin-bottom:12px}
.phase-label{font-size:10px;font-weight:700;color:#588157;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;padding:3px 8px;background:#f0f4ef;border-radius:6px;display:inline-block}

/* ── Answers ── */
.answer-cell{max-width:200px;word-break:break-word}
.attempt{padding:2px 6px;border-radius:4px;margin-bottom:2px;font-size:12px;word-break:break-word}
.a-ok{background:#f0fdf4;border-left:2px solid #22c55e}
.a-err{background:#fff7ed;border-left:2px solid #f59e0b}
.retry-n{font-size:10px;font-weight:700;color:#f59e0b}
.retry-badge{font-size:10px;font-weight:700;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:8px;white-space:nowrap}
.ok-badge{font-size:11px;color:#16a34a}
.err-badge{font-size:11px;color:#f59e0b}
.saved-val{font-size:12px;font-weight:600;color:#344E41;background:#eef1ea;padding:1px 6px;border-radius:4px;word-break:break-word}

/* ── Meta bar ── */
.meta-bar{display:flex;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#fff;border-radius:10px;border:1px solid #e4e0da;margin-bottom:14px;font-size:12px;color:#666;align-items:center}

/* ── Two-col ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}

/* ── Panel ── */
.panel{background:#fff;border-radius:12px;border:1px solid #e4e0da;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.panel-title{font-size:13px;font-weight:700;color:#344E41;margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ── Chat ── */
.chat-log{max-height:65vh;overflow-y:auto;display:flex;flex-direction:column;gap:7px}
.msg{padding:9px 12px;border-radius:10px}
.msg.user{background:#f0f7ed;border-left:3px solid #588157}
.msg.assistant{background:#f8f7f5;border-left:3px solid #A3B18A}
.msg-role{font-size:10px;font-weight:700;color:#aaa;margin-bottom:3px;text-transform:uppercase;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.msg-text{font-size:12px;line-height:1.6;color:#333;white-space:pre-wrap;word-break:break-word}
.msg-time{font-size:10px;color:#ccc;margin-top:3px}

/* ── Responsive breakpoints ── */
@media(max-width:900px){
  .two-col{grid-template-columns:1fr}
  .profile-stats{justify-content:flex-start}
}
@media(max-width:640px){
  .container{padding:10px}
  .page-title{font-size:16px;margin-bottom:12px}
  .header{padding:10px 12px}
  .brand{font-size:14px}
  .header nav a{font-size:11px;padding:4px 8px}
  .stats{grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:6px}
  .stat{padding:12px 8px}
  .stat-num{font-size:22px}
  .stat-label{font-size:9px}
  .section>h3{font-size:10px}
  th{font-size:9px;padding:7px 8px}
  td{padding:7px 8px;font-size:12px}
  .profile-card{padding:14px}
  .profile-name{font-size:15px}
  .session-hdr{padding:10px 12px}
  .journey-body{padding:8px 12px}
  .panel{padding:10px}
  .meta-bar{padding:8px 12px;gap:8px}
  .answer-cell{max-width:140px}
  .chat-log{max-height:50vh}
  .pstat span{font-size:18px}
}
@media(max-width:400px){
  .header nav{display:none}
  .stats{grid-template-columns:1fr 1fr}
  .profile-card{flex-direction:column}
  .session-hdr-right{width:100%}
}
</style></head><body>
<div class="header">
  <div class="brand">🌿 CarbonIQ Admin</div>
  <nav>
    <a href="/admin" class="${title==='Dashboard'?'active':''}">Dashboard</a>
    <a href="/admin/users" class="${title==='Kullanıcılar'?'active':''}">Kullanıcılar</a>
  </nav>
</div>
<div class="container">
  <div class="page-title">${esc(title)}</div>
  ${content}
</div>
<script>
// Auto-wrap all tables for horizontal scroll on mobile
document.querySelectorAll('table').forEach(t => {
  if (t.closest('.tbl-wrap,.inner-wrap')) return;
  const w = document.createElement('div');
  w.className = t.classList.contains('inner-table') ? 'inner-wrap' : 'tbl-wrap';
  t.parentNode.insertBefore(w, t);
  w.appendChild(t);
});

// Collapsible session cards — click header to toggle journey body
document.querySelectorAll('.session-hdr').forEach(hdr => {
  const body = hdr.nextElementSibling;
  if (!body || !body.classList.contains('journey-body')) return;
  hdr.style.cursor = 'pointer';
  const tog = document.createElement('span');
  tog.textContent = '▾';
  tog.style.cssText = 'font-size:14px;color:#A3B18A;margin-left:6px;transition:transform .2s;display:inline-block';
  hdr.querySelector('.session-title')?.appendChild(tog);
  hdr.addEventListener('click', e => {
    if (e.target.closest('a,.del')) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    tog.style.transform = open ? 'rotate(-90deg)' : '';
  });
});
</script>
</body></html>`;
}

module.exports = router;
