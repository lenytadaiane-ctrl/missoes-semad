import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SortTh from '../../components/ui/SortTh';
import { useSortable } from '../../hooks/useSortable';

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function Avatar({ foto, nome }) {
  if (foto) return <img src={`/${foto}`} alt={nome} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
      {nome?.charAt(0) || '?'}
    </div>
  );
}

export default function RelatorioMissionarios() {
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroBase, setFiltroBase] = useState('');
  const [filtroCampo, setFiltroCampo] = useState('');
  const [mostrarFoto, setMostrarFoto] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState('tabela'); // tabela | cards

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['rel-missionarios'],
    queryFn: () => api.get('/relatorios/missionarios').then(r => r.data),
  });

  const { data: bases = [] } = useQuery({ queryKey: ['bases'], queryFn: () => api.get('/bases-missionarias').then(r => r.data) });

  // filtros locais
  const filtrado = useMemo(() => {
    let d = raw;
    if (filtroStatus) d = d.filter(m => m.status === filtroStatus);
    if (filtroBase) d = d.filter(m => String(m.baseMissionariaId) === filtroBase);
    if (filtroCampo) d = d.filter(m => m.campoMissionario?.toLowerCase().includes(filtroCampo.toLowerCase()));
    if (filtroBusca) d = d.filter(m => m.pessoa?.nome?.toLowerCase().includes(filtroBusca.toLowerCase()));
    return d;
  }, [raw, filtroStatus, filtroBase, filtroCampo, filtroBusca]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtrado, 'pessoa.nome');

  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Missionários</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModoVisualizacao(v => v === 'tabela' ? 'cards' : 'tabela')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {modoVisualizacao === 'tabela' ? '⊞ Cards' : '☰ Tabela'}
          </button>
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 no-print">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
          placeholder="Buscar por nome..."
          value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)}
        />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="AFASTADO">Afastado</option>
          <option value="INATIVO">Inativo</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtroBase} onChange={e => setFiltroBase(e.target.value)}>
          <option value="">Todas as bases</option>
          {bases.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36"
          placeholder="Campo missionário..."
          value={filtroCampo} onChange={e => setFiltroCampo(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer border border-gray-300 rounded-lg px-3 py-2">
          <input type="checkbox" checked={mostrarFoto} onChange={e => setMostrarFoto(e.target.checked)} className="accent-blue-600" />
          Mostrar foto
        </label>
      </div>

      {/* Totalizador */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <span>Total: <strong>{sorted.length}</strong></span>
        <span>Ativos: <strong className="text-emerald-600">{sorted.filter(m => m.status === 'ATIVO').length}</strong></span>
        <span>Afastados: <strong className="text-amber-600">{sorted.filter(m => m.status === 'AFASTADO').length}</strong></span>
        <span>Inativos: <strong className="text-rose-600">{sorted.filter(m => m.status === 'INATIVO').length}</strong></span>
        <span>Dependentes: <strong>{sorted.reduce((s, m) => s + (m.dependentes?.length || 0), 0)}</strong></span>
      </div>

      {/* MODO CARDS */}
      {modoVisualizacao === 'cards' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 print-area">
          {isLoading ? <p className="text-gray-400">Carregando...</p> : sorted.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex gap-3">
              {mostrarFoto && <Avatar foto={m.pessoa?.foto} nome={m.pessoa?.nome} />}
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{m.pessoa?.nome}</p>
                <p className="text-xs text-gray-400">{m.campoMissionario || '—'}</p>
                <p className="text-xs text-gray-400">{m.baseMissionaria?.nome || '—'}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge text={m.status} />
                  {m.dependentes?.length > 0 && <span className="text-xs text-gray-400">{m.dependentes.length} dep.</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">Envio: {fmtData(m.dataEnvio)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODO TABELA */}
      {modoVisualizacao === 'tabela' && (
        <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {mostrarFoto && <th className="px-4 py-3 w-12" />}
                <SortTh label="Nome" sortKey="pessoa.nome" {...thProps} />
                <SortTh label="Status" sortKey="status" {...thProps} />
                <SortTh label="Campo" sortKey="campoMissionario" {...thProps} />
                <SortTh label="Base" sortKey="baseMissionaria.nome" {...thProps} />
                <SortTh label="Envio" sortKey="dataEnvio" {...thProps} />
                <SortTh label="CPF" sortKey="pessoa.cpf" {...thProps} />
                <SortTh label="Telefone" sortKey="pessoa.telefone" {...thProps} />
                <SortTh label="Dep." sortKey="dependentes.length" {...thProps} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">Nenhum resultado</td></tr>
              ) : sorted.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 align-middle">
                  {mostrarFoto && (
                    <td className="px-3 py-2">
                      <Avatar foto={m.pessoa?.foto} nome={m.pessoa?.nome} />
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-medium text-gray-800">{m.pessoa?.nome}</td>
                  <td className="px-4 py-2.5"><Badge text={m.status} /></td>
                  <td className="px-4 py-2.5 text-gray-600">{m.campoMissionario || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.baseMissionaria?.nome || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{fmtData(m.dataEnvio)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{m.pessoa?.cpf || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{m.pessoa?.telefone || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{m.dependentes?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} missionário(s)</div>
        </div>
      )}
    </div>
  );
}
