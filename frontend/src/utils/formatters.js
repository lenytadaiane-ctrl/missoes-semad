export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatarDataHora(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR');
}

export function nomeMes(numero) {
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return nomes[(numero - 1)] ?? '';
}

export function abrevMes(numero) {
  const abrevs = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return abrevs[(numero - 1)] ?? '';
}
