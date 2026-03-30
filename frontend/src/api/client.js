import axios from 'axios';

// Em produção (Vercel), VITE_API_URL aponta para o backend no Railway.
// Em desenvolvimento, fica vazio e o proxy do Vite resolve para localhost:3001.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Interceptor de resposta para tratar erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Erro inesperado. Tente novamente.';

    // Retorna o erro enriquecido com a mensagem legível
    return Promise.reject(new Error(msg));
  }
);

export default api;
