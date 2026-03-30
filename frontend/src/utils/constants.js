export const MESES = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
          'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][i],
}));

export const ANOS = Array.from({ length: 6 }, (_, i) => {
  const ano = new Date().getFullYear() - 2 + i;
  return { value: ano, label: String(ano) };
});

export const STATUS_MISSIONARIO = [
  { value: 'ATIVO',    label: 'Ativo',    cor: 'green' },
  { value: 'INATIVO',  label: 'Inativo',  cor: 'red'   },
  { value: 'AFASTADO', label: 'Afastado', cor: 'yellow' },
];

export const PARENTESCOS = [
  { value: 'CONJUGE', label: 'Cônjuge' },
  { value: 'FILHO',   label: 'Filho'   },
  { value: 'FILHA',   label: 'Filha'   },
  { value: 'OUTRO',   label: 'Outro'   },
];

export const TIPOS_LOCAL = [
  { value: 'CAPITAL',  label: 'Capital'  },
  { value: 'INTERIOR', label: 'Interior' },
];

export const ESTADOS_CIVIS = [
  { value: 'SOLTEIRO',       label: 'Solteiro(a)'   },
  { value: 'CASADO',         label: 'Casado(a)'     },
  { value: 'VIUVO',          label: 'Viúvo(a)'      },
  { value: 'DIVORCIADO',     label: 'Divorciado(a)' },
  { value: 'UNIAO_ESTAVEL',  label: 'União Estável' },
];

export const SEXOS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino'  },
];

export const GRAUS_INSTRUCAO = [
  'Fundamental Incompleto','Fundamental Completo',
  'Médio Incompleto','Médio Completo',
  'Superior Incompleto','Superior Completo','Pós-graduação',
].map((l) => ({ value: l, label: l }));

export const TIPOS_SANGUINEOS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
  .map((v) => ({ value: v, label: v }));
