const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const STATUS_MISSIONARIO = ['ATIVO', 'INATIVO', 'AFASTADO'];
const PARENTESCOS = ['CONJUGE', 'FILHO', 'FILHA', 'OUTRO'];
const TIPOS_LOCAL = ['CAPITAL', 'INTERIOR'];

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
}

module.exports = { MESES_NOMES, MESES_ABREV, STATUS_MISSIONARIO, PARENTESCOS, TIPOS_LOCAL, formatarMoeda, formatarData };
