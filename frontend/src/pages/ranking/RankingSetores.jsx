import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rankingApi } from '../../api/ranking';
import PageHeader from '../../components/ui/PageHeader';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatarMoeda, nomeMes } from '../../utils/formatters';
import { MESES, ANOS } from '../../utils/constants';
import { TipoLocalBadge } from '../../components/ui/Badge';

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

const MEDALHA = { OURO: '🥇', PRATA: '🥈', BRONZE: '🥉' };

function Variacao({ variacao }) {
  if (variacao === null || variacao === undefined) return <span className="text-gray-300 text-xs">—</span>;
  if (variacao > 0) return <span className="text-emerald-600 text-xs font-medium">▲ {variacao}</span>;
  if (variacao < 0) return <span className="text-red-500 text-xs font-medium">▼ {Math.abs(variacao)}</span>;
  return <span className="text-gray-400 text-xs">= 0</span>;
}

export default function RankingSetores() {
  const [filtros, setFiltros] = useState({ mes: mesAtual, ano: anoAtual });

  const { data, isLoading } = useQuery({
    queryKey: ['ranking-setores', filtros],
    queryFn: () => rankingApi.setores(filtros),
  });

  const lista = data?.ranking ?? [];

  return (
    <div>
      <PageHeader
        title="Ranking de Setores"
        subtitle={`${nomeMes(filtros.mes)} de ${filtros.ano}`}
      />

      <div className="flex gap-3 mb-6">
        <div>
          <label className="label">Mês</label>
          <select
            value={filtros.mes}
            onChange={(e) => setFiltros((f) => ({ ...f, mes: parseInt(e.target.value) }))}
            className="input w-36"
          >
            {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <select
            value={filtros.ano}
            onChange={(e) => setFiltros((f) => ({ ...f, ano: parseInt(e.target.value) }))}
            className="input w-28"
          >
            {ANOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : lista.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          Nenhum dado de oferta encontrado para {nomeMes(filtros.mes)}/{filtros.ano}.
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">Pos.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Setor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Mês Anterior</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total do Mês</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((item) => (
                <tr
                  key={item.setorId}
                  className={`hover:bg-gray-50 transition-colors ${item.medalha === 'OURO' ? 'bg-yellow-50/50' : item.medalha === 'PRATA' ? 'bg-gray-50/80' : item.medalha === 'BRONZE' ? 'bg-orange-50/40' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {item.medalha ? (
                        <span className="text-xl">{MEDALHA[item.medalha]}</span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">{item.posicao}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3"><TipoLocalBadge tipo={item.tipo} /></td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatarMoeda(item.valorMesAnterior)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">{formatarMoeda(item.valor)}</td>
                  <td className="px-4 py-3 text-center"><Variacao variacao={item.variacao} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total Geral</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">
                  {formatarMoeda(lista.reduce((s, r) => s + r.valor, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
