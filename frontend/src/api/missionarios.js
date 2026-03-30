import api from './client';

function toFormData(data) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') fd.append(k, v);
  });
  return fd;
}

export const missionariosApi = {
  listar:      (p) => api.get('/missionarios', { params: p }).then(r => r.data),
  buscarPorId: (id) => api.get(`/missionarios/${id}`).then(r => r.data),
  criar:       (d)  => api.post('/missionarios', toFormData(d), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  atualizar:   (id, d) => api.put(`/missionarios/${id}`, toFormData(d), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  remover:     (id) => api.delete(`/missionarios/${id}`).then(r => r.data),
};
