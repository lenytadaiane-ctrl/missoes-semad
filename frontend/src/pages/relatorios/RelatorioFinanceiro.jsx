import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SortTh from '../../components/ui/SortTh';
import Spinner from '../../components/ui/Spinner';
import { useSortable } from '../../hooks/useSortable';

const MESES_L = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_S = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const KEYS    = ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12'];
const keyMes  = k => parseInt(k.substring(1));
const fmt  = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtK = v => (!v || v === 0) ? '' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 12 }, (_, i) => anoAtual - i);

function SubNav({ itens, ativo, setAtivo }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit no-print">
      {itens.map(s => (
        <button key={s.id} onClick={() => setAtivo(s.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
            ${ativo === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

function AnoSelect({ ano, setAno }) {
  return (
    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={ano} onChange={e => setAno(e.target.value)}>
      {anos.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}

// ── Pivot table para relatórios (sem cliques, imprimível) ─────────────────────
function PivotRelatorio({ linhas, colunas = KEYS, agrupador = null, loading }) {
  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!linhas || !linhas.length) return <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado encontrado.</p>;

  const grupos = {};
  if (agrupador) {
    linhas.forEach(l => {
      const chave = l[agrupador] || '(Sem ' + agrupador + ')';
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(l);
    });
  }

  const totaisGeral = colunas.map(k => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalGeral  = totaisGeral.reduce((s, v) => s + v, 0);
  const colSpan     = 1 + colunas.length + 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm print-area">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 bg-gray-50 px-3 py-2.5 text-left font-bold text-gray-600 uppercase tracking-wider min-w-[180px] border-r border-gray-200">
              {agrupador === 'setor' ? 'Setor / Congregação' : agrupador === 'cidade' ? 'Cidade / Congregação' : 'Nome'}
            </th>
            {colunas.map((k, i) => (
              <th key={i} className="px-1 py-2.5 text-right font-bold text-gray-500 uppercase min-w-[62px]">{MESES_S[keyMes(k)]}</th>
            ))}
            <th className="px-2 py-2.5 text-right font-bold text-blue-700 uppercase min-w-[90px] border-l border-gray-200">Total</th>
          </tr>
        </thead>
        <tbody>
          {agrupador ? (
            Object.entries(grupos).map(([grupo, gLinhas]) => {
              const subTotais = colunas.map(k => gLinhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
              const subTotal  = subTotais.reduce((s, v) => s + v, 0);
              return (
                <>
                  <tr key={`h-${grupo}`} className="bg-gray-100 border-y border-gray-200">
                    <td colSpan={colSpan} className="px-3 py-1.5 font-bold text-gray-600 uppercase text-xs tracking-wider">{grupo}</td>
                  </tr>
                  {gLinhas.map((l, idx) => {
                    const vals  = colunas.map(k => parseFloat(l[k]) || 0);
                    const total = vals.reduce((s, v) => s + v, 0);
                    return (
                      <tr key={l.id || idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="sticky left-0 bg-inherit px-3 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">
                          {l.tipo && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${l.tipo === 'CAPITAL' ? 'bg-blue-400' : 'bg-violet-400'}`} />}
                          {l.nome}
                        </td>
                        {vals.map((v, i) => (
                          <td key={i} className={`px-1 py-2 text-right whitespace-nowrap ${v === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>{v === 0 ? '—' : fmtK(v)}</td>
                        ))}
                        <td className="px-2 py-2 text-right font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">{total > 0 ? fmtK(total) : '—'}</td>
                      </tr>
                    );
                  })}
                  <tr key={`sub-${grupo}`} className="bg-gray-100 border-b border-gray-300">
                    <td className="sticky left-0 bg-gray-100 px-3 py-1.5 font-bold text-gray-600 text-xs border-r border-gray-200">Subtotal</td>
                    {subTotais.map((t, i) => (
                      <td key={i} className={`px-1 py-1.5 text-right font-semibold ${t === 0 ? 'text-gray-200' : 'text-gray-700'}`}>{t === 0 ? '—' : fmtK(t)}</td>
                    ))}
                    <td className="px-2 py-1.5 text-right font-bold text-blue-700 border-l border-gray-200">{fmtK(subTotal)}</td>
                  </tr>
                </>
              );
            })
          ) : (
            linhas.map((l, idx) => {
              const vals  = colunas.map(k => parseFloat(l[k]) || 0);
              const total = vals.reduce((s, v) => s + v, 0);
              return (
                <tr key={l.id || idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="sticky left-0 bg-inherit px-3 py-2 font-medium text-gray-800 border-r border-gray-200 whitespace-nowrap">
                    {l.tipo && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${l.tipo === 'CAPITAL' ? 'bg-blue-400' : 'bg-violet-400'}`} />}
                    {l.nome}
                  </td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-1 py-2 text-right whitespace-nowrap ${v === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>{v === 0 ? '—' : fmtK(v)}</td>
                  ))}
                  <td className="px-2 py-2 text-right font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">{total > 0 ? fmtK(total) : '—'}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 bg-blue-600 px-3 py-2.5 font-bold border-r border-blue-500">TOTAL GERAL</td>
            {totaisGeral.map((t, i) => (
              <td key={i} className={`px-1 py-2.5 text-right font-semibold ${t === 0 ? 'opacity-40' : ''}`}>{t === 0 ? '—' : fmtK(t)}</td>
            ))}
            <td className="px-2 py-2.5 text-right font-bold border-l border-blue-500">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Resumo Mensal ─────────────────────────────────────────────────────────────
function AbaResumoMensal() {
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rel-financeiro', ano],
    queryFn: () => api.get('/relatorios/financeiro', { params: { ano } }).then(r => r.data),
  });

  const meses = mes ? (data?.meses || []).filter(m => String(m.mes) === mes) : (data?.meses || []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div />
        <div className="flex flex-wrap gap-2 items-center">
          <AnoSelect ano={ano} setAno={setAno} />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)}>
            <option value="">Ano todo</option>
            {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
        </div>
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
                <td className="px-4 py-3 font-medium">{MESES_L[m.mes]}</td>
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

// ── Por Setores ───────────────────────────────────────────────────────────────
function AbaSetores() {
  const [ano, setAno] = useState(String(anoAtual));
  const [sub, setSub] = useState('ranking');
  const [mes, setMes] = useState('');
  const [setorSel, setSetorSel] = useState('');

  // Ranking data
  const { data: dataRank, isLoading: loadRank } = useQuery({
    queryKey: ['rel-financeiro-setores', ano, mes],
    queryFn: () => api.get('/relatorios/financeiro/setores', { params: { ano, mes: mes || undefined } }).then(r => r.data),
    enabled: sub === 'ranking',
  });

  // Pivot data (panorama + individual)
  const { data: dataPivot, isLoading: loadPivot } = useQuery({
    queryKey: ['pivot-setores-rel', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/setores', { params: { ano } }).then(r => r.data),
    enabled: sub === 'panorama' || sub === 'individual',
  });

  // Individual: congregacoes do setor selecionado
  const { data: dataCongsSel, isLoading: loadCongsSel } = useQuery({
    queryKey: ['pivot-congs-setor-rel', ano, setorSel],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, setorId: setorSel } }).then(r => r.data),
    enabled: sub === 'individual' && !!setorSel,
  });

  const linhasPivot = dataPivot?.linhas || [];
  const labelPeriodo = mes ? `${MESES_L[parseInt(mes)]}/${ano}` : `Ano ${ano}`;

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(dataRank?.setores, 'total', 'desc');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  const SUB = [
    { id: 'ranking',   label: '📋 Ranking' },
    { id: 'panorama',  label: '📊 Panorama Anual' },
    { id: 'individual',label: '🔍 Setor Individual' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <AnoSelect ano={ano} setAno={setAno} />
        <SubNav itens={SUB} ativo={sub} setAtivo={setSub} />
        {sub === 'ranking' && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)}>
            <option value="">Ano todo</option>
            {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        )}
        {sub === 'individual' && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={setorSel} onChange={e => setSetorSel(e.target.value)}>
            <option value="">Selecione um setor...</option>
            {linhasPivot.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        )}
        <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* RANKING */}
      {sub === 'ranking' && (
        <>
          <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <span className="text-blue-700">Total Geral: <strong className="text-blue-900">{fmt(dataRank?.totalGeral || 0)}</strong></span>
            <span className="text-blue-700">Capital: <strong className="text-blue-900">{fmt(dataRank?.totalCapital || 0)}</strong></span>
            <span className="text-blue-700">Interior: <strong className="text-blue-900">{fmt(dataRank?.totalInterior || 0)}</strong></span>
            <span className="text-blue-700">Período: <strong className="text-blue-900">{labelPeriodo}</strong></span>
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadRank ? <tr><td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td></tr>
                  : (sorted || []).map((s, i) => {
                    const pct = dataRank?.totalGeral > 0 ? (s.total / dataRank.totalGeral * 100) : 0;
                    return (
                      <tr key={s.id} className={`hover:bg-gray-50 ${s.total === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{s.total > 0 ? `${i+1}º` : '—'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.nome}</td>
                        <td className="px-4 py-2.5"><Badge text={s.tipo} /></td>
                        <td className="px-4 py-2.5 text-right">{s.capital > 0 ? fmt(s.capital) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-right">{s.interior > 0 ? fmt(s.interior) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{s.total > 0 ? fmt(s.total) : <span className="text-gray-300">—</span>}</td>
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
              {dataRank && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-bold">TOTAL — {labelPeriodo}</td>
                    <td className="px-4 py-3 text-right font-bold">{fmt(dataRank.totalCapital || 0)}</td>
                    <td className="px-4 py-3 text-right font-bold">{fmt(dataRank.totalInterior || 0)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(dataRank.totalGeral || 0)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* PANORAMA */}
      {sub === 'panorama' && (
        <PivotRelatorio linhas={linhasPivot} loading={loadPivot} />
      )}

      {/* SETOR INDIVIDUAL */}
      {sub === 'individual' && !setorSel && (
        <div className="text-center py-16 text-gray-400 text-sm">Selecione um setor acima para ver as congregações mês a mês</div>
      )}
      {sub === 'individual' && setorSel && (
        <>
          {linhasPivot.find(s => String(s.id) === setorSel) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm">
              <span className="font-semibold text-blue-800">{linhasPivot.find(s => String(s.id) === setorSel)?.nome}</span>
              <span className="ml-2 text-blue-600">· Total {ano}: <strong className="text-blue-900">{fmt(linhasPivot.find(s => String(s.id) === setorSel)?.total || 0)}</strong></span>
            </div>
          )}
          <PivotRelatorio linhas={dataCongsSel?.linhas || []} loading={loadCongsSel} />
        </>
      )}
    </div>
  );
}

// ── Por Congregações ──────────────────────────────────────────────────────────
function AbaCongregacoes() {
  const [ano, setAno]       = useState(String(anoAtual));
  const [sub, setSub]       = useState('ranking');
  const [mes, setMes]       = useState('');
  const [setorId, setSetorId] = useState('');
  const [tipo, setTipo]     = useState('');
  const [congSel, setCongSel] = useState('');
  const [ocultarSem, setOcultarSem] = useState(false);

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });

  // Ranking data
  const { data: dataRank, isLoading: loadRank } = useQuery({
    queryKey: ['rel-financeiro-congs', ano, mes, setorId, tipo],
    queryFn: () => api.get('/relatorios/financeiro/congregacoes', {
      params: { ano, mes: mes || undefined, setorId: setorId || undefined, tipo: tipo || undefined },
    }).then(r => r.data),
    enabled: sub === 'ranking',
  });

  // Pivot data
  const { data: dataPivot, isLoading: loadPivot } = useQuery({
    queryKey: ['pivot-congs-rel', ano, tipo],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, tipo: tipo || undefined } }).then(r => r.data),
    enabled: sub === 'panorama' || sub === 'individual',
  });

  const linhasPivot = dataPivot?.linhas || [];
  const linhasFiltradas = setorId ? linhasPivot.filter(l => String(l.setorId) === setorId) : linhasPivot;
  const congSelecionada = linhasPivot.find(l => String(l.id) === congSel);
  const labelPeriodo = mes ? `${MESES_L[parseInt(mes)]}/${ano}` : `Ano ${ano}`;

  const base = ocultarSem ? (dataRank?.congregacoes || []).filter(c => c.total > 0) : (dataRank?.congregacoes || []);
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(base, 'total', 'desc');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  const SUB = [
    { id: 'ranking',   label: '📋 Ranking' },
    { id: 'panorama',  label: '📊 Panorama Anual' },
    { id: 'individual',label: '🔍 Congregação Individual' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <AnoSelect ano={ano} setAno={setAno} />
        <SubNav itens={SUB} ativo={sub} setAtivo={setSub} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tipo} onChange={e => { setTipo(e.target.value); setSetorId(''); setCongSel(''); }}>
          <option value="">Capital + Interior</option>
          <option value="CAPITAL">Capital</option>
          <option value="INTERIOR">Interior</option>
        </select>
        {(sub === 'ranking' || sub === 'panorama') && (tipo === 'CAPITAL' || !tipo) && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={setorId} onChange={e => setSetorId(e.target.value)}>
            <option value="">Todos os setores</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        )}
        {sub === 'ranking' && (
          <>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)}>
              <option value="">Ano todo</option>
              {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer border border-gray-300 rounded-lg px-3 py-2">
              <input type="checkbox" checked={ocultarSem} onChange={e => setOcultarSem(e.target.checked)} className="accent-blue-600" />
              Só com oferta
            </label>
          </>
        )}
        {sub === 'individual' && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={congSel} onChange={e => setCongSel(e.target.value)}>
            <option value="">Selecione uma congregação...</option>
            {linhasPivot.map(c => <option key={c.id} value={c.id}>{c.nome}{c.cidade ? ` (${c.cidade})` : ''}</option>)}
          </select>
        )}
        <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
      </div>

      {/* RANKING */}
      {sub === 'ranking' && (
        <>
          <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <span className="text-blue-700">Total: <strong className="text-blue-900">{fmt(dataRank?.totalGeral || 0)}</strong></span>
            <span className="text-blue-700">Com oferta: <strong className="text-emerald-700">{(dataRank?.congregacoes || []).filter(c => c.total > 0).length}</strong></span>
            <span className="text-blue-700">Sem oferta: <strong className="text-amber-700">{(dataRank?.congregacoes || []).filter(c => c.total === 0).length}</strong></span>
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadRank ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Carregando...</td></tr>
                  : sorted.map((c, i) => {
                    const pct = dataRank?.totalGeral > 0 ? (c.total / dataRank.totalGeral * 100) : 0;
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${c.total === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{c.total > 0 ? `${i+1}º` : '—'}</td>
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
              {dataRank && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 font-bold">TOTAL — {labelPeriodo}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{fmt(dataRank.totalGeral || 0)}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
            <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} congregação(ões)</div>
          </div>
        </>
      )}

      {/* PANORAMA */}
      {sub === 'panorama' && (
        <PivotRelatorio linhas={linhasFiltradas} loading={loadPivot} agrupador={tipo === 'INTERIOR' ? 'cidade' : 'setor'} />
      )}

      {/* INDIVIDUAL */}
      {sub === 'individual' && !congSel && (
        <div className="text-center py-16 text-gray-400 text-sm">Selecione uma congregação acima para ver mês a mês</div>
      )}
      {sub === 'individual' && congSel && congSelecionada && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
            <p className="font-semibold text-blue-800 text-sm">{congSelecionada.nome}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {congSelecionada.tipo}
              {congSelecionada.setor ? ` · ${congSelecionada.setor}` : ''}
              {congSelecionada.cidade ? ` · ${congSelecionada.cidade}` : ''}
            </p>
            <p className="text-sm font-bold text-blue-900 mt-1">Total {ano}: {fmt(congSelecionada.total || 0)}</p>
          </div>
          <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mês</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-blue-700 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {KEYS.map((k, i) => {
                  const v = parseFloat(congSelecionada[k]) || 0;
                  return (
                    <tr key={k} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} ${v === 0 ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-700">{MESES_L[i + 1]}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                        {v > 0 ? fmt(v) : <span className="text-gray-300 font-normal text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-blue-600 text-white">
                  <td className="px-4 py-3 font-bold">TOTAL {ano}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(congSelecionada.total || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Cidades do Interior ───────────────────────────────────────────────────────
function AbaCidadesInterior() {
  const [ano, setAno]         = useState(String(anoAtual));
  const [sub, setSub]         = useState('panorama');
  const [cidadeSel, setCidadeSel] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pivot-interior-rel', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, tipo: 'INTERIOR' } }).then(r => r.data),
  });

  const todasLinhas = data?.linhas || [];
  const cidades = [...new Set(todasLinhas.map(l => l.cidade).filter(Boolean))].sort();

  // Linhas agregadas por cidade
  const linhasCidades = cidades.map(cidade => {
    const congs = todasLinhas.filter(l => l.cidade === cidade);
    const row = { id: cidade, nome: cidade };
    KEYS.forEach(k => { row[k] = congs.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0); });
    row.total = KEYS.reduce((s, k) => s + (row[k] || 0), 0);
    row.qtdCongs = congs.length;
    return row;
  });

  const linhasCidadeSel = cidadeSel ? todasLinhas.filter(l => l.cidade === cidadeSel) : [];
  const totalInterior   = linhasCidades.reduce((s, l) => s + (l.total || 0), 0);

  const SUB = [
    { id: 'panorama', label: '🌍 Todas as Cidades' },
    { id: 'cidade',   label: '📍 Cidade Individual' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 no-print">
        <AnoSelect ano={ano} setAno={setAno} />
        <SubNav itens={SUB} ativo={sub} setAtivo={setSub} />
        {sub === 'cidade' && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={cidadeSel} onChange={e => setCidadeSel(e.target.value)}>
            <option value="">Selecione uma cidade...</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
      </div>

      {sub === 'panorama' && (
        <>
          <div className="flex flex-wrap gap-4 text-sm bg-violet-50 border border-violet-200 rounded-xl px-5 py-3">
            <span className="text-violet-700">Total Interior {ano}: <strong className="text-violet-900">{fmt(totalInterior)}</strong></span>
            <span className="text-violet-700">Cidades: <strong className="text-violet-900">{cidades.length}</strong></span>
            <span className="text-violet-700">Congregações: <strong className="text-violet-900">{todasLinhas.length}</strong></span>
          </div>
          <PivotRelatorio linhas={linhasCidades} loading={isLoading} />
        </>
      )}

      {sub === 'cidade' && !cidadeSel && (
        <div className="text-center py-16 text-gray-400 text-sm">Selecione uma cidade acima para ver as congregações mês a mês</div>
      )}
      {sub === 'cidade' && cidadeSel && (
        <>
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-sm">
            <p className="font-semibold text-violet-800">📍 {cidadeSel}</p>
            <p className="text-xs text-violet-600 mt-0.5">{linhasCidadeSel.length} congregação(ões)</p>
            <p className="font-bold text-violet-900 mt-1">Total {ano}: {fmt(linhasCidadeSel.reduce((s, l) => s + (parseFloat(l.total) || 0), 0))}</p>
          </div>
          <PivotRelatorio linhas={linhasCidadeSel} loading={isLoading} />
        </>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const ABAS = [
  { id: 'mensal',    label: '📅 Resumo Mensal' },
  { id: 'setores',   label: '🗂️ Setores' },
  { id: 'congs',     label: '🏘️ Congregações' },
  { id: 'interior',  label: '🌳 Cidades Interior' },
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
      {aba === 'mensal'   && <AbaResumoMensal />}
      {aba === 'setores'  && <AbaSetores />}
      {aba === 'congs'    && <AbaCongregacoes />}
      {aba === 'interior' && <AbaCidadesInterior />}
    </div>
  );
}
