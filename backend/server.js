require('dotenv').config();
const app  = require('./src/app');
const path = require('path');

const PORT = process.env.PORT || 3001;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const count = await prisma.setor.count();
      if (count === 0) {
        console.log('[auto-seed] Banco vazio — executando seed de producao...');
        const { execSync } = require('child_process');
        execSync('node ' + path.join(__dirname, 'prisma', 'seed.production.js'), {
          stdio: 'inherit',
          cwd: __dirname,
        });
        console.log('[auto-seed] Seed concluido.');
      } else {
        console.log(`[auto-seed] Banco ja possui ${count} setor(es) — seed ignorado.`);
      }
    } catch (err) {
      console.error('[auto-seed] Erro ao verificar banco:', err.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServidor rodando na porta ${PORT}`);
    console.log(`Arquivos estaticos em /uploads\n`);
  });
}

startServer();
