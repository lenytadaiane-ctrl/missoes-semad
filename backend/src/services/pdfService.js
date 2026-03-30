const PDFDocument = require('pdfkit');
const { MESES_NOMES, MESES_ABREV, formatarMoeda, formatarData } = require('../utils/constants');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function criarDoc(landscape = false) {
  return new PDFDocument({
    size: 'A4',
    layout: landscape ? 'landscape' : 'portrait',
    margin: 36,
    info: { Title: 'SEMAD-IEADMS', Author: 'Sistema de Missões IEADMS' },
  });
}

function cabecalho(doc, titulo, subtitulo = '') {
  doc
    .fillColor('#1e40af')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('SEMAD-IEADMS — Departamento de Missões', { align: 'center' });

  doc
    .fillColor('#1e293b')
    .fontSize(12)
    .font('Helvetica-Bold')
    .moveDown(0.3)
    .text(titulo, { align: 'center' });

  if (subtitulo) {
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(subtitulo, { align: 'center' });
  }

  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

  doc
    .moveDown(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#1e40af')
    .lineWidth(1.5)
    .stroke();

  doc.moveDown(0.6);
}

/**
 * Desenha uma tabela simples.
 * Retorna o Y final após a tabela.
 */
function tabela(doc, { headers, rows, colWidths, startX, startY, rowH = 18, headerFontSize = 8, bodyFontSize = 7.5 }) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  let y = startY;
  const marginBottom = doc.page.margins.bottom;

  // Cabeçalho
  doc.fillColor('#1e40af').rect(startX, y, totalW, rowH).fill();
  doc.fillColor('white').fontSize(headerFontSize).font('Helvetica-Bold');
  let cx = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], cx + 2, y + 4, { width: colWidths[i] - 4, lineBreak: false, ellipsis: true });
    cx += colWidths[i];
  }
  y += rowH;

  // Linhas de dados
  doc.font('Helvetica').fontSize(bodyFontSize);
  rows.forEach((row, ri) => {
    // Quebra de página
    if (y + rowH > doc.page.height - marginBottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
      // Repete cabeçalho
      doc.fillColor('#1e40af').rect(startX, y, totalW, rowH).fill();
      doc.fillColor('white').fontSize(headerFontSize).font('Helvetica-Bold');
      let hx = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], hx + 2, y + 4, { width: colWidths[i] - 4, lineBreak: false });
        hx += colWidths[i];
      }
      y += rowH;
      doc.font('Helvetica').fontSize(bodyFontSize);
    }

    const bg = ri % 2 === 0 ? '#f1f5f9' : '#ffffff';
    doc.fillColor(bg).rect(startX, y, totalW, rowH).fill();
    doc.strokeColor('#cbd5e1').lineWidth(0.3);
    let dx = startX;
    for (let i = 0; i < row.length; i++) {
      doc.fillColor('#1e293b').text(String(row[i] ?? ''), dx + 2, y + 4, { width: colWidths[i] - 4, lineBreak: false, ellipsis: true });
      doc.rect(dx, y, colWidths[i], rowH).stroke();
      dx += colWidths[i];
    }
    y += rowH;
  });

  return y;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO DE MISSIONÁRIOS E FAMÍLIA
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioMissionarios(missionarios) {
  const doc = criarDoc(false);
  cabecalho(doc, 'Relatório de Missionários e Família');

  if (!missionarios.length) {
    doc.fontSize(10).fillColor('#64748b').text('Nenhum missionário cadastrado.', { align: 'center' });
    return doc;
  }

  const statusCor = { ATIVO: '#166534', INATIVO: '#991b1b', AFASTADO: '#92400e' };
  const statusBg  = { ATIVO: '#dcfce7', INATIVO: '#fee2e2', AFASTADO: '#fef3c7' };

  missionarios.forEach((m, idx) => {
    if (idx > 0) {
      // Quebra de página a cada missionário se necessário
      if (doc.y > doc.page.height - 180) {
        doc.addPage();
        doc.moveDown(0.5);
      }
    }

    const p = m.pessoa;

    // Bloco do missionário
    doc
      .fillColor('#1e40af')
      .rect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 16)
      .fill();
    doc
      .fillColor('white')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`${idx + 1}. ${p.nome}`, doc.page.margins.left + 4, doc.y - 12);

    doc.moveDown(0.8).font('Helvetica').fontSize(8).fillColor('#1e293b');

    const col1X = doc.page.margins.left;
    const col2X = col1X + 250;
    const lineY  = doc.y;

    doc.text(`Campo Missionário: ${m.campoMissionario}`, col1X, lineY);
    doc.text(`Data de Envio: ${formatarData(m.dataEnvio)}`, col2X, lineY);
    doc.moveDown(0.4);

    const lineY2 = doc.y;
    doc.text(`Status: ${m.status}`, col1X, lineY2);
    if (m.coordenador) {
      doc.text(`Coordenador: ${m.coordenador.pessoa?.nome ?? ''}`, col2X, lineY2);
    }
    if (m.baseMissionaria) {
      doc.moveDown(0.4);
      doc.text(`Base: ${m.baseMissionaria.nome} — ${m.baseMissionaria.cidade}/${m.baseMissionaria.estado}`);
    }

    // Dados pessoais
    if (p.telefone || p.email) {
      doc.moveDown(0.4);
      const lineY3 = doc.y;
      if (p.telefone) doc.text(`Telefone: ${p.telefone}`, col1X, lineY3);
      if (p.email)    doc.text(`E-mail: ${p.email}`, col2X, lineY3);
    }

    // Dependentes
    if (m.dependentes && m.dependentes.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('Dependentes:');
      doc.moveDown(0.2);

      const depHeaders = ['Nome', 'Parentesco', 'Data de Nascimento'];
      const depWidths  = [200, 100, 120];
      const depRows    = m.dependentes.map((d) => [
        d.pessoa.nome,
        d.parentesco,
        formatarData(d.pessoa.dataNascimento),
      ]);

      tabela(doc, {
        headers: depHeaders,
        rows:    depRows,
        colWidths: depWidths,
        startX: doc.page.margins.left + 10,
        startY: doc.y,
        rowH: 16,
      });
    }

    doc.moveDown(0.8);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.6);
  });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO DE BASES MISSIONÁRIAS
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioBasesMissionarias(bases) {
  const doc = criarDoc(false);
  cabecalho(doc, 'Relatório de Bases Missionárias');

  if (!bases.length) {
    doc.fontSize(10).fillColor('#64748b').text('Nenhuma base missionária cadastrada.', { align: 'center' });
    return doc;
  }

  tabela(doc, {
    headers:   ['Nome', 'Cidade', 'Estado', 'Responsável', 'Telefone', 'E-mail'],
    rows:      bases.map((b) => [b.nome, b.cidade || '', b.estado || '', b.responsavelNome || '', b.telefone || '', b.email || '']),
    colWidths: [130, 90, 40, 120, 90, 130],
    startX:    doc.page.margins.left,
    startY:    doc.y,
  });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO DE PROMOTORES DE MISSÕES
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioPromotores(promotores) {
  const doc = criarDoc(false);
  cabecalho(doc, 'Relatório de Promotores de Missões');

  if (!promotores.length) {
    doc.fontSize(10).fillColor('#64748b').text('Nenhum promotor cadastrado.', { align: 'center' });
    return doc;
  }

  tabela(doc, {
    headers:   ['Nome', 'Setor', 'Tipo', 'Telefone', 'E-mail', 'Data Início'],
    rows:      promotores.map((p) => [
      p.pessoa.nome,
      p.setor?.nome || '',
      p.setor?.tipo || '',
      p.pessoa.telefone || '',
      p.pessoa.email || '',
      formatarData(p.dataInicio),
    ]),
    colWidths: [150, 50, 55, 90, 140, 75],
    startX:    doc.page.margins.left,
    startY:    doc.y,
  });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO DE SECRETÁRIOS POR SETOR
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioSecretarios(setoresComSecretarios) {
  const doc = criarDoc(false);
  cabecalho(doc, 'Relatório de Secretários de Missões por Setor');

  setoresComSecretarios.forEach((setor) => {
    if (doc.y > doc.page.height - 120) { doc.addPage(); doc.moveDown(0.5); }

    doc
      .fillColor('#1e40af').fontSize(10).font('Helvetica-Bold')
      .text(`Setor ${setor.nome}  (${setor.tipo})`, doc.page.margins.left);
    doc.moveDown(0.3);

    if (!setor.secretarios.length) {
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('Nenhum secretário vinculado.', doc.page.margins.left + 10);
    } else {
      tabela(doc, {
        headers:   ['Nome', 'Telefone', 'E-mail', 'Data Início'],
        rows:      setor.secretarios.map((s) => [
          s.pessoa.nome,
          s.pessoa.telefone || '',
          s.pessoa.email || '',
          formatarData(s.dataInicio),
        ]),
        colWidths: [180, 100, 170, 90],
        startX:    doc.page.margins.left,
        startY:    doc.y,
      });
    }
    doc.moveDown(1);
  });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO FINANCEIRO — CAPITAL CONSOLIDADO (setores × meses)
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioFinanceiroCapital(dados) {
  const { ano, capitalConsolidado, meses } = dados;
  const doc = criarDoc(true); // landscape
  cabecalho(doc, `Relatório Financeiro — Capital ${ano}`, 'Totais mensais por setor');

  const labelW = 45;
  const mesW   = Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right - labelW - 60) / 12);
  const totalW = 60;

  const headers = ['Setor', ...MESES_ABREV, 'TOTAL'];
  const colWidths = [labelW, ...Array(12).fill(mesW), totalW];

  const rows = capitalConsolidado.map((s) => [
    s.nome,
    ...meses.map((m) => s.totaisMes[m] > 0 ? formatarMoeda(s.totaisMes[m]) : '-'),
    formatarMoeda(s.totalAnual),
  ]);

  // Linha de totais gerais
  const totaisGerais = meses.map((m) =>
    capitalConsolidado.reduce((acc, s) => acc + (s.totaisMes[m] || 0), 0)
  );
  const totalGeral = totaisGerais.reduce((a, b) => a + b, 0);
  rows.push(['TOTAL', ...totaisGerais.map((v) => v > 0 ? formatarMoeda(v) : '-'), formatarMoeda(totalGeral)]);

  tabela(doc, { headers, rows, colWidths, startX: doc.page.margins.left, startY: doc.y, rowH: 16 });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO FINANCEIRO — INTERIOR (igrejas × meses)
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioFinanceiroInterior(dados) {
  const { ano, interior, meses } = dados;
  const doc = criarDoc(true);
  cabecalho(doc, `Relatório Financeiro — Interior ${ano}`, 'Totais mensais por igreja');

  const labelW = 90;
  const mesW   = Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right - labelW - 60) / 12);
  const totalW = 60;

  const headers   = ['Igreja', ...MESES_ABREV, 'TOTAL'];
  const colWidths = [labelW, ...Array(12).fill(mesW), totalW];

  const rows = interior.map((c) => [
    c.nome,
    ...meses.map((m) => c.totaisMes[m] > 0 ? formatarMoeda(c.totaisMes[m]) : '-'),
    formatarMoeda(c.totalAnual),
  ]);

  const totaisGerais = meses.map((m) => interior.reduce((acc, c) => acc + (c.totaisMes[m] || 0), 0));
  const totalGeral   = totaisGerais.reduce((a, b) => a + b, 0);
  rows.push(['TOTAL', ...totaisGerais.map((v) => v > 0 ? formatarMoeda(v) : '-'), formatarMoeda(totalGeral)]);

  tabela(doc, { headers, rows, colWidths, startX: doc.page.margins.left, startY: doc.y, rowH: 16 });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO FINANCEIRO — POR SETOR (congregações × meses)
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioFinanceiroSetor(setorDados, ano) {
  const { nome, congregacoes } = setorDados;
  const doc    = criarDoc(true);
  const meses  = Array.from({ length: 12 }, (_, i) => i + 1);
  cabecalho(doc, `Relatório Financeiro — Setor ${nome} — ${ano}`, 'Totais mensais por congregação');

  const labelW = 90;
  const mesW   = Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right - labelW - 60) / 12);
  const totalW = 60;

  const headers   = ['Congregação', ...MESES_ABREV, 'TOTAL'];
  const colWidths = [labelW, ...Array(12).fill(mesW), totalW];

  const rows = congregacoes.map((c) => [
    c.nome,
    ...meses.map((m) => c.totaisMes[m] > 0 ? formatarMoeda(c.totaisMes[m]) : '-'),
    formatarMoeda(c.totalAnual),
  ]);

  const totaisGerais = meses.map((m) => congregacoes.reduce((acc, c) => acc + (c.totaisMes[m] || 0), 0));
  const totalGeral   = totaisGerais.reduce((a, b) => a + b, 0);
  rows.push(['TOTAL', ...totaisGerais.map((v) => v > 0 ? formatarMoeda(v) : '-'), formatarMoeda(totalGeral)]);

  tabela(doc, { headers, rows, colWidths, startX: doc.page.margins.left, startY: doc.y, rowH: 16 });

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO FINANCEIRO — COMPARATIVO CAPITAL × INTERIOR
// ─────────────────────────────────────────────────────────────────────────────

