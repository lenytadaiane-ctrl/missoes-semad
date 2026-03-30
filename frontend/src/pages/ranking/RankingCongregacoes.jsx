import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rankingApi } from '../../api/ranking';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
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

export default function RankingCongregacoes() {
  const [filtros, setFiltros] = useState({ mes: mesAtual, ano: anoAtual, tipo: '' });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ranking-congregacoes', filtros],
    queryFn: () => rankingApi.congregacoes({ ...filtros, tipo: filtros.tipo || undefined }),
  });

  const lista = (data?.ranking ?? []).filter((item) =>
    search ? item.nome.toLowerCase().includes(search.toLowerCase()) || (item.setor ?? '').toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <PageHeader
        title="Ranking de Congregações"
        subtitle={`${nomeMes(filtros.mes)} de ${filtros.ano}${filtros.tipo ? ` — ${filtros.tipo === 'CAPITAL' ? 'Capital' : 'Interior'}` : ''}`}
      />

      <div className="flex flex-wrap gap-3 mb-6 items-end">
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
        <div>
          <label className="label">Tipo</label>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
            className="input w-36"
          >
            <option value="">Todos</option>
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
        </div>
        <div>
          <label className="label">Buscar</label>
          <SearchInput value={search} onChange={setSearch} placeholder="Congregação ou setor..." className="w-52" />
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
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Congregação</th>
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
                  key={item.congregacaoId}
                  className={`hover:bg-gray-50 transition-colors ${item.medalha === 'OURO' ? 'bg-yellow-50/50' : item.medalha === 'PRATA' ? 'bg-gray-50/80' : item.medalha === 'BRONZE' ? 'bg-orange-50/40' : ''}`}
                >
                  <td className="px-4 py-3">
                    {item.medalha ? (
                      <span className="text-xl">{MEDALHA[item.medalha]}</span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">{item.posicao}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{item.setor ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3"><TipoLocalBadge tipo={item.tipo} /></td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatarMoeda(item.valorMesAnterior)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">{formatarMoeda(item.valor)}</td>
                  <td className="px-4 py-3 text-center"><Variacao variacao={item.variacao} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Total Geral ({lista.length} congregações)
                </td>
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
