const ranking    = require('../services/rankingService');
const { toJSON } = require('../utils/serializer');

function periodoAtual() {
  const agora = new Date();
  return { mes: agora.getMonth() + 1, ano: agora.getFullYear() };
}

async function rankingCongregacoes(req, res, next) {
  try {
    const atual  = periodoAtual();
    const mes    = parseInt(req.query.mes) || atual.mes;
    const ano    = parseInt(req.query.ano) || atual.ano;
    const tipo   = req.query.tipo?.toUpperCase() || null; // CAPITAL | INTERIOR | null=todos

    const data = await ranking.calcularRankingCongregacoes(mes, ano, tipo);
    res.json({ mes, ano, tipo, ranking: data });
  } catch (err) { next(err); }
}

async function rankingSetores(req, res, next) {
  try {
    const atual = periodoAtual();
    const mes   = parseInt(req.query.mes) || atual.mes;
    const ano   = parseInt(req.query.ano) || atual.ano;

    const data  = await ranking.calcularRankingSetores(mes, ano);
    res.json({ mes, ano, ranking: data });
  } catch (err) { next(err); }
}

module.exports = { rankingCongregacoes, rankingSetores };
