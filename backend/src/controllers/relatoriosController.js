'use strict';
const prisma = require('../config/prisma');

async function relatorioMissionarios(req, res, next) {
  try {
    const { status, baseMissionariaId, coordenadorId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (baseMissionariaId) where.baseMissionariaId = parseInt(baseMissionariaId);
    if (coordenadorId) where.coordenadorId = parseInt(coordenadorId);

    const items = await prisma.missionario.findMany({
      where,
      include: { pessoa: true, baseMissionaria: true, coordenador: { include: { pessoa: true } }, dependentes: { include: { pessoa: true } } },
      orderBy: { pessoa: { nome: 'asc' } },
    });
    res.json(items);
  } catch (err) { next(err); }
}

async function relatorioFinanceiro(req, res, next) {
  try {
    const { ano } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();

    const meses = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async (mes) => {
        const [totalAgg, capitalAgg, interiorAgg] = await Promise.all([
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoRef, mesReferencia: mes } }),
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoRef, mesReferencia: mes, congregacao: { tipo: 'CAPITAL' } } }),
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoRef, mesReferencia: mes, congregacao: { tipo: 'INTERIOR' } } }),
        ]);
        return {
          mes,
          total: parseFloat(totalAgg._sum.valor || 0),
          capital: parseFloat(capitalAgg._sum.valor || 0),
          interior: parseFloat(interiorAgg._sum.valor || 0),
        };
      })
    );

    const entradaAnual = await prisma.entradaAnual.findUnique({ where: { ano: anoRef } });
    const totalAno = meses.reduce((s, m) => s + m.total, 0);
    const totalCapital = meses.reduce((s, m) => s + m.capital, 0);
    const totalInterior = meses.reduce((s, m) => s + m.interior, 0);

    res.json({ ano: anoRef, meses, totalAno, totalCapital, totalInterior, entradaAnual });
  } catch (err) { next(err); }
}

async function relatorioFinanceiroSetores(req, res, next) {
  try {
    const { ano, mes } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();
    const mesRef = mes ? parseInt(mes) : null;

    const whereBase = { anoReferencia: anoRef };
    if (mesRef) whereBase.mesReferencia = mesRef;

    const setores = await prisma.setor.findMany({ orderBy: { nome: 'asc' } });

    const resultado = await Promise.all(
      setores.map(async (s) => {
        const [totalAgg, capitalAgg, interiorAgg] = await Promise.all([
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereBase, congregacao: { setorId: s.id } } }),
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereBase, congregacao: { setorId: s.id, tipo: 'CAPITAL' } } }),
          prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereBase, congregacao: { setorId: s.id, tipo: 'INTERIOR' } } }),
        ]);
        return {
          id: s.id,
          nome: s.nome,
          tipo: s.tipo,
          total: parseFloat(totalAgg._sum.valor || 0),
          capital: parseFloat(capitalAgg._sum.valor || 0),
          interior: parseFloat(interiorAgg._sum.valor || 0),
        };
      })
    );

    resultado.sort((a, b) => b.total - a.total);
    const totalGeral = resultado.reduce((s, r) => s + r.total, 0);
    const totalCapital = resultado.reduce((s, r) => s + r.capital, 0);
    const totalInterior = resultado.reduce((s, r) => s + r.interior, 0);

    res.json({ ano: anoRef, mes: mesRef, setores: resultado, totalGeral, totalCapital, totalInterior });
  } catch (err) { next(err); }
}

async function relatorioFinanceiroCongregacoes(req, res, next) {
  try {
    const { ano, mes, setorId, tipo } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();
    const mesRef = mes ? parseInt(mes) : null;

    const whereBase = { anoReferencia: anoRef };
    if (mesRef) whereBase.mesReferencia = mesRef;

    const whereCong = {};
    if (setorId) whereCong.setorId = parseInt(setorId);
    if (tipo) whereCong.tipo = tipo;

    const congregacoes = await prisma.congregacao.findMany({
      where: whereCong,
      include: { setor: true },
      orderBy: { nome: 'asc' },
    });

    const resultado = await Promise.all(
      congregacoes.map(async (c) => {
        const agg = await prisma.ofertaMissionaria.aggregate({
          _sum: { valor: true },
          where: { ...whereBase, congregacaoId: c.id },
        });
        return {
          id: c.id,
          nome: c.nome,
          tipo: c.tipo,
          setor: c.setor?.nome,
          setorId: c.setorId,
          total: parseFloat(agg._sum.valor || 0),
        };
      })
    );

    resultado.sort((a, b) => b.total - a.total);
    const totalGeral = resultado.reduce((s, r) => s + r.total, 0);

    res.json({ ano: anoRef, mes: mesRef, congregacoes: resultado, totalGeral });
  } catch (err) { next(err); }
}

module.exports = { relatorioMissionarios, relatorioFinanceiro, relatorioFinanceiroSetores, relatorioFinanceiroCongregacoes };