function gerarRelatorioFinanceiroComparativo(dados) {
  const { ano, capitalConsolidado, interior, meses } = dados;
  const doc = criarDoc(false);
  cabecalho(doc, `Comparativo Capital × Interior — ${ano}`);

  const totalCapitalMes    = meses.map((m) => capitalConsolidado.reduce((acc, s) => acc + (s.totaisMes[m] || 0), 0));
  const totalInteriorMes   = meses.map((m) => interior.reduce((acc, c) => acc + (c.totaisMes[m] || 0), 0));
  const totalGeralMes      = meses.map((m, i) => totalCapitalMes[i] + totalInteriorMes[i]);
  const totalCapitalAnual  = totalCapitalMes.reduce((a, b) => a + b, 0);
  const totalInteriorAnual = totalInteriorMes.reduce((a, b) => a + b, 0);
  const totalGeralAnual    = totalCapitalAnual + totalInteriorAnual;

  const headers   = ['Mês', 'Capital (R$)', 'Interior (R$)', 'Total (R$)'];
  const colWidths = [100, 140, 140, 140];

  const rows = meses.map((m, i) => [
    MESES_NOMES[m - 1],
    formatarMoeda(totalCapitalMes[i]),
    formatarMoeda(totalInteriorMes[i]),
    formatarMoeda(totalGeralMes[i]),
  ]);
  rows.push(['TOTAL ANUAL', formatarMoeda(totalCapitalAnual), formatarMoeda(totalInteriorAnual), formatarMoeda(totalGeralAnual)]);

  tabela(doc, { headers, rows, colWidths, startX: doc.page.margins.left, startY: doc.y });

  return doc;
}

module.exports = {
  gerarRelatorioMissionarios,
  gerarRelatorioBasesMissionarias,
  gerarRelatorioPromotores,
  gerarRelatorioSecretarios,
  gerarRelatorioFinanceiroCapital,
  gerarRelatorioFinanceiroInterior,
  gerarRelatorioFinanceiroSetor,
  gerarRelatorioFinanceiroComparativo,
};
