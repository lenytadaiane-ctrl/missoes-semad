'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SETORES = [
  { nome: 'Setor A', tipo: 'CAPITAL', congregacoes: ['A.Pereira','C.Verde','C.Morena','Albuquerque','Itamaraca','Moema','Sta Felicidade','MR4','Universitario','MR3'] },
  { nome: 'Setor B', tipo: 'CAPITAL', congregacoes: ['C.Belo','N.Lima 3','I.Garden','At.Sul','Imperial'] },
  { nome: 'Setor C1', tipo: 'CAPITAL', congregacoes: ['S.Amaro','S.Carmelia','José Abrão','S.Luzia','Zé Pereira','Marly','Nasser','P.Lagoa'] },
  { nome: 'Setor C2', tipo: 'CAPITAL', congregacoes: ['Imã','Popular','Serradinho','AI','Carioca','A II','Inápolis','S.Monica'] },
  { nome: 'Setor D', tipo: 'CAPITAL', congregacoes: ['Centenário','A.R.1','A.R.4','I.Coelho','Hortencias','Guanandy2','Parati','N.Esperança','A.Rancho','T.Neves'] },
  { nome: 'Setor E', tipo: 'CAPITAL', congregacoes: ['M.Roberto','J.Paulista','Piratininga','V.Boas','P.Dallas','Tiradentes'] },
  { nome: 'Setor F', tipo: 'CAPITAL', congregacoes: ['B.Jardim','Caiçara','Tijuca 2','Jacy','R.Alegre','Guanandy','S.Emilia','S.Conrado','S.J.da Lagoa','União'] },
  { nome: 'Setor G', tipo: 'CAPITAL', congregacoes: ['Taruma','Caioba I','Caioba II','Penfigo','Laranjeiras','Lageado','Sabia','Colorado','P.do Sol','A.Rancho 7'] },
  { nome: 'Setor H', tipo: 'CAPITAL', congregacoes: ['Sta Fé','M.Castelo','M.Jacinto','Montevideo','E.Dalva','Taquaral','Cruzeiro','Catarina','Margarida','N.Bahia'] },
  { nome: 'Setor I', tipo: 'CAPITAL', congregacoes: ['Matriz'] },
  { nome: 'Setor J', tipo: 'CAPITAL', congregacoes: ['Pioneira','Cohab','C.Oeste','Uirapuru','Macaubas','J.Nações','V.Martins','Guaicurus','Balsamo','Los Angeles'] },
  { nome: 'Setor M', tipo: 'CAPITAL', congregacoes: ['N.Lima 1','N.Lima 2','Columbia','V.Nova','Anache','Matel'] },
  { nome: 'Setor N', tipo: 'CAPITAL', congregacoes: ['Pedrossian','R.Vieira','C.Redentor','Noroeste','E.Parque','Leon','Panorama','N.Serrana'] },
];

const INTERIOR = ['Camapuã','Três Lagoas','Sidrolândia','Terenos','Aquidauana','Dourados','Ponta Porã','Ribas','São Gabriel','Rio Verde'];

const BASES = [
  { nome: 'Base Moçambique', cidade: 'Maputo', estado: 'Moçambique', responsavelNome: 'Rev. Samuel Chirwa' },
  { nome: 'Base Peru', cidade: 'Lima', estado: 'Peru', responsavelNome: 'Rev. José Gutierrez' },
  { nome: 'Base Timor-Leste', cidade: 'Díli', estado: 'Timor-Leste', responsavelNome: 'Rev. Francisco Sousa' },
  { nome: 'Base Nordeste Brasil', cidade: 'Recife', estado: 'PE', responsavelNome: 'Pr. Antônio Barros' },
];

const PROMOTORES = [
  'Roberto Santos','Fernanda Costa','Marcelo Oliveira','Patrícia Rocha','Anderson Pereira',
  'Cláudia Mendes','Thiago Barbosa','Simone Cavalcante','Rodrigo Figueiredo','Luciana Carvalho',
  'Eduardo Nascimento','Vanessa Teixeira','Fábio Monteiro',
];

