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

module.exports = { list, getById, create, update, remove, resumo };
