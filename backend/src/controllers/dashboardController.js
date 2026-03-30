const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');
const { MESES_NOMES } = require('../utils/constants');

async function getDashboard(req, res, next) {
  try {
    const agora    = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;

    // Consultas paralelas
    const [
      totalMissionariosAtivos,
      totalMissionarios,
      totalSetores,
      totalCongregacoes,
      somaAno,
      somaMes,
      evolucaoRaw,
      ofertasAno,
    ] = await Promise.all([
      prisma.missionario.count({ where: { status: 'ATIVO' } }),
      prisma.missionario.count(),
      prisma.setor.count(),
      prisma.congregacao.count(),
      prisma.ofertaMissionaria.aggregate({
        _sum: { valor: true },
        where: { anoReferencia: anoAtual },
      }),
      prisma.ofertaMissionaria.aggregate({
        _sum: { valor: true },
        where: { mesReferencia: mesAtual, anoReferencia: anoAtual },
      }),
      // Evolução mensal — últimos 12 meses
      prisma.ofertaMissionaria.groupBy({
        by: ['mesReferencia', 'anoReferencia'],
        _sum: { valor: true },
        orderBy: [{ anoReferencia: 'asc' }, { mesReferencia: 'asc' }],
        where: {
          OR: [
            { anoReferencia: anoAtual - 1, mesReferencia: { gte: mesAtual === 12 ? 1 : mesAtual + 1 } },
            { anoReferencia: anoAtual },
          ],
        },
      }),
      // Todas as ofertas do ano para comparativo capital x interior
      prisma.ofertaMissionaria.findMany({
        where: { anoReferencia: anoAtual },
        select: { valor: true, congregacao: { select: { tipo: true } } },
      }),
    ]);

    // Comparativo capital × interior
    let totalCapital = 0, totalInterior = 0;
    for (const o of ofertasAno) {
      const v = parseFloat(o.valor.toString());
      if (o.congregacao.tipo === 'CAPITAL') totalCapital += v;
      else totalInterior += v;
    }

    // Evolução — garante 12 pontos (preenche meses sem oferta com 0)
    const evolucaoMap = new Map();
    for (const g of evolucaoRaw) {
      evolucaoMap.set(`${g.anoReferencia}-${g.mesReferencia}`, parseFloat((g._sum.valor || 0).toString()));
    }
    const evolucao = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - 1 - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      evolucao.unshift({
        mes:   m,
        ano:   a,
        label: `${MESES_NOMES[m - 1].substring(0, 3)}/${a}`,
        valor: evolucaoMap.get(`${a}-${m}`) || 0,
      });
    }

    res.json({
      missionarios: { ativos: totalMissionariosAtivos, total: totalMissionarios },
      setores:      totalSetores,
      congregacoes: totalCongregacoes,
      financeiro: {
        totalAno:       parseFloat((somaAno._sum.valor  || 0).toString()),
        totalMesAtual:  parseFloat((somaMes._sum.valor  || 0).toString()),
        totalCapital,
        totalInterior,
        mesAtual,
        anoAtual,
      },
      evolucaoMensal: evolucao,
    });
  } catch (err) { next(err); }
}

