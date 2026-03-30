import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '../../api/relatorios';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatarMoeda } from '../../utils/formatters';
import { ANOS } from '../../utils/constants';

const anoAtual = new Date().getFullYear();
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const TABS = [
  { key: 'capital',     label: 'Capital Consolidado' },
  { key: 'interior',    label: 'Interior' },
  { key: 'setor',       label: 'Por Setor' },
  { key: 'comparativo', label: 'Comparativo' },
];

function ValorCelula({ valor }) {
  if (!valor) return <span className="text-gray-200">—</span>;
  return <span className="tabular-nums">{formatarMoeda(valor)}</span>;
}

function TabelaMatriz({ linhas, ano }) {
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  if (linhas.length === 0) return <p className="text-gray-400 text-sm py-4">Sem dados.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 font-semibold text-gray-600 border border-gray-100 min-w-[140px]">Nome</th>
            {MESES_ABREV.map((m) => (
              <th key={m} className="px-2 py-2 font-semibold text-gray-500 border border-gray-100 text-right min-w-[80px]">{m}</th>
            ))}
            <th className="px-2 py-2 font-bold text-gray-700 border border-gray-100 text-right min-w-[90px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={linha.id ?? i} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-3 py-2 font-medium text-gray-800 border border-gray-100">{linha.nome}</td>
              {meses.map((mes) => (
                <td key={mes} className="px-2 py-2 text-right border border-gray-100 text-gray-700">
                  <ValorCelula valor={linha.totaisMes?.[mes]} />
                </td>
              ))}
              <td className="px-2 py-2 text-right font-bold border border-gray-100 text-emerald-700">
                {formatarMoeda(linha.totalAnual)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td className="px-3 py-2 border border-gray-200 text-gray-700">Total Geral</td>
            {meses.map((mes) => {
              const total = linhas.reduce((s, l) => s + (l.totaisMes?.[mes] || 0), 0);
              return (
                <td key={mes} className="px-2 py-2 text-right border border-gray-200 text-emerald-700">
                  {total > 0 ? formatarMoeda(total) : <span className="text-gray-200">—</span>}
                </td>
              );
            })}
            <td className="px-2 py-2 text-right border border-gray-200 text-emerald-700">
              {formatarMoeda(linhas.reduce((s, l) => s + l.totalAnual, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TabCapital({ dados }) {
  return <TabelaMatriz linhas={dados.capitalConsolidado ?? []} ano={dados.ano} />;
}

function TabInterior({ dados }) {
  return <TabelaMatriz linhas={dados.interior ?? []} ano={dados.ano} />;
}

function TabSetor({ dados }) {
  const [setorAberto, setSetorAberto] = useState(dados.porSetor?.[0]?.id ?? null);
  const setorAtual = (dados.porSetor ?? []).find((s) => s.id === setorAberto);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(dados.porSetor ?? []).map((s) => (
          <button
            key={s.id}
            onClick={() => setSetorAberto(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${setorAberto === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Setor {s.nome}
          </button>
        ))}
      </div>
      {setorAtual && <TabelaMatriz linhas={setorAtual.congregacoes ?? []} ano={dados.ano} />}
    </div>
  );
}

function TabComparativo({ dados }) {
  const capital = { id: 'capital', nome: 'Capital', totaisMes: {}, totalAnual: 0 };
  const interior = { id: 'interior', nome: 'Interior', totaisMes: {}, totalAnual: 0 };

  for (const mes of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const valCapital = (dados.capitalConsolidado ?? []).reduce((s, l) => s + (l.totaisMes?.[mes] || 0), 0);
    const valInterior = (dados.interior ?? []).reduce((s, l) => s + (l.totaisMes?.[mes] || 0), 0);
    capital.totaisMes[mes] = valCapital;
    interior.totaisMes[mes] = valInterior;
    capital.totalAnual += valCapital;
    interior.totalAnual += valInterior;
  }

  return <TabelaMatriz linhas={[capital, interior]} ano={dados.ano} />;
}

export default function RelatorioFinanceiro() {
  const [ano, setAno] = useState(anoAtual);
  const [tab, setTab] = useState('capital');
  const [baixando, setBaixando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-financeiro', ano],
    queryFn: () => relatoriosApi.getFinanceiro({ ano }),
  });

  async function handlePDF() {
    setBaixando(true);
    try {
      await relatoriosApi.pdfFinanceiro({ ano, tipo: tab });
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatório Financeiro"
        subtitle={`Ano ${ano}`}
        actions={
          <button
            onClick={handlePDF}
            disabled={baixando || !data}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {baixando ? 'Gerando PDF...' : 'Exportar PDF'}
          </button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="label">Ano</label>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="input w-28"
          >
            {ANOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === t.key ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data ? null : (
        <div className="card">
          {tab === 'capital'     && <TabCapital     dados={data} />}
          {tab === 'interior'    && <TabInterior    dados={data} />}
          {tab === 'setor'       && <TabSetor       dados={data} />}
          {tab === 'comparativo' && <TabComparativo dados={data} />}
        </div>
      )}
    </div>
  );
}