const SECRETARIOS = [
  'Gabriel Vieira','Juliana Pinto','Leonardo Azevedo','Camila Ribeiro','Rafael Guimarães',
  'Tatiana Moreira','Bruno Cardoso','Amanda Lopes','Henrique Silveira','Priscila Cunha',
  'Vinícius Martins','Letícia Corrêa','Alexandre Gomes',
];

// Jan/Fev 2026 offerings
const OFERTAS_JAN_FEV = {
  'A.Pereira':    { jan: 1250.00, fev: 1380.00 },
  'C.Verde':      { jan: 480.00,  fev: 520.00 },
  'C.Morena':     { jan: 360.00,  fev: 390.00 },
  'Albuquerque':  { jan: 720.00,  fev: 680.00 },
  'Itamaraca':    { jan: 540.00,  fev: 510.00 },
  'Moema':        { jan: 890.00,  fev: 920.00 },
  'Sta Felicidade':{ jan: 430.00, fev: 460.00 },
  'MR4':          { jan: 310.00,  fev: 290.00 },
  'Universitario':{ jan: 650.00,  fev: 700.00 },
  'MR3':          { jan: 280.00,  fev: 300.00 },
  'C.Belo':       { jan: 1100.00, fev: 980.00 },
  'N.Lima 3':     { jan: 420.00,  fev: 450.00 },
  'I.Garden':     { jan: 560.00,  fev: 530.00 },
  'At.Sul':       { jan: 380.00,  fev: 410.00 },
  'Imperial':     { jan: 750.00,  fev: 780.00 },
  'S.Amaro':      { jan: 640.00,  fev: 610.00 },
  'S.Carmelia':   { jan: 480.00,  fev: 500.00 },
  'José Abrão':   { jan: 390.00,  fev: 420.00 },
  'S.Luzia':      { jan: 520.00,  fev: 490.00 },
  'Zé Pereira':   { jan: 300.00,  fev: 320.00 },
  'Marly':        { jan: 410.00,  fev: 440.00 },
  'Nasser':       { jan: 350.00,  fev: 380.00 },
  'P.Lagoa':      { jan: 460.00,  fev: 430.00 },
  'Imã':          { jan: 580.00,  fev: 560.00 },
  'Popular':      { jan: 720.00,  fev: 750.00 },
  'Serradinho':   { jan: 340.00,  fev: 360.00 },
  'AI':           { jan: 480.00,  fev: 500.00 },
  'Carioca':      { jan: 390.00,  fev: 410.00 },
  'A II':         { jan: 520.00,  fev: 490.00 },
  'Inápolis':     { jan: 290.00,  fev: 310.00 },
  'S.Monica':     { jan: 650.00,  fev: 680.00 },
  'Centenário':   { jan: 1800.00, fev: 1950.00 },
  'A.R.1':        { jan: 430.00,  fev: 460.00 },
  'A.R.4':        { jan: 380.00,  fev: 400.00 },
  'I.Coelho':     { jan: 520.00,  fev: 550.00 },
  'Hortencias':   { jan: 360.00,  fev: 390.00 },
  'Guanandy2':    { jan: 490.00,  fev: 470.00 },
  'Parati':       { jan: 310.00,  fev: 330.00 },
  'N.Esperança':  { jan: 420.00,  fev: 440.00 },
  'A.Rancho':     { jan: 280.00,  fev: 300.00 },
  'T.Neves':      { jan: 540.00,  fev: 560.00 },
  'M.Roberto':    { jan: 680.00,  fev: 720.00 },
  'J.Paulista':   { jan: 540.00,  fev: 560.00 },
  'Piratininga':  { jan: 390.00,  fev: 410.00 },
  'V.Boas':       { jan: 470.00,  fev: 500.00 },
  'P.Dallas':     { jan: 580.00,  fev: 550.00 },
  'Tiradentes':   { jan: 320.00,  fev: 350.00 },
  'B.Jardim':     { jan: 920.00,  fev: 980.00 },
  'Caiçara':      { jan: 540.00,  fev: 560.00 },
  'Tijuca 2':     { jan: 480.00,  fev: 510.00 },
  'Jacy':         { jan: 360.00,  fev: 380.00 },
  'R.Alegre':     { jan: 420.00,  fev: 440.00 },
  'Guanandy':     { jan: 650.00,  fev: 630.00 },
  'S.Emilia':     { jan: 380.00,  fev: 400.00 },
  'S.Conrado':    { jan: 510.00,  fev: 530.00 },
  'S.J.da Lagoa': { jan: 290.00,  fev: 310.00 },
  'União':        { jan: 470.00,  fev: 490.00 },
  'Taruma':       { jan: 760.00,  fev: 800.00 },
  'Caioba I':     { jan: 540.00,  fev: 560.00 },
  'Caioba II':    { jan: 480.00,  fev: 510.00 },
  'Penfigo':      { jan: 620.00,  fev: 640.00 },
  'Laranjeiras':  { jan: 390.00,  fev: 410.00 },
  'Lageado':      { jan: 330.00,  fev: 350.00 },
  'Sabia':        { jan: 420.00,  fev: 440.00 },
  'Colorado':     { jan: 360.00,  fev: 380.00 },
  'P.do Sol':     { jan: 500.00,  fev: 520.00 },
  'A.Rancho 7':   { jan: 280.00,  fev: 300.00 },
  'Sta Fé':       { jan: 840.00,  fev: 880.00 },
  'M.Castelo':    { jan: 560.00,  fev: 590.00 },
  'M.Jacinto':    { jan: 420.00,  fev: 450.00 },
  'Montevideo':   { jan: 680.00,  fev: 710.00 },
  'E.Dalva':      { jan: 380.00,  fev: 400.00 },
  'Taquaral':     { jan: 530.00,  fev: 550.00 },
  'Cruzeiro':     { jan: 460.00,  fev: 480.00 },
  'Catarina':     { jan: 310.00,  fev: 330.00 },
  'Margarida':    { jan: 490.00,  fev: 510.00 },
  'N.Bahia':      { jan: 370.00,  fev: 390.00 },
  'Matriz':       { jan: 2200.00, fev: 2400.00 },
  'Pioneira':     { jan: 780.00,  fev: 820.00 },
  'Cohab':        { jan: 560.00,  fev: 590.00 },
  'C.Oeste':      { jan: 420.00,  fev: 450.00 },
  'Uirapuru':     { jan: 340.00,  fev: 360.00 },
  'Macaubas':     { jan: 490.00,  fev: 510.00 },
  'J.Nações':     { jan: 380.00,  fev: 400.00 },
  'V.Martins':    { jan: 620.00,  fev: 640.00 },
  'Guaicurus':    { jan: 460.00,  fev: 480.00 },
  'Balsamo':      { jan: 300.00,  fev: 320.00 },
  'Los Angeles':  { jan: 540.00,  fev: 560.00 },
  'N.Lima 1':     { jan: 520.00,  fev: 550.00 },
  'N.Lima 2':     { jan: 480.00,  fev: 500.00 },
  'Columbia':     { jan: 360.00,  fev: 380.00 },
  'V.Nova':       { jan: 430.00,  fev: 450.00 },
  'Anache':       { jan: 290.00,  fev: 310.00 },
  'Matel':        { jan: 350.00,  fev: 370.00 },
  'Pedrossian':   { jan: 640.00,  fev: 680.00 },
  'R.Vieira':     { jan: 480.00,  fev: 510.00 },
  'C.Redentor':   { jan: 560.00,  fev: 590.00 },
  'Noroeste':     { jan: 420.00,  fev: 440.00 },
  'E.Parque':     { jan: 380.00,  fev: 400.00 },
  'Leon':         { jan: 340.00,  fev: 360.00 },
  'Panorama':     { jan: 460.00,  fev: 480.00 },
  'N.Serrana':    { jan: 310.00,  fev: 330.00 },
  'Camapuã':      { jan: 180.00,  fev: 200.00 },
  'Três Lagoas':  { jan: 260.00,  fev: 280.00 },
  'Sidrolândia':  { jan: 150.00,  fev: 170.00 },
  'Terenos':      { jan: 120.00,  fev: 140.00 },
  'Aquidauana':   { jan: 140.00,  fev: 160.00 },
  'Dourados':     { jan: 320.00,  fev: 350.00 },
  'Ponta Porã':   { jan: 210.00,  fev: 230.00 },
  'Ribas':        { jan: 130.00,  fev: 150.00 },
  'São Gabriel':  { jan: 110.00,  fev: 130.00 },
  'Rio Verde':    { jan: 160.00,  fev: 180.00 },
};

