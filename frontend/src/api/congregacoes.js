import api from './client';
export const congregacoesApi = {
  listar:      (p) => api.get('/congregacoes', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/congregacoes/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/congregacoes', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/congregacoes/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/congregacoes/${id}`).then(r => r.data),
};
