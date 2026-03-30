const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

const INCLUDE = { pessoa: true, setor: true };

async function listar(req, res, next) {
  try {
    const { setorId } = req.query;
    const where = setorId ? { setorId: parseInt(setorId) } : {};
    const data = await prisma.promotorMissoes.findMany({
      where,
      orderBy: { pessoa: { nome: 'asc' } },
      include: INCLUDE,
    });
    res.json(toJSON(data));
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const reg = await prisma.promotorMissoes.findUnique({ where: { id }, include: INCLUDE });
    if (!reg) return res.status(404).json({ error: 'Promotor não encontrado.' });
    res.json(toJSON(reg));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, telefone, email, setorId, dataInicio } = req.body;
    if (!nome)    return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!setorId) return res.status(400).json({ error: 'setorId é obrigatório.' });

    const reg = await prisma.promotorMissoes.create({
      data: {
        setorId:    parseInt(setorId),
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        pessoa: { create: { nome: nome.trim(), telefone: telefone || null, email: email || null } },
      },
      include: INCLUDE,
    });
    res.status(201).json(toJSON(reg));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { nome, telefone, email, setorId, dataInicio } = req.body;

    const reg = await prisma.promotorMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Promotor não encontrado.' });

    const pessoaData = {};
    if (nome     !== undefined) pessoaData.nome     = nome.trim();
    if (telefone !== undefined) pessoaData.telefone = telefone || null;
    if (email    !== undefined) pessoaData.email    = email    || null;

    const updated = await prisma.promotorMissoes.update({
      where: { id },
      data: {
        ...(setorId    ? { setorId: parseInt(setorId) }    : {}),
        ...(dataInicio ? { dataInicio: new Date(dataInicio) } : {}),
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
    const reg = await prisma.promotorMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Promotor não encontrado.' });

    const pessoaId = reg.pessoaId;
    await prisma.promotorMissoes.delete({ where: { id } });
    await prisma.pessoa.delete({ where: { id: pessoaId } }).catch(() => {});
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
