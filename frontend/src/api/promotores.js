import api from './client';
export const promotoresApi = {
  listar:      (p) => api.get('/promotores-missoes', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/promotores-missoes/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/promotores-missoes', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/promotores-missoes/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/promotores-missoes/${id}`).then(r => r.data),
};
