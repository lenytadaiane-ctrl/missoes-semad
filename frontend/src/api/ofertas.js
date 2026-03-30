import api from './client';
export const ofertasApi = {
  listar:      (p) => api.get('/ofertas-missionarias', { params: p }).then(r => r.data),
  resumo:      (p) => api.get('/ofertas-missionarias/resumo', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/ofertas-missionarias/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/ofertas-missionarias', d).then(r => r.data),
  atualizar:   (id, d) => api.put(`/ofertas-missionarias/${id}`, d).then(r => r.data),
  remover:     (id) => api.delete(`/ofertas-missionarias/${id}`).then(r => r.data),
};
