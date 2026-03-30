import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import { TipoLocalBadge } from '../../components/ui/Badge';

export default function RelatorioSecretarios() {
  const [baixando, setBaixando] = useState(false);

  const { data: setores = [], isLoading } = useQuery({
    queryKey: ['relatorio-secretarios'],
    queryFn: () => relatoriosApi.getSecretarios(),
  });

  const totalSecretarios = setores.reduce((s, setor) => s + (setor.secretarios?.length ?? 0), 0);
  const setoresComSecretarios = setores.filter((s) => s.secretarios?.length > 0);

  async function handlePDF() {
    setBaixando(true);
    try {
      await relatoriosApi.pdfSecretarios();
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatório de Secretários por Setor"
        subtitle={`${totalSecretarios} secretário(s) em ${setoresComSecretarios.length} setor(es)`}
        actions={
          <button
            onClick={handlePDF}
            disabled={baixando || totalSecretarios === 0}
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
      ) : totalSecretarios === 0 ? (
        <div className="card text-center py-10 text-gray-400">Nenhum secretário cadastrado.</div>
      ) : (
        <div className="space-y-4">
          {setores.filter((s) => s.secretarios?.length > 0).map((setor) => (
            <div key={setor.id} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="font-bold text-gray-800">Setor {setor.nome}</span>
                <TipoLocalBadge tipo={setor.tipo} />
                <span className="text-xs text-gray-500 ml-auto">{setor.secretarios.length} secretário(s)</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-left">
                    <th className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Nome</th>
                    <th className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Telefone</th>
                    <th className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase">E-mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {setor.secretarios.map((sec) => (
                    <tr key={sec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-gray-900">{sec.pessoa?.nome}</td>
                      <td className="px-5 py-2.5 text-gray-600">{sec.pessoa?.telefone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-2.5 text-gray-600">{sec.pessoa?.email || <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
