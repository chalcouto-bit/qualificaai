require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const settingsRoutes = require('./routes/settings');
const clientsRoutes  = require('./routes/clients');
const historyRoutes  = require('./routes/history');
const chatRoutes     = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares de Segurança e Logging ─────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas ──────────────────────────────────────────────────────────────
app.use('/api/settings', settingsRoutes);
app.use('/api/clients',  clientsRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/chat',     chatRoutes);

// ── Error Handler Global ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

app.listen(PORT, () => {
  console.log(`✅ QualificaAI Backend rodando na porta ${PORT}`);
});

module.exports = app;