// ─── Dashboard Gráficos ───────────────────────────────────────────────────────
async function getDashboardGraficos(req, res, next) {
  try {
    const ano         = parseInt(req.query.ano) || new Date().getFullYear();
    const anoAnterior = ano - 1;
    const ABREV       = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    const [ofertasAno, evolAnoAnterior, setoresDB] = await Promise.all([
      prisma.ofertaMissionaria.findMany({
        where: { anoReferencia: ano },
        select: {
          congregacaoId: true,
          mesReferencia: true,
          valor: true,
          congregacao: {
            select: { nome: true, tipo: true, setorId: true, setor: { select: { nome: true } } },
          },
        },
      }),
      prisma.ofertaMissionaria.groupBy({
        by: ['mesReferencia'],
        _sum: { valor: true },
        where: { anoReferencia: anoAnterior },
      }),
      prisma.setor.findMany({ orderBy: { nome: 'asc' } }),
    ]);

    // 1 — Evolução comparativa (ano vs ano anterior)
    const anoMap      = new Map();
    const anteriorMap = new Map(evolAnoAnterior.map((g) => [
      g.mesReferencia, parseFloat((g._sum.valor || 0).toString()),
    ]));
    for (const o of ofertasAno) {
      const v = parseFloat(o.valor.toString());
      anoMap.set(o.mesReferencia, (anoMap.get(o.mesReferencia) || 0) + v);
    }
    const evolucaoComparativa = Array.from({ length: 12 }, (_, i) => ({
      mes:             i + 1,
      label:           ABREV[i],
      valorAno:        anoMap.get(i + 1) || 0,
      valorAnoAnterior: anteriorMap.get(i + 1) || 0,
    }));

    // 2 — Distribuição Capital × Interior
    let totalCapital = 0, totalInterior = 0;
    for (const o of ofertasAno) {
      const v = parseFloat(o.valor.toString());
      if (o.congregacao.tipo === 'CAPITAL') totalCapital += v;
      else totalInterior += v;
    }

    // 3 — Top 5 congregações do ano
    const congMap = new Map();
    for (const o of ofertasAno) {
      const v = parseFloat(o.valor.toString());
      if (!congMap.has(o.congregacaoId)) {
        congMap.set(o.congregacaoId, {
          nome:  o.congregacao.nome,
          setor: o.congregacao.setor?.nome || 'Interior',
          total: 0,
        });
      }
      congMap.get(o.congregacaoId).total += v;
    }
    const top5Congregacoes = [...congMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 4 — Dados por setor (Capital)
    const setorMap = new Map(
      setoresDB.map((s) => [s.id, { id: s.id, nome: s.nome, tipo: s.tipo, mesTotals: {}, congTotals: {} }])
    );
    for (const o of ofertasAno) {
      const sid = o.congregacao.setorId;
      if (!sid) continue;
      const s = setorMap.get(sid);
      if (!s) continue;
      const mes = o.mesReferencia;
      const v   = parseFloat(o.valor.toString());
      s.mesTotals[mes] = (s.mesTotals[mes] || 0) + v;
      if (!s.congTotals[o.congregacaoId]) {
        s.congTotals[o.congregacaoId] = { nome: o.congregacao.nome, total: 0 };
      }
      s.congTotals[o.congregacaoId].total += v;
    }
    const setores = [...setorMap.values()].map((s) => {
      const totalAno = Object.values(s.mesTotals).reduce((a, b) => a + b, 0);
      return {
        id: s.id, nome: s.nome, tipo: s.tipo, totalAno,
        evolucaoMensal: Array.from({ length: 12 }, (_, i) => ({
          mes: i + 1, label: ABREV[i], valor: s.mesTotals[i + 1] || 0,
        })),
        congregacoes: Object.values(s.congTotals).sort((a, b) => b.total - a.total),
      };
    });

    // 5 — Ranking de setores
    const rankingSetores = [...setores]
      .map((s) => ({ id: s.id, nome: s.nome, tipo: s.tipo, total: s.totalAno }))
      .sort((a, b) => b.total - a.total);

    res.json(toJSON({
      ano, anoAnterior,
      evolucaoComparativa,
      distribuicao: { capital: totalCapital, interior: totalInterior },
      top5Congregacoes,
      setores,
      rankingSetores,
    }));
  } catch (err) { next(err); }
}

// ─── Entrada Anual ────────────────────────────────────────────────────────────
async function getEntradaAnual(req, res, next) {
  try {
    const anoAtual = new Date().getFullYear();

    const [historico, somaAnoAtual] = await Promise.all([
      prisma.entradaAnual.findMany({ orderBy: { ano: 'asc' } }),
      prisma.ofertaMissionaria.aggregate({
        _sum: { valor: true },
        where: { anoReferencia: anoAtual },
      }),
    ]);

    const valorAnoAtual = parseFloat((somaAnoAtual._sum.valor || 0).toString());

    const dados = historico.map((e) => ({
      ano:      e.ano,
      valor:    parseFloat(e.valor.toString()),
      historico: true,
    }));

    // Adiciona o ano atual calculado das ofertas (só se não existir no histórico)
    if (!historico.find((e) => e.ano === anoAtual)) {
      dados.push({ ano: anoAtual, valor: valorAnoAtual, historico: false });
    }

    res.json(toJSON({ dados, anoAtual }));
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getDashboardGraficos, getEntradaAnual };
