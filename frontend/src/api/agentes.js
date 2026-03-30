import api from './client';
export const agentesApi = {
  listar:      (p) => api.get('/agentes-missoes', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/agentes-missoes/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/agentes-missoes', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/agentes-missoes/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/agentes-missoes/${id}`).then(r => r.data),
};
