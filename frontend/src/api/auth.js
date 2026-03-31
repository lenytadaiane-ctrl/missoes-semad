import api from './client';

export const authApi = {
  login: (usuario, senha) =>
    api.post('/auth/login', { usuario, senha }).then((r) => r.data),
};
