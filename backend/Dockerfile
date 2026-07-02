FROM node:18-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY server.js ./
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "server.js"]
