'use strict';
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEARCH_PATHS = [
  'C:/Users/Midia IEADMS/missoes-departamento/setores_semad.xlsx',
  'C:/Users/Midia IEADMS/Downloads/setores semad.xlsx',
  path.resolve(__dirname, '../../setores_semad.xlsx'),
];

const MES_MAP = {
  janeiro: 1, fevereiro: 2, marco: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseMes(val) {
  const n = normalize(String(val || ''));
  return MES_MAP[n] || null;
}

async function main() {
  const force = process.argv.includes('--force');

  // Find Excel file
  let xlsxPath = null;
  for (const p of SEARCH_PATHS) {
    if (fs.existsSync(p)) { xlsxPath = p; break; }
  }
  if (!xlsxPath) {
    console.error('Arquivo Excel não encontrado. Caminhos tentados:');
    SEARCH_PATHS.forEach(p => console.error(' -', p));
    process.exit(1);
  }
  console.log('Usando arquivo:', xlsxPath);

  // Check existing 2025 data
  const existing2025 = await prisma.ofertaMissionaria.count({
    where: { anoReferencia: 2025 },
  });
  if (existing2025 > 0 && !force) {
    console.error(`Já existem ${existing2025} registros de 2025. Use --force para reimportar.`);
    process.exit(1);
  }
  if (force && existing2025 > 0) {
    await prisma.ofertaMissionaria.deleteMany({ where: { anoReferencia: 2025 } });
    console.log(`${existing2025} registros de 2025 removidos.`);
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheetNames = workbook.SheetNames;

  // Load all congregations from DB
  const allCongs = await prisma.congregacao.findMany({ include: { setor: true } });
  const congByNorm = {};
  for (const c of allCongs) {
    congByNorm[normalize(c.nome)] = c;
  }

  let totalInserido = 0;

  for (const sheetName of sheetNames) {
    const isInterior = /interior/i.test(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (isInterior) {
      // Interior: header at row index 3, col A = church name, cols B+ = months
      const headerRow = rows[3] || [];
      const meses = [];
      for (let col = 1; col < headerRow.length; col++) {
        const mes = parseMes(headerRow[col]);
        meses.push(mes);
      }

      for (let r = 4; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row[0]) continue;
        const nomeIgreja = String(row[0]).trim();
        if (normalize(nomeIgreja) === 'total' || !nomeIgreja) continue;
        const cong = congByNorm[normalize(nomeIgreja)];
        if (!cong) { console.warn(`Interior: congregação não encontrada: ${nomeIgreja}`); continue; }

        for (let col = 1; col < row.length; col++) {
          const mes = meses[col - 1];
          const valor = parseFloat(row[col]);
          if (!mes || isNaN(valor) || valor <= 0) continue;
          await prisma.ofertaMissionaria.upsert({
            where: { congregacaoId_mesReferencia_anoReferencia: { congregacaoId: cong.id, mesReferencia: mes, anoReferencia: 2025 } },
            update: { valor },
            create: { congregacaoId: cong.id, mesReferencia: mes, anoReferencia: 2025, valor },
          });
          totalInserido++;
        }
      }
      console.log(`Aba "${sheetName}" (Interior) processada`);
      continue;
    }

    // Capital setor sheet: find header row by looking for "mes" in col A
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const cellA = normalize(String(rows[r]?.[0] || ''));
      if (cellA.startsWith('mes') || cellA === 'mes') { headerRowIdx = r; break; }
    }
    if (headerRowIdx === -1) {
      console.warn(`Aba "${sheetName}": cabeçalho não encontrado, pulando`);
      continue;
    }

    const headerRow = rows[headerRowIdx];
    const colunasCong = [];
    for (let col = 1; col < headerRow.length; col++) {
      const nomeCong = String(headerRow[col] || '').trim();
      if (!nomeCong || normalize(nomeCong) === 'total') break;
      const cong = congByNorm[normalize(nomeCong)];
      if (!cong) console.warn(`Aba "${sheetName}": congregação não encontrada: ${nomeCong}`);
      colunasCong.push({ col, cong, nome: nomeCong });
    }

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const mes = parseMes(row[0]);
      if (!mes) continue;

      for (const { col, cong } of colunasCong) {
        if (!cong) continue;
        const valor = parseFloat(row[col]);
        if (isNaN(valor) || valor <= 0) continue;
        await prisma.ofertaMissionaria.upsert({
          where: { congregacaoId_mesReferencia_anoReferencia: { congregacaoId: cong.id, mesReferencia: mes, anoReferencia: 2025 } },
          update: { valor },
          create: { congregacaoId: cong.id, mesReferencia: mes, anoReferencia: 2025, valor },
        });
        totalInserido++;
      }
    }
    console.log(`Aba "${sheetName}" processada`);
  }

  console.log(`\nSeed 2025 concluído! Total inserido/atualizado: ${totalInserido} registros`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
