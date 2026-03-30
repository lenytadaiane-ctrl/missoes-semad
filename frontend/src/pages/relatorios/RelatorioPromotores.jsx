import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import { setoresApi } from '../../api/setores';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import { TipoLocalBadge } from '../../components/ui/Badge';
import { formatarData } from '../../utils/formatters';

export default function RelatorioPromotores() {
  const [setorId, setSetorId] = useState('');
  const [baixando, setBaixando] = useState(false);

  const { data: setores = [] } = useQuery({
    queryKey: ['setores'],
    queryFn: () => setoresApi.listar(),
  });

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['relatorio-promotores', setorId],
    queryFn: () => relatoriosApi.getPromotores({ setorId: setorId || undefined }),
  });

  async function handlePDF() {
    setBaixando(true);
    try {
      await relatoriosApi.pdfPromotores({ setorId: setorId || undefined });
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatório de Promotores de Missões"
        subtitle={`${lista.length} promotor(es)`}
        actions={
          <button
            onClick={handlePDF}
            disabled={baixando || lista.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {baixando ? 'Gerando PDF...' : 'Exportar PDF'}
          </button>
        }
      />

      <div className="flex gap-3 mb-6">
        <div>
          <label className="label">Filtrar por Setor</label>
          <select
            value={setorId}
            onChange={(e) => setSetorId(e.target.value)}
            className="input w-52"
          >
            <option value="">Todos os setores</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                Setor {s.nome} ({s.tipo === 'CAPITAL' ? 'Capital' : 'Interior'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : lista.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Nenhum promotor encontrado.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Setor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">E-mail</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data de Início</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.pessoa?.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{p.setor?.nome ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {p.setor ? <TipoLocalBadge tipo={p.setor.tipo} /> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.pessoa?.telefone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{p.pessoa?.email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{formatarData(p.dataInicio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
