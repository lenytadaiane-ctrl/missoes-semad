import axios from 'axios';

// Em produção (Vercel), VITE_API_URL é a URL completa do backend Railway + /api.
// Em desenvolvimento, usa /api e o proxy do Vite resolve para localhost:3001.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
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
