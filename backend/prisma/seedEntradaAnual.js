'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ENTRADAS = [
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
  console.log(`Seed de entradas anuais${force ? ' (--force)' : ''}...`);

  for (const entrada of ENTRADAS) {
    await prisma.entradaAnual.upsert({
      where: { ano: entrada.ano },
      update: { valor: entrada.valor },
      create: { ano: entrada.ano, valor: entrada.valor },
    });
    console.log(`  ${entrada.ano}: R$ ${entrada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }

  console.log('Entradas anuais inseridas com sucesso!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