async function main() {
  console.log('Iniciando seed principal...');

  // Bases Missionárias
  const bases = {};
  for (const b of BASES) {
    const base = await prisma.baseMissionaria.upsert({
      where: { id: (await prisma.baseMissionaria.findFirst({ where: { nome: b.nome } }))?.id || 0 },
      update: b,
      create: b,
    });
    bases[b.nome] = base;
  }
  console.log('Bases criadas:', Object.keys(bases).length);

  // Setores e Congregações
  const setorMap = {};
  const congregacaoMap = {};

  for (const s of SETORES) {
    const setor = await prisma.setor.upsert({
      where: { nome: s.nome },
      update: { tipo: s.tipo },
      create: { nome: s.nome, tipo: s.tipo },
    });
    setorMap[s.nome] = setor;

    for (const nomeCong of s.congregacoes) {
      const cong = await prisma.congregacao.upsert({
        where: { nome_setorId: { nome: nomeCong, setorId: setor.id } },
        update: { tipo: 'CAPITAL' },
        create: { nome: nomeCong, setorId: setor.id, tipo: 'CAPITAL' },
      });
      congregacaoMap[nomeCong] = cong;
    }
  }

  // Interior
  for (const nomeCong of INTERIOR) {
    const existing = await prisma.congregacao.findFirst({ where: { nome: nomeCong, setorId: null } });
    let cong;
    if (existing) {
      cong = existing;
    } else {
      cong = await prisma.congregacao.create({ data: { nome: nomeCong, tipo: 'INTERIOR', setorId: null } });
    }
    congregacaoMap[nomeCong] = cong;
  }

  console.log('Setores criados:', Object.keys(setorMap).length);
  console.log('Congregações criadas:', Object.keys(congregacaoMap).length);

  // Missionários
  const pessoaJoao = await prisma.pessoa.upsert({
    where: { cpf: '111.111.111-01' },
    update: {},
    create: { nome: 'João Carlos da Silva', cpf: '111.111.111-01', sexo: 'M' },
  });
  const missJoao = await prisma.missionario.upsert({
    where: { pessoaId: pessoaJoao.id },
    update: {},
    create: {
      pessoaId: pessoaJoao.id,
      campoMissionario: 'Moçambique África',
      dataEnvio: new Date('2018-03-15'),
      status: 'ATIVO',
      baseMissionariaId: bases['Base Moçambique'].id,
    },
  });

  const pessoaMaria = await prisma.pessoa.upsert({
    where: { cpf: '222.222.222-02' },
    update: {},
    create: { nome: 'Maria Helena Souza', cpf: '222.222.222-02', sexo: 'F' },
  });
  await prisma.missionario.upsert({
    where: { pessoaId: pessoaMaria.id },
    update: {},
    create: {
      pessoaId: pessoaMaria.id,
      campoMissionario: 'Peru América do Sul',
      dataEnvio: new Date('2019-06-20'),
      status: 'ATIVO',
      baseMissionariaId: bases['Base Peru'].id,
    },
  });

  const pessoaPedro = await prisma.pessoa.upsert({
    where: { cpf: '333.333.333-03' },
    update: {},
    create: { nome: 'Pedro Almeida Neto', cpf: '333.333.333-03', sexo: 'M' },
  });
  await prisma.missionario.upsert({
    where: { pessoaId: pessoaPedro.id },
    update: {},
    create: {
      pessoaId: pessoaPedro.id,
      campoMissionario: 'Timor-Leste Ásia',
      dataEnvio: new Date('2020-01-10'),
      status: 'ATIVO',
      baseMissionariaId: bases['Base Timor-Leste'].id,
      coordenadorId: missJoao.id,
    },
  });

  const pessoaAna = await prisma.pessoa.upsert({
    where: { cpf: '444.444.444-04' },
    update: {},
    create: { nome: 'Ana Paula Ferreira', cpf: '444.444.444-04', sexo: 'F' },
  });
  await prisma.missionario.upsert({
    where: { pessoaId: pessoaAna.id },
    update: {},
    create: {
      pessoaId: pessoaAna.id,
      campoMissionario: 'Nordeste do Brasil',
      dataEnvio: new Date('2021-08-05'),
      status: 'AFASTADO',
      baseMissionariaId: bases['Base Nordeste Brasil'].id,
      coordenadorId: missJoao.id,
    },
  });

  const pessoaCarlos = await prisma.pessoa.upsert({
    where: { cpf: '555.555.555-05' },
    update: {},
    create: { nome: 'Carlos Eduardo Lima', cpf: '555.555.555-05', sexo: 'M' },
  });
  await prisma.missionario.upsert({
    where: { pessoaId: pessoaCarlos.id },
    update: {},
    create: {
      pessoaId: pessoaCarlos.id,
      campoMissionario: 'Bolívia',
      dataEnvio: new Date('2017-11-01'),
      status: 'INATIVO',
    },
  });

  // Dependentes de João
  const depRosana = await prisma.pessoa.upsert({
    where: { cpf: '111.111.111-11' },
    update: {},
    create: { nome: 'Rosana da Silva', cpf: '111.111.111-11', sexo: 'F' },
  });
  const depLucas = await prisma.pessoa.upsert({
    where: { cpf: '111.111.111-12' },
    update: {},
    create: { nome: 'Lucas da Silva', cpf: '111.111.111-12', sexo: 'M' },
  });
  const existDepRosana = await prisma.dependente.findFirst({ where: { missionarioId: missJoao.id, pessoaId: depRosana.id } });
  if (!existDepRosana) await prisma.dependente.create({ data: { missionarioId: missJoao.id, pessoaId: depRosana.id, parentesco: 'Cônjuge' } });
  const existDepLucas = await prisma.dependente.findFirst({ where: { missionarioId: missJoao.id, pessoaId: depLucas.id } });
  if (!existDepLucas) await prisma.dependente.create({ data: { missionarioId: missJoao.id, pessoaId: depLucas.id, parentesco: 'Filho' } });

  // Dependentes de Maria
  const missMaria = await prisma.missionario.findUnique({ where: { pessoaId: pessoaMaria.id } });
  const depPaulo = await prisma.pessoa.upsert({
    where: { cpf: '222.222.222-21' },
    update: {},
    create: { nome: 'Paulo Souza', cpf: '222.222.222-21', sexo: 'M' },
  });
  const existDepPaulo = await prisma.dependente.findFirst({ where: { missionarioId: missMaria.id, pessoaId: depPaulo.id } });
  if (!existDepPaulo) await prisma.dependente.create({ data: { missionarioId: missMaria.id, pessoaId: depPaulo.id, parentesco: 'Cônjuge' } });

  // Dependentes de Pedro
  const missPedro = await prisma.missionario.findUnique({ where: { pessoaId: pessoaPedro.id } });
  const depSandra = await prisma.pessoa.upsert({
    where: { cpf: '333.333.333-31' },
    update: {},
    create: { nome: 'Sandra Almeida', cpf: '333.333.333-31', sexo: 'F' },
  });
  const depSofia = await prisma.pessoa.upsert({
    where: { cpf: '333.333.333-32' },
    update: {},
    create: { nome: 'Sofia Almeida', cpf: '333.333.333-32', sexo: 'F' },
  });
  const existDepSandra = await prisma.dependente.findFirst({ where: { missionarioId: missPedro.id, pessoaId: depSandra.id } });
  if (!existDepSandra) await prisma.dependente.create({ data: { missionarioId: missPedro.id, pessoaId: depSandra.id, parentesco: 'Cônjuge' } });
  const existDepSofia = await prisma.dependente.findFirst({ where: { missionarioId: missPedro.id, pessoaId: depSofia.id } });
  if (!existDepSofia) await prisma.dependente.create({ data: { missionarioId: missPedro.id, pessoaId: depSofia.id, parentesco: 'Filha' } });

  console.log('Missionários e dependentes criados');

  // Promotores
  for (let i = 0; i < SETORES.length; i++) {
    const nomePromotor = PROMOTORES[i];
    const setor = setorMap[SETORES[i].nome];
    if (!nomePromotor || !setor) continue;
    const cpf = `600.${String(i + 1).padStart(3, '0')}.000-01`;
    const pessoa = await prisma.pessoa.upsert({
      where: { cpf },
      update: {},
      create: { nome: nomePromotor, cpf },
    });
    const existPromotor = await prisma.promotorMissoes.findUnique({ where: { pessoaId: pessoa.id } });
    if (!existPromotor) {
      await prisma.promotorMissoes.create({ data: { pessoaId: pessoa.id, setorId: setor.id } });
    }
  }
  console.log('Promotores criados');

  // Secretários
  for (let i = 0; i < SETORES.length; i++) {
    const nomeSecretario = SECRETARIOS[i];
    const setor = setorMap[SETORES[i].nome];
    if (!nomeSecretario || !setor) continue;
    const cpf = `700.${String(i + 1).padStart(3, '0')}.000-01`;
    const pessoa = await prisma.pessoa.upsert({
      where: { cpf },
      update: {},
      create: { nome: nomeSecretario, cpf },
    });
    const existSecretario = await prisma.secretarioMissoes.findUnique({ where: { pessoaId: pessoa.id } });
    if (!existSecretario) {
      await prisma.secretarioMissoes.create({ data: { pessoaId: pessoa.id, setorId: setor.id } });
    }
  }
  console.log('Secretários criados');

  // Ofertas Jan e Fev 2026
  let ofertasCount = 0;
  for (const [nomeCong, valores] of Object.entries(OFERTAS_JAN_FEV)) {
    const cong = congregacaoMap[nomeCong];
    if (!cong) { console.warn(`Congregação não encontrada: ${nomeCong}`); continue; }

    await prisma.ofertaMissionaria.upsert({
      where: { congregacaoId_mesReferencia_anoReferencia: { congregacaoId: cong.id, mesReferencia: 1, anoReferencia: 2026 } },
      update: { valor: valores.jan },
      create: { congregacaoId: cong.id, mesReferencia: 1, anoReferencia: 2026, valor: valores.jan },
    });
    await prisma.ofertaMissionaria.upsert({
      where: { congregacaoId_mesReferencia_anoReferencia: { congregacaoId: cong.id, mesReferencia: 2, anoReferencia: 2026 } },
      update: { valor: valores.fev },
      create: { congregacaoId: cong.id, mesReferencia: 2, anoReferencia: 2026, valor: valores.fev },
    });
    ofertasCount += 2;
  }
  console.log(`Ofertas Jan/Fev 2026 inseridas: ${ofertasCount}`);
  console.log('Seed principal concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
