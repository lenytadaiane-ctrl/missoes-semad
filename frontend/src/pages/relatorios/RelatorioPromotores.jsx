import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import SortTh from '../../components/ui/SortTh';
import { useSortable } from '../../hooks/useSortable';

function Avatar({ foto, nome }) {
  if (foto) return <img src={`/${foto}`} alt={nome} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
      {nome?.charAt(0) || '?'}
    </div>
  );
}

export default function RelatorioPromotores() {
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [mostrarFoto, setMostrarFoto] = useState(true);

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['rel-promotores'],
    queryFn: () => api.get('/promotores-missoes').then(r => r.data),
  });
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });

  const filtrado = useMemo(() => {
    let d = raw;
    if (filtroSetor) d = d.filter(p => String(p.setorId) === filtroSetor);
    if (filtroBusca) d = d.filter(p => p.pessoa?.nome?.toLowerCase().includes(filtroBusca.toLowerCase()));
    return d;
  }, [raw, filtroSetor, filtroBusca]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtrado, 'pessoa.nome');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Promotores de Missões</h1>
        <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" placeholder="Buscar por nome..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer border border-gray-300 rounded-lg px-3 py-2">
          <input type="checkbox" checked={mostrarFoto} onChange={e => setMostrarFoto(e.target.checked)} className="accent-blue-600" />
          Mostrar foto
        </label>
      </div>

      <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        Total: <strong>{sorted.length}</strong> promotor(es)
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {mostrarFoto && <th className="px-4 py-3 w-12" />}
              <SortTh label="Nome" sortKey="pessoa.nome" {...thProps} />
              <SortTh label="Setor" sortKey="setor.nome" {...thProps} />
              <SortTh label="Telefone" sortKey="pessoa.telefone" {...thProps} />
              <SortTh label="E-mail" sortKey="pessoa.email" {...thProps} />
              <SortTh label="CPF" sortKey="pessoa.cpf" {...thProps} />
              <SortTh label="Cidade" sortKey="pessoa.cidade" {...thProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : sorted.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 align-middle">
                {mostrarFoto && <td className="px-3 py-2"><Avatar foto={p.pessoa?.foto} nome={p.pessoa?.nome} /></td>}
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.pessoa?.nome}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.setor?.nome || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.telefone || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.email || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.cpf || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.cidade || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} promotor(es)</div>
      </div>
    </div>
  );
}
