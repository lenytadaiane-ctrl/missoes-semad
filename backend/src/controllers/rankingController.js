'use strict';
const prisma = require('../config/prisma');

async function rankingSetores(req, res, next) {
  try {
    const { ano, mes } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();
    const mesRef = mes ? parseInt(mes) : null;

    // período anterior: mês anterior (mesmo ano ou ano anterior) ou ano anterior
    let whereAtual = { anoReferencia: anoRef };
    let whereAnterior;
    if (mesRef) {
      whereAtual.mesReferencia = mesRef;
      if (mesRef === 1) {
        whereAnterior = { anoReferencia: anoRef - 1, mesReferencia: 12 };
      } else {
        whereAnterior = { anoReferencia: anoRef, mesReferencia: mesRef - 1 };
      }
    } else {
      whereAnterior = { anoReferencia: anoRef - 1 };
    }

    const setores = await prisma.setor.findMany({ orderBy: { nome: 'asc' } });

    const [atual, anterior] = await Promise.all([
      Promise.all(setores.map(async (s) => {
        const agg = await prisma.ofertaMissionaria.aggregate({
          _sum: { valor: true },
          where: { ...whereAtual, congregacao: { setorId: s.id } },
        });
        return { ...s, total: parseFloat(agg._sum.valor || 0) };
      })),
      Promise.all(setores.map(async (s) => {
        const agg = await prisma.ofertaMissionaria.aggregate({
          _sum: { valor: true },
          where: { ...whereAnterior, congregacao: { setorId: s.id } },
        });
        return { id: s.id, total: parseFloat(agg._sum.valor || 0) };
      })),
    ]);

    atual.sort((a, b) => b.total - a.total);
    anterior.sort((a, b) => b.total - a.total);

    const posAnt = {};
    anterior.forEach((s, i) => { posAnt[s.id] = i + 1; });

    const resultado = atual.map((s, i) => {
      const posicaoAtual = i + 1;
      const posicaoAnterior = posAnt[s.id] || posicaoAtual;
      const delta = posicaoAnterior - posicaoAtual; // positivo = subiu
      return { ...s, posicao: posicaoAtual, delta, totalAnterior: anterior.find(a => a.id === s.id)?.total || 0 };
    });

    res.json({ ano: anoRef, mes: mesRef, data: resultado });
  } catch (err) { next(err); }
}

async function rankingCongregacoes(req, res, next) {
  try {
    const { ano, mes, setorId } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();
    const mesRef = mes ? parseInt(mes) : null;

    let whereAtual = { anoReferencia: anoRef };
    let whereAnterior;
    if (mesRef) {
      whereAtual.mesReferencia = mesRef;
      whereAnterior = mesRef === 1
        ? { anoReferencia: anoRef - 1, mesReferencia: 12 }
        : { anoReferencia: anoRef, mesReferencia: mesRef - 1 };
    } else {
      whereAnterior = { anoReferencia: anoRef - 1 };
    }

    if (setorId) {
      whereAtual.congregacao = { setorId: parseInt(setorId) };
      whereAnterior.congregacao = { setorId: parseInt(setorId) };
    }

    const [gruposAtual, gruposAnt] = await Promise.all([
      prisma.ofertaMissionaria.groupBy({
        by: ['congregacaoId'],
        _sum: { valor: true },
        where: whereAtual,
        orderBy: { _sum: { valor: 'desc' } },
      }),
      prisma.ofertaMissionaria.groupBy({
        by: ['congregacaoId'],
        _sum: { valor: true },
        where: whereAnterior,
        orderBy: { _sum: { valor: 'desc' } },
      }),
    ]);

    const posAnt = {};
    gruposAnt.forEach((g, i) => { posAnt[g.congregacaoId] = i + 1; });

    const resultado = await Promise.all(
      gruposAtual.map(async (g, i) => {
        const cong = await prisma.congregacao.findUnique({ where: { id: g.congregacaoId }, include: { setor: true } });
        const posicaoAtual = i + 1;
        const posicaoAnterior = posAnt[g.congregacaoId] || posicaoAtual;
        const delta = posicaoAnterior - posicaoAtual;
        const totalAnterior = gruposAnt.find(a => a.congregacaoId === g.congregacaoId)?._sum?.valor || 0;
        return { ...cong, total: parseFloat(g._sum.valor || 0), totalAnterior: parseFloat(totalAnterior), posicao: posicaoAtual, delta };
      })
    );

    res.json({ ano: anoRef, mes: mesRef, data: resultado });
  } catch (err) { next(err); }
}

module.exports = { rankingSetores, rankingCongregacoes };
