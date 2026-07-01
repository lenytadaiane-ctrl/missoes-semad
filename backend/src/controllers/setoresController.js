'use strict';
const prisma = require('../config/prisma');

async function list(req, res, next) {
  try {
    const setores = await prisma.setor.findMany({ orderBy: { nome: 'asc' }, include: { _count: { select: { congregacoes: true } } } });
    res.json(setores);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const setor = await prisma.setor.findUnique({ where: { id: parseInt(req.params.id) }, include: { congregacoes: true } });
    if (!setor) return res.status(404).json({ error: 'Setor não encontrado' });
    res.json(setor);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const setor = await prisma.setor.create({ data: req.body });
    res.status(201).json(setor);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const setor = await prisma.setor.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(setor);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.setor.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
