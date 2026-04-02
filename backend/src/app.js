Como eu não consigo editar os arquivos diretamente no seu GitHub, preparei abaixo as versões corrigidas dos arquivos principais com base nos erros que você me mostrou (o erro do Prisma no salvamento e o erro 401 no mobile).

Aqui está o "kit de correção" para você copiar e substituir:

1. Corrigindo o backend/src/app.js

Este arquivo resolve o problema do Mobile e do CORS. Removi a origem genérica e adicionei permissões mais claras para o cabeçalho de autenticação.

Copie e substitua o conteúdo do seu app.js por este:

code
JavaScript
download
content_copy
expand_less
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// -- Middlewares globais ------------------------------------------------------
app.use(cors({
  // Troque 'true' pela URL da sua Vercel para maior segurança, 
  // ou deixe '*' se quiser testar o acesso mobile rapidamente.
  origin: function (origin, callback) {
    callback(null, true); 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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

// -- Arquivos estáticos (fotos de missionários) -------------------------------
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// -- Rotas Públicas (Antes da Autenticação) -----------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API SEMAD-IEADMS ATIVA', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));

// -- Middleware de Autenticação -----------------------------------------------
// Verifique se o seu front-end está enviando o Token no cabeçalho 'Authorization'
app.use(require('./middlewares/authMiddleware'));

// -- Rotas Protegidas ---------------------------------------------------------
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

// -- Tratamento de erros global -----------------------------------------------
app.use(require('./middlewares/errorHandler'));

module.exports = app;
2. Corrigindo o Erro de Salvamento (Prisma)

O erro "Argument setor is missing" acontece em todos os seus Controllers que tentam salvar dados vinculados a um Setor ou Congregação.

Vou usar o secretarioMissoesController.js como exemplo (procure ele em backend/src/controllers/). Você deve aplicar a mesma lógica de connect em todos os outros.

Procure a função create e substitua por esta lógica:

code
JavaScript
download
content_copy
expand_less
// Exemplo de como deve ficar a função de criar dentro do seu Controller:
async create(req, res) {
  try {
    const { 
      setorId, 
      congregacaoId, 
      nome, 
      email, 
      telefone, 
      dataInicio 
    } = req.body;

    const novo = await prisma.secretarioMissoes.create({
      data: {
        // CORREÇÃO AQUI: Em vez de setorId: setorId, use o connect
        setor: {
          connect: { id: Number(setorId) }
        },
        // Se houver congregação, conecta também
        ...(congregacaoId && {
          congregacao: {
            connect: { id: Number(congregacaoId) }
          }
        }),
        pessoa: {
          create: {
            nome,
            email,
            telefone
          }
        },
        dataInício: dataInicio ? new Date(dataInicio) : new Date(),
      },
      include: {
        pessoa: true,
        setor: true
      }
    });

    return res.status(201).json(novo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar cadastro" });
  }
}
3. Corrigindo o Mobile (Middleware de Autenticação)

Se o mobile dá erro 401, é porque ele não está conseguindo ler o token. Certifique-se de que o seu arquivo backend/src/middlewares/authMiddleware.js aceita o token pelo cabeçalho (Header).

Substitua o conteúdo do seu authMiddleware.js por este:

code
JavaScript
download
content_copy
expand_less
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Tenta pegar o token do cabeçalho Authorization ou do Cookie
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Acesso negado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'suachave-secreta');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
Por que essas mudanças resolvem seu problema?

Prisma (Connect): O Prisma não entende setorId se no arquivo schema.prisma o campo estiver definido como um objeto de relação. Usar setor: { connect: { id: X } } é a forma obrigatória de dizer ao banco: "vincule este novo secretário ao setor que já existe com ID X".

CORS (Mobile): O celular muitas vezes falha quando o CORS é muito restrito ou quando o origin não é detectado corretamente. O novo app.js é mais permissivo para testes.

Auth (Mobile): Navegadores mobile (Chrome/Safari no celular) bloqueiam cookies de terceiros por segurança. Se seu sistema usava apenas cookies, ele daria 401. Agora ele aceita o Header Authorization, que é o padrão mais seguro.

O que você deve fazer agora:

Substitua o código nos arquivos acima.

Dê um git push para o seu GitHub.

O Railway vai atualizar automaticamente.

No Frontend (Vercel), verifique se você está enviando o token no Axios/Fetch.

Se após isso algum cadastro ainda der erro, me mande o nome do arquivo desse cadastro (ex: missionarioController.js) e eu te mando ele corrigido também!
