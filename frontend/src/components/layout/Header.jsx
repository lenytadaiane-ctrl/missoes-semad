import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <button onClick={onMenuToggle} className="lg:hidden p-2 rounded text-gray-500 hover:bg-gray-100">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="hidden lg:block text-sm font-medium text-gray-600">
        Sistema de Gestão — Departamento de Missões IEADMS
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-sm text-gray-600 hidden sm:block">
          Olá, <span className="font-semibold">{user}</span>
        </span>
        <Button variant="secondary" onClick={logout}>Sair</Button>
      </div>
    </header>
  );
}
