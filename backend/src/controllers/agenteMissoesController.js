const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

const INCLUDE = { pessoa: true, setor: true, congregacao: true };

async function listar(req, res, next) {
  try {
    const { setorId, congregacaoId } = req.query;
    const where = {};
    if (setorId)       where.setorId       = parseInt(setorId);
    if (congregacaoId) where.congregacaoId = parseInt(congregacaoId);

    const data = await prisma.agenteMissoes.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: INCLUDE,
    });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id  = parseInt(req.params.id);
    const reg = await prisma.agenteMissoes.findUnique({ where: { id }, include: INCLUDE });
    if (!reg) return res.status(404).json({ error: 'Agente não encontrado.' });
    res.json(toJSON(reg));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, telefone, email, setorId, congregacaoId, dataInicio } = req.body;
    if (!nome)    return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!setorId) return res.status(400).json({ error: 'setorId é obrigatório.' });

    const reg = await prisma.agenteMissoes.create({
      data: {
        setor: { connect: { id: parseInt(setorId) } },
        congregacao: { connect: { id: parseInt(id) } },
        dataInicio:    dataInicio ? new Date(dataInicio) : null,
        pessoa: { create: { nome: nome.trim(), telefone: telefone || null, email: email || null } },
      },
      include: INCLUDE,
    });
    res.status(201).json(toJSON(reg));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id  = parseInt(req.params.id);
    const reg = await prisma.agenteMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Agente não encontrado.' });

    const { nome, telefone, email, setorId, congregacaoId, dataInicio } = req.body;
    const pessoaData = {};
    if (nome     !== undefined) pessoaData.nome     = nome.trim();
    if (telefone !== undefined) pessoaData.telefone = telefone || null;
    if (email    !== undefined) pessoaData.email    = email    || null;

    const updated = await prisma.agenteMissoes.update({
      where: { id },
      data: {
        ...(setorId       !== undefined ? { setorId: parseInt(setorId) } : {}),
        ...(congregacaoId !== undefined ? { congregacaoId: congregacaoId ? parseInt(congregacaoId) : null } : {}),
        ...(dataInicio    !== undefined ? { dataInicio: dataInicio ? new Date(dataInicio) : null } : {}),
        pessoa: Object.keys(pessoaData).length ? { update: pessoaData } : undefined,
      },
      include: INCLUDE,
    });
    res.json(toJSON(updated));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id  = parseInt(req.params.id);
    const reg = await prisma.agenteMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Agente não encontrado.' });

    const pessoaId = reg.pessoaId;
    await prisma.agenteMissoes.delete({ where: { id } });
    await prisma.pessoa.delete({ where: { id: pessoaId } }).catch(() => {});
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
