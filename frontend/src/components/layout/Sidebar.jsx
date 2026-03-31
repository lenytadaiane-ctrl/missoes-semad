import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ── Ícones simples em SVG inline ─────────────────────────────────────────────
function Icon({ path, className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  missionario:  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  cadastros:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  financeiro:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  ranking:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  relatorio:    'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  chevronDown:  'M19 9l-7 7-7-7',
  chevronRight: 'M9 5l7 7-7 7',
  church:       'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users:        'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  base:         'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  logout:       'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

// ── Estrutura do menu ─────────────────────────────────────────────────────────
const menuGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
      { label: 'Missionários', to: '/missionarios', icon: 'missionario' },
    ],
  },
  {
    label: 'Cadastros',
    icon: 'cadastros',
    collapsible: true,
    items: [
      { label: 'Bases Missionárias', to: '/bases-missionarias', icon: 'base' },
      { label: 'Promotores', to: '/promotores', icon: 'missionario' },
      { label: 'Agentes', to: '/agentes', icon: 'users' },
      { label: 'Secretários', to: '/secretarios', icon: 'users' },
      { label: 'Setores', to: '/setores', icon: 'church' },
      { label: 'Congregações', to: '/congregacoes', icon: 'church' },
    ],
  },
  {
    label: 'Financeiro',
    icon: 'financeiro',
    collapsible: true,
    items: [
      { label: 'Lançamento de Ofertas', to: '/financeiro', icon: 'financeiro' },
    ],
  },
  {
    label: 'Ranking',
    icon: 'ranking',
    collapsible: true,
    items: [
      { label: 'Ranking de Setores', to: '/ranking/setores', icon: 'ranking' },
      { label: 'Ranking de Congregações', to: '/ranking/congregacoes', icon: 'ranking' },
    ],
  },
  {
    label: 'Relatórios',
    icon: 'relatorio',
    collapsible: true,
    items: [
      { label: 'Missionários e Família', to: '/relatorios/missionarios', icon: 'relatorio' },
      { label: 'Bases Missionárias', to: '/relatorios/bases', icon: 'relatorio' },
      { label: 'Secretários por Setor', to: '/relatorios/secretarios', icon: 'relatorio' },
      { label: 'Promotores de Missões', to: '/relatorios/promotores', icon: 'relatorio' },
      { label: 'Financeiro Geral', to: '/relatorios/financeiro', icon: 'relatorio' },
    ],
  },
];

// ── Componente de item de menu ────────────────────────────────────────────────
function MenuItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-blue-700 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`
      }
    >
      <Icon path={ICONS[item.icon]} className="w-4 h-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

// ── Componente de grupo colapsável ────────────────────────────────────────────
function MenuGroup({ group }) {
  const location = useLocation();
  const hasActive = group.items.some((item) => location.pathname.startsWith(item.to));
  const [open, setOpen] = useState(hasActive || !group.collapsible);

  if (!group.collapsible) {
    return (
      <div className="space-y-0.5">
        <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {group.label}
        </p>
        {group.items.map((item) => (
          <MenuItem key={item.to} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold
                   text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-3">
          <Icon path={ICONS[group.icon]} className="w-4 h-4 shrink-0" />
          {group.label}
        </span>
        <Icon
          path={open ? ICONS.chevronDown : ICONS.chevronRight}
          className="w-4 h-4 shrink-0"
        />
      </button>

      {open && (
        <div className="pl-3 space-y-0.5 border-l border-slate-700 ml-4">
          {group.items.map((item) => (
            <MenuItem key={item.to} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="w-64 bg-slate-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-700 flex flex-col items-center gap-2">
        <img
          src="/logo.png"
          alt="Logo SEMAD-IEADMS"
          className="max-h-16 w-auto object-contain"
        />
        <span className="text-white font-semibold text-sm tracking-wide">
          SEMAD-IEADMS
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuGroups.map((group) => (
          <MenuGroup key={group.label} group={group} />
        ))}
      </nav>

      {/* Usuário + Logout */}
      <div className="px-4 py-3 border-t border-slate-700 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user}</p>
            <p className={`text-xs font-medium ${role === 'MASTER' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {role === 'MASTER' ? 'Administrador' : 'Visualizador'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded"
          >
            <Icon path={ICONS.logout} className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Depto. de Missões © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
