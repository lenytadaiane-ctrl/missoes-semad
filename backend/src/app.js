const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middlewares globais ──────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Converte Prisma Decimal → Number em todas as respostas JSON
app.use((req, res, next) => {
  const _json = res.json.bind(res);
  res.json = (body) => {
    const converted = JSON.parse(
      JSON.stringify(body, (_key, value) => {
        if (value !== null && value !== undefined && typeof value === 'object' &&
            value.constructor?.name === 'Decimal') {
          return parseFloat(value.toString());
        }
        return value;
      })
    );
    return _json(converted);
  };
  next();
});

// ── Arquivos estáticos (fotos de missionários) ───────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Autenticação ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use(require('./middlewares/authMiddleware'));

// ── Rotas da API ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API SEMAD-IEADMS', timestamp: new Date().toISOString() });
});

app.use('/api/dashboard',             require('./routes/dashboardRoutes'));
app.use('/api/setores',               require('./routes/setorRoutes'));
app.use('/api/congregacoes',          require('./routes/congregacaoRoutes'));
app.use('/api/missionarios',          require('./routes/missionarioRoutes'));
app.use('/api/dependentes',           require('./routes/dependenteRoutes'));
app.use('/api/bases-missionarias',    require('./routes/baseMissionariaRoutes'));
app.use('/api/promotores-missoes',    require('./routes/promotorMissoesRoutes'));
app.use('/api/agentes-missoes',       require('./routes/agenteMissoesRoutes'));
app.use('/api/secretarios-missoes',   require('./routes/secretarioMissoesRoutes'));
app.use('/api/ofertas-missionarias',  require('./routes/ofertaMissionariaRoutes'));
app.use('/api/ranking',               require('./routes/rankingRoutes'));
app.use('/api/relatorios',            require('./routes/relatorioRoutes'));

// ── Tratamento de erros global ────────────────────────────────────────────────
app.use(require('./middlewares/errorHandler'));

module.exports = app;
