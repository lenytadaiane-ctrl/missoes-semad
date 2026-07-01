import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import api from '../api/client';
import Spinner from '../components/ui/Spinner';

const MESES_S = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_L = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtK = (v) => v >= 1000000 ? `R$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${Number(v).toFixed(0)}`;
const CORES_SETOR = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0284c7','#65a30d','#b45309','#0f766e','#c026d3','#1d4ed8'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

function Kpi({ label, value, note, accent }) {
  const clr = { blue:'bg-blue-600', green:'bg-emerald-600', amber:'bg-amber-500', red:'bg-rose-500', purple:'bg-violet-600', teal:'bg-teal-600' }[accent] || 'bg-gray-600';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-0.5 min-w-0">
      <div className={`w-1 h-4 rounded-full ${clr} self-start mb-1`} />
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">{label}</p>
      <p className="text-xl font-bold text-gray-800 leading-tight truncate">{value}</p>
      {note && <p className="text-[10px] text-gray-400 leading-none">{note}</p>}
    </div>
  );
}

export default function Dashboard() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState('');
  const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', ano, mes],
    queryFn: () => api.get('/dashboard', { params: { ano, mes: mes || undefined } }).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return null;

  const labelPeriodo = mes ? `${MESES_L[parseInt(mes)-1]}/${ano}` : `Ano ${ano}`;
  const crescimento = (data.crescimentoAnual || []).map(r => ({ name: String(r.ano), total: r.total, fonte: r.fonte }));
  const evolucao = (data.evolucaoMensal || []).map(m => ({ name: `${MESES_S[m.mes-1]}/${String(m.ano).slice(2)}`, total: m.total }));
  const setoresChart = (data.totaisPorSetor || []).filter(s => s.total > 0);

  return (
    <div className="space-y-5">

      {/* ── Cabeçalho + Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800 mr-2">Dashboard</h1>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-sm">
          <select className="bg-transparent focus:outline-none font-medium text-gray-700" value={ano} onChange={e => { setAno(e.target.value); }}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {/* Chips de mês */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setMes('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!mes ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'}`}
          >Ano todo</button>
          {MESES_S.map((m, i) => (
            <button
              key={i}
              onClick={() => setMes(String(i + 1))}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${mes === String(i + 1) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'} ${i + 1 > mesAtual && parseInt(ano) === anoAtual ? 'opacity-40' : ''}`}
            >{m}</button>
          ))}
        </div>
      </div>

      {/* ── KPIs compactos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <Kpi label="Ativos" value={data.totalMissionariosAtivos} note={`${data.totalMissionarios} total`} accent="green" />
        <Kpi label="Afastados" value={data.totalMissionariosAfastados} accent="amber" />
        <Kpi label="Inativos" value={data.totalMissionariosInativos} accent="red" />
        <Kpi label="Bases" value={data.totalBases} accent="teal" />
        <Kpi label="Setores" value={data.totalSetores} accent="purple" />
        <Kpi label="Congregações" value={data.totalCongregacoes} accent="blue" />
        <Kpi label={mes ? 'Mês selecionado' : 'Total ' + ano} value={fmtK(data.somaFiltro)} accent="blue" />
        <Kpi label="Mês atual" value={fmtK(data.somaMesAtual)} note={`Acum. ${ano}: ${fmtK(data.somaAnoAtual)}`} accent="blue" />
      </div>

      {/* ── Capital × Interior (pills) ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-600 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Capital</p>
            <p className="text-xl font-bold">{fmt(data.somaCapital)}</p>
          </div>
          <div className="text-3xl opacity-20 font-black">C</div>
        </div>
        <div className="bg-violet-600 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">Interior</p>
            <p className="text-xl font-bold">{fmt(data.somaInterior)}</p>
          </div>
          <div className="text-3xl opacity-20 font-black">I</div>
        </div>
      </div>

      {/* ── Crescimento Anual + Evolução Mensal ── */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Crescimento Anual</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={crescimento} margin={{ top: 14, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 9 }} width={48} />
              <Tooltip content={<TT />} />
              <Bar dataKey="total" name="Total" radius={[3,3,0,0]}>
                {crescimento.map((e, i) => <Cell key={i} fill={e.fonte === 'calculado' ? '#93c5fd' : '#2563eb'} />)}
                <LabelList dataKey="total" position="top" formatter={fmtK} style={{ fontSize: 8, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-1 flex gap-3">
            <span><span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-sm mr-1 align-middle" />Oficial</span>
            <span><span className="inline-block w-2.5 h-2.5 bg-blue-300 rounded-sm mr-1 align-middle" />Calculado</span>
          </p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Evolução — últimos 12 meses</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 9 }} width={44} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Por Setor + Top Congregações ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Setores — {labelPeriodo}
          </p>
          {setoresChart.length === 0
            ? <p className="text-sm text-gray-300 py-6 text-center">Sem dados</p>
            : (
              <ResponsiveContainer width="100%" height={Math.max(200, setoresChart.length * 28)}>
                <BarChart layout="vertical" data={setoresChart} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="total" name="Total" radius={[0,3,3,0]}>
                    {setoresChart.map((_, i) => <Cell key={i} fill={CORES_SETOR[i % CORES_SETOR.length]} />)}
                    <LabelList dataKey="total" position="right" formatter={fmtK} style={{ fontSize: 9, fill: '#374151' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Congregações — {labelPeriodo}
          </p>
          <div className="space-y-1.5">
            {(data.topCongregacoesFull || data.topCongregacoes || []).slice(0, 10).map((c, i) => {
              const max = (data.topCongregacoesFull?.[0]?.total || data.topCongregacoes?.[0]?.total || 1);
              const pct = (c.total / max) * 100;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-gray-400 font-bold shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700 font-medium truncate">{c.nome}</span>
                      <span className="font-semibold text-gray-800 shrink-0 ml-2">{fmtK(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={c.tipo === 'CAPITAL' ? 'h-full bg-blue-500 rounded-full' : 'h-full bg-violet-500 rounded-full'}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {!(data.topCongregacoesFull?.length || data.topCongregacoes?.length) && (
              <p className="text-sm text-gray-300 py-6 text-center">Sem dados</p>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 flex gap-3">
            <span><span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-sm mr-1 align-middle" />Capital</span>
            <span><span className="inline-block w-2.5 h-2.5 bg-violet-500 rounded-sm mr-1 align-middle" />Interior</span>
          </p>
        </div>
      </div>

    </div>
  );
}
