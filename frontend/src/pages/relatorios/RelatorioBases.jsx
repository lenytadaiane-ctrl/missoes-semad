import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import SortTh from '../../components/ui/SortTh';
import { useSortable } from '../../hooks/useSortable';

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export default function RelatorioBases() {
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroPais, setFiltroPais] = useState('');

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['rel-bases'],
    queryFn: () => api.get('/bases-missionarias').then(r => r.data),
  });

  const paises = useMemo(() => [...new Set(raw.map(b => b.pais).filter(Boolean))].sort(), [raw]);

  const filtrado = useMemo(() => {
    let d = raw;
    if (filtroPais) d = d.filter(b => b.pais === filtroPais);
    if (filtroBusca) d = d.filter(b => b.nome?.toLowerCase().includes(filtroBusca.toLowerCase()) || b.cidade?.toLowerCase().includes(filtroBusca.toLowerCase()));
    return d;
  }, [raw, filtroBusca, filtroPais]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtrado, 'nome');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Bases Missionárias</h1>
        <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" placeholder="Buscar nome ou cidade..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} />
        {paises.length > 1 && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtroPais} onChange={e => setFiltroPais(e.target.value)}>
            <option value="">Todos os países</option>
            {paises.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        Total: <strong>{sorted.length}</strong> base(s) · Missionários vinculados: <strong>{sorted.reduce((s, b) => s + (b._count?.missionarios || 0), 0)}</strong>
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortTh label="Nome" sortKey="nome" {...thProps} />
              <SortTh label="Cidade" sortKey="cidade" {...thProps} />
              <SortTh label="Estado" sortKey="estado" {...thProps} />
              <SortTh label="País" sortKey="pais" {...thProps} />
              <SortTh label="Responsável" sortKey="responsavelNome" {...thProps} />
              <SortTh label="Contato" sortKey="responsavelContato" {...thProps} />
              <SortTh label="Fundação" sortKey="dataFundacao" {...thProps} />
              <SortTh label="Missionários" sortKey="_count.missionarios" {...thProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : sorted.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{b.nome}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.cidade || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{b.estado || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{b.pais || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{b.responsavelNome || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{b.responsavelContato || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{fmtData(b.dataFundacao)}</td>
                <td className="px-4 py-2.5 text-center font-semibold text-gray-700">{b._count?.missionarios ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} base(s)</div>
      </div>
    </div>
  );
}
