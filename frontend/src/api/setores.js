import api from './client';
export const setoresApi = {
  listar:      (p) => api.get('/setores', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/setores/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/setores', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/setores/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/setores/${id}`).then(r => r.data),
};
