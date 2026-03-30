FROM node:18-slim

WORKDIR /app

# Instala OpenSSL e dependências do sistema necessárias para o Prisma
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copia manifestos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDeps para prisma generate)
RUN npm ci

# Copia o schema e gera o Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copia o restante do código
COPY src ./src
COPY server.js ./

# Diretório para uploads de fotos (efêmero no Railway)
RUN mkdir -p uploads

EXPOSE 3001

# Sincroniza o schema com o banco Postgres e inicia o servidor
CMD ["sh", "-c", "npx prisma db push && node server.js"]
