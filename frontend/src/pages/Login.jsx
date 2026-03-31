import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(usuario, senha);
      login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header com logo */}
          <div className="bg-slate-700 px-8 py-8 flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo SEMAD-IEADMS"
              className="h-20 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="text-center">
              <h1 className="text-white font-bold text-xl tracking-wide">SEMAD-IEADMS</h1>
              <p className="text-slate-400 text-sm mt-0.5">Departamento de Missões</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Usuário
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600
                           text-white placeholder-slate-400 focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Digite seu usuário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600
                           text-white placeholder-slate-400 focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Digite sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800
                         disabled:cursor-not-allowed text-white font-semibold rounded-lg
                         transition-colors text-sm mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Depto. de Missões © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
