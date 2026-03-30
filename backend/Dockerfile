# ── Stage de build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Instala todas as dependências (incluindo devDeps para o prisma generate)
RUN npm ci

# Gera o Prisma Client para Linux/Alpine
RUN npx prisma generate

# ── Stage de produção ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copia o Prisma Client gerado no stage anterior
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY prisma ./prisma
COPY src ./src
COPY server.js ./

# Diretório para uploads de fotos (volume efêmero no Railway)
RUN mkdir -p uploads

EXPOSE 3001

# Sincroniza o schema com o banco Postgres e inicia o servidor
# Usa db push pois não há migration files — para usar migrate deploy,
# gere as migrations localmente contra um Postgres: prisma migrate dev --name init
CMD ["sh", "-c", "npx prisma db push && node server.js"]
