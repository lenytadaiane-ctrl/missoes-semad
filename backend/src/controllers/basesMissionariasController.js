'use strict';
const prisma = require('../config/prisma');

async function list(req, res, next) {
  try {
    const items = await prisma.baseMissionaria.findMany({ orderBy: { nome: 'asc' }, include: { _count: { select: { missionarios: true } } } });
    res.json(items);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const item = await prisma.baseMissionaria.findUnique({ where: { id: parseInt(req.params.id) }, include: { missionarios: { include: { pessoa: true } } } });
    if (!item) return res.status(404).json({ error: 'Base não encontrada' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const item = await prisma.baseMissionaria.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const item = await prisma.baseMissionaria.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.baseMissionaria.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
