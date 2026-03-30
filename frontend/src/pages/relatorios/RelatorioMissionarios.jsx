import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatusMissionarioBadge } from '../../components/ui/Badge';
import { formatarData } from '../../utils/formatters';

export default function RelatorioMissionarios() {
  const [status, setStatus] = useState('');
  const [baixando, setBaixando] = useState(false);

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['relatorio-missionarios', status],
    queryFn: () => relatoriosApi.getMissionarios({ status: status || undefined }),
  });

  async function handlePDF() {
    setBaixando(true);
    try {
      await relatoriosApi.pdfMissionarios({ status: status || undefined });
    } catch {
      // erro silencioso — o navegador já mostra falha de download
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatório de Missionários"
        subtitle={`${lista.length} missionário(s)`}
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
          <label className="label">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-40">
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="AFASTADO">Afastado</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : lista.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Nenhum missionário encontrado.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Campo Missionário</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Base</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Envio</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Coordenador</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Dependentes</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.pessoa?.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{m.campoMissionario || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{m.baseMissionaria?.nome || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{formatarData(m.dataEnvio)}</td>
                  <td className="px-4 py-3 text-gray-600">{m.coordenador?.pessoa?.nome || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-center">
                    {m.dependentes?.length > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {m.dependentes.length}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusMissionarioBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
