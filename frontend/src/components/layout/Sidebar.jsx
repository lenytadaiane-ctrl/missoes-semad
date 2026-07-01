import { NavLink } from 'react-router-dom';

const navGroups = [
  {
    label: null,
    items: [{ to: '/dashboard', label: 'Dashboard', icon: '📊' }],
  },
  {
    label: 'Missionários',
    items: [
      { to: '/missionarios', label: 'Missionários', icon: '✈️' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/bases-missionarias', label: 'Bases Missionárias', icon: '🌍' },
      { to: '/setores', label: 'Setores', icon: '🗂️' },
      { to: '/congregacoes', label: 'Congregações', icon: '⛪' },
      { to: '/promotores', label: 'Promotores', icon: '👤' },
      { to: '/agentes', label: 'Agentes', icon: '👥' },
      { to: '/secretarios', label: 'Secretários', icon: '📋' },
    ],
  },
  {
    label: 'Financeiro',
    items: [{ to: '/financeiro', label: 'Ofertas Missionárias', icon: '💰' }],
  },
  {
    label: 'Ranking',
    items: [
      { to: '/ranking/setores', label: 'Por Setor', icon: '🏆' },
      { to: '/ranking/congregacoes', label: 'Por Congregação', icon: '🥇' },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { to: '/relatorios/missionarios', label: 'Missionários', icon: '📄' },
      { to: '/relatorios/bases', label: 'Bases', icon: '📄' },
      { to: '/relatorios/promotores', label: 'Promotores', icon: '📄' },
      { to: '/relatorios/secretarios', label: 'Secretários', icon: '📄' },
      { to: '/relatorios/financeiro', label: 'Financeiro', icon: '📄' },
    ],
  },
  {
    label: 'Sistema',
    items: [{ to: '/configuracoes', label: 'Configurações', icon: '⚙️' }],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-primary-900 text-white z-30 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-primary-700">
          <span className="font-bold text-lg leading-tight">SEMAD IEADMS</span>
        </div>
        <nav className="overflow-y-auto h-[calc(100%-4rem)] py-3">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-2">
              {group.label && (
                <p className="px-5 py-1 text-xs font-semibold text-primary-300 uppercase tracking-wider">{group.label}</p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                      isActive ? 'bg-primary-700 text-white font-medium' : 'text-primary-100 hover:bg-primary-800'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
