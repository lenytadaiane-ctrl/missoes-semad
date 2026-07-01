'use strict';
const prisma = require('../config/prisma');

async function list(req, res, next) {
  try {
    const { setorId, tipo } = req.query;
    const where = {};
    if (setorId) where.setorId = parseInt(setorId);
    if (tipo) where.tipo = tipo;
    const items = await prisma.congregacao.findMany({ where, orderBy: { nome: 'asc' }, include: { setor: true } });
    res.json(items);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const item = await prisma.congregacao.findUnique({ where: { id: parseInt(req.params.id) }, include: { setor: true } });
    if (!item) return res.status(404).json({ error: 'Congregação não encontrada' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.setorId) data.setorId = parseInt(data.setorId);
    const item = await prisma.congregacao.create({ data, include: { setor: true } });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.setorId) data.setorId = parseInt(data.setorId);
    const item = await prisma.congregacao.update({ where: { id: parseInt(req.params.id) }, data, include: { setor: true } });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.congregacao.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
