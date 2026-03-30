import api from './client';

async function downloadPDF(url, filename, params = {}) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href; a.download = filename; a.click();
  URL.revokeObjectURL(href);
}

export const relatoriosApi = {
  getMissionarios:    (p) => api.get('/relatorios/missionarios', { params: p }).then(r => r.data),
  getBases:           ()  => api.get('/relatorios/bases-missionarias').then(r => r.data),
  getPromotores:      (p) => api.get('/relatorios/promotores', { params: p }).then(r => r.data),
  getSecretarios:     ()  => api.get('/relatorios/secretarios').then(r => r.data),
  getFinanceiro:      (p) => api.get('/relatorios/financeiro', { params: p }).then(r => r.data),

  pdfMissionarios:    (p) => downloadPDF('/relatorios/missionarios/pdf', 'missionarios.pdf', p),
  pdfBases:           ()  => downloadPDF('/relatorios/bases-missionarias/pdf', 'bases.pdf'),
  pdfPromotores:      (p) => downloadPDF('/relatorios/promotores/pdf', 'promotores.pdf', p),
  pdfSecretarios:     ()  => downloadPDF('/relatorios/secretarios/pdf', 'secretarios.pdf'),
  pdfFinanceiro:      (p) => downloadPDF('/relatorios/financeiro/pdf', `financeiro-${p.tipo || 'capital'}.pdf`, p),
};
