import api from './client';
export const secretariosApi = {
  listar:      (p) => api.get('/secretarios-missoes', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/secretarios-missoes/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/secretarios-missoes', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/secretarios-missoes/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/secretarios-missoes/${id}`).then(r => r.data),
};
