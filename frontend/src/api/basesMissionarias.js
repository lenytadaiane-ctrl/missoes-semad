import api from './client';
export const basesApi = {
  listar:      (p) => api.get('/bases-missionarias', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/bases-missionarias/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/bases-missionarias', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/bases-missionarias/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/bases-missionarias/${id}`).then(r => r.data),
};
