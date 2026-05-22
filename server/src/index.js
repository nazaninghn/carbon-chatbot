const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath, override: true });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');
const adminPanel = require('./routes/adminPanel');
const { authenticateToken } = require('./middleware/auth');
const { startMCPServer } = require('./mcp/server');

const app = express();
const server = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to known origins. Set CLIENT_URL env var for production.
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

// Socket.IO
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust Render/Vercel proxy for rate-limit
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Chat limit: 60/min in dev, 30/min in prod
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 60 : 30,
  message: { error: 'Too many messages, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatLimiter, chatRoutes);
app.use('/api/sessions', authenticateToken, sessionRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/admin', adminPanel);

// ── Health check (JSON) ───────────────────────────────────────────────────────
// NOTE: this endpoint is intentionally public (used by Render health-check and
// the Render keep-alive pinger). Do NOT expose API keys or sensitive config here.
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    groq: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_KEY_HERE',
    version: '1.0.0',
  });
});

// ── Root — status page ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';
  const dbHost   = mongoose.connection.host || 'in-memory';
  const isMemory = dbHost.includes('127.0.0.1') && dbHost !== 'localhost';
  const groqOk   = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_KEY_HERE';

  res.send(`<!DOCTYPE html><html lang="tr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CarbonIQ API Status</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#f0f4ef;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:16px;padding:36px 40px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(52,78,65,.1)}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:4px}
  h1{font-size:22px;font-weight:700;color:#344E41}
  .sub{font-size:13px;color:#A3B18A;margin-bottom:28px;margin-top:2px}
  .row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #f0ede8}
  .row:last-of-type{border:none}
  .label{font-size:13px;color:#555;display:flex;align-items:center;gap:7px}
  .badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
  .ok  {background:#eef1ea;color:#3a6b38}
  .warn{background:#fef3c7;color:#92400e}
  .err {background:#fee2e2;color:#991b1b}
  .warn-box{margin-top:16px;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;font-size:12px;color:#78350f;line-height:1.5}
  .endpoints{margin-top:24px;background:#f8f7f5;border-radius:10px;padding:16px}
  .endpoints h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#A3B18A;margin-bottom:10px;font-weight:600}
  .ep{font-size:12px;font-family:'Courier New',monospace;color:#344E41;padding:3px 0;display:flex;gap:12px}
  .method{color:#A3B18A;min-width:40px}
  .footer{margin-top:20px;font-size:11px;color:#bbb;text-align:center}
</style></head><body><div class="card">
  <div class="logo">
    <div style="width:32px;height:32px;border-radius:8px;background:#344E41;display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3B18A" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <h1>CarbonIQ API</h1>
  </div>
  <div class="sub">ISO 14064-1 Karbon Chatbot Backend &nbsp;·&nbsp; Port ${process.env.PORT || 3001}</div>

  <div class="row">
    <span class="label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>Sunucu</span>
    <span class="badge ok">✓ Çalışıyor</span>
  </div>
  <div class="row">
    <span class="label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>MongoDB</span>
    <span class="badge ${dbStatus === 'connected' ? (isMemory ? 'warn' : 'ok') : 'err'}">
      ${dbStatus === 'connected' ? (isMemory ? '⚠ In-Memory (geçici)' : '✓ Kalıcı (lokal)') : '✗ ' + dbStatus}
    </span>
  </div>
  <div class="row">
    <span class="label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v4l3 3"/></svg>Groq AI</span>
    <span class="badge ${groqOk ? 'ok' : 'warn'}">${groqOk ? '✓ Aktif' : '⚠ Mock Mode'}</span>
  </div>
  <div class="row">
    <span class="label">Ortam</span>
    <span class="badge ok">${process.env.NODE_ENV || 'development'}</span>
  </div>
  <div class="row">
    <span class="label">Zaman</span>
    <span style="font-size:12px;color:#999">${new Date().toLocaleString('tr-TR')}</span>
  </div>

  ${isMemory ? `<div class="warn-box">⚠ <strong>In-Memory MongoDB çalışıyor.</strong> Bu modda veriler sunucu yeniden başlatıldığında silinir.<br>Kalıcı depolama için Windows MongoDB servisini başlatın: <code>net start MongoDB</code></div>` : ''}

  <div class="endpoints">
    <h3>API Endpoint'leri</h3>
    <div class="ep"><span class="method">POST</span>/api/auth/register</div>
    <div class="ep"><span class="method">POST</span>/api/auth/login</div>
    <div class="ep"><span class="method">GET</span>/api/auth/me</div>
    <div class="ep"><span class="method">POST</span>/api/chat/start</div>
    <div class="ep"><span class="method">POST</span>/api/chat/message</div>
    <div class="ep"><span class="method">GET</span>/api/sessions</div>
    <div class="ep"><span class="method">GET</span>/api/sessions/:id</div>
    <div class="ep"><span class="method">GET</span>/api/sessions/:id/summary</div>
    <div class="ep"><span class="method">DELETE</span>/api/sessions/:id</div>
    <div class="ep"><span class="method">GET</span>/api/health</div>
  </div>
  <div class="footer">CarbonIQ v1.0.0 &nbsp;·&nbsp; ISO 14064-1 Compliant</div>
</div></body></html>`);
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.use(require('./middleware/socketAuth'));
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`);
  require('./socket/chatHandler')(io, socket);
});

// ── MongoDB + start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function startApp() {
  let mongoUri = process.env.MONGODB_URI;
  let usingMemory = false;

  if (isDev) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
    } catch {
      logger.warn('⚠ Local MongoDB not available — starting in-memory fallback (data will not persist across restarts)');
      logger.warn('   To fix: run "net start MongoDB" in an admin terminal, or install MongoDB from https://www.mongodb.com/try/download/community');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        usingMemory = true;
        logger.warn('⚠ In-memory MongoDB started — for development only');
      } catch (memErr) {
        logger.error('❌ Cannot start in-memory MongoDB:', memErr.message);
        logger.error('   Install MongoDB or set MONGODB_URI to Atlas connection string');
        process.exit(1);
      }
    }
  } else {
    try {
      await mongoose.connect(mongoUri);
      logger.info(`✅ MongoDB connected: ${mongoose.connection.host}`);
    } catch (err) {
      logger.error('❌ MongoDB connection failed:', err.message);
      logger.error('   MONGODB_URI:', mongoUri ? mongoUri.substring(0, 30) + '...' : 'NOT SET');
      process.exit(1);
    }
  }

  server.listen(PORT, () => {
    logger.info(`🌿 CarbonIQ Server running on http://localhost:${PORT}`);
    logger.info(`   Status page : http://localhost:${PORT}/`);
    logger.info(`   Health JSON : http://localhost:${PORT}/api/health`);
    if (usingMemory) {
      logger.warn('   ⚠ DATA WILL BE LOST ON RESTART (in-memory mode)');
    }

    // Keep-alive ping for Render free tier (prevents 15-min sleep).
    // Store the interval so it can be cleared on graceful shutdown.
    let keepAliveTimer = null;
    if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
      const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      const pinger = selfUrl.startsWith('https') ? require('https') : require('http');
      keepAliveTimer = setInterval(() => {
        pinger.get(`${selfUrl}/api/health`, () => {}).on('error', () => {});
      }, 10 * 60 * 1000); // ping every 10 min
    }

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      clearInterval(keepAliveTimer);
      server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false).then(() => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        }).catch(() => process.exit(1));
      });
      // Force-exit after 10 s if something hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  });

  startMCPServer();
}

startApp().catch((err) => {
  console.error('FATAL ERROR:', err);
  logger.error('Failed to start application:', err);
  process.exit(1);
});

module.exports = { app, io };
