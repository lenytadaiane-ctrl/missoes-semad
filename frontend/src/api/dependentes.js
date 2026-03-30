import api from './client';
export const dependentesApi = {
  criar:    (d)  => api.post('/dependentes', d).then(r => r.data),
  atualizar:(id, d) => api.put(`/dependentes/${id}`, d).then(r => r.data),
  remover:  (id) => api.delete(`/dependentes/${id}`).then(r => r.data),
};
