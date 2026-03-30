import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';

export default function RelatorioBases() {
  const [baixando, setBaixando] = useState(false);

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['relatorio-bases'],
    queryFn: () => relatoriosApi.getBases(),
  });

  async function handlePDF() {
    setBaixando(true);
    try {
      await relatoriosApi.pdfBases();
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatório de Bases Missionárias"
        subtitle={`${lista.length} base(s)`}
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

      {isLoading ? (
        <PageSpinner />
      ) : lista.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Nenhuma base missionária cadastrada.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cidade</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Responsável</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{b.cidade || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{b.estado || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{b.responsavelNome || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{b.telefone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{b.email || <span className="text-gray-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
