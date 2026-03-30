import api from './client';
export const rankingApi = {
  congregacoes: (p) => api.get('/ranking/congregacoes', { params: p }).then(r => r.data),
  setores:      (p) => api.get('/ranking/setores', { params: p }).then(r => r.data),
};
