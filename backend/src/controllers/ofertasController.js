'use strict';
const prisma = require('../config/prisma');

async function list(req, res, next) {
  try {
    const { mes, ano, tipo, setorId, congregacaoId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (mes) where.mesReferencia = parseInt(mes);
    if (ano) where.anoReferencia = parseInt(ano);
    if (congregacaoId) where.congregacaoId = parseInt(congregacaoId);
    if (tipo || setorId) {
      where.congregacao = {};
      if (tipo) where.congregacao.tipo = tipo;
      if (setorId) where.congregacao.setorId = parseInt(setorId);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total, soma] = await Promise.all([
      prisma.ofertaMissionaria.findMany({
        where, skip, take: parseInt(limit),
        include: { congregacao: { include: { setor: true } } },
        orderBy: [{ anoReferencia: 'desc' }, { mesReferencia: 'desc' }],
      }),
      prisma.ofertaMissionaria.count({ where }),
      prisma.ofertaMissionaria.aggregate({ _sum: { valor: true }, where }),
    ]);

    res.json({ data, total, soma: parseFloat(soma._sum.valor || 0), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const item = await prisma.ofertaMissionaria.findUnique({ where: { id: parseInt(req.params.id) }, include: { congregacao: true } });
    if (!item) return res.status(404).json({ error: 'Oferta não encontrada' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { congregacaoId, mesReferencia, anoReferencia, valor, observacao } = req.body;
    const item = await prisma.ofertaMissionaria.create({
      data: {
        congregacaoId: parseInt(congregacaoId),
        mesReferencia: parseInt(mesReferencia),
        anoReferencia: parseInt(anoReferencia),
        valor: parseFloat(valor),
        observacao,
      },
      include: { congregacao: { include: { setor: true } } },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { congregacaoId, mesReferencia, anoReferencia, valor, observacao } = req.body;
    const data = {};
    if (congregacaoId !== undefined) data.congregacaoId = parseInt(congregacaoId);
    if (mesReferencia !== undefined) data.mesReferencia = parseInt(mesReferencia);
    if (anoReferencia !== undefined) data.anoReferencia = parseInt(anoReferencia);
    if (valor !== undefined) data.valor = parseFloat(valor);
    if (observacao !== undefined) data.observacao = observacao;
    const item = await prisma.ofertaMissionaria.update({ where: { id: parseInt(req.params.id) }, data, include: { congregacao: true } });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.ofertaMissionaria.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function resumo(req, res, next) {
  try {
    const { ano } = req.query;
    const anoRef = parseInt(ano) || new Date().getFullYear();
    const meses = await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async (mes) => {
        const agg = await prisma.ofertaMissionaria.aggregate({
          _sum: { valor: true },
          where: { anoReferencia: anoRef, mesReferencia: mes },
        });
        return { mes, total: parseFloat(agg._sum.valor || 0) };
      })
    );
    res.json({ ano: anoRef, meses });
  } catch (err) { next(err); }
}

async function pivotSetores(req, res, next) {
  try {
    const anoRef = parseInt(req.query.ano) || new Date().getFullYear();
    const linhas = await prisma.$queryRaw`
      SELECT s.id, s.nome, s.tipo,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=1  THEN o.valor ELSE 0 END),0)::float AS m1,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=2  THEN o.valor ELSE 0 END),0)::float AS m2,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=3  THEN o.valor ELSE 0 END),0)::float AS m3,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=4  THEN o.valor ELSE 0 END),0)::float AS m4,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=5  THEN o.valor ELSE 0 END),0)::float AS m5,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=6  THEN o.valor ELSE 0 END),0)::float AS m6,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=7  THEN o.valor ELSE 0 END),0)::float AS m7,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=8  THEN o.valor ELSE 0 END),0)::float AS m8,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=9  THEN o.valor ELSE 0 END),0)::float AS m9,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=10 THEN o.valor ELSE 0 END),0)::float AS m10,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=11 THEN o.valor ELSE 0 END),0)::float AS m11,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=12 THEN o.valor ELSE 0 END),0)::float AS m12,
        COALESCE(SUM(o.valor),0)::float AS total
      FROM "Setor" s
      LEFT JOIN "Congregacao" c ON c."setorId" = s.id
      LEFT JOIN "OfertaMissionaria" o ON o."congregacaoId" = c.id AND o."anoReferencia" = ${anoRef}
      GROUP BY s.id, s.nome, s.tipo
      ORDER BY s.nome ASC
    `;
    res.json({ ano: anoRef, linhas });
  } catch (err) { next(err); }
}

async function pivotCongregacoes(req, res, next) {
  try {
    const { Prisma } = require('@prisma/client');
    const anoRef  = parseInt(req.query.ano) || new Date().getFullYear();
    const setorId = req.query.setorId ? parseInt(req.query.setorId) : null;
    const tipo    = req.query.tipo || null;
    const filtroSetor = setorId ? Prisma.sql`AND c."setorId" = ${setorId}` : Prisma.empty;
    const filtroTipo  = tipo    ? Prisma.sql`AND c.tipo = ${tipo}`         : Prisma.empty;

    const linhas = await prisma.$queryRaw`
      SELECT c.id, c.nome, c.tipo, c.cidade, s.nome AS setor, s.id AS "setorId",
        COALESCE(SUM(CASE WHEN o."mesReferencia"=1  THEN o.valor ELSE 0 END),0)::float AS m1,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=2  THEN o.valor ELSE 0 END),0)::float AS m2,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=3  THEN o.valor ELSE 0 END),0)::float AS m3,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=4  THEN o.valor ELSE 0 END),0)::float AS m4,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=5  THEN o.valor ELSE 0 END),0)::float AS m5,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=6  THEN o.valor ELSE 0 END),0)::float AS m6,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=7  THEN o.valor ELSE 0 END),0)::float AS m7,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=8  THEN o.valor ELSE 0 END),0)::float AS m8,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=9  THEN o.valor ELSE 0 END),0)::float AS m9,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=10 THEN o.valor ELSE 0 END),0)::float AS m10,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=11 THEN o.valor ELSE 0 END),0)::float AS m11,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=12 THEN o.valor ELSE 0 END),0)::float AS m12,
        COALESCE(SUM(o.valor),0)::float AS total
      FROM "Congregacao" c
      LEFT JOIN "Setor" s ON s.id = c."setorId"
      LEFT JOIN "OfertaMissionaria" o ON o."congregacaoId" = c.id AND o."anoReferencia" = ${anoRef}
      WHERE 1=1 ${filtroSetor} ${filtroTipo}
      GROUP BY c.id, c.nome, c.tipo, c.cidade, s.nome, s.id
      ORDER BY s.nome ASC NULLS LAST, c.nome ASC
    `;
    res.json({ ano: anoRef, linhas });
  } catch (err) { next(err); }
}

async function pivotCidades(req, res, next) {
  try {
    const { Prisma } = require('@prisma/client');
    const anoRef = parseInt(req.query.ano) || new Date().getFullYear();
    const tipo   = req.query.tipo || null;
    const filtroTipo = tipo ? Prisma.sql`AND c.tipo = ${tipo}` : Prisma.empty;

    const linhas = await prisma.$queryRaw`
      SELECT COALESCE(c.cidade, '(sem cidade)') AS cidade,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=1  THEN o.valor ELSE 0 END),0)::float AS m1,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=2  THEN o.valor ELSE 0 END),0)::float AS m2,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=3  THEN o.valor ELSE 0 END),0)::float AS m3,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=4  THEN o.valor ELSE 0 END),0)::float AS m4,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=5  THEN o.valor ELSE 0 END),0)::float AS m5,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=6  THEN o.valor ELSE 0 END),0)::float AS m6,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=7  THEN o.valor ELSE 0 END),0)::float AS m7,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=8  THEN o.valor ELSE 0 END),0)::float AS m8,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=9  THEN o.valor ELSE 0 END),0)::float AS m9,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=10 THEN o.valor ELSE 0 END),0)::float AS m10,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=11 THEN o.valor ELSE 0 END),0)::float AS m11,
        COALESCE(SUM(CASE WHEN o."mesReferencia"=12 THEN o.valor ELSE 0 END),0)::float AS m12,
        COALESCE(SUM(o.valor),0)::float AS total,
        COUNT(DISTINCT c.id) AS "qtdCongregacoes"
      FROM "Congregacao" c
      LEFT JOIN "OfertaMissionaria" o ON o."congregacaoId" = c.id AND o."anoReferencia" = ${anoRef}
      WHERE 1=1 ${filtroTipo}
      GROUP BY c.cidade
      ORDER BY total DESC
    `;
    res.json({ ano: anoRef, linhas: linhas.map(r => ({ ...r, qtdCongregacoes: parseInt(r.qtdCongregacoes) })) });
  } catch (err) { next(err); }
}

async function upsert(req, res, next) {
  try {
    const { congregacaoId, mesReferencia, anoReferencia, valor, observacao } = req.body;
    const item = await prisma.ofertaMissionaria.upsert({
      where: { congregacaoId_mesReferencia_anoReferencia: {
        congregacaoId: parseInt(congregacaoId),
        mesReferencia: parseInt(mesReferencia),
        anoReferencia: parseInt(anoReferencia),
      }},
      update: { valor: parseFloat(valor), observacao: observacao || null },
      create: {
        congregacaoId: parseInt(congregacaoId),
        mesReferencia: parseInt(mesReferencia),
        anoReferencia: parseInt(anoReferencia),
        valor: parseFloat(valor),
        observacao: observacao || null,
      },
      include: { congregacao: { include: { setor: true } } },
    });
    res.json(item);
  } catch (err) { next(err); }
}

// ── Importação de arquivo (Excel / PDF) ───────────────────────────────────────

function normalizar(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similaridade(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wa = na.split(' ').filter(Boolean);
  const wb = new Set(nb.split(' ').filter(Boolean));
  const intersect = wa.filter(w => wb.has(w)).length;
  if (intersect === 0) return 0;
  return intersect / Math.max(wa.length, wb.size);
}

function parsearValorBR(str) {
  if (typeof str === 'number') return isNaN(str) ? null : str;
  const s = String(str || '').trim().replace(/R\$\s*/g, '');
  // "1.234,56" → 1234.56
  const v = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return isNaN(v) ? null : v;
}

async function parsearExcel(buffer) {
  const xlsx = require('xlsx');
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // header:1 retorna arrays brutos (sem depender de cabeçalhos)
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rawRows.length === 0) return [];

  // Detecta a linha de cabeçalho (primeira linha não-vazia)
  let headerRow = -1;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    if (rawRows[i].some(c => c !== '')) { headerRow = i; break; }
  }
  if (headerRow === -1) return [];

  const headers = rawRows[headerRow].map(h => normalizar(String(h)));
  const dataRows = rawRows.slice(headerRow + 1).filter(r => r.some(c => c !== ''));

  // Detecta coluna de nome: 1) por cabeçalho, 2) por conteúdo (coluna com strings longas)
  const nomeKeywords = ['nome', 'congreg', 'igreja', 'local', 'cidade', 'setor', 'descric', 'descri'];
  const valorKeywords = ['valor', 'ofert', 'total', 'receit', 'arrecad', 'quantia', 'mont'];

  let colunaNomel = headers.findIndex(h => nomeKeywords.some(k => h.includes(k)));
  let colunaValor = headers.findIndex(h => valorKeywords.some(k => h.includes(k)));

  // Fallback: detecta por tipo de dado das primeiras linhas
  if (colunaNomel === -1 || colunaValor === -1) {
    const amostra = dataRows.slice(0, 10);
    const numCols = Math.max(...amostra.map(r => r.length), 0);
    const scores = Array.from({ length: numCols }, (_, i) => {
      const vals = amostra.map(r => r[i]).filter(v => v !== '');
      const numCount = vals.filter(v => parsearValorBR(v) !== null && parsearValorBR(v) > 0).length;
      const textCount = vals.filter(v => typeof v === 'string' && v.trim().length > 3).length;
      return { i, numCount, textCount };
    });
    if (colunaNomel === -1) {
      const best = scores.filter(s => s.i !== colunaValor).sort((a, b) => b.textCount - a.textCount)[0];
      if (best && best.textCount > 0) colunaNomel = best.i;
    }
    if (colunaValor === -1) {
      const best = scores.filter(s => s.i !== colunaNomel).sort((a, b) => b.numCount - a.numCount)[0];
      if (best && best.numCount > 0) colunaValor = best.i;
    }
  }

  if (colunaNomel === -1 || colunaValor === -1) return [];

  const linhas = [];
  for (const row of dataRows) {
    const nome = String(row[colunaNomel] || '').trim();
    const valor = parsearValorBR(row[colunaValor]);
    if (nome && nome.length >= 2 && valor !== null && valor > 0) {
      linhas.push({ nome, valor });
    }
  }
  return linhas;
}

async function parsearPDF(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
  const linhas = [];
  // Padrão: "Nome da Congregação .... 1.234,56" ou "Nome R$ 1.234,56"
  const reValor = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)$/;
  for (const line of lines) {
    const m = line.match(reValor);
    if (!m) continue;
    const valor = parsearValorBR(m[1]);
    if (!valor || valor <= 0) continue;
    const nome = line.slice(0, line.lastIndexOf(m[0])).replace(/\.{2,}/g, '').trim();
    if (nome && nome.length >= 3) linhas.push({ nome, valor });
  }
  return linhas;
}

async function importarPreview(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const { mesReferencia, anoReferencia } = req.body;
    if (!mesReferencia || !anoReferencia) return res.status(400).json({ error: 'Informe mês e ano de referência' });

    const mime = req.file.mimetype || '';
    const originalname = (req.file.originalname || '').toLowerCase();
    console.log(`[importar] arquivo: ${req.file.originalname}, mime: ${mime}, size: ${req.file.size}`);

    let linhasBruto = [];
    const isExcel = mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('sheet') ||
      originalname.endsWith('.xlsx') || originalname.endsWith('.xls') || originalname.endsWith('.csv') ||
      mime === 'application/octet-stream';
    const isPDF = mime.includes('pdf') || originalname.endsWith('.pdf');

    if (isExcel && !isPDF) {
      linhasBruto = await parsearExcel(req.file.buffer);
      console.log(`[importar] Excel: ${linhasBruto.length} linhas extraídas`);
    } else if (isPDF) {
      linhasBruto = await parsearPDF(req.file.buffer);
      console.log(`[importar] PDF: ${linhasBruto.length} linhas extraídas`);
    } else {
      return res.status(400).json({ error: `Formato não suportado (${mime || originalname}). Use Excel (.xlsx, .xls) ou PDF.` });
    }

    if (linhasBruto.length === 0) return res.status(422).json({
      error: 'Nenhuma linha com nome+valor encontrada no arquivo. Verifique se a planilha tem colunas de congregação e valor.',
    });

    const congregacoes = await prisma.congregacao.findMany({ include: { setor: true } });

    const preview = linhasBruto.map((linha, idx) => {
      let melhor = null, melhorScore = 0;
      for (const cong of congregacoes) {
        const score = similaridade(linha.nome, cong.nome);
        if (score > melhorScore) { melhorScore = score; melhor = cong; }
      }
      const matched = melhorScore >= 0.5;
      return {
        idx,
        nomeOriginal: linha.nome,
        valor: linha.valor,
        matched,
        score: Math.round(melhorScore * 100),
        congregacaoId: matched ? melhor.id : null,
        congregacaoNome: matched ? melhor.nome : null,
        setorNome: matched ? (melhor.setor?.nome || '—') : null,
      };
    });

    res.json({
      total: preview.length,
      matched: preview.filter(r => r.matched).length,
      preview,
      mesReferencia: parseInt(mesReferencia),
      anoReferencia: parseInt(anoReferencia),
    });
  } catch (err) { next(err); }
}

async function confirmarImportacao(req, res, next) {
  try {
    const { linhas, mesReferencia, anoReferencia } = req.body;
    if (!linhas || !Array.isArray(linhas) || linhas.length === 0) return res.status(400).json({ error: 'Nenhuma linha para importar' });

    const mes = parseInt(mesReferencia), ano = parseInt(anoReferencia);
    let importados = 0, erros = [];

    for (const l of linhas) {
      if (!l.congregacaoId || !l.valor) continue;
      try {
        await prisma.ofertaMissionaria.upsert({
          where: { congregacaoId_mesReferencia_anoReferencia: {
            congregacaoId: parseInt(l.congregacaoId),
            mesReferencia: mes,
            anoReferencia: ano,
          }},
          update: { valor: parseFloat(l.valor) },
          create: {
            congregacaoId: parseInt(l.congregacaoId),
            mesReferencia: mes,
            anoReferencia: ano,
            valor: parseFloat(l.valor),
          },
        });
        importados++;
      } catch (e) { erros.push({ congregacaoId: l.congregacaoId, erro: e.message }); }
    }

    res.json({ importados, erros });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove, resumo, pivotSetores, pivotCongregacoes, pivotCidades, upsert, importarPreview, confirmarImportacao };
