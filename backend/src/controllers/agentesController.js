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
    const { setorId, congregacaoId } = req.query;
    const where = {};
    if (setorId) where.setorId = parseInt(setorId);
    if (congregacaoId) where.congregacaoId = parseInt(congregacaoId);
    const items = await prisma.agenteMissoes.findMany({ where, include: { pessoa: true, setor: true, congregacao: true }, orderBy: { pessoa: { nome: 'asc' } } });
    res.json(items);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const item = await prisma.agenteMissoes.findUnique({ where: { id }, include: { pessoa: true, setor: true, congregacao: true } });
    if (!item) return res.status(404).json({ error: 'Agente não encontrado' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { setorId, congregacaoId, dataInicio, ...rest } = req.body;
    const pessoaData = buildPessoa(rest);
    const pessoa = await prisma.pessoa.create({ data: pessoaData });
    const congId = congregacaoId ? parseInt(congregacaoId) : null;
    const item = await prisma.agenteMissoes.create({
      data: {
        pessoaId: pessoa.id,
        setorId: parseInt(setorId),
        ...(congId ? { congregacaoId: congId } : {}),
        dataInicio: dataInicio ? new Date(dataInicio) : null,
      },
      include: { pessoa: true, setor: true, congregacao: true },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { setorId, congregacaoId, dataInicio, ...rest } = req.body;
    const existing = await prisma.agenteMissoes.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Agente não encontrado' });
    const pessoaData = buildPessoa(rest);
    await prisma.pessoa.update({ where: { id: existing.pessoaId }, data: pessoaData });
    const congId = congregacaoId ? parseInt(congregacaoId) : null;
    const item = await prisma.agenteMissoes.update({
      where: { id },
      data: { setorId: parseInt(setorId), congregacaoId: congId, dataInicio: dataInicio ? new Date(dataInicio) : null },
      include: { pessoa: true, setor: true, congregacao: true },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.agenteMissoes.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
