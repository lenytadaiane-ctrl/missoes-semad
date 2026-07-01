import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SortTh from '../../components/ui/SortTh';
import { useSortable } from '../../hooks/useSortable';

const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 12 }, (_, i) => anoAtual - i);

function FiltroBar({ ano, setAno, mes, setMes, extras }) {
  return (
    <div className="flex flex-wrap gap-2 items-center no-print">
      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={ano} onChange={e => setAno(e.target.value)}>
        {anos.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)}>
        <option value="">Ano todo</option>
        {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
      </select>
      {extras}
      <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
    </div>
  );
}

/* ── ABA 1: RESUMO MENSAL ── */
function AbaResumoMensal() {
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rel-financeiro', ano],
    queryFn: () => api.get('/relatorios/financeiro', { params: { ano } }).then(r => r.data),
  });

  // filtra mês se selecionado
  const meses = mes ? (data?.meses || []).filter(m => String(m.mes) === mes) : (data?.meses || []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div />
        <FiltroBar ano={ano} setAno={setAno} mes={mes} setMes={setMes} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
        {data?.entradaAnual && <span className="text-blue-700">Entrada Oficial {ano}: <strong className="text-blue-900">{fmt(data.entradaAnual.valor)}</strong></span>}
        <span className="text-blue-700">Arrecadado de Ofertas: <strong className="text-blue-900">{fmt(data?.totalAno || 0)}</strong></span>
        <span className="text-blue-700">Capital: <strong className="text-blue-900">{fmt(data?.totalCapital || 0)}</strong></span>
        <span className="text-blue-700">Interior: <strong className="text-blue-900">{fmt(data?.totalInterior || 0)}</strong></span>
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mês</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Capital</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Interior</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : meses.map(m => (
              <tr key={m.mes} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{MESES[m.mes]}</td>
                <td className="px-4 py-3 text-right">{m.capital > 0 ? fmt(m.capital) : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-right">{m.interior > 0 ? fmt(m.interior) : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-right font-semibold">{m.total > 0 ? fmt(m.total) : <span className="text-gray-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
          {data && !mes && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-4 py-3 font-bold">TOTAL {ano}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(data.totalCapital || 0)}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(data.totalInterior || 0)}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(data.totalAno || 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── ABA 2: POR SETOR ── */
function AbaPorSetor() {
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');

  const labelPeriodo = mes ? `${MESES[parseInt(mes)]}/${ano}` : `Ano ${ano}`;

  const { data, isLoading } = useQuery({
    queryKey: ['rel-financeiro-setores', ano, mes],
    queryFn: () => api.get('/relatorios/financeiro/setores', { params: { ano, mes: mes || undefined } }).then(r => r.data),
  });

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(data?.setores, 'total', 'desc');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <p className="text-sm text-gray-500">Período: <strong>{labelPeriodo}</strong></p>
        <FiltroBar ano={ano} setAno={setAno} mes={mes} setMes={setMes} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
        <span className="text-blue-700">Total Geral: <strong className="text-blue-900">{fmt(data?.totalGeral || 0)}</strong></span>
        <span className="text-blue-700">Capital: <strong className="text-blue-900">{fmt(data?.totalCapital || 0)}</strong></span>
        <span className="text-blue-700">Interior: <strong className="text-blue-900">{fmt(data?.totalInterior || 0)}</strong></span>
        <span className="text-blue-700">Setores com arrecadação: <strong className="text-blue-900">{(sorted || []).filter(s => s.total > 0).length}</strong></span>
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8">#</th>
              <SortTh label="Setor" sortKey="nome" {...thProps} />
              <SortTh label="Tipo" sortKey="tipo" {...thProps} />
              <SortTh label="Capital" sortKey="capital" {...thProps} />
              <SortTh label="Interior" sortKey="interior" {...thProps} />
              <SortTh label="Total" sortKey="total" {...thProps} />
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">% do Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : (sorted || []).map((s, i) => {
              const pct = data?.totalGeral > 0 ? (s.total / data.totalGeral * 100) : 0;
              return (
                <tr key={s.id} className={`hover:bg-gray-50 ${s.total === 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{s.total > 0 ? `${i + 1}º` : '—'}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{s.nome}</td>
                  <td className="px-4 py-2.5"><Badge text={s.tipo} /></td>
                  <td className="px-4 py-2.5 text-right">{s.capital > 0 ? fmt(s.capital) : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-right">{s.interior > 0 ? fmt(s.interior) : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{s.total > 0 ? fmt(s.total) : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-right">
                    {pct > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {data && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-bold">TOTAL — {labelPeriodo}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(data.totalCapital || 0)}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(data.totalInterior || 0)}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(data.totalGeral || 0)}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── ABA 3: POR CONGREGAÇÃO ── */
function AbaPorCongregacao() {
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');
  const [setorId, setSetorId] = useState('');
  const [tipo, setTipo] = useState('');
  const [ocultarSemOferta, setOcultarSemOferta] = useState(false);

  const labelPeriodo = mes ? `${MESES[parseInt(mes)]}/${ano}` : `Ano ${ano}`;
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['rel-financeiro-congs', ano, mes, setorId, tipo],
    queryFn: () => api.get('/relatorios/financeiro/congregacoes', {
      params: { ano, mes: mes || undefined, setorId: setorId || undefined, tipo: tipo || undefined },
    }).then(r => r.data),
  });

  const base = ocultarSemOferta ? (data?.congregacoes || []).filter(c => c.total > 0) : (data?.congregacoes || []);
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(base, 'total', 'desc');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <p className="text-sm text-gray-500">Período: <strong>{labelPeriodo}</strong></p>
        <FiltroBar
          ano={ano} setAno={setAno} mes={mes} setMes={setMes}
          extras={<>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={setorId} onChange={e => setSetorId(e.target.value)}>
              <option value="">Todos os setores</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Capital + Interior</option>
              <option value="CAPITAL">Capital</option>
              <option value="INTERIOR">Interior</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer border border-gray-300 rounded-lg px-3 py-2">
              <input type="checkbox" checked={ocultarSemOferta} onChange={e => setOcultarSemOferta(e.target.checked)} className="accent-blue-600" />
              Só com oferta
            </label>
          </>}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
        <span className="text-blue-700">Total Geral: <strong className="text-blue-900">{fmt(data?.totalGeral || 0)}</strong></span>
        <span className="text-blue-700">Com oferta: <strong className="text-emerald-700">{(data?.congregacoes || []).filter(c => c.total > 0).length}</strong></span>
        <span className="text-blue-700">Sem oferta: <strong className="text-amber-700">{(data?.congregacoes || []).filter(c => c.total === 0).length}</strong></span>
        <span className="text-blue-700">Exibindo: <strong className="text-blue-900">{sorted.length}</strong></span>
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8">#</th>
              <SortTh label="Congregação" sortKey="nome" {...thProps} />
              <SortTh label="Setor" sortKey="setor" {...thProps} />
              <SortTh label="Tipo" sortKey="tipo" {...thProps} />
              <SortTh label={`Total — ${labelPeriodo}`} sortKey="total" {...thProps} />
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">% do Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : sorted.map((c, i) => {
              const pct = data?.totalGeral > 0 ? (c.total / data.totalGeral * 100) : 0;
              return (
                <tr key={c.id} className={`hover:bg-gray-50 ${c.total === 0 ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{c.total > 0 ? `${i + 1}º` : '—'}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{c.nome}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{c.setor || '—'}</td>
                  <td className="px-4 py-2.5"><Badge text={c.tipo} /></td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {c.total > 0 ? fmt(c.total) : <span className="text-gray-300 text-xs font-normal">sem oferta</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {pct > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                          <div className={`h-1.5 rounded-full ${c.tipo === 'CAPITAL' ? 'bg-blue-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(pct * 5, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct.toFixed(2)}%</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {data && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-bold">TOTAL — {labelPeriodo}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(data.totalGeral || 0)}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
        <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} congregação(ões)</div>
      </div>
    </div>
  );
}

/* ── COMPONENTE PRINCIPAL ── */
const ABAS = [
  { id: 'mensal', label: 'Resumo Mensal' },
  { id: 'setores', label: 'Por Setor' },
  { id: 'congregacoes', label: 'Por Congregação' },
];

export default function RelatorioFinanceiro() {
  const [aba, setAba] = useState('mensal');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 no-print">Relatório Financeiro</h1>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit no-print">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>
      {aba === 'mensal' && <AbaResumoMensal />}
      {aba === 'setores' && <AbaPorSetor />}
      {aba === 'congregacoes' && <AbaPorCongregacao />}
    </div>
  );
}
