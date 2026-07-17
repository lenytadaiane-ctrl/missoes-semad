'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportarBackup(req, res) {
  const [
    setores,
    congregacoes,
    bases,
    missionarios,
    dependentes,
    agentes,
    secretarios,
    promotores,
    ofertas,
    entradasAnuais,
    configuracoes,
    interacoes,
    relatorios,
    campos,
    marcos,
    ajudas,
    avaliacoes,
  ] = await Promise.all([
    prisma.setor.findMany({ orderBy: { nome: 'asc' } }),
    prisma.congregacao.findMany({ orderBy: { nome: 'asc' } }),
    prisma.baseMissionaria.findMany(),
    prisma.agenteMissoes.findMany({ include: { congregacao: true } }),
    prisma.dependente.findMany(),
    prisma.agenteMissoes.findMany(),
    prisma.secretarioMissoes.findMany(),
    prisma.promotorMissoes.findMany({ include: { setor: true } }),
    prisma.ofertaMissionaria.findMany({ orderBy: [{ anoReferencia: 'desc' }, { mesReferencia: 'desc' }] }),
    prisma.entradaAnual.findMany({ orderBy: { ano: 'asc' } }),
    prisma.configuracaoSistema.findMany(),
    prisma.interacaoMissionario.findMany({ orderBy: { data: 'desc' } }),
    prisma.relatorioMissionario.findMany({ orderBy: [{ anoRef: 'desc' }, { mesRef: 'desc' }] }),
    prisma.campoMissionario.findMany(),
    prisma.marcoMissao.findMany({ orderBy: { data: 'desc' } }),
    prisma.ajudaEnviada.findMany({ orderBy: { data: 'desc' } }),
    prisma.avaliacaoSemestral.findMany({ orderBy: [{ ano: 'desc' }, { semestre: 'desc' }] }),
  ]);

  const backup = {
    versao: '2.0',
    geradoEm: new Date().toISOString(),
    geradoPor: req.user?.usuario || 'desconhecido',
    dados: {
      setores,
      congregacoes,
      bases,
      missionarios,
      dependentes,
      agentes,
      secretarios,
      promotores,
      ofertas,
      entradasAnuais,
      configuracoes,
      // Acompanhamento pastoral
      interacoes,
      relatorios,
      campos,
      marcos,
      ajudas,
      avaliacoes,
    },
  };

  const nome = `semad-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(backup);
}

module.exports = { exportarBackup };
