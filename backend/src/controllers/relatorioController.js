const prisma      = require('../config/prisma');
const { toJSON }  = require('../utils/serializer');
const pdfService  = require('../services/pdfService');
const rankingService = require('../services/rankingService');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function enviarPDF(res, doc, nomeArquivo) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
  doc.pipe(res);
  doc.end();
}

// ─── Missionários ─────────────────────────────────────────────────────────────
async function getMissionarios(req, res, next) {
  try {
    const { status } = req.query;
    const where = status ? { status: status.toUpperCase() } : {};
    const data = await prisma.missionario.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: {
        pessoa:          true,
        baseMissionaria: true,
        coordenador:     { include: { pessoa: { select: { id: true, nome: true } } } },
        dependentes:     { include: { pessoa: true } },
      },
    });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function getMissionariosPDF(req, res, next) {
  try {
    const { status } = req.query;
    const where = status ? { status: status.toUpperCase() } : {};
    const data = await prisma.missionario.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: {
        pessoa:          true,
        baseMissionaria: true,
        coordenador:     { include: { pessoa: { select: { id: true, nome: true } } } },
        dependentes:     { include: { pessoa: true } },
      },
    });
    const doc = pdfService.gerarRelatorioMissionarios(toJSON(data));
    enviarPDF(res, doc, 'relatorio-missionarios.pdf');
  } catch (err) { next(err); }
}

// ─── Bases Missionárias ────────────────────────────────────────────────────────
async function getBases(req, res, next) {
  try {
    const data = await prisma.baseMissionaria.findMany({ orderBy: { nome: 'asc' } });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function getBasesPDF(req, res, next) {
  try {
    const data = await prisma.baseMissionaria.findMany({ orderBy: { nome: 'asc' } });
    const doc  = pdfService.gerarRelatorioBasesMissionarias(toJSON(data));
    enviarPDF(res, doc, 'relatorio-bases-missionarias.pdf');
  } catch (err) { next(err); }
}

// ─── Promotores de Missões ─────────────────────────────────────────────────────
async function getPromotores(req, res, next) {
  try {
    const { setorId } = req.query;
    const where = setorId ? { setorId: parseInt(setorId) } : {};
    const data = await prisma.promotorMissoes.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: { pessoa: true, setor: true },
    });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function getPromotoresPDF(req, res, next) {
  try {
    const { setorId } = req.query;
    const where = setorId ? { setorId: parseInt(setorId) } : {};
    const data = await prisma.promotorMissoes.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: { pessoa: true, setor: true },
    });
    const doc = pdfService.gerarRelatorioPromotores(toJSON(data));
    enviarPDF(res, doc, 'relatorio-promotores.pdf');
  } catch (err) { next(err); }
}

// ─── Secretários por Setor ─────────────────────────────────────────────────────
async function getSecretarios(req, res, next) {
  try {
    const data = await prisma.setor.findMany({
      orderBy: { nome: 'asc' },
      include: {
        secretarios: {
          include: { pessoa: true },
          orderBy: { pessoa: { nome: 'asc' } },
        },
      },
    });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function getSecretariosPDF(req, res, next) {
  try {
    const data = await prisma.setor.findMany({
      orderBy: { nome: 'asc' },
      include: { secretarios: { include: { pessoa: true }, orderBy: { pessoa: { nome: 'asc' } } } },
    });
    const doc = pdfService.gerarRelatorioSecretarios(toJSON(data));
    enviarPDF(res, doc, 'relatorio-secretarios.pdf');
  } catch (err) { next(err); }
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
async function getFinanceiro(req, res, next) {
  try {
    const ano = parseInt(req.query.ano) || new Date().getFullYear();
    const dados = await rankingService.getDadosFinanceiros(ano);
    res.json(dados);
  } catch (err) { next(err); }
}

async function getFinanceiroPDF(req, res, next) {
  try {
    const ano  = parseInt(req.query.ano) || new Date().getFullYear();
    const tipo = req.query.tipo || 'capital'; // capital | interior | setor | comparativo
    const dados = await rankingService.getDadosFinanceiros(ano);

    let doc;
    let nomeArquivo;

    switch (tipo) {
      case 'interior':
        doc = pdfService.gerarRelatorioFinanceiroInterior(dados);
        nomeArquivo = `financeiro-interior-${ano}.pdf`;
        break;
      case 'setor': {
        const setorId  = parseInt(req.query.setorId);
        const setorDados = dados.porSetor.find((s) => s.id === setorId);
        if (!setorDados) return res.status(404).json({ error: 'Setor não encontrado.' });
        doc = pdfService.gerarRelatorioFinanceiroSetor(setorDados, ano);
        nomeArquivo = `financeiro-setor-${setorDados.nome}-${ano}.pdf`;
        break;
      }
      case 'comparativo':
        doc = pdfService.gerarRelatorioFinanceiroComparativo(dados);
        nomeArquivo = `financeiro-comparativo-${ano}.pdf`;
        break;
      default: // capital
        doc = pdfService.gerarRelatorioFinanceiroCapital(dados);
        nomeArquivo = `financeiro-capital-${ano}.pdf`;
    }

    enviarPDF(res, doc, nomeArquivo);
  } catch (err) { next(err); }
}

module.exports = {
  getMissionarios, getMissionariosPDF,
  getBases, getBasesPDF,
  getPromotores, getPromotoresPDF,
  getSecretarios, getSecretariosPDF,
  getFinanceiro, getFinanceiroPDF,
};
