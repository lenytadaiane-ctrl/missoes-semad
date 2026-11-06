'use strict';
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

if (process.env.RUN_SEED === '1') {
  const { spawnSync } = require('child_process');
  console.log('RUN_SEED=1 — executando seed principal...');
  spawnSync('node', ['prisma/seed.js'], { stdio: 'inherit', env: process.env });
  console.log('RUN_SEED=1 — executando seed de entradas anuais...');
  spawnSync('node', ['prisma/seedEntradaAnual.js'], { stdio: 'inherit', env: process.env });
  console.log('Seeds concluídos.');
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

