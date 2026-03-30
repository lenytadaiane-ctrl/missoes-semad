-- CreateTable
CREATE TABLE "Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "dataNascimento" DATETIME,
    "cpf" TEXT,
    "rg" TEXT,
    "orgaoEmissor" TEXT,
    "dataEmissao" DATETIME,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "naturalidade" TEXT,
    "estadoCivil" TEXT,
    "origemReligiosa" TEXT,
    "nacionalidade" TEXT,
    "grauInstrucao" TEXT,
    "sexo" TEXT,
    "profissao" TEXT,
    "tituloEleitor" TEXT,
    "zona" TEXT,
    "secao" TEXT,
    "reservista" TEXT,
    "tipoSanguineo" TEXT,
    "nomePai" TEXT,
    "nomeMae" TEXT,
    "nomeConjuge" TEXT,
    "foto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Missionario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "campoMissionario" TEXT NOT NULL,
    "dataEnvio" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "coordenadorId" INTEGER,
    "baseMissionariaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Missionario_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Missionario_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "Missionario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Missionario_baseMissionariaId_fkey" FOREIGN KEY ("baseMissionariaId") REFERENCES "BaseMissionaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dependente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "missionarioId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "parentesco" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dependente_missionarioId_fkey" FOREIGN KEY ("missionarioId") REFERENCES "Missionario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dependente_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BaseMissionaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "descricao" TEXT,
    "responsavelNome" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Congregacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "setorId" INTEGER,
    "cidade" TEXT,
    "pastor" TEXT,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Congregacao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromotorMissoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "dataInicio" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromotorMissoes_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromotorMissoes_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgenteMissoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "congregacaoId" INTEGER,
    "dataInicio" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgenteMissoes_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgenteMissoes_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgenteMissoes_congregacaoId_fkey" FOREIGN KEY ("congregacaoId") REFERENCES "Congregacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecretarioMissoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "dataInicio" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecretarioMissoes_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SecretarioMissoes_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfertaMissionaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "congregacaoId" INTEGER NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valor" DECIMAL NOT NULL,
    "dataLancamento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfertaMissionaria_congregacaoId_fkey" FOREIGN KEY ("congregacaoId") REFERENCES "Congregacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_cpf_key" ON "Pessoa"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Missionario_pessoaId_key" ON "Missionario"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "Setor_nome_key" ON "Setor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Congregacao_nome_setorId_key" ON "Congregacao"("nome", "setorId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotorMissoes_pessoaId_key" ON "PromotorMissoes"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "AgenteMissoes_pessoaId_key" ON "AgenteMissoes"("pessoaId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretarioMissoes_pessoaId_key" ON "SecretarioMissoes"("pessoaId");

-- CreateIndex
CREATE INDEX "OfertaMissionaria_anoReferencia_mesReferencia_idx" ON "OfertaMissionaria"("anoReferencia", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaMissionaria_congregacaoId_mesReferencia_anoReferencia_key" ON "OfertaMissionaria"("congregacaoId", "mesReferencia", "anoReferencia");
