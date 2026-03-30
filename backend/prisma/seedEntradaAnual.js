/**
 * Seed histórico de EntradaAnual (2017–2025)
 * Uso: node prisma/seedEntradaAnual.js
 * Use --force para apagar e reimportar
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HISTORICO = [
  { ano: 2017, valor: 618985.44 },
  { ano: 2018, valor: 748699.01 },
  { ano: 2019, valor: 765133.53 },
  { ano: 2020, valor: 857874.32 },
  { ano: 2021, valor: 1007563.00 },
  { ano: 2022, valor: 1181848.40 },
  { ano: 2023, valor: 1322347.90 },
  { ano: 2024, valor: 1501641.70 },
  { ano: 2025, valor: 1527489.10 },
];

async function main() {
  const force = process.argv.includes('--force');

  if (force) {
    const del = await prisma.entradaAnual.deleteMany({});
    console.log(`Apagados ${del.count} registros.`);
  } else {
    const count = await prisma.entradaAnual.count();
    if (count > 0) {
      console.log(`EntradaAnual já possui ${count} registros. Use --force para reimportar.`);
      return;
    }
  }

  let inserted = 0;
  for (const item of HISTORICO) {
    await prisma.entradaAnual.upsert({
      where:  { ano: item.ano },
      update: { valor: item.valor },
      create: { ano: item.ano, valor: item.valor },
    });
    inserted++;
    console.log(`  ${item.ano}: R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }

  console.log(`\n✓ ${inserted} registros inseridos/atualizados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
