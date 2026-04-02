const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

const INCLUDE = { pessoa: true, setor: true };

async function listar(req, res, next) {
  try {
    const { setorId } = req.query;
    const where = setorId ? { setorId: parseInt(setorId) } : {};
    const data = await prisma.secretarioMissoes.findMany({
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
    const reg = await prisma.secretarioMissoes.findUnique({ where: { id }, include: INCLUDE });
    if (!reg) return res.status(404).json({ error: 'Secretário não encontrado.' });
    res.json(toJSON(reg));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, telefone, email, setorId, dataInicio } = req.body;
    
    // Validações básicas
    if (!nome)    return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!setorId) return res.status(400).json({ error: 'setorId é obrigatório.' });

    const reg = await prisma.secretarioMissoes.create({
      data: {
        // CORREÇÃO: Em vez de setorId direto, usamos o 'connect'
        setor: {
          connect: { id: parseInt(setorId) }
        },
        // O campo no banco parece ser 'dataInício' (com acento) ou 'dataInicio'. 
        // Verifique no seu schema. Se o erro persistir, tente mudar para dataInício.
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        
        // Criação da pessoa vinculada
        pessoa: { 
          create: { 
            nome: nome.trim(), 
            telefone: telefone || null, 
            email: email || null 
          } 
        },
      },
      include: INCLUDE, // Mantém o seu include original
    });

    res.status(201).json(toJSON(reg));
  } catch (err) { 
    console.error("Erro ao criar secretário:", err);
    next(err); 
  }
}

async function atualizar(req, res, next) {
  try {
    const id  = parseInt(req.params.id);
    const reg = await prisma.secretarioMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Secretário não encontrado.' });

    const { nome, telefone, email, setorId, dataInicio } = req.body;
    const pessoaData = {};
    if (nome     !== undefined) pessoaData.nome     = nome.trim();
    if (telefone !== undefined) pessoaData.telefone = telefone || null;
    if (email    !== undefined) pessoaData.email    = email    || null;

    const updated = await prisma.secretarioMissoes.update({
      where: { id },
      data: {
        ...(setorId    !== undefined ? { setorId: parseInt(setorId) } : {}),
        ...(dataInicio !== undefined ? { dataInicio: dataInicio ? new Date(dataInicio) : null } : {}),
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
    const reg = await prisma.secretarioMissoes.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Secretário não encontrado.' });

    const pessoaId = reg.pessoaId;
    await prisma.secretarioMissoes.delete({ where: { id } });
    await prisma.pessoa.delete({ where: { id: pessoaId } }).catch(() => {});
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
