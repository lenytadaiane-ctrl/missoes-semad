const prisma = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

async function listar(req, res, next) {
  try {
    const { setorId, tipo, search } = req.query;
    const where = {};
    if (setorId) where.setorId = parseInt(setorId);
    if (tipo)    where.tipo = tipo.toUpperCase();
    if (search)  where.nome = { contains: search };

    const congs = await prisma.congregacao.findMany({
      where,
      orderBy: [{ setor: { nome: 'asc' } }, { nome: 'asc' }],
      include: { setor: true },
    });
    res.json(toJSON(congs));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const cong = await prisma.congregacao.findUnique({
      where: { id },
      include: {
        setor:   true,
        agentes: { include: { pessoa: true } },
      },
    });
    if (!cong) return res.status(404).json({ error: 'Congregação não encontrada.' });
    res.json(toJSON(cong));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, setorId, cidade, pastor, tipo } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!['CAPITAL', 'INTERIOR'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });

    const cong = await prisma.congregacao.create({
      data: {
        nome: nome.trim(),
        tipo,
        cidade: cidade?.trim() || null,
        pastor: pastor?.trim() || null,
        setorId: setorId ? parseInt(setorId) : null,
      },
      include: { setor: true },
    });
    res.status(201).json(toJSON(cong));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nome, setorId, cidade, pastor, tipo } = req.body;
    const data = {};
    if (nome   !== undefined) data.nome   = nome.trim();
    if (cidade !== undefined) data.cidade = cidade?.trim() || null;
    if (pastor !== undefined) data.pastor = pastor?.trim() || null;
    if (tipo   !== undefined) data.tipo   = tipo;
    if (setorId !== undefined) data.setorId = setorId ? parseInt(setorId) : null;

    const cong = await prisma.congregacao.update({ where: { id }, data, include: { setor: true } });
    res.json(toJSON(cong));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.congregacao.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
