'use strict';
const prisma = require('../config/prisma');

// ── Interações / Contatos ─────────────────────────────────────────────────────

async function listarInteracoes(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { tipo, page = 1, limit = 20 } = req.query;
    const where = { missionarioId: parseInt(missionarioId) };
    if (tipo) where.tipo = tipo;
    const [total, itens] = await Promise.all([
      prisma.interacaoMissionario.count({ where }),
      prisma.interacaoMissionario.findMany({
        where,
        orderBy: { data: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
    ]);
    res.json({ total, pagina: parseInt(page), itens });
  } catch (err) { next(err); }
}

async function criarInteracao(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { tipo, data, descricao, observacao, arquivos } = req.body;
    const item = await prisma.interacaoMissionario.create({
      data: {
        missionarioId: parseInt(missionarioId),
        tipo,
        data: new Date(data),
        descricao,
        observacao: observacao || null,
        arquivos: arquivos || [],
        registradoPor: req.user?.usuario || null,
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function atualizarInteracao(req, res, next) {
  try {
    const { id } = req.params;
    const { tipo, data, descricao, observacao, arquivos } = req.body;
    const item = await prisma.interacaoMissionario.update({
      where: { id: parseInt(id) },
      data: { tipo, data: new Date(data), descricao, observacao: observacao || null, arquivos: arquivos || [] },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deletarInteracao(req, res, next) {
  try {
    await prisma.interacaoMissionario.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── Campo Missionário ─────────────────────────────────────────────────────────

async function getCampo(req, res, next) {
  try {
    const campo = await prisma.campoMissionario.findUnique({
      where: { missionarioId: parseInt(req.params.missionarioId) },
    });
    res.json(campo || {});
  } catch (err) { next(err); }
}

async function salvarCampo(req, res, next) {
  try {
    const missionarioId = parseInt(req.params.missionarioId);
    const { pais, cidade, estado, tipoArea, tipoReunioes, temTemplo, capacidade,
            dataInicio, situacao, descricao, publicosAtendidos, qtdPessoas } = req.body;
    const data = {
      pais: pais || null, cidade: cidade || null, estado: estado || null,
      tipoArea: tipoArea || null, tipoReunioes: tipoReunioes || null,
      temTemplo: !!temTemplo, capacidade: capacidade ? parseInt(capacidade) : null,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      situacao: situacao || 'ATIVO',
      descricao: descricao || null,
      publicosAtendidos: publicosAtendidos || [],
      qtdPessoas: qtdPessoas ? parseInt(qtdPessoas) : null,
    };
    const campo = await prisma.campoMissionario.upsert({
      where: { missionarioId },
      update: data,
      create: { missionarioId, ...data },
    });
    res.json(campo);
  } catch (err) { next(err); }
}

// ── Relatórios ────────────────────────────────────────────────────────────────

async function listarRelatorios(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const itens = await prisma.relatorioMissionario.findMany({
      where: { missionarioId: parseInt(missionarioId) },
      orderBy: [{ anoRef: 'desc' }, { mesRef: 'desc' }],
    });
    res.json(itens);
  } catch (err) { next(err); }
}

async function criarRelatorio(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { tipo, mesRef, anoRef, status, conteudo, arquivo, dataEnvio, dataRecebimento, observacao } = req.body;
    const item = await prisma.relatorioMissionario.create({
      data: {
        missionarioId: parseInt(missionarioId),
        tipo, mesRef: mesRef ? parseInt(mesRef) : null,
        anoRef: parseInt(anoRef), status: status || 'PENDENTE',
        conteudo: conteudo || null, arquivo: arquivo || null,
        dataEnvio: dataEnvio ? new Date(dataEnvio) : null,
        dataRecebimento: dataRecebimento ? new Date(dataRecebimento) : null,
        observacao: observacao || null,
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function atualizarRelatorio(req, res, next) {
  try {
    const { id } = req.params;
    const { tipo, mesRef, anoRef, status, conteudo, arquivo, dataEnvio, dataRecebimento, observacao } = req.body;
    const item = await prisma.relatorioMissionario.update({
      where: { id: parseInt(id) },
      data: {
        tipo, mesRef: mesRef ? parseInt(mesRef) : null,
        anoRef: parseInt(anoRef), status,
        conteudo: conteudo || null, arquivo: arquivo || null,
        dataEnvio: dataEnvio ? new Date(dataEnvio) : null,
        dataRecebimento: dataRecebimento ? new Date(dataRecebimento) : null,
        observacao: observacao || null,
      },
    });
    res.json(item);
  } catch (err) { next(err); }
}

async function deletarRelatorio(req, res, next) {
  try {
    await prisma.relatorioMissionario.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── Marcos da Missão ──────────────────────────────────────────────────────────

async function listarMarcos(req, res, next) {
  try {
    const itens = await prisma.marcoMissao.findMany({
      where: { missionarioId: parseInt(req.params.missionarioId) },
      orderBy: { data: 'desc' },
    });
    res.json(itens);
  } catch (err) { next(err); }
}

async function criarMarco(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { tipo, data, titulo, descricao, impacto } = req.body;
    const campo = await prisma.campoMissionario.findUnique({ where: { missionarioId: parseInt(missionarioId) } });
    const item = await prisma.marcoMissao.create({
      data: {
        missionarioId: parseInt(missionarioId),
        campoId: campo?.id || null,
        tipo, data: new Date(data), titulo,
        descricao: descricao || null, impacto: impacto || null,
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function deletarMarco(req, res, next) {
  try {
    await prisma.marcoMissao.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── Ajudas Enviadas ───────────────────────────────────────────────────────────

async function listarAjudas(req, res, next) {
  try {
    const itens = await prisma.ajudaEnviada.findMany({
      where: { missionarioId: parseInt(req.params.missionarioId) },
      orderBy: { data: 'desc' },
    });
    res.json(itens);
  } catch (err) { next(err); }
}

async function criarAjuda(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { tipo, data, descricao, valor, ofertaId } = req.body;
    const item = await prisma.ajudaEnviada.create({
      data: {
        missionarioId: parseInt(missionarioId),
        tipo, data: new Date(data), descricao,
        valor: valor ? parseFloat(valor) : null,
        ofertaId: ofertaId ? parseInt(ofertaId) : null,
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
}

async function deletarAjuda(req, res, next) {
  try {
    await prisma.ajudaEnviada.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ── Avaliações Semestrais ─────────────────────────────────────────────────────

async function listarAvaliacoes(req, res, next) {
  try {
    const itens = await prisma.avaliacaoSemestral.findMany({
      where: { missionarioId: parseInt(req.params.missionarioId) },
      orderBy: [{ ano: 'desc' }, { semestre: 'desc' }],
    });
    res.json(itens);
  } catch (err) { next(err); }
}

async function salvarAvaliacao(req, res, next) {
  try {
    const { missionarioId } = req.params;
    const { semestre, ano, situacaoCampo, avaliacaoGeral, proximosPassos } = req.body;
    const item = await prisma.avaliacaoSemestral.upsert({
      where: { missionarioId_semestre_ano: { missionarioId: parseInt(missionarioId), semestre: parseInt(semestre), ano: parseInt(ano) } },
      update: { situacaoCampo, avaliacaoGeral, proximosPassos: proximosPassos || null, avaliadoPor: req.user?.usuario || 'admin' },
      create: {
        missionarioId: parseInt(missionarioId),
        semestre: parseInt(semestre), ano: parseInt(ano),
        situacaoCampo, avaliacaoGeral, proximosPassos: proximosPassos || null,
        avaliadoPor: req.user?.usuario || 'admin',
      },
    });
    res.json(item);
  } catch (err) { next(err); }
}

module.exports = {
  listarInteracoes, criarInteracao, atualizarInteracao, deletarInteracao,
  getCampo, salvarCampo,
  listarRelatorios, criarRelatorio, atualizarRelatorio, deletarRelatorio,
  listarMarcos, criarMarco, deletarMarco,
  listarAjudas, criarAjuda, deletarAjuda,
  listarAvaliacoes, salvarAvaliacao,
};
