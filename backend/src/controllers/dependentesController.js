'use strict';
const prisma = require('../config/prisma');

function sanitize(val) {
  return (val === '' || val === undefined) ? null : val;
}

async function list(req, res, next) {
  try {
    const { missionarioId } = req.query;
    const where = missionarioId ? { missionarioId: parseInt(missionarioId) } : {};
    const items = await prisma.dependente.findMany({ where, include: { pessoa: true, missionario: { include: { pessoa: true } } } });
    res.json(items);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const item = await prisma.dependente.findUnique({ where: { id: parseInt(req.params.id) }, include: { pessoa: true } });
    if (!item) return res.status(404).json({ error: 'Dependente não encontrado' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { missionarioId, parentesco, ...rest } = req.body;
    const pessoaData = {};
    for (const [k, v] of Object.entries(rest)) pessoaData[k] = sanitize(v);
    if (pessoaData.dataNascimento) pessoaData.dataNascimento = new Date(pessoaData.dataNascimento);
    const pessoa = await prisma.pessoa.create({ data: pessoaData });
    const item = await prisma.dependente.create({
      data: { missionarioId: parseInt(missionarioId), pessoaId: pessoa.id, parentesco },
      include: { pessoa: true },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { parentesco, ...rest } = req.body;
    const dep = await prisma.dependente.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: 'Dependente não encontrado' });
    const pessoaData = {};
    for (const [k, v] of Object.entries(rest)) pessoaData[k] = sanitize(v);
    if (pessoaData.dataNascimento) pessoaData.dataNascimento = new Date(pessoaData.dataNascimento);
    await prisma.pessoa.update({ where: { id: dep.pessoaId }, data: pessoaData });
    const item = await prisma.dependente.update({ where: { id }, data: { parentesco }, include: { pessoa: true } });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.dependente.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
