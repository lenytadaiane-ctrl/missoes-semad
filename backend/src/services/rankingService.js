const prisma = require('../config/prisma');

function mesAnterior(mes, ano) {
  if (mes === 1) return { mes: 12, ano: ano - 1 };
  return { mes: mes - 1, ano };
}

function atribuirMedalha(posicao) {
  if (posicao === 1) return 'OURO';
  if (posicao === 2) return 'PRATA';
  if (posicao === 3) return 'BRONZE';
  return null;
}

// ── Ranking de Congregações ───────────────────────────────────────────────────
async function calcularRankingCongregacoes(mes, ano, tipo = null) {
  const prev = mesAnterior(mes, ano);

  const whereAtual = { mesReferencia: mes, anoReferencia: ano };
  const wherePrev  = { mesReferencia: prev.mes, anoReferencia: prev.ano };

  if (tipo) {
    whereAtual.congregacao = { tipo };
    wherePrev.congregacao  = { tipo };
  }

  const [ofertas, ofertasPrev] = await Promise.all([
    prisma.ofertaMissionaria.findMany({
      where: whereAtual,
      include: { congregacao: { include: { setor: true } } },
    }),
    prisma.ofertaMissionaria.findMany({
      where: wherePrev,
      select: { congregacaoId: true, valor: true },
    }),
  ]);

  // Agrupa por congregação — mês atual
  const mapaAtual = new Map();
  for (const o of ofertas) {
    const id = o.congregacaoId;
    const entry = mapaAtual.get(id) || { cong: o.congregacao, total: 0 };
    entry.total += parseFloat(o.valor.toString());
    mapaAtual.set(id, entry);
  }

  // Agrega mês anterior
  const mapaPrev = new Map();
  for (const o of ofertasPrev) {
    mapaPrev.set(o.congregacaoId, (mapaPrev.get(o.congregacaoId) || 0) + parseFloat(o.valor.toString()));
  }

  const sortedPrev = [...mapaPrev.entries()].sort((a, b) => b[1] - a[1]);
  const posPrev    = new Map(sortedPrev.map(([id], i) => [id, i + 1]));

  const sorted = [...mapaAtual.values()].sort((a, b) => b.total - a.total);

  return sorted.map((item, idx) => {
    const posicao     = idx + 1;
    const posAnterior = posPrev.get(item.cong.id) ?? null;
    const variacao    = posAnterior !== null ? posAnterior - posicao : null;
    return {
      posicao,
      medalha:          atribuirMedalha(posicao),
      congregacaoId:    item.cong.id,
      nome:             item.cong.nome,
      setor:            item.cong.setor?.nome ?? null,
      tipo:             item.cong.tipo,
      valor:            item.total,
      valorMesAnterior: mapaPrev.get(item.cong.id) ?? 0,
      posicaoAnterior:  posAnterior,
      variacao,
    };
  });
}

