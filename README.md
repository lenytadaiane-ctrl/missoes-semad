# Sistema de Gestão — Departamento de Missões IEADMS

Sistema full-stack para gestão de missionários, congregações, setores, ofertas e relatórios do Departamento de Missões da IEADMS.

- **Backend:** Node.js + Express + Prisma + PostgreSQL → deploy no **Railway**
- **Frontend:** React + Vite + Tailwind → deploy na **Vercel**

---

## Desenvolvimento local

### Pré-requisitos
- Node.js 20+
- npm

### Backend
```bash
cd backend
cp .env.example .env
# Edite .env: defina DATABASE_URL com seu SQLite local (file:./prisma/dev.db)
# ou um Postgres local
npm install
npx prisma migrate dev --name init
npm run dev        # http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

> O Vite proxy redireciona `/api` para `localhost:3001` automaticamente. Não é necessário definir `VITE_API_URL` em desenvolvimento.

---

## Deploy — Backend no Railway

### 1. Criar conta e novo projeto
1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione este repositório e, quando pedido, indique **Root Directory: `backend`**

### 2. Adicionar PostgreSQL
1. No painel do projeto, clique em **+ New → Database → Add PostgreSQL**
2. O Railway injeta `DATABASE_URL` automaticamente no serviço do backend

### 3. Variáveis de ambiente
No painel do serviço backend, vá em **Variables** e adicione:

| Variável | Valor |
|---|---|
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://seu-app.vercel.app` *(preencha após o deploy do frontend)* |
| `UPLOAD_DIR` | `uploads` |
| `MAX_FILE_SIZE` | `5242880` |

> `DATABASE_URL` já é injetada pelo plugin PostgreSQL — não precisa adicionar manualmente.

### 4. Deploy
O Railway detecta o `Dockerfile` e o `railway.toml` automaticamente. A cada push na branch principal, um novo deploy é disparado.

Na primeira inicialização, o comando `prisma db push` cria todas as tabelas no Postgres automaticamente.

### 5. Verificar
Acesse `https://seu-backend.up.railway.app/api/health` — deve retornar `{"status":"ok"}`.

---

## Deploy — Frontend na Vercel

### 1. Criar projeto
1. Acesse [vercel.com](https://vercel.com) e conecte ao GitHub
2. Clique em **New Project → Import** e selecione este repositório
3. Em **Root Directory**, selecione `frontend`
4. Framework será detectado como **Vite** automaticamente

### 2. Variável de ambiente
Em **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://seu-backend.up.railway.app` *(URL do Railway, sem barra final)* |

### 3. Deploy
Clique em **Deploy**. A Vercel executa `npm run build` e serve o `dist/` resultante.

O arquivo `vercel.json` já configura o redirect de todas as rotas para `index.html` (necessário para o React Router funcionar).

---

## Importação dos dados históricos

Após o primeiro deploy no Railway, rode os seeds via Railway CLI ou pelo painel **Run Command**:

```bash
# Dados de teste 2026
node prisma/seed.js

# Dados reais 2025 (requer o Excel no container — ver nota abaixo)
node prisma/seed2025.js

# Histórico anual 2017–2025
node prisma/seedEntradaAnual.js
```

---

## Observações importantes

### Uploads de fotos de missionários
O Railway usa armazenamento **efêmero** — arquivos enviados são apagados a cada redeploy. Para persistência de uploads em produção, integre um serviço de object storage (ex: Cloudflare R2, AWS S3, Supabase Storage) e ajuste o `multer` para salvar nesses serviços.

### Migrações de banco de dados
O deploy usa `prisma db push` (sincroniza o schema sem histórico de migrações). Para ambientes com dados em produção, prefira criar migrations explícitas:

```bash
# Gerar migration para o schema atual (requer Postgres local ou DATABASE_URL do Railway)
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init_postgres
```

---

## Estrutura do projeto

```
missoes-departamento/
├── backend/
│   ├── Dockerfile
│   ├── railway.toml
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma        # provider: postgresql
│   │   ├── seed.js              # dados de teste 2026
│   │   ├── seed2025.js          # ofertas reais 2025 (Excel)
│   │   └── seedEntradaAnual.js  # histórico 2017–2025
│   └── src/
│       ├── app.js
│       ├── controllers/
│       ├── routes/
│       └── services/
└── frontend/
    ├── vercel.json
    ├── .env.example
    ├── vite.config.js
    └── src/
        └── api/
            └── client.js        # usa VITE_API_URL
```
