'use strict';
const prisma = require('../config/prisma');
const path = require('path');

const PESSOA_FIELDS = [
  'nome','dataNascimento','cpf','rg','orgaoEmissor','dataEmissao','telefone','email',
  'endereco','cep','cidade','estado','naturalidade','estadoCivil','origemReligiosa',
  'nacionalidade','grauInstrucao','sexo','profissao','tituloEleitor','zona','secao',
  'reservista','tipoSanguineo','nomePai','nomeMae','nomeConjuge','congregacaoOrigemId',
];

// Converte string vazia em null para todos os campos opcionais
function sanitize(val) {
  if (val === '' || val === undefined) return null;
  return val;
}

function buildPessoaData(body) {
  const data = {};
  for (const f of PESSOA_FIELDS) {
    if (body[f] !== undefined) data[f] = sanitize(body[f]);
  }
  if (data.dataNascimento) data.dataNascimento = new Date(data.dataNascimento);
  if (data.dataEmissao) data.dataEmissao = new Date(data.dataEmissao);
  if (data.congregacaoOrigemId) data.congregacaoOrigemId = parseInt(data.congregacaoOrigemId);
  else data.congregacaoOrigemId = null;
  return data;
}

function buildMissData(body) {
  const data = {};
  if (body.campoMissionario !== undefined) data.campoMissionario = sanitize(body.campoMissionario);
  if (body.status !== undefined) data.status = body.status || 'ATIVO';
  if (body.dataEnvio) data.dataEnvio = new Date(body.dataEnvio);

  // IDs de relação: só inclui se for um número válido, senão omite (undefined = sem alteração)
  const coordId = body.coordenadorId ? parseInt(body.coordenadorId) : null;
  const baseId = body.baseMissionariaId ? parseInt(body.baseMissionariaId) : null;
  if (!isNaN(coordId) && coordId) data.coordenadorId = coordId;
  else data.coordenadorId = null;
  if (!isNaN(baseId) && baseId) data.baseMissionariaId = baseId;
  else data.baseMissionariaId = null;

  return data;
}

async function list(req, res, next) {
  try {
    const { status, page = 1, limit = 20, busca } = req.query;
    const where = {};
    if (status) where.status = status;
    if (busca) where.pessoa = { nome: { contains: busca, mode: 'insensitive' } };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      prisma.missionario.findMany({
        where, skip, take: parseInt(limit),
        include: { pessoa: true, baseMissionaria: true, coordenador: { include: { pessoa: true } } },
        orderBy: { pessoa: { nome: 'asc' } },
      }),
      prisma.missionario.count({ where }),
    ]);
    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const item = await prisma.missionario.findUnique({
      where: { id },
      include: {
        pessoa: true,
        baseMissionaria: true,
        coordenador: { include: { pessoa: true } },
        dependentes: { include: { pessoa: true } },
        supervisionados: { include: { pessoa: true } },
      },
    });
    if (!item) return res.status(404).json({ error: 'Missionário não encontrado' });
    res.json(item);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const pessoaData = buildPessoaData(req.body);
    const missData = buildMissData(req.body);

    // Remove nulls de IDs de relação no create para evitar erro do Prisma
    const createData = { ...missData };
    if (!createData.coordenadorId) delete createData.coordenadorId;
    if (!createData.baseMissionariaId) delete createData.baseMissionariaId;

    const item = await prisma.missionario.create({
      data: { ...createData, pessoa: { create: pessoaData } },
      include: { pessoa: true, baseMissionaria: true },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const pessoaData = buildPessoaData(req.body);
    const missData = buildMissData(req.body);
    const existing = await prisma.missionario.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Missionário não encontrado' });

    const [, item] = await prisma.$transaction([
      prisma.pessoa.update({ where: { id: existing.pessoaId }, data: pessoaData }),
      prisma.missionario.update({ where: { id }, data: missData, include: { pessoa: true } }),
    ]);
    res.json(item);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await prisma.missionario.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

async function uploadFoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const id = parseInt(req.params.id);
    const missionario = await prisma.missionario.findUnique({ where: { id } });
    if (!missionario) return res.status(404).json({ error: 'Missionário não encontrado' });
    const fotoPath = path.join('uploads', 'missionarios', req.file.filename).replace(/\\/g, '/');
    await prisma.pessoa.update({ where: { id: missionario.pessoaId }, data: { foto: fotoPath } });
    res.json({ foto: fotoPath });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove, uploadFoto };
