'use strict';
const prisma = require('../config/prisma');

async function getDashboard(req, res, next) {
  try {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    const { mes, ano } = req.query;
    const anoFiltro = parseInt(ano) || anoAtual;
    const mesFiltro = mes ? parseInt(mes) : null;

    const whereOfertas = { anoReferencia: anoFiltro };
    if (mesFiltro) whereOfertas.mesReferencia = mesFiltro;

    const [
      totalMissionariosAtivos,
      totalMissionariosAfastados,
      totalMissionariosInativos,
      totalMissionarios,
      totalSetores,
      totalCongregacoes,
      totalBases,
      somaFiltro,
      somaCapital,
      somaInterior,
      somaMesAtual,
      somaAnoAtual,
    ] = await Promise.all([
      prisma.missionario.count({ where: { status: 'ATIVO' } }),
      prisma.missionario.count({ where: { status: 'AFASTADO' } }),
      prisma.missionario.count({ where: { status: 'INATIVO' } }),
      prisma.missionario.count(),
      prisma.setor.count(),
      prisma.congregacao.count(),
      prisma.baseMissionaria.count(),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: whereOfertas }),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereOfertas, congregacao: { tipo: 'CAPITAL' } } }),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereOfertas, congregacao: { tipo: 'INTERIOR' } } }),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoAtual, mesReferencia: mesAtual } }),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoAtual } }),
    ]);

    // Evolução mensal dos últimos 12 meses
    const evolucao = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const a = d.getFullYear();
      const m = d.getMonth() + 1;
      const agg = await prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: a, mesReferencia: m } });
      evolucao.push({ ano: a, mes: m, total: parseFloat(agg._sum.valor || 0) });
    }

    // Top 5 setores do período filtrado
    const setores = await prisma.setor.findMany();
    const topSetores = await Promise.all(
      setores.map(async (s) => {
        const agg = await prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereOfertas, congregacao: { setorId: s.id } } });
        return { nome: s.nome, total: parseFloat(agg._sum.valor || 0) };
      })
    );
    topSetores.sort((a, b) => b.total - a.total);

    // Top 5 congregações do período filtrado
    const topCongs = await prisma.ofertaMissionaria.groupBy({
      by: ['congregacaoId'],
      _sum: { valor: true },
      where: whereOfertas,
      orderBy: { _sum: { valor: 'desc' } },
      take: 5,
    });
    const topCongregacoes = await Promise.all(
      topCongs.map(async (g) => {
        const c = await prisma.congregacao.findUnique({ where: { id: g.congregacaoId } });
        return { nome: c?.nome || '?', total: parseFloat(g._sum.valor || 0) };
      })
    );

    // Crescimento anual: EntradaAnual 2017-ano_anterior + ano atual calculado de ofertas
    const entradas = await prisma.entradaAnual.findMany({ orderBy: { ano: 'asc' } });
    const somaAnoAtualRaw = await prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { anoReferencia: anoAtual } });
    const crescimentoAnual = [
      ...entradas.map(e => ({ ano: e.ano, total: parseFloat(e.valor || 0), fonte: 'registrado' })),
      ...(entradas.find(e => e.ano === anoAtual) ? [] : [{ ano: anoAtual, total: parseFloat(somaAnoAtualRaw._sum.valor || 0), fonte: 'calculado' }]),
    ].sort((a, b) => a.ano - b.ano);

    // Totais por setor do período filtrado
    const todoSetores = await prisma.setor.findMany({ orderBy: { nome: 'asc' } });
    const totaisPorSetor = await Promise.all(
      todoSetores.map(async (s) => {
        const agg = await prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where: { ...whereOfertas, congregacao: { setorId: s.id } } });
        return { id: s.id, nome: s.nome, tipo: s.tipo, total: parseFloat(agg._sum.valor || 0) };
      })
    );
    totaisPorSetor.sort((a, b) => b.total - a.total);

    // Top 10 congregações do período filtrado
    const topCongsFull = await prisma.ofertaMissionaria.groupBy({
      by: ['congregacaoId'],
      _sum: { valor: true },
      where: whereOfertas,
      orderBy: { _sum: { valor: 'desc' } },
      take: 10,
    });
    const topCongsFullData = await Promise.all(
      topCongsFull.map(async (g) => {
        const c = await prisma.congregacao.findUnique({ where: { id: g.congregacaoId }, include: { setor: true } });
        return { id: g.congregacaoId, nome: c?.nome || '?', setor: c?.setor?.nome, tipo: c?.tipo, total: parseFloat(g._sum.valor || 0) };
      })
    );

    res.json({
      totalMissionariosAtivos,
      totalMissionariosAfastados,
      totalMissionariosInativos,
      totalMissionarios,
      totalSetores,
      totalCongregacoes,
      totalBases,
      somaFiltro: parseFloat(somaFiltro._sum.valor || 0),
      somaCapital: parseFloat(somaCapital._sum.valor || 0),
      somaInterior: parseFloat(somaInterior._sum.valor || 0),
      somaMesAtual: parseFloat(somaMesAtual._sum.valor || 0),
      somaAnoAtual: parseFloat(somaAnoAtual._sum.valor || 0),
      filtro: { ano: anoFiltro, mes: mesFiltro },
      evolucaoMensal: evolucao,
      comparativo: {
        capital: parseFloat(somaCapital._sum.valor || 0),
        interior: parseFloat(somaInterior._sum.valor || 0),
      },
      topSetores: topSetores.slice(0, 5),
      topCongregacoes,
      crescimentoAnual,
      totaisPorSetor,
      topCongregacoesFull: topCongsFullData,
    });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
