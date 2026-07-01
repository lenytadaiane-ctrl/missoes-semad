'use strict';
const prisma = require('../config/prisma');

// ── Listas personalizadas ──────────────────────────────────────────────────

const LISTAS_PADRAO = {
  parentesco:      { label: 'Parentesco (Dependentes)', itens: ['Cônjuge','Filho(a)','Enteado(a)','Pai','Mãe','Irmão/Irmã','Avô/Avó','Neto(a)','Outro'] },
  estadoCivil:     { label: 'Estado Civil', itens: ['Solteiro(a)','Casado(a)','Divorciado(a)','Viúvo(a)','União Estável','Separado(a)'] },
  grauInstrucao:   { label: 'Grau de Instrução', itens: ['Fundamental Incompleto','Fundamental Completo','Médio Incompleto','Médio Completo','Superior Incompleto','Superior Completo','Pós-graduação','Mestrado','Doutorado'] },
  origemReligiosa: { label: 'Origem Religiosa', itens: ['IEADMS','IEAD','Assembleia de Deus','Batista','Metodista','Presbiteriana','Outra Evangélica','Católica','Outra'] },
  tipoSanguineo:   { label: 'Tipo Sanguíneo', itens: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  statusMissionario: { label: 'Status do Missionário', itens: ['ATIVO','AFASTADO','INATIVO'] },
};

async function getListas(req, res, next) {
  try {
    const chaves = Object.keys(LISTAS_PADRAO);
    const salvas = await prisma.configuracaoSistema.findMany({ where: { chave: { in: chaves } } });
    const salvasPorChave = {};
    salvas.forEach(s => { salvasPorChave[s.chave] = s; });

    const resultado = chaves.map(chave => {
      const padrao = LISTAS_PADRAO[chave];
      const salva = salvasPorChave[chave];
      return {
        chave,
        label: salva?.label || padrao.label,
        itens: salva ? salva.itens : padrao.itens,
        personalizada: !!salva,
        updatedAt: salva?.updatedAt || null,
      };
    });
    res.json(resultado);
  } catch (err) { next(err); }
}

async function getLista(req, res, next) {
  try {
    const { chave } = req.params;
    const padrao = LISTAS_PADRAO[chave];
    if (!padrao) return res.status(404).json({ error: 'Lista não encontrada' });

    const salva = await prisma.configuracaoSistema.findUnique({ where: { chave } });
    res.json({
      chave,
      label: salva?.label || padrao.label,
      itens: salva ? salva.itens : padrao.itens,
    });
  } catch (err) { next(err); }
}

async function salvarLista(req, res, next) {
  try {
    const { chave } = req.params;
    const { itens } = req.body;
    if (!Array.isArray(itens)) return res.status(400).json({ error: 'itens deve ser array' });

    const padrao = LISTAS_PADRAO[chave];
    const label = padrao?.label || chave;

    const result = await prisma.configuracaoSistema.upsert({
      where: { chave },
      update: { itens, label },
      create: { chave, label, itens },
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function resetarLista(req, res, next) {
  try {
    const { chave } = req.params;
    await prisma.configuracaoSistema.deleteMany({ where: { chave } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ── Entrada Anual ──────────────────────────────────────────────────────────

async function listarEntradas(req, res, next) {
  try {
    const itens = await prisma.entradaAnual.findMany({ orderBy: { ano: 'desc' } });
    res.json(itens);
  } catch (err) { next(err); }
}

async function salvarEntrada(req, res, next) {
  try {
    const { ano, valor, observacao } = req.body;
    const result = await prisma.entradaAnual.upsert({
      where: { ano: parseInt(ano) },
      update: { valor: parseFloat(valor), observacao: observacao || null },
      create: { ano: parseInt(ano), valor: parseFloat(valor), observacao: observacao || null },
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function deletarEntrada(req, res, next) {
  try {
    await prisma.entradaAnual.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getListas, getLista, salvarLista, resetarLista, listarEntradas, salvarEntrada, deletarEntrada };
