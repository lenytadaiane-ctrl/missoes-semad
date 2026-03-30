import api from './client';
export const dashboardApi = {
  get:          ()    => api.get('/dashboard').then(r => r.data),
  graficos:     (ano) => api.get('/dashboard/graficos', { params: { ano } }).then(r => r.data),
  entradaAnual: ()    => api.get('/dashboard/entrada-anual').then(r => r.data),
};
