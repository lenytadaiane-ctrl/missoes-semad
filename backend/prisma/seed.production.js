/**
 * SEED DE PRODUÇÃO — Departamento de Missões IEADMS
 *
 * Seguro para rodar em banco PostgreSQL já existente:
 * - Usa upsert / createMany com skipDuplicates (não apaga dados reais)
 * - Pula etapas que já possuem dados
 * - Use --force para apagar tudo e recriar do zero (CUIDADO em produção)
 *
 * Uso:
 *   node prisma/seed.production.js
 *   node prisma/seed.production.js --force
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FORCE = process.argv.includes('--force');

// ─────────────────────────────────────────────────────────────────────────────
// DADOS
// ─────────────────────────────────────────────────────────────────────────────

const setoresCapital = [
  {
    nome: 'A',
    congregacoes: [
      'A.Pereira', 'C.Verde', 'C.Morena', 'Albuquerque', 'Itamaraca',
      'Moema', 'Sta Felicidade', 'MR4', 'Universitario', 'MR3',
    ],
  },
  {
    nome: 'B',
    congregacoes: ['C.Belo', 'N.Lima 3', 'I.Garden', 'At.Sul', 'Imperial'],
  },
  {
    nome: 'C1',
    congregacoes: [
      'S.Amaro', 'S.Carmelia', 'José Abrão', 'S.Luzia',
      'Zé Pereira', 'Marly', 'Nasser', 'P.Lagoa',
    ],
  },
  {
    nome: 'C2',
    congregacoes: [
      'Imã', 'Popular', 'Serradinho', 'AI',
      'Carioca', 'A II', 'Inápolis', 'S.Monica',
    ],
  },
  {
    nome: 'D',
    congregacoes: [
      'Centenário', 'A.R.1', 'A.R.4', 'I.Coelho', 'Hortencias',
      'Guanandy2', 'Parati', 'N.Esperança', 'A.Rancho', 'T.Neves',
    ],
  },
  {
    nome: 'E',
    congregacoes: [
      'M.Roberto', 'J.Paulista', 'Piratininga',
      'V.Boas', 'P.Dallas', 'Tiradentes',
    ],
  },
  {
    nome: 'F',
    congregacoes: [
      'B.Jardim', 'Caiçara', 'Tijuca 2', 'Jacy', 'R.Alegre',
      'Guanandy', 'S.Emilia', 'S.Conrado', 'S.J.da Lagoa', 'União',
    ],
  },
  {
    nome: 'G',
    congregacoes: [
      'Taruma', 'Caioba I', 'Caioba II', 'Penfigo', 'Laranjeiras',
      'Lageado', 'Sabia', 'Colorado', 'P.do Sol', 'A.Rancho 7',
    ],
  },
  {
    nome: 'H',
    congregacoes: [
      'Sta Fé', 'M.Castelo', 'M.Jacinto', 'Montevideo', 'E.Dalva',
      'Taquaral', 'Cruzeiro', 'Catarina', 'Margarida', 'N.Bahia',
    ],
  },
  {
    nome: 'I',
    congregacoes: ['Matriz'],
  },
  {
    nome: 'J',
    congregacoes: [
      'Pioneira', 'Cohab', 'C.Oeste', 'Uirapuru', 'Macaubas',
      'J.Nações', 'V.Martins', 'Guaicurus', 'Balsamo', 'Los Angeles',
    ],
  },
  {
    nome: 'M',
    congregacoes: ['N.Lima 1', 'N.Lima 2', 'Columbia', 'V.Nova', 'Anache', 'Matel'],
  },
  {
    nome: 'N',
    congregacoes: [
      'Pedrossian', 'R.Vieira', 'C.Redentor', 'Noroeste',
      'E.Parque', 'Leon', 'Panorama', 'N.Serrana',
    ],
  },
];

const igrejasInterior = [
  'Camapuã', 'Três Lagoas', 'Sidrolândia', 'Terenos',
  'Aquidauana', 'Dourados', 'Ponta Porã', 'Ribas',
  'São Gabriel', 'Rio Verde',
];

const valoresOfertas = {
  // SETOR A
  'A.Pereira':      [1250.00, 1380.00],
  'C.Verde':        [480.00,  520.00],
  'C.Morena':       [360.00,  390.00],
  'Albuquerque':    [720.00,  680.00],
  'Itamaraca':      [540.00,  510.00],
  'Moema':          [890.00,  920.00],
  'Sta Felicidade': [430.00,  460.00],
  'MR4':            [310.00,  290.00],
  'Universitario':  [650.00,  700.00],
  'MR3':            [280.00,  300.00],
  // SETOR B
  'C.Belo':   [1100.00, 980.00],
  'N.Lima 3': [420.00,  450.00],
  'I.Garden': [560.00,  530.00],
  'At.Sul':   [380.00,  410.00],
  'Imperial': [750.00,  780.00],
  // SETOR C1
  'S.Amaro':    [640.00,  610.00],
  'S.Carmelia': [480.00,  500.00],
  'José Abrão': [390.00,  420.00],
  'S.Luzia':    [520.00,  490.00],
  'Zé Pereira': [300.00,  320.00],
  'Marly':      [410.00,  440.00],
  'Nasser':     [350.00,  380.00],
  'P.Lagoa':    [460.00,  430.00],
  // SETOR C2
  'Imã':        [580.00,  560.00],
  'Popular':    [720.00,  750.00],
  'Serradinho': [340.00,  360.00],
  'AI':         [480.00,  500.00],
  'Carioca':    [390.00,  410.00],
  'A II':       [520.00,  490.00],
  'Inápolis':   [290.00,  310.00],
  'S.Monica':   [650.00,  680.00],
  // SETOR D
  'Centenário':  [1800.00, 1950.00],
  'A.R.1':       [430.00,  460.00],
  'A.R.4':       [380.00,  400.00],
  'I.Coelho':    [520.00,  550.00],
  'Hortencias':  [360.00,  390.00],
  'Guanandy2':   [490.00,  470.00],
  'Parati':      [310.00,  330.00],
  'N.Esperança': [420.00,  440.00],
  'A.Rancho':    [280.00,  300.00],
  'T.Neves':     [540.00,  560.00],
  // SETOR E
  'M.Roberto':   [680.00,  720.00],
  'J.Paulista':  [540.00,  560.00],
  'Piratininga': [390.00,  410.00],
  'V.Boas':      [470.00,  500.00],
  'P.Dallas':    [580.00,  550.00],
  'Tiradentes':  [320.00,  350.00],
  // SETOR F
  'B.Jardim':     [920.00,  980.00],
  'Caiçara':      [540.00,  560.00],
  'Tijuca 2':     [480.00,  510.00],
  'Jacy':         [360.00,  380.00],
  'R.Alegre':     [420.00,  440.00],
  'Guanandy':     [650.00,  630.00],
  'S.Emilia':     [380.00,  400.00],
  'S.Conrado':    [510.00,  530.00],
  'S.J.da Lagoa': [290.00,  310.00],
  'União':        [470.00,  490.00],
  // SETOR G
  'Taruma':     [760.00,  800.00],
  'Caioba I':   [540.00,  560.00],
  'Caioba II':  [480.00,  510.00],
  'Penfigo':    [620.00,  640.00],
  'Laranjeiras':[390.00,  410.00],
  'Lageado':    [330.00,  350.00],
  'Sabia':      [420.00,  440.00],
  'Colorado':   [360.00,  380.00],
  'P.do Sol':   [500.00,  520.00],
  'A.Rancho 7': [280.00,  300.00],
  // SETOR H
  'Sta Fé':     [840.00,  880.00],
  'M.Castelo':  [560.00,  590.00],
  'M.Jacinto':  [420.00,  450.00],
  'Montevideo': [680.00,  710.00],
  'E.Dalva':    [380.00,  400.00],
  'Taquaral':   [530.00,  550.00],
  'Cruzeiro':   [460.00,  480.00],
  'Catarina':   [310.00,  330.00],
  'Margarida':  [490.00,  510.00],
  'N.Bahia':    [370.00,  390.00],
  // SETOR I
  'Matriz': [2200.00, 2400.00],
  // SETOR J
  'Pioneira':    [780.00,  820.00],
  'Cohab':       [560.00,  590.00],
  'C.Oeste':     [420.00,  450.00],
  'Uirapuru':    [340.00,  360.00],
  'Macaubas':    [490.00,  510.00],
  'J.Nações':    [380.00,  400.00],
  'V.Martins':   [620.00,  640.00],
  'Guaicurus':   [460.00,  480.00],
  'Balsamo':     [300.00,  320.00],
  'Los Angeles': [540.00,  560.00],
  // SETOR M
  'N.Lima 1': [520.00,  550.00],
  'N.Lima 2': [480.00,  500.00],
  'Columbia': [360.00,  380.00],
  'V.Nova':   [430.00,  450.00],
  'Anache':   [290.00,  310.00],
  'Matel':    [350.00,  370.00],
  // SETOR N
  'Pedrossian': [640.00,  680.00],
  'R.Vieira':   [480.00,  510.00],
  'C.Redentor': [560.00,  590.00],
  'Noroeste':   [420.00,  440.00],
  'E.Parque':   [380.00,  400.00],
  'Leon':       [340.00,  360.00],
  'Panorama':   [460.00,  480.00],
  'N.Serrana':  [310.00,  330.00],
  // INTERIOR
  'Camapuã':     [180.00,  200.00],
  'Três Lagoas': [260.00,  280.00],
  'Sidrolândia': [150.00,  170.00],
  'Terenos':     [120.00,  140.00],
  'Aquidauana':  [140.00,  160.00],
  'Dourados':    [320.00,  350.00],
  'Ponta Porã':  [210.00,  230.00],
  'Ribas':       [130.00,  150.00],
  'São Gabriel': [110.00,  130.00],
  'Rio Verde':   [160.00,  180.00],
};

const pessoasMissionarios = [
  {
    nome: 'João Carlos da Silva',
    telefone: '(67) 99101-2345',
    email: 'joao.silva@missoes.com',
    cidade: 'Campo Grande',
    estado: 'MS',
    sexo: 'M',
    estadoCivil: 'CASADO',
    campoMissionario: 'Moçambique, África',
    dataEnvio: new Date('2018-03-15'),
    status: 'ATIVO',
  },
  {
    nome: 'Maria Helena Souza',
    telefone: '(67) 99202-3456',
    email: 'maria.souza@missoes.com',
    cidade: 'Campo Grande',
    estado: 'MS',
    sexo: 'F',
    estadoCivil: 'CASADA',
    campoMissionario: 'Peru, América do Sul',
    dataEnvio: new Date('2019-06-20'),
    status: 'ATIVO',
  },
  {
    nome: 'Pedro Almeida Neto',
    telefone: '(67) 99303-4567',
    email: 'pedro.almeida@missoes.com',
    cidade: 'Dourados',
    estado: 'MS',
    sexo: 'M',
    estadoCivil: 'CASADO',
    campoMissionario: 'Timor-Leste, Ásia',
    dataEnvio: new Date('2020-01-10'),
    status: 'ATIVO',
  },
  {
    nome: 'Ana Paula Ferreira',
    telefone: '(67) 99404-5678',
    email: 'ana.ferreira@missoes.com',
    cidade: 'Campo Grande',
    estado: 'MS',
    sexo: 'F',
    estadoCivil: 'SOLTEIRA',
    campoMissionario: 'Nordeste do Brasil',
    dataEnvio: new Date('2021-08-05'),
    status: 'AFASTADO',
  },
  {
    nome: 'Carlos Eduardo Lima',
    telefone: '(67) 99505-6789',
    email: 'carlos.lima@missoes.com',
    cidade: 'Três Lagoas',
    estado: 'MS',
    sexo: 'M',
    estadoCivil: 'CASADO',
    campoMissionario: 'Bolívia',
    dataEnvio: new Date('2017-11-01'),
    status: 'INATIVO',
  },
];

const pessoasPromotores = [
  'Roberto Santos', 'Fernanda Costa', 'Marcelo Oliveira', 'Patrícia Rocha',
  'Anderson Pereira', 'Cláudia Mendes', 'Thiago Barbosa', 'Simone Cavalcante',
  'Rodrigo Figueiredo', 'Luciana Carvalho', 'Eduardo Nascimento',
  'Vanessa Teixeira', 'Fábio Monteiro',
];

const pessoasSecretarios = [
  'Gabriel Vieira', 'Juliana Pinto', 'Leonardo Azevedo', 'Camila Ribeiro',
  'Rafael Guimarães', 'Tatiana Moreira', 'Bruno Cardoso', 'Amanda Lopes',
  'Henrique Silveira', 'Priscila Cunha', 'Vinícius Martins',
  'Letícia Corrêa', 'Alexandre Gomes',
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed de producao...\n');

  // ── FORCE: limpa tudo antes de recriar ──────────────────────────────────────
  if (FORCE) {
    console.log('--force: apagando dados existentes...');
    await prisma.ofertaMissionaria.deleteMany();
    await prisma.entradaAnual.deleteMany();
    await prisma.dependente.deleteMany();
    await prisma.missionario.deleteMany();
    await prisma.promotorMissoes.deleteMany();
    await prisma.agenteMissoes.deleteMany();
    await prisma.secretarioMissoes.deleteMany();
    await prisma.congregacao.deleteMany();
    await prisma.setor.deleteMany();
    await prisma.baseMissionaria.deleteMany();
    await prisma.pessoa.deleteMany();
    console.log('Banco limpo.\n');
  }

  // ── 1. SETORES (upsert pelo nome único) ────────────────────────────────────
  console.log('Criando setores...');
  const setoresCriados = {};
  for (const s of setoresCapital) {
    const setor = await prisma.setor.upsert({
      where:  { nome: s.nome },
      update: {},
      create: { nome: s.nome, tipo: 'CAPITAL' },
    });
    setoresCriados[s.nome] = setor;
  }
  console.log(`  ${Object.keys(setoresCriados).length} setores ok.\n`);

  // ── 2. CONGREGAÇÕES DA CAPITAL (upsert pelo nome+setorId) ──────────────────
  console.log('Criando congregacoes da capital...');
  const congregacoesCriadas = {};
  for (const s of setoresCapital) {
    for (const nomeCongreg of s.congregacoes) {
      const cong = await prisma.congregacao.upsert({
        where:  { nome_setorId: { nome: nomeCongreg, setorId: setoresCriados[s.nome].id } },
        update: {},
        create: {
          nome:    nomeCongreg,
          setorId: setoresCriados[s.nome].id,
          tipo:    'CAPITAL',
          cidade:  'Campo Grande',
        },
      });
      congregacoesCriadas[nomeCongreg] = cong;
    }
  }
  console.log(`  ${Object.keys(congregacoesCriadas).length} congregacoes da capital ok.\n`);

  // ── 3. IGREJAS DO INTERIOR ─────────────────────────────────────────────────
  console.log('Criando igrejas do interior...');
  for (const nome of igrejasInterior) {
    // Interior não tem setor: busca pelo nome sem setorId
    const existing = await prisma.congregacao.findFirst({ where: { nome, setorId: null } });
    if (!existing) {
      const cong = await prisma.congregacao.create({
        data: { nome, setorId: null, tipo: 'INTERIOR', cidade: nome },
      });
      congregacoesCriadas[nome] = cong;
    } else {
      congregacoesCriadas[nome] = existing;
    }
  }
  console.log(`  ${igrejasInterior.length} igrejas do interior ok.\n`);

  // ── 4. BASES MISSIONÁRIAS ─────────────────────────────────────────────────
  console.log('Criando bases missionarias...');
  const basesData = [
    { nome: 'Base Mocambique',    cidade: 'Maputo',  estado: 'Maputo', responsavelNome: 'Rev. Samuel Chirwa',   descricao: 'Base missionaria em Maputo, Mocambique' },
    { nome: 'Base Peru',          cidade: 'Lima',    estado: 'Lima',   responsavelNome: 'Rev. Jose Gutierrez',  descricao: 'Base missionaria em Lima, Peru' },
    { nome: 'Base Timor-Leste',   cidade: 'Dili',    estado: 'Dili',   responsavelNome: 'Rev. Francisco Sousa', descricao: 'Base missionaria em Dili, Timor-Leste' },
    { nome: 'Base Nordeste Brasil',cidade: 'Recife', estado: 'PE',     responsavelNome: 'Pr. Antonio Barros',   descricao: 'Base de apoio no Nordeste do Brasil' },
  ];
  const bases = [];
  for (const b of basesData) {
    const existing = await prisma.baseMissionaria.findFirst({ where: { nome: b.nome } });
    if (!existing) {
      bases.push(await prisma.baseMissionaria.create({ data: b }));
    } else {
      bases.push(existing);
    }
  }
  console.log(`  ${bases.length} bases ok.\n`);

  // ── 5. MISSIONÁRIOS ────────────────────────────────────────────────────────
  console.log('Criando missionarios...');
  const missionariosCriados = [];
  const missionariosExistentes = await prisma.missionario.count();

  if (missionariosExistentes === 0) {
    for (let i = 0; i < pessoasMissionarios.length; i++) {
      const pm = pessoasMissionarios[i];
      const pessoa = await prisma.pessoa.create({
        data: {
          nome: pm.nome, telefone: pm.telefone, email: pm.email,
          cidade: pm.cidade, estado: pm.estado, sexo: pm.sexo,
          estadoCivil: pm.estadoCivil,
          nacionalidade: 'Brasileira',
          origemReligiosa: 'Assembleia de Deus',
        },
      });
      const missionario = await prisma.missionario.create({
        data: {
          pessoaId: pessoa.id,
          campoMissionario: pm.campoMissionario,
          dataEnvio: pm.dataEnvio,
          status: pm.status,
          baseMissionariaId: i < bases.length ? bases[i].id : null,
        },
      });
      missionariosCriados.push(missionario);
    }
    // Coordenadores
    await prisma.missionario.update({ where: { id: missionariosCriados[2].id }, data: { coordenadorId: missionariosCriados[0].id } });
    await prisma.missionario.update({ where: { id: missionariosCriados[3].id }, data: { coordenadorId: missionariosCriados[0].id } });

    // Dependentes
    const dependentesData = [
      { idx: 0, nome: 'Rosana da Silva',  parentesco: 'CONJUGE', sexo: 'F' },
      { idx: 0, nome: 'Lucas da Silva',   parentesco: 'FILHO',   sexo: 'M' },
      { idx: 1, nome: 'Paulo Souza',      parentesco: 'CONJUGE', sexo: 'M' },
      { idx: 2, nome: 'Sandra Almeida',   parentesco: 'CONJUGE', sexo: 'F' },
      { idx: 2, nome: 'Sofia Almeida',    parentesco: 'FILHA',   sexo: 'F' },
    ];
    for (const dep of dependentesData) {
      const pessoaDep = await prisma.pessoa.create({ data: { nome: dep.nome, sexo: dep.sexo } });
      await prisma.dependente.create({
        data: { missionarioId: missionariosCriados[dep.idx].id, pessoaId: pessoaDep.id, parentesco: dep.parentesco },
      });
    }
    console.log(`  ${missionariosCriados.length} missionarios + dependentes criados.\n`);
  } else {
    const todos = await prisma.missionario.findMany();
    missionariosCriados.push(...todos);
    console.log(`  ${missionariosExistentes} missionarios ja existentes — pulado.\n`);
  }

  // ── 6. PROMOTORES (um por setor, pula se já existir) ───────────────────────
  console.log('Criando promotores...');
  const promotoresExistentes = await prisma.promotorMissoes.count();
  if (promotoresExistentes === 0) {
    for (let i = 0; i < setoresCapital.length; i++) {
      const nomeSetor = setoresCapital[i].nome;
      const pessoa = await prisma.pessoa.create({
        data: {
          nome: pessoasPromotores[i],
          email: `promotor.setor${nomeSetor.toLowerCase()}@ieadms.org`,
          telefone: `(67) 9${String(9000 + i).padStart(4, '0')}-${String(1000 + i * 7).padStart(4, '0')}`,
        },
      });
      await prisma.promotorMissoes.create({
        data: { pessoaId: pessoa.id, setorId: setoresCriados[nomeSetor].id, dataInicio: new Date('2023-01-01') },
      });
    }
    console.log(`  ${setoresCapital.length} promotores criados.\n`);
  } else {
    console.log(`  ${promotoresExistentes} promotores ja existentes — pulado.\n`);
  }

  // ── 7. SECRETÁRIOS (um por setor, pula se já existir) ─────────────────────
  console.log('Criando secretarios...');
  const secretariosExistentes = await prisma.secretarioMissoes.count();
  if (secretariosExistentes === 0) {
    for (let i = 0; i < setoresCapital.length; i++) {
      const nomeSetor = setoresCapital[i].nome;
      const pessoa = await prisma.pessoa.create({
        data: {
          nome: pessoasSecretarios[i],
          email: `secretario.setor${nomeSetor.toLowerCase()}@ieadms.org`,
          telefone: `(67) 9${String(8000 + i).padStart(4, '0')}-${String(2000 + i * 11).padStart(4, '0')}`,
        },
      });
      await prisma.secretarioMissoes.create({
        data: { pessoaId: pessoa.id, setorId: setoresCriados[nomeSetor].id, dataInicio: new Date('2023-01-01') },
      });
    }
    console.log(`  ${setoresCapital.length} secretarios criados.\n`);
  } else {
    console.log(`  ${secretariosExistentes} secretarios ja existentes — pulado.\n`);
  }

  // ── 8. OFERTAS JAN e FEV 2026 (skipDuplicates pelo unique constraint) ──────
  console.log('Lancando ofertas Jan/Fev 2026...');
  const todasCongs = Object.values(congregacoesCriadas);
  const ofertasParaInserir = [];

  for (const cong of todasCongs) {
    const valores = valoresOfertas[cong.nome];
    if (!valores) continue;
    ofertasParaInserir.push(
      { congregacaoId: cong.id, mesReferencia: 1, anoReferencia: 2026, valor: valores[0], dataLancamento: new Date('2026-02-05') },
      { congregacaoId: cong.id, mesReferencia: 2, anoReferencia: 2026, valor: valores[1], dataLancamento: new Date('2026-03-05') },
    );
  }

  const resultado = await prisma.ofertaMissionaria.createMany({
    data: ofertasParaInserir,
    skipDuplicates: true,   // ignora se o unique [congregacaoId, mes, ano] já existe
  });
  console.log(`  ${resultado.count} ofertas inseridas (duplicatas ignoradas).\n`);

  // ── 9. HISTÓRICO ENTRADA ANUAL 2017-2025 ──────────────────────────────────
  console.log('Inserindo historico de entradas anuais...');
  const historico = [
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
  let entradaCount = 0;
  for (const item of historico) {
    await prisma.entradaAnual.upsert({
      where:  { ano: item.ano },
      update: {},
      create: { ano: item.ano, valor: item.valor },
    });
    entradaCount++;
  }
  console.log(`  ${entradaCount} entradas anuais ok.\n`);

  // ── RESUMO ─────────────────────────────────────────────────────────────────
  const [nSetores, nCongs, nMiss, nBases, nProm, nSecr, nOfertas, nEntrada] = await Promise.all([
    prisma.setor.count(),
    prisma.congregacao.count(),
    prisma.missionario.count(),
    prisma.baseMissionaria.count(),
    prisma.promotorMissoes.count(),
    prisma.secretarioMissoes.count(),
    prisma.ofertaMissionaria.count(),
    prisma.entradaAnual.count(),
  ]);

  console.log('=========================================');
  console.log('SEED CONCLUIDO COM SUCESSO!');
  console.log('=========================================');
  console.log(`  Setores:            ${nSetores}`);
  console.log(`  Congregacoes:       ${nCongs}`);
  console.log(`  Missionarios:       ${nMiss}`);
  console.log(`  Bases missionarias: ${nBases}`);
  console.log(`  Promotores:         ${nProm}`);
  console.log(`  Secretarios:        ${nSecr}`);
  console.log(`  Ofertas:            ${nOfertas}`);
  console.log(`  Entradas anuais:    ${nEntrada}`);
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('ERRO durante o seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
