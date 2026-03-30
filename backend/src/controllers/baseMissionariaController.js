const prisma = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

async function listar(req, res, next) {
  try {
    const { search, estado } = req.query;
    const where = {};
    if (search) where.OR = [{ nome: { contains: search } }, { cidade: { contains: search } }];
    if (estado) where.estado = { contains: estado };

    const bases = await prisma.baseMissionaria.findMany({ where, orderBy: { nome: 'asc' } });
    res.json(toJSON(bases));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const base = await prisma.baseMissionaria.findUnique({
      where: { id },
      include: { missionarios: { include: { pessoa: true } } },
    });
    if (!base) return res.status(404).json({ error: 'Base missionária não encontrada.' });
    res.json(toJSON(base));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, endereco, cidade, estado, telefone, email, descricao, responsavelNome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    const base = await prisma.baseMissionaria.create({
      data: { nome: nome.trim(), endereco, cidade, estado, telefone, email, descricao, responsavelNome },
    });
    res.status(201).json(toJSON(base));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nome, endereco, cidade, estado, telefone, email, descricao, responsavelNome } = req.body;
    const base = await prisma.baseMissionaria.update({
      where: { id },
      data: { nome, endereco, cidade, estado, telefone, email, descricao, responsavelNome },
    });
    res.json(toJSON(base));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.baseMissionaria.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
