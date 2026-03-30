/**
 * SEED — Departamento de Missões IEADMS
 *
 * ATENÇÃO: Os valores de oferta de Janeiro e Fevereiro de 2026 abaixo
 * são PLACEHOLDERS. Substitua pelos valores reais da planilha antes de
 * usar em produção. Os nomes dos setores e congregações são os dados reais.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DOS SETORES E SUAS CONGREGAÇÕES
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

// ─────────────────────────────────────────────────────────────────────────────
// VALORES DAS OFERTAS — JAN e FEV 2026
// SUBSTITUA pelos valores reais da planilha Excel.
// Formato: { nomeExatoDaCongregacao: [valorJan, valorFev] }
// ─────────────────────────────────────────────────────────────────────────────

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
  'Imã':       [580.00,  560.00],
  'Popular':   [720.00,  750.00],
  'Serradinho':[340.00,  360.00],
  'AI':        [480.00,  500.00],
  'Carioca':   [390.00,  410.00],
  'A II':      [520.00,  490.00],
  'Inápolis':  [290.00,  310.00],
  'S.Monica':  [650.00,  680.00],

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
  'M.Roberto':  [680.00,  720.00],
  'J.Paulista': [540.00,  560.00],
  'Piratininga':[390.00,  410.00],
  'V.Boas':     [470.00,  500.00],
  'P.Dallas':   [580.00,  550.00],
  'Tiradentes': [320.00,  350.00],

  // SETOR F
  'B.Jardim':    [920.00,  980.00],
  'Caiçara':     [540.00,  560.00],
  'Tijuca 2':    [480.00,  510.00],
  'Jacy':        [360.00,  380.00],
  'R.Alegre':    [420.00,  440.00],
  'Guanandy':    [650.00,  630.00],
  'S.Emilia':    [380.00,  400.00],
  'S.Conrado':   [510.00,  530.00],
  'S.J.da Lagoa':[290.00,  310.00],
  'União':       [470.00,  490.00],

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
  'Camapuã':    [180.00,  200.00],
  'Três Lagoas':[260.00,  280.00],
  'Sidrolândia':[150.00,  170.00],
  'Terenos':    [120.00,  140.00],
  'Aquidauana': [140.00,  160.00],
  'Dourados':   [320.00,  350.00],
  'Ponta Porã': [210.00,  230.00],
  'Ribas':      [130.00,  150.00],
  'São Gabriel':[110.00,  130.00],
  'Rio Verde':  [160.00,  180.00],
};

// ─────────────────────────────────────────────────────────────────────────────
// PESSOAS PARA MISSIONÁRIOS, PROMOTORES E SECRETÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

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
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpa tudo na ordem correta
  await prisma.ofertaMissionaria.deleteMany();
  await prisma.dependente.deleteMany();
  await prisma.missionario.deleteMany();
  await prisma.promotorMissoes.deleteMany();
  await prisma.agenteMissoes.deleteMany();
  await prisma.secretarioMissoes.deleteMany();
  await prisma.congregacao.deleteMany();
  await prisma.setor.deleteMany();
  await prisma.baseMissionaria.deleteMany();
  await prisma.pessoa.deleteMany();

  console.log('🗑️  Banco limpo.\n');

  // ── 1. SETORES DA CAPITAL ──────────────────────────────────────────────────
  console.log('📍 Criando setores da capital...');
  const setoresCriados = {};
  for (const s of setoresCapital) {
    const setor = await prisma.setor.create({
      data: { nome: s.nome, tipo: 'CAPITAL' },
    });
    setoresCriados[s.nome] = setor;
  }
  console.log(`   ✅ ${setoresCapital.length} setores criados.\n`);

  // ── 2. CONGREGAÇÕES DA CAPITAL ────────────────────────────────────────────
  console.log('⛪ Criando congregações da capital...');
  const congregacoesCriadas = {};
  for (const s of setoresCapital) {
    for (const nomeCongreg of s.congregacoes) {
      const cong = await prisma.congregacao.create({
        data: {
          nome: nomeCongreg,
          setorId: setoresCriados[s.nome].id,
          tipo: 'CAPITAL',
          cidade: 'Campo Grande',
        },
      });
      congregacoesCriadas[nomeCongreg] = cong;
    }
  }
  console.log(`   ✅ ${Object.keys(congregacoesCriadas).length} congregações da capital criadas.\n`);

  // ── 3. IGREJAS DO INTERIOR ────────────────────────────────────────────────
  console.log('🏘️  Criando igrejas do interior...');
  for (const nome of igrejasInterior) {
    const cong = await prisma.congregacao.create({
      data: {
        nome,
        setorId: null,
        tipo: 'INTERIOR',
        cidade: nome,
      },
    });
    congregacoesCriadas[nome] = cong;
  }
  console.log(`   ✅ ${igrejasInterior.length} igrejas do interior criadas.\n`);

  // ── 4. BASES MISSIONÁRIAS ─────────────────────────────────────────────────
  console.log('🏠 Criando bases missionárias...');
  const bases = await Promise.all([
    prisma.baseMissionaria.create({
      data: {
        nome: 'Base Moçambique',
        cidade: 'Maputo',
        estado: 'Maputo',
        responsavelNome: 'Rev. Samuel Chirwa',
        descricao: 'Base missionária em Maputo, Moçambique',
      },
    }),
    prisma.baseMissionaria.create({
      data: {
        nome: 'Base Peru',
        cidade: 'Lima',
        estado: 'Lima',
        responsavelNome: 'Rev. José Gutierrez',
        descricao: 'Base missionária em Lima, Peru',
      },
    }),
    prisma.baseMissionaria.create({
      data: {
        nome: 'Base Timor-Leste',
        cidade: 'Díli',
        estado: 'Díli',
        responsavelNome: 'Rev. Francisco Sousa',
        descricao: 'Base missionária em Díli, Timor-Leste',
      },
    }),
    prisma.baseMissionaria.create({
      data: {
        nome: 'Base Nordeste Brasil',
        cidade: 'Recife',
        estado: 'PE',
        responsavelNome: 'Pr. Antônio Barros',
        descricao: 'Base de apoio no Nordeste do Brasil',
      },
    }),
  ]);
  console.log(`   ✅ ${bases.length} bases missionárias criadas.\n`);

  // ── 5. PESSOAS E MISSIONÁRIOS ─────────────────────────────────────────────
  console.log('👤 Criando missionários...');
  const missionariosCriados = [];
  for (let i = 0; i < pessoasMissionarios.length; i++) {
    const pm = pessoasMissionarios[i];
    const pessoa = await prisma.pessoa.create({
      data: {
        nome: pm.nome,
        telefone: pm.telefone,
        email: pm.email,
        cidade: pm.cidade,
        estado: pm.estado,
        sexo: pm.sexo,
        estadoCivil: pm.estadoCivil,
        nacionalidade: 'Brasileira',
        origemReligiosa: 'Assembléia de Deus',
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

  // Vínculo coordenador: missionário 3 e 4 são supervisionados pelo missionário 1
  await prisma.missionario.update({
    where: { id: missionariosCriados[2].id },
    data: { coordenadorId: missionariosCriados[0].id },
  });
  await prisma.missionario.update({
    where: { id: missionariosCriados[3].id },
    data: { coordenadorId: missionariosCriados[0].id },
  });
  console.log(`   ✅ ${missionariosCriados.length} missionários criados.\n`);

  // ── 6. DEPENDENTES ────────────────────────────────────────────────────────
  console.log('👨‍👩‍👧 Criando dependentes...');
  const dependentesData = [
    // Missionário João (índice 0): cônjuge e filho
    { missionarioIdx: 0, nome: 'Rosana da Silva', parentesco: 'CONJUGE', sexo: 'F' },
    { missionarioIdx: 0, nome: 'Lucas da Silva', parentesco: 'FILHO', sexo: 'M' },
    // Missionária Maria (índice 1): cônjuge
    { missionarioIdx: 1, nome: 'Paulo Souza', parentesco: 'CONJUGE', sexo: 'M' },
    // Missionário Pedro (índice 2): cônjuge e filha
    { missionarioIdx: 2, nome: 'Sandra Almeida', parentesco: 'CONJUGE', sexo: 'F' },
    { missionarioIdx: 2, nome: 'Sofia Almeida', parentesco: 'FILHA', sexo: 'F' },
  ];
  for (const dep of dependentesData) {
    const pessoaDep = await prisma.pessoa.create({
      data: { nome: dep.nome, sexo: dep.sexo },
    });
    await prisma.dependente.create({
      data: {
        missionarioId: missionariosCriados[dep.missionarioIdx].id,
        pessoaId: pessoaDep.id,
        parentesco: dep.parentesco,
      },
    });
  }
  console.log(`   ✅ ${dependentesData.length} dependentes criados.\n`);

  // ── 7. PROMOTORES (um por setor) ──────────────────────────────────────────
  console.log('🎯 Criando promotores de missões...');
  for (let i = 0; i < setoresCapital.length; i++) {
    const nomeSetor = setoresCapital[i].nome;
    const nomePromotor = pessoasPromotores[i];
    const pessoa = await prisma.pessoa.create({
      data: {
        nome: nomePromotor,
        email: `promotor.setor${nomeSetor.toLowerCase()}@ieadms.org`,
        telefone: `(67) 9${String(9000 + i).padStart(4, '0')}-${String(1000 + i * 7).padStart(4, '0')}`,
      },
    });
    await prisma.promotorMissoes.create({
      data: {
        pessoaId: pessoa.id,
        setorId: setoresCriados[nomeSetor].id,
        dataInicio: new Date('2023-01-01'),
      },
    });
  }
  console.log(`   ✅ ${setoresCapital.length} promotores criados.\n`);

  // ── 8. SECRETÁRIOS (um por setor) ─────────────────────────────────────────
  console.log('📋 Criando secretários de missões...');
  for (let i = 0; i < setoresCapital.length; i++) {
    const nomeSetor = setoresCapital[i].nome;
    const nomeSecretario = pessoasSecretarios[i];
    const pessoa = await prisma.pessoa.create({
      data: {
        nome: nomeSecretario,
        email: `secretario.setor${nomeSetor.toLowerCase()}@ieadms.org`,
        telefone: `(67) 9${String(8000 + i).padStart(4, '0')}-${String(2000 + i * 11).padStart(4, '0')}`,
      },
    });
    await prisma.secretarioMissoes.create({
      data: {
        pessoaId: pessoa.id,
        setorId: setoresCriados[nomeSetor].id,
        dataInicio: new Date('2023-01-01'),
      },
    });
  }
  console.log(`   ✅ ${setoresCapital.length} secretários criados.\n`);

  // ── 9. OFERTAS — JAN e FEV 2026 ───────────────────────────────────────────
  console.log('💰 Lançando ofertas de Janeiro e Fevereiro de 2026...');
  let totalOfertas = 0;
  const todasAsCongregacoes = Object.values(congregacoesCriadas);

  for (const cong of todasAsCongregacoes) {
    const valores = valoresOfertas[cong.nome];
    if (!valores) {
      console.warn(`   ⚠️  Sem valores definidos para: "${cong.nome}" — pulado.`);
      continue;
    }

    const [valorJan, valorFev] = valores;

    await prisma.ofertaMissionaria.create({
      data: {
        congregacaoId: cong.id,
        mesReferencia: 1,
        anoReferencia: 2026,
        valor: valorJan,
        dataLancamento: new Date('2026-02-05'),
      },
    });

    await prisma.ofertaMissionaria.create({
      data: {
        congregacaoId: cong.id,
        mesReferencia: 2,
        anoReferencia: 2026,
        valor: valorFev,
        dataLancamento: new Date('2026-03-05'),
      },
    });

    totalOfertas += 2;
  }
  console.log(`   ✅ ${totalOfertas} registros de oferta lançados.\n`);

  // ── RESUMO ────────────────────────────────────────────────────────────────
  const contagens = await Promise.all([
    prisma.setor.count(),
    prisma.congregacao.count(),
    prisma.missionario.count(),
    prisma.dependente.count(),
    prisma.baseMissionaria.count(),
    prisma.promotorMissoes.count(),
    prisma.secretarioMissoes.count(),
    prisma.ofertaMissionaria.count(),
  ]);

  console.log('═══════════════════════════════════════');
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('═══════════════════════════════════════');
  console.log(`   Setores:          ${contagens[0]}`);
  console.log(`   Congregações:     ${contagens[1]}`);
  console.log(`   Missionários:     ${contagens[2]}`);
  console.log(`   Dependentes:      ${contagens[3]}`);
  console.log(`   Bases:            ${contagens[4]}`);
  console.log(`   Promotores:       ${contagens[5]}`);
  console.log(`   Secretários:      ${contagens[6]}`);
  console.log(`   Ofertas lançadas: ${contagens[7]}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
