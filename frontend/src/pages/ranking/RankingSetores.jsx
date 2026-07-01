import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Badge from '../../components/ui/Badge';

const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_S = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function Delta({ delta }) {
  if (delta === 0) return <span className="text-xs text-gray-400">—</span>;
  if (delta > 0) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-bold">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
      {delta}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-rose-500 text-xs font-bold">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      {Math.abs(delta)}
    </span>
  );
}

function medalha(pos) {
  if (pos === 1) return 'bg-yellow-400 text-yellow-900';
  if (pos === 2) return 'bg-gray-300 text-gray-700';
  if (pos === 3) return 'bg-orange-300 text-orange-900';
  return 'bg-gray-100 text-gray-500';
}

function labelPeriodoAnterior(ano, mes) {
  if (!mes) return `Ano ${parseInt(ano) - 1}`;
  const m = parseInt(mes);
  if (m === 1) return `Dez/${parseInt(ano) - 1}`;
  return `${MESES_S[m - 1]}/${ano}`;
}

export default function RankingSetores() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');
  const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

  const labelAtual = mes ? `${MESES[parseInt(mes)]}/${ano}` : `Ano ${ano}`;
  const labelAnterior = labelPeriodoAnterior(ano, mes);

  const { data, isLoading } = useQuery({
    queryKey: ['ranking-setores', ano, mes],
    queryFn: () => api.get('/ranking/setores', { params: { ano, mes: mes || undefined } }).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ranking por Setor</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Variação comparada com: <strong>{labelAnterior}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={ano} onChange={e => setAno(e.target.value)}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)}>
            <option value="">Ano todo</option>
            {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Chips de mês */}
      <div className="flex flex-wrap gap-1 no-print">
        <button onClick={() => setMes('')} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!mes ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'}`}>Ano todo</button>
        {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
          <button key={i} onClick={() => setMes(String(i + 1))} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${mes === String(i + 1) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'}`}>{m}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Setor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{labelAnterior}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{labelAtual}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Variação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center text-gray-400">Carregando...</td></tr>
            ) : (data?.data || []).map((r) => (
              <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.posicao <= 3 && r.total > 0 ? 'font-medium' : ''}`}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${medalha(r.posicao)}`}>
                    {r.posicao}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-800">{r.nome}</td>
                <td className="px-4 py-3"><Badge text={r.tipo} /></td>
                <td className="px-4 py-3 text-right text-gray-400 text-xs">{r.totalAnterior > 0 ? fmt(r.totalAnterior) : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{r.total > 0 ? fmt(r.total) : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-center"><Delta delta={r.delta} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-gray-400 border-t">
          {(data?.data || []).filter(r => r.total > 0).length} setor(es) com arrecadação em {labelAtual}
        </div>
      </div>
    </div>
  );
}
