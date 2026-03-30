const prisma = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

async function listar(req, res, next) {
  try {
    const setores = await prisma.setor.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { congregacoes: true, secretarios: true, promotores: true } },
      },
    });
    res.json(toJSON(setores));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const setor = await prisma.setor.findUnique({
      where: { id },
      include: {
        congregacoes: { orderBy: { nome: 'asc' } },
        secretarios:  { include: { pessoa: true } },
        promotores:   { include: { pessoa: true } },
      },
    });
    if (!setor) return res.status(404).json({ error: 'Setor não encontrado.' });
    res.json(toJSON(setor));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, tipo } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!['CAPITAL', 'INTERIOR'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido. Use CAPITAL ou INTERIOR.' });
    const setor = await prisma.setor.create({ data: { nome: nome.trim().toUpperCase(), tipo } });
    res.status(201).json(toJSON(setor));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nome, tipo } = req.body;
    const data = {};
    if (nome) data.nome = nome.trim().toUpperCase();
    if (tipo) {
      if (!['CAPITAL', 'INTERIOR'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
      data.tipo = tipo;
    }
    const setor = await prisma.setor.update({ where: { id }, data });
    res.json(toJSON(setor));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.setor.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
