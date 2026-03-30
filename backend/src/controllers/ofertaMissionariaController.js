const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

const INCLUDE = {
  congregacao: { include: { setor: true } },
};

async function listar(req, res, next) {
  try {
    const { mes, ano, tipo, setorId, congregacaoId, page = 1, limit = 50 } = req.query;
    const where = {};

    if (mes) where.mesReferencia  = parseInt(mes);
    if (ano) where.anoReferencia  = parseInt(ano);
    if (congregacaoId) where.congregacaoId = parseInt(congregacaoId);

    // Filtro por tipo de congregação (CAPITAL/INTERIOR) ou setorId
    if (tipo) where.congregacao = { tipo: tipo.toUpperCase() };
    if (setorId) {
      where.congregacao = { ...(where.congregacao || {}), setorId: parseInt(setorId) };
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [total, data] = await Promise.all([
      prisma.ofertaMissionaria.count({ where }),
      prisma.ofertaMissionaria.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ anoReferencia: 'desc' }, { mesReferencia: 'desc' }, { congregacao: { nome: 'asc' } }],
        include: INCLUDE,
      }),
    ]);

    const soma = data.reduce((acc, o) => acc + parseFloat(o.valor.toString()), 0);
    res.json({ data: toJSON(data), total, soma, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function resumo(req, res, next) {
  try {
    const { ano = new Date().getFullYear() } = req.query;

    const grupados = await prisma.ofertaMissionaria.groupBy({
      by: ['mesReferencia', 'anoReferencia'],
      _sum: { valor: true },
      where: { anoReferencia: parseInt(ano) },
      orderBy: { mesReferencia: 'asc' },
    });

    res.json(toJSON(grupados.map((g) => ({
      mes:   g.mesReferencia,
      ano:   g.anoReferencia,
      total: parseFloat((g._sum.valor || 0).toString()),
    }))));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const oferta = await prisma.ofertaMissionaria.findUnique({ where: { id }, include: INCLUDE });
    if (!oferta) return res.status(404).json({ error: 'Oferta não encontrada.' });
    res.json(toJSON(oferta));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { congregacaoId, mesReferencia, anoReferencia, valor, observacao } = req.body;
    if (!congregacaoId) return res.status(400).json({ error: 'congregacaoId é obrigatório.' });
    if (!mesReferencia || mesReferencia < 1 || mesReferencia > 12) return res.status(400).json({ error: 'Mês inválido (1-12).' });
    if (!anoReferencia) return res.status(400).json({ error: 'anoReferencia é obrigatório.' });
    if (!valor || isNaN(parseFloat(valor))) return res.status(400).json({ error: 'valor inválido.' });

    const oferta = await prisma.ofertaMissionaria.create({
      data: {
        congregacaoId: parseInt(congregacaoId),
        mesReferencia: parseInt(mesReferencia),
        anoReferencia: parseInt(anoReferencia),
        valor:         parseFloat(valor),
        observacao:    observacao || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(toJSON(oferta));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { valor, observacao, mesReferencia, anoReferencia } = req.body;

    const data = {};
    if (valor        !== undefined) data.valor        = parseFloat(valor);
    if (observacao   !== undefined) data.observacao   = observacao || null;
    if (mesReferencia !== undefined) data.mesReferencia = parseInt(mesReferencia);
    if (anoReferencia !== undefined) data.anoReferencia = parseInt(anoReferencia);

    const oferta = await prisma.ofertaMissionaria.update({ where: { id }, data, include: INCLUDE });
    res.json(toJSON(oferta));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.ofertaMissionaria.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, resumo, buscarPorId, criar, atualizar, remover };
