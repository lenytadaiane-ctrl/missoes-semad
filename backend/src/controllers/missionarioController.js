const fs   = require('fs');
const path = require('path');
const prisma          = require('../config/prisma');
const { toJSON }      = require('../utils/serializer');

const CAMPOS_PESSOA = [
  'nome', 'dataNascimento', 'cpf', 'rg', 'orgaoEmissor', 'dataEmissao',
  'telefone', 'email', 'endereco', 'cep', 'cidade', 'estado',
  'naturalidade', 'estadoCivil', 'origemReligiosa', 'nacionalidade',
  'grauInstrucao', 'sexo', 'profissao', 'tituloEleitor', 'zona', 'secao',
  'reservista', 'tipoSanguineo', 'nomePai', 'nomeMae', 'nomeConjuge',
];

function extrairPessoa(body) {
  const data = {};
  for (const campo of CAMPOS_PESSOA) {
    if (body[campo] !== undefined) {
      if ((campo === 'dataNascimento' || campo === 'dataEmissao') && body[campo]) {
        data[campo] = new Date(body[campo]);
      } else {
        data[campo] = body[campo] || null;
      }
    }
  }
  return data;
}

async function listar(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status.toUpperCase();
    if (search) where.pessoa = { nome: { contains: search } };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [total, missionarios] = await Promise.all([
      prisma.missionario.count({ where }),
      prisma.missionario.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { pessoa: { nome: 'asc' } },
        include: {
          pessoa:  { select: { id: true, nome: true, telefone: true, email: true, foto: true } },
          baseMissionaria: { select: { id: true, nome: true } },
        },
      }),
    ]);

    res.json({ data: toJSON(missionarios), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const m  = await prisma.missionario.findUnique({
      where: { id },
      include: {
        pessoa:         true,
        baseMissionaria: true,
        coordenador:    { include: { pessoa: { select: { id: true, nome: true } } } },
        supervisionados:{ include: { pessoa: { select: { id: true, nome: true } } } },
        dependentes:    { include: { pessoa: true } },
      },
    });
    if (!m) return res.status(404).json({ error: 'Missionário não encontrado.' });
    res.json(toJSON(m));
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { campoMissionario, dataEnvio, status, coordenadorId, baseMissionariaId } = req.body;
    if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (!campoMissionario) return res.status(400).json({ error: 'Campo missionário é obrigatório.' });
    if (!dataEnvio) return res.status(400).json({ error: 'Data de envio é obrigatória.' });

    const pessoaData = extrairPessoa(req.body);
    if (req.file) pessoaData.foto = `uploads/missionarios/${req.file.filename}`;

    const m = await prisma.missionario.create({
      data: {
        campoMissionario: campoMissionario.trim(),
        dataEnvio: new Date(dataEnvio),
        status:    status || 'ATIVO',
        coordenadorId:    coordenadorId    ? parseInt(coordenadorId)    : null,
        baseMissionariaId: baseMissionariaId ? parseInt(baseMissionariaId) : null,
        pessoa: { create: pessoaData },
      },
      include: { pessoa: true },
    });
    res.status(201).json(toJSON(m));
  } catch (err) {
    // Se deu erro e havia upload, remove o arquivo
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existente = await prisma.missionario.findUnique({
      where: { id },
      include: { pessoa: true },
    });
    if (!existente) return res.status(404).json({ error: 'Missionário não encontrado.' });

    const pessoaData = extrairPessoa(req.body);

    // Se enviou nova foto, apaga a antiga
    if (req.file) {
      if (existente.pessoa.foto) {
        const fotoAntiga = path.join(__dirname, '..', '..', existente.pessoa.foto);
        fs.unlink(fotoAntiga, () => {});
      }
      pessoaData.foto = `uploads/missionarios/${req.file.filename}`;
    }

    const missionarioData = {};
    if (req.body.campoMissionario) missionarioData.campoMissionario = req.body.campoMissionario.trim();
    if (req.body.dataEnvio)        missionarioData.dataEnvio        = new Date(req.body.dataEnvio);
    if (req.body.status)           missionarioData.status           = req.body.status.toUpperCase();
    if (req.body.coordenadorId    !== undefined) missionarioData.coordenadorId    = req.body.coordenadorId    ? parseInt(req.body.coordenadorId)    : null;
    if (req.body.baseMissionariaId !== undefined) missionarioData.baseMissionariaId = req.body.baseMissionariaId ? parseInt(req.body.baseMissionariaId) : null;

    const m = await prisma.missionario.update({
      where: { id },
      data: {
        ...missionarioData,
        pessoa: { update: pessoaData },
      },
      include: { pessoa: true },
    });
    res.json(toJSON(m));
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
}

async function remover(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const m  = await prisma.missionario.findUnique({ where: { id }, include: { pessoa: true } });
    if (!m) return res.status(404).json({ error: 'Missionário não encontrado.' });

    if (m.pessoa.foto) {
      const fotoPath = path.join(__dirname, '..', '..', m.pessoa.foto);
      fs.unlink(fotoPath, () => {});
    }

    await prisma.missionario.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
