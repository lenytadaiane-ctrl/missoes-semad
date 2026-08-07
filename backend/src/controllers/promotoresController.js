'use strict';
const prisma = require('../config/prisma');

function sanitize(val) {
  return (val === '' || val === undefined) ? null : val;
}

function buildPessoa(body) {
  const fields = ['nome','cpf','rg','telefone','email','endereco','cep','cidade','estado','sexo','profissao','dataNascimento','congregacaoOrigemId'];
  const data = {};
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = sanitize(body[f]);
  }
  if (data.dataNascimento) data.dataNascimento = new Date(data.dataNascimento);
  if (data.congregacaoOrigemId) data.congregacaoOrigemId = parseInt(data.congregacaoOrigemId);
  else data.congregacaoOrigemId = null;
  return data;
}

async function list(req, res, next) {
  try {
    const { setorId } = req.query;
    const where = setorId ? { setorId: parseInt(setorId) } : {};
    const items = await prisma.promotorMissoes.findMany({ where, include: { pessoa: true, setor: true }, orderBy: { pessoa: { nome: 'asc' } } });
    res.json(items);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const item = await prisma.promotorMissoes.findUnique({ where: { id: parseInt(req.params.id) }, include: { pessoa: true, setor: true } });
    if (!item) return res.status(404).json({ error: 'Promotor não encontrado' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { setorId, dataInicio, ...rest } = req.body;
    const pessoaData = buildPessoa(rest);
    const pessoa = await prisma.pessoa.create({ data: pessoaData });
    const item = await prisma.promotorMissoes.create({
      data: { pessoaId: pessoa.id, setorId: parseInt(setorId), dataInicio: dataInicio ? new Date(dataInicio) : null },
      include: { pessoa: true, setor: true },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { setorId, dataInicio, ...rest } = req.body;
    const existing = await prisma.promotorMissoes.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Promotor não encontrado' });
    const pessoaData = buildPessoa(rest);
    await prisma.pessoa.update({ where: { id: existing.pessoaId }, data: pessoaData });
    const item = await prisma.promotorMissoes.update({
      where: { id },
      data: { setorId: parseInt(setorId), dataInicio: dataInicio ? new Date(dataInicio) : null },
      include: { pessoa: true, setor: true },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.promotorMissoes.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
