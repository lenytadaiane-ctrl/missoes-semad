/**
 * SEED 2025 — Importa dados reais de ofertas da planilha Excel
 *
 * Estrutura do Excel:
 *   - Abas "Setor A" ... "Setor N": colunas = congregações, linhas = meses (auto-detectado)
 *   - Aba "Interior 2025": linhas = igrejas, colunas = meses (header na row 4)
 *
 * Uso:
 *   node prisma/seed2025.js               → aborta se 2025 já tiver dados
 *   node prisma/seed2025.js --force       → apaga dados de 2025 e reimporta
 */

const { PrismaClient } = require('@prisma/client');
const XLSX             = require('xlsx');
const path             = require('path');

const prisma = new PrismaClient();

// ─── Caminho do arquivo Excel ─────────────────────────────────────────────────
// Locais tentados em ordem
const XLSX_PATHS = [
  path.join('C:', 'Users', 'Midia IEADMS', 'missoes-departamento', 'setores_semad.xlsx'),
  path.join('C:', 'Users', 'Midia IEADMS', 'Downloads', 'setores semad.xlsx'),
  path.join(__dirname, '..', '..', 'setores_semad.xlsx'),
];

// ─── Mapeamento de rótulo de mês → número ────────────────────────────────────
const MES_MAP = {
  'janeiro': 1, 'fevereiro': 2, 'feveiro': 2, 'março': 3, 'marco': 3,
  'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
};

// ─── Normalização para matching tolerante ────────────────────────────────────
function normalizar(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '')             // remove espaços
    .replace(/[^a-z0-9]/g, '');      // remove pontuação
}

// ─── Lê o workbook ───────────────────────────────────────────────────────────
function abrirExcel() {
  const fs = require('fs');
  for (const p of XLSX_PATHS) {
    if (fs.existsSync(p)) {
      console.log(`📂 Excel encontrado: ${p}`);
      return XLSX.readFile(p);
    }
  }
  console.error('❌ Arquivo Excel não encontrado. Caminhos tentados:');
  XLSX_PATHS.forEach((p) => console.error('   ' + p));
  process.exit(1);
}

// ─── Extrai dados das abas de setor (Capital) ─────────────────────────────────
// Retorna: [{ nomeCong: string, mes: number, valor: number }]
function extrairDadosSetor(ws, nomeAba) {
  const range  = XLSX.utils.decode_range(ws['!ref']);
  const maxRow = range.e.r;
  const maxCol = range.e.c;

  // 1. Encontrar a linha do cabeçalho (contém "meses" na coluna A)
  let headerRow = -1;
  for (let r = 0; r <= maxRow; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell && String(cell.v).toLowerCase().trim().startsWith('mes')) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) {
    console.warn(`  ⚠️  ${nomeAba}: cabeçalho "meses" não encontrado, pulando`);
    return [];
  }

  // 2. Coletar nomes das congregações (colunas B em diante, pular "TOTAL")
  const colunasCong = []; // [{ col, nome }]
  for (let c = 1; c <= maxCol; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c })];
    if (!cell) break;
    const nome = String(cell.v).trim();
    if (nome.toUpperCase() === 'TOTAL' || nome === '') break;
    colunasCong.push({ col: c, nome });
  }

  // 3. Coletar linhas dos meses (procura "janeiro" logo após o cabeçalho)
  const registros = [];
  for (let r = headerRow + 1; r <= maxRow; r++) {
    const celA = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (!celA) continue;
    const rotulo = String(celA.v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mes = MES_MAP[rotulo];
    if (!mes) continue;

    for (const { col, nome } of colunasCong) {
      const celVal = ws[XLSX.utils.encode_cell({ r, c: col })];
      if (!celVal) continue;
      const valor = parseFloat(String(celVal.v));
      if (isNaN(valor) || valor <= 0) continue;
      registros.push({ nomeCong: nome, mes, valor });
    }
  }

  return registros;
}