// ── Ranking de Setores ────────────────────────────────────────────────────────
async function calcularRankingSetores(mes, ano) {
  const prev = mesAnterior(mes, ano);

  const [ofertas, ofertasPrev] = await Promise.all([
    prisma.ofertaMissionaria.findMany({
      where: { mesReferencia: mes, anoReferencia: ano },
      include: { congregacao: { include: { setor: true } } },
    }),
    prisma.ofertaMissionaria.findMany({
      where: { mesReferencia: prev.mes, anoReferencia: prev.ano },
      include: { congregacao: { select: { setorId: true } } },
    }),
  ]);

  // Agrega por setor — mês atual
  const mapaAtual = new Map();
  for (const o of ofertas) {
    const setor = o.congregacao.setor;
    if (!setor) continue; // interior sem setor
    const id    = setor.id;
    const entry = mapaAtual.get(id) || { setor, total: 0 };
    entry.total += parseFloat(o.valor.toString());
    mapaAtual.set(id, entry);
  }

  // Agrega por setor — mês anterior
  const mapaPrev = new Map();
  for (const o of ofertasPrev) {
    const sid = o.congregacao.setorId;
    if (!sid) continue;
    mapaPrev.set(sid, (mapaPrev.get(sid) || 0) + parseFloat(o.valor.toString()));
  }

  const sortedPrev = [...mapaPrev.entries()].sort((a, b) => b[1] - a[1]);
  const posPrev    = new Map(sortedPrev.map(([id], i) => [id, i + 1]));

  const sorted = [...mapaAtual.values()].sort((a, b) => b.total - a.total);

  return sorted.map((item, idx) => {
    const posicao     = idx + 1;
    const posAnterior = posPrev.get(item.setor.id) ?? null;
    const variacao    = posAnterior !== null ? posAnterior - posicao : null;
    return {
      posicao,
      medalha:          atribuirMedalha(posicao),
      setorId:          item.setor.id,
      nome:             item.setor.nome,
      tipo:             item.setor.tipo,
      valor:            item.total,
      valorMesAnterior: mapaPrev.get(item.setor.id) ?? 0,
      posicaoAnterior:  posAnterior,
      variacao,
    };
  });
}

// ── Dados financeiros matriciais para relatório ───────────────────────────────
async function getDadosFinanceiros(ano) {
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);

  const [setoresCapital, congregacoesInterior, todasOfertas] = await Promise.all([
    prisma.setor.findMany({
      where: { tipo: 'CAPITAL' },
      orderBy: { nome: 'asc' },
      include: { congregacoes: { orderBy: { nome: 'asc' } } },
    }),
    prisma.congregacao.findMany({
      where: { tipo: 'INTERIOR' },
      orderBy: { nome: 'asc' },
    }),
    prisma.ofertaMissionaria.findMany({
      where: { anoReferencia: ano },
      include: { congregacao: { include: { setor: true } } },
    }),
  ]);

  // Mapeia: congregacaoId → mes → valor
  const ofertaMap = new Map();
  for (const o of todasOfertas) {
    if (!ofertaMap.has(o.congregacaoId)) ofertaMap.set(o.congregacaoId, new Map());
    ofertaMap.get(o.congregacaoId).set(o.mesReferencia, parseFloat(o.valor.toString()));
  }

  // ── Capital consolidado: setor → mes → total ──────────────────────────────
  const capitalConsolidado = setoresCapital.map((setor) => {
    const totaisMes = {};
    let totalAnual = 0;
    for (const mes of meses) {
      let totalMes = 0;
      for (const cong of setor.congregacoes) {
        totalMes += ofertaMap.get(cong.id)?.get(mes) || 0;
      }
      totaisMes[mes] = totalMes;
      totalAnual += totalMes;
    }
    return { id: setor.id, nome: setor.nome, totaisMes, totalAnual };
  });

  // ── Por setor detalhado: congregação → mes → valor ────────────────────────
  const porSetor = setoresCapital.map((setor) => ({
    id: setor.id,
    nome: setor.nome,
    congregacoes: setor.congregacoes.map((cong) => {
      const totaisMes = {};
      let totalAnual = 0;
      for (const mes of meses) {
        const v = ofertaMap.get(cong.id)?.get(mes) || 0;
        totaisMes[mes] = v;
        totalAnual += v;
      }
      return { id: cong.id, nome: cong.nome, totaisMes, totalAnual };
    }),
  }));

  // ── Interior: Igreja → mes → valor ────────────────────────────────────────
  const interior = congregacoesInterior.map((cong) => {
    const totaisMes = {};
    let totalAnual = 0;
    for (const mes of meses) {
      const v = ofertaMap.get(cong.id)?.get(mes) || 0;
      totaisMes[mes] = v;
      totalAnual += v;
    }
    return { id: cong.id, nome: cong.nome, totaisMes, totalAnual };
  });

  return { ano, meses, capitalConsolidado, porSetor, interior };
}

module.exports = { calcularRankingCongregacoes, calcularRankingSetores, getDadosFinanceiros };
