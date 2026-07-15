'use strict';
const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');

async function getDashboard(req, res, next) {
  try {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;
    const { mes, ano } = req.query;
    const anoFiltro = parseInt(ano) || anoAtual;
    const mesFiltro = mes ? parseInt(mes) : null;

    const mesCondition = mesFiltro
      ? Prisma.sql`AND o."mesReferencia" = ${mesFiltro}`
      : Prisma.empty;

    // ── Contagens gerais (uma query) ──────────────────────────────────────────
    const [
      totalMissionariosAtivos,
      totalMissionariosAfastados,
      totalMissionariosInativos,
      totalMissionarios,
      totalSetores,
      totalCongregacoes,
      totalBases,
    ] = await Promise.all([
      prisma.missionario.count({ where: { status: 'ATIVO' } }),
      prisma.missionario.count({ where: { status: 'AFASTADO' } }),
      prisma.missionario.count({ where: { status: 'INATIVO' } }),
      prisma.missionario.count(),
      prisma.setor.count(),
      prisma.congregacao.count(),
      prisma.baseMissionaria.count(),
    ]);

    // ── Somas financeiras (uma query com CASE) ────────────────────────────────
    const somasRaw = await prisma.$queryRaw`
      SELECT
        COALESCE(SUM(CASE WHEN o."anoReferencia" = ${anoFiltro} ${mesCondition} THEN o.valor ELSE 0 END), 0) AS "somaFiltro",
        COALESCE(SUM(CASE WHEN o."anoReferencia" = ${anoFiltro} ${mesCondition} AND c.tipo = 'CAPITAL'  THEN o.valor ELSE 0 END), 0) AS "somaCapital",
        COALESCE(SUM(CASE WHEN o."anoReferencia" = ${anoFiltro} ${mesCondition} AND c.tipo = 'INTERIOR' THEN o.valor ELSE 0 END), 0) AS "somaInterior",
        COALESCE(SUM(CASE WHEN o."anoReferencia" = ${anoAtual} AND o."mesReferencia" = ${mesAtual} THEN o.valor ELSE 0 END), 0) AS "somaMesAtual",
        COALESCE(SUM(CASE WHEN o."anoReferencia" = ${anoAtual} THEN o.valor ELSE 0 END), 0) AS "somaAnoAtual"
      FROM "OfertaMissionaria" o
      JOIN "Congregacao" c ON c.id = o."congregacaoId"
    `;
    const somas = somasRaw[0];

    // ── Totais por setor (uma query com JOIN + GROUP BY) ──────────────────────
    const totaisPorSetorRaw = await prisma.$queryRaw`
      SELECT s.id, s.nome, s.tipo,
             COALESCE(SUM(o.valor), 0) AS total
      FROM "Setor" s
      LEFT JOIN "Congregacao" c ON c."setorId" = s.id
      LEFT JOIN "OfertaMissionaria" o
        ON o."congregacaoId" = c.id
       AND o."anoReferencia" = ${anoFiltro}
       ${mesCondition}
      GROUP BY s.id, s.nome, s.tipo
      ORDER BY total DESC
    `;
    const totaisPorSetor = totaisPorSetorRaw.map(r => ({
      id: r.id,
      nome: r.nome,
      tipo: r.tipo,
      total: parseFloat(r.total),
    }));

    // ── Top 10 congregações (uma query) ───────────────────────────────────────
    const topCongsRaw = await prisma.$queryRaw`
      SELECT c.id, c.nome, c.tipo, s.nome AS setor,
             COALESCE(SUM(o.valor), 0) AS total
      FROM "Congregacao" c
      LEFT JOIN "Setor" s ON s.id = c."setorId"
      LEFT JOIN "OfertaMissionaria" o
        ON o."congregacaoId" = c.id
       AND o."anoReferencia" = ${anoFiltro}
       ${mesCondition}
      GROUP BY c.id, c.nome, c.tipo, s.nome
      ORDER BY total DESC
      LIMIT 10
    `;
    const topCongregacoesFull = topCongsRaw.map(r => ({
      id: r.id,
      nome: r.nome,
      tipo: r.tipo,
      setor: r.setor,
      total: parseFloat(r.total),
    }));

    // ── Evolução últimos 12 meses (uma query) ─────────────────────────────────
    const mesMin = anoAtual * 100 + mesAtual - 11;
    const mesMax = anoAtual * 100 + mesAtual;

    const evolucaoRaw = await prisma.$queryRaw`
      SELECT "anoReferencia" AS ano, "mesReferencia" AS mes, COALESCE(SUM(valor), 0) AS total
      FROM "OfertaMissionaria"
      WHERE ("anoReferencia" * 100 + "mesReferencia") >= ${mesMin}
        AND ("anoReferencia" * 100 + "mesReferencia") <= ${mesMax}
      GROUP BY "anoReferencia", "mesReferencia"
      ORDER BY "anoReferencia" ASC, "mesReferencia" ASC
    `;

    // preenche meses sem registro com 0
    const evolucaoMap = {};
    evolucaoRaw.forEach(r => { evolucaoMap[`${r.ano}-${r.mes}`] = parseFloat(r.total); });
    const evolucaoMensal = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - 1 - i, 1);
      const a = d.getFullYear();
      const m = d.getMonth() + 1;
      evolucaoMensal.push({ ano: a, mes: m, total: evolucaoMap[`${a}-${m}`] || 0 });
    }

    // ── Crescimento anual ─────────────────────────────────────────────────────
    const entradas = await prisma.entradaAnual.findMany({ orderBy: { ano: 'asc' } });
    const somaAnoAtualRaw = await prisma.$queryRaw`
      SELECT COALESCE(SUM(valor), 0) AS total FROM "OfertaMissionaria"
      WHERE "anoReferencia" = ${anoAtual}
    `;
    const crescimentoAnual = [
      ...entradas.map(e => ({ ano: e.ano, total: parseFloat(e.valor || 0), fonte: 'registrado' })),
      ...(entradas.find(e => e.ano === anoAtual) ? [] : [{
        ano: anoAtual,
        total: parseFloat(somaAnoAtualRaw[0]?.total || 0),
        fonte: 'calculado',
      }]),
    ].sort((a, b) => a.ano - b.ano);

    // ── Alertas de acompanhamento ─────────────────────────────────────────────
    const limite30dias = new Date();
    limite30dias.setDate(limite30dias.getDate() - 30);

    const semContatoRaw = await prisma.$queryRaw`
      SELECT m.id, p.nome,
             MAX(i.data) AS ultimoContato,
             EXTRACT(DAY FROM NOW() - MAX(i.data))::int AS diasSemContato
      FROM "Missionario" m
      JOIN "Pessoa" p ON p.id = m."pessoaId"
      LEFT JOIN "InteracaoMissionario" i ON i."missionarioId" = m.id
      WHERE m.status = 'ATIVO'
      GROUP BY m.id, p.nome
      HAVING MAX(i.data) < ${limite30dias} OR MAX(i.data) IS NULL
      ORDER BY diasSemContato DESC NULLS FIRST
      LIMIT 5
    `;

    res.json({
      totalMissionariosAtivos,
      totalMissionariosAfastados,
      totalMissionariosInativos,
      totalMissionarios,
      totalSetores,
      totalCongregacoes,
      totalBases,
      somaFiltro:   parseFloat(somas.somaFiltro),
      somaCapital:  parseFloat(somas.somaCapital),
      somaInterior: parseFloat(somas.somaInterior),
      somaMesAtual: parseFloat(somas.somaMesAtual),
      somaAnoAtual: parseFloat(somas.somaAnoAtual),
      filtro: { ano: anoFiltro, mes: mesFiltro },
      evolucaoMensal,
      crescimentoAnual,
      totaisPorSetor,
      topCongregacoesFull,
      topCongregacoes: topCongregacoesFull.slice(0, 5),
      alertas: {
        semContato: semContatoRaw.map(r => ({
          id: r.id,
          nome: r.nome,
          ultimoContato: r.ultimoContato,
          diasSemContato: r.diasSemContato ?? null,
        })),
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