// ─── Extrai dados da aba Interior 2025 ───────────────────────────────────────
// Retorna: [{ nomeIgreja: string, mes: number, valor: number }]
function extrairDadosInterior(ws) {
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Header na row 4 (r=3): IGREJA | JANEIRO | FEVEREIRO | ... | DEZEMBRO | TOTAL
  const HEADER_ROW = 3;
  const colMes = {}; // col → mes_number
  for (let c = 1; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: HEADER_ROW, c })];
    if (!cell) continue;
    const h = String(cell.v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (MES_MAP[h]) colMes[c] = MES_MAP[h];
  }

  const registros = [];
  // Dados a partir de r=4 (row 5); parar antes de linhas de totais (col A vazia)
  for (let r = HEADER_ROW + 1; r <= range.e.r; r++) {
    const celNome = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (!celNome) continue;
    const nomeIgreja = String(celNome.v).trim();
    if (!nomeIgreja) continue;
    // Linha de total: valor numérico na coluna A → pular
    if (!isNaN(parseFloat(nomeIgreja))) continue;

    for (const [col, mes] of Object.entries(colMes)) {
      const celVal = ws[XLSX.utils.encode_cell({ r, c: parseInt(col) })];
      if (!celVal) continue;
      const valor = parseFloat(String(celVal.v));
      if (isNaN(valor) || valor <= 0) continue;
      registros.push({ nomeIgreja, mes, valor });
    }
  }

  return registros;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force');

  // ── Guarda de idempotência ──────────────────────────────────────────────────
  const count2025 = await prisma.ofertaMissionaria.count({ where: { anoReferencia: 2025 } });
  if (count2025 > 0 && !force) {
    console.log(`\n⚠️  Já existem ${count2025} ofertas de 2025 no banco.`);
    console.log('   Use --force para apagar e reimportar.\n');
    process.exit(0);
  }
  if (count2025 > 0 && force) {
    console.log(`🗑️  Apagando ${count2025} registros de 2025...`);
    await prisma.ofertaMissionaria.deleteMany({ where: { anoReferencia: 2025 } });
  }

  // ── Carregar Excel ──────────────────────────────────────────────────────────
  const wb = abrirExcel();
  const setorSheets = wb.SheetNames.filter((n) => n.startsWith('Setor'));
  console.log(`\n📊 Abas encontradas: ${wb.SheetNames.join(', ')}`);

  // ── Carregar congregações do banco ──────────────────────────────────────────
  const capitalDB = await prisma.congregacao.findMany({
    where: { tipo: 'CAPITAL' },
    select: { id: true, nome: true },
  });
  const interiorDB = await prisma.congregacao.findMany({
    where: { tipo: 'INTERIOR' },
    select: { id: true, nome: true },
  });

  // Mapa normalizado → id
  const mapaCapital  = new Map(capitalDB.map((c) => [normalizar(c.nome), c.id]));
  const mapaInterior = new Map(interiorDB.map((c) => [normalizar(c.nome), c.id]));

  console.log(`\n🏛️  Capital no banco: ${capitalDB.length} | Interior no banco: ${interiorDB.length}`);

  // ── Processar Capital (abas de setor) ───────────────────────────────────────
  console.log('\n━━━ CAPITAL ━━━');
  const registrosCapital = [];
  const naoEncontradosCapital = new Set();

  for (const nomeAba of setorSheets) {
    const ws     = wb.Sheets[nomeAba];
    const dados  = extrairDadosSetor(ws, nomeAba);
    let ok = 0, nao = 0;

    for (const { nomeCong, mes, valor } of dados) {
      const norm  = normalizar(nomeCong);
      const congId = mapaCapital.get(norm);
      if (!congId) {
        naoEncontradosCapital.add(`${nomeAba}: "${nomeCong}" (norm: ${norm})`);
        nao++;
        continue;
      }
      registrosCapital.push({ congregacaoId: congId, mesReferencia: mes, anoReferencia: 2025, valor });
      ok++;
    }
    console.log(`  ${nomeAba}: ${ok} valores coletados${nao > 0 ? `, ${nao} não mapeados` : ''}`);
  }

  if (naoEncontradosCapital.size > 0) {
    console.log('\n  ⚠️  Congregações Capital não encontradas no banco:');
    naoEncontradosCapital.forEach((s) => console.log(`     ${s}`));
  }

  // ── Processar Interior ──────────────────────────────────────────────────────
  console.log('\n━━━ INTERIOR ━━━');
  const wsInterior    = wb.Sheets['Interior 2025'];
  const dadosInterior = extrairDadosInterior(wsInterior);

  // Agrupar por nome de igreja para criar as que faltam
  const igrejasMes = new Map(); // nome → [{ mes, valor }]
  for (const { nomeIgreja, mes, valor } of dadosInterior) {
    if (!igrejasMes.has(nomeIgreja)) igrejasMes.set(nomeIgreja, []);
    igrejasMes.get(nomeIgreja).push({ mes, valor });
  }

  // Criar congregações de interior que não existem no banco
  let criadas = 0;
  for (const [nomeIgreja] of igrejasMes) {
    const norm = normalizar(nomeIgreja);
    if (!mapaInterior.has(norm)) {
      const nova = await prisma.congregacao.create({
        data: { nome: nomeIgreja, tipo: 'INTERIOR', setorId: null },
      });
      mapaInterior.set(norm, nova.id);
      console.log(`  ✅ Criada: "${nomeIgreja}" (id=${nova.id})`);
      criadas++;
    }
  }
  if (criadas === 0) console.log('  Todas as igrejas do interior já existem no banco.');
  else console.log(`  ${criadas} igrejas criadas.`);

  const registrosInterior = [];
  const naoEncontradosInterior = new Set();
  for (const { nomeIgreja, mes, valor } of dadosInterior) {
    const norm   = normalizar(nomeIgreja);
    const congId = mapaInterior.get(norm);
    if (!congId) {
      naoEncontradosInterior.add(nomeIgreja);
      continue;
    }
    registrosInterior.push({ congregacaoId: congId, mesReferencia: mes, anoReferencia: 2025, valor });
  }
  console.log(`  ${registrosInterior.length} valores coletados`);
  if (naoEncontradosInterior.size > 0) {
    console.log('  ⚠️  Não mapeadas:', [...naoEncontradosInterior].join(', '));
  }

  // ── Inserção com upsert (evita duplicatas por segurança) ────────────────────
  const todos = [...registrosCapital, ...registrosInterior];
  console.log(`\n💾 Inserindo ${todos.length} registros no banco...`);

  // Inserir em lotes de 100 usando createMany + skipDuplicates
  // Primeiro, verificar se há unique constraint em (congregacaoId, mesReferencia, anoReferencia)
  // Se não, usamos upsert para segurança
  let inseridos = 0;
  const LOTE = 100;

  for (let i = 0; i < todos.length; i += LOTE) {
    const lote  = todos.slice(i, i + LOTE);
    // Verificar cada registro individualmente para evitar duplicatas
    for (const reg of lote) {
      const existe = await prisma.ofertaMissionaria.findFirst({
        where: {
          congregacaoId: reg.congregacaoId,
          mesReferencia: reg.mesReferencia,
          anoReferencia: reg.anoReferencia,
        },
      });
      if (existe) continue;
      await prisma.ofertaMissionaria.create({ data: reg });
      inseridos++;
    }
    process.stdout.write(`\r   ${Math.min(i + LOTE, todos.length)}/${todos.length} processados...`);
  }

  // ── Relatório Final ─────────────────────────────────────────────────────────
  console.log(`\n\n✅ CONCLUÍDO`);
  console.log(`   Registros inseridos : ${inseridos}`);
  console.log(`   Registros pulados   : ${todos.length - inseridos} (já existiam)`);
  console.log(`   Congregações criadas: ${criadas}`);

  // Verificação: congregações Capital sem nenhum dado de 2025
  const comDados = new Set(registrosCapital.map((r) => r.congregacaoId));
  const semDados = capitalDB.filter((c) => !comDados.has(c.id));
  if (semDados.length > 0) {
    console.log(`\n   ⚠️  Congregações Capital SEM dados de 2025 (verifique a planilha):`);
    semDados.forEach((c) => console.log(`      - ${c.nome}`));
  }

  const totalInserido = await prisma.ofertaMissionaria.aggregate({
    _sum: { valor: true },
    where: { anoReferencia: 2025 },
  });
  console.log(`\n   💰 Total inserido: R$ ${parseFloat(totalInserido._sum.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => { console.error('\n❌ Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
