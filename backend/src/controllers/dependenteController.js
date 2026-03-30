const prisma     = require('../config/prisma');
const { toJSON } = require('../utils/serializer');

async function criar(req, res, next) {
  try {
    const { missionarioId, parentesco, nome, dataNascimento, sexo } = req.body;
    if (!missionarioId) return res.status(400).json({ error: 'missionarioId é obrigatório.' });
    if (!parentesco)    return res.status(400).json({ error: 'parentesco é obrigatório.' });
    if (!nome)          return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!['CONJUGE', 'FILHO', 'FILHA', 'OUTRO'].includes(parentesco.toUpperCase())) {
      return res.status(400).json({ error: 'parentesco inválido.' });
    }

    const dep = await prisma.dependente.create({
      data: {
        missionarioId: parseInt(missionarioId),
        parentesco:    parentesco.toUpperCase(),
        pessoa: {
          create: {
            nome: nome.trim(),
            dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
            sexo: sexo || null,
          },
        },
      },
      include: { pessoa: true },
    });
    res.status(201).json(toJSON(dep));
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { parentesco, nome, dataNascimento, sexo } = req.body;

    const dep = await prisma.dependente.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: 'Dependente não encontrado.' });

    const pessoaData = {};
    if (nome           !== undefined) pessoaData.nome           = nome.trim();
    if (dataNascimento !== undefined) pessoaData.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;
    if (sexo           !== undefined) pessoaData.sexo           = sexo || null;

    const updated = await prisma.dependente.update({
      where: { id },
      data: {
        ...(parentesco ? { parentesco: parentesco.toUpperCase() } : {}),
        pessoa: Object.keys(pessoaData).length ? { update: pessoaData } : undefined,
      },
      include: { pessoa: true },
    });
    res.json(toJSON(updated));
  } catch (err) { next(err); }
}

async function remover(req, res, next) {
  try {
    const id  = parseInt(req.params.id);
    const dep = await prisma.dependente.findUnique({ where: { id } });
    if (!dep) return res.status(404).json({ error: 'Dependente não encontrado.' });

    const pessoaId = dep.pessoaId;
    await prisma.dependente.delete({ where: { id } });
    // Apaga a Pessoa órfã
    await prisma.pessoa.delete({ where: { id: pessoaId } }).catch(() => {});
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { criar, atualizar, remover };
