import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { formatarMoeda, nomeMes } from '../utils/formatters';
import { PageSpinner } from '../components/ui/Spinner';

// ─── Paleta de cores para setores A-N ────────────────────────────────────────
const COR_SETOR = [
  '#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#06b6d4',
  '#84cc16','#ec4899','#f59e0b','#6366f1','#14b8a6','#d946ef','#e11d48',
];

const TT = {
  borderRadius: 8, fontSize: 12,
  border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)',
};

function moedaCurta(v) {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v}`;
}

// ─── Componentes compartilhados ───────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
        </div>
        <span className="text-3xl opacity-90">{icon}</span>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-base font-bold text-gray-800">{children}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ─── Aba Resumo (conteúdo original) ──────────────────────────────────────────
function TabResumo({ data }) {
  const { missionarios, setores, congregacoes, financeiro, evolucaoMensal } = data;
  const pieData = [
    { name: 'Capital',  value: financeiro.totalCapital  },
    { name: 'Interior', value: financeiro.totalInterior },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✈️" label="Missionários Ativos" value={missionarios.ativos} sub={`${missionarios.total} total`} color="blue" />
        <StatCard icon="⛪" label="Setores / Congregações" value={setores} sub={`${congregacoes} congregações`} color="purple" />
        <StatCard icon="💰" label={`Ofertas ${nomeMes(financeiro.mesAtual)}`} value={formatarMoeda(financeiro.totalMesAtual)} color="green" />
        <StatCard icon="📊" label={`Total ${financeiro.anoAtual}`} value={formatarMoeda(financeiro.totalAno)} sub="acumulado no ano" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Evolução Mensal de Ofertas (últimos 12 meses)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolucaoMensal} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={moedaCurta} tick={{ fontSize: 10 }} width={68} />
              <Tooltip formatter={(v) => [formatarMoeda(v), 'Total']} contentStyle={TT} />
              <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Capital × Interior ({financeiro.anoAtual})</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                <Cell fill="#3b82f6" />
                <Cell fill="#f97316" />
              </Pie>
              <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
              <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex justify-between text-sm"><span className="text-blue-600 font-medium">Capital</span><span className="font-semibold">{formatarMoeda(financeiro.totalCapital)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-orange-500 font-medium">Interior</span><span className="font-semibold">{formatarMoeda(financeiro.totalInterior)}</span></div>
            <div className="flex justify-between text-sm border-t pt-2 font-bold"><span>Total Geral</span><span>{formatarMoeda(financeiro.totalAno)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Aba Gráficos ─────────────────────────────────────────────────────────────
function TabGraficos({ ano, setAno }) {
  const [setorIdx, setSetorIdx] = useState(0);
  const ANOS_DISP = [2025, 2026];

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-graficos', ano],
    queryFn: () => dashboardApi.graficos(ano),
  });

  const { data: entradaAnualData } = useQuery({
    queryKey: ['dashboard-entrada-anual'],
    queryFn: dashboardApi.entradaAnual,
  });

  if (isLoading) return <PageSpinner />;
  if (!data)    return null;

  const setorSel = data.setores[setorIdx] ?? data.setores[0];

  // Dados para o gráfico empilhado (12 meses × setores)
  const dadosEmpilhados = Array.from({ length: 12 }, (_, i) => {
    const ponto = { label: data.evolucaoComparativa[i].label };
    for (const s of data.setores) {
      ponto[`S${s.nome}`] = s.evolucaoMensal[i]?.valor || 0;
    }
    return ponto;
  });

  const pieData = [
    { name: 'Capital',  value: data.distribuicao.capital  },
    { name: 'Interior', value: data.distribuicao.interior },
  ];

  const totalGeral = data.distribuicao.capital + data.distribuicao.interior;

  return (
    <div className="space-y-10">
      {/* Seletor de ano */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium mr-1">Ano:</span>
        {ANOS_DISP.map((a) => (
          <button
            key={a}
            onClick={() => setAno(a)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              ano === a
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >{a}</button>
        ))}
      </div>

      {/* ── SEÇÃO 1: Visão Geral ─────────────────────────────────────────── */}
      <div>
        <SectionTitle>Seção 1 — Visão Geral</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Evolução comparativa: dois anos sobrepostos */}
          <ChartCard title={`Evolução Mensal — ${ano} vs ${data.anoAnterior}`} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.evolucaoComparativa} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={moedaCurta} tick={{ fontSize: 10 }} width={68} />
                <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
                <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="valorAno"         name={String(ano)}              stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="valorAnoAnterior" name={String(data.anoAnterior)} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pizza Capital × Interior */}
          <ChartCard title={`Capital × Interior — ${ano}`}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={68} dataKey="value" paddingAngle={3}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
                <Legend iconSize={9} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between"><span className="text-blue-600 font-medium">Capital</span><span className="font-semibold">{formatarMoeda(data.distribuicao.capital)}</span></div>
              <div className="flex justify-between"><span className="text-orange-500 font-medium">Interior</span><span className="font-semibold">{formatarMoeda(data.distribuicao.interior)}</span></div>
              {totalGeral > 0 && (
                <div className="text-xs text-gray-400 text-right">
                  Capital: {((data.distribuicao.capital / totalGeral) * 100).toFixed(1)}% &nbsp;|&nbsp;
                  Interior: {((data.distribuicao.interior / totalGeral) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </ChartCard>

          {/* Top 5 Congregações */}
          <ChartCard title={`Top 5 Congregações — ${ano}`} className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={data.top5Congregacoes}
                margin={{ top: 4, right: 80, bottom: 4, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={moedaCurta} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(v, _n, p) => [formatarMoeda(v), `Setor ${p.payload.setor}`]}
                  contentStyle={TT}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={28} label={{ position: 'right', formatter: moedaCurta, fontSize: 11, fill: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Histórico de Entradas Anuais */}
          <ChartCard title="Histórico de Entradas Anuais (2017–2026)" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={entradaAnualData?.dados ?? []}
                margin={{ top: 28, right: 16, bottom: 4, left: 4 }}
              >
                <defs>
                  <linearGradient id="blueGradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={moedaCurta} tick={{ fontSize: 10 }} width={68} />
                <Tooltip
                  formatter={(v, _n, p) => [formatarMoeda(v), p.payload.historico ? 'Histórico' : 'Acumulado no ano']}
                  contentStyle={TT}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={52}
                  label={{ position: 'top', formatter: moedaCurta, fontSize: 11, fill: '#475569' }}
                >
                  {(entradaAnualData?.dados ?? []).map((entry) => (
                    <Cell key={entry.ano} fill={entry.historico ? 'url(#blueGradBar)' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> Histórico (2017–2025)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" /> Ano atual (acumulado)
              </span>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── SEÇÃO 2: Por Setor ──────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Seção 2 — Por Setor</SectionTitle>

        {/* Seletor de setor */}
        <div className="flex flex-wrap gap-2 mb-5">
          {data.setores.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSetorIdx(i)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                setorIdx === i
                  ? 'text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={setorIdx === i ? { backgroundColor: COR_SETOR[i] } : {}}
            >
              Setor {s.nome}
            </button>
          ))}
        </div>

        {setorSel && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranking congregações do setor */}
            <ChartCard title={`Congregações — Setor ${setorSel.nome} (${ano})`} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={Math.max(180, setorSel.congregacoes.length * 32)}>
                <BarChart
                  layout="vertical"
                  data={setorSel.congregacoes}
                  margin={{ top: 4, right: 80, bottom: 4, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={moedaCurta} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
                  <Bar
                    dataKey="total"
                    fill={COR_SETOR[setorIdx % COR_SETOR.length]}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                    label={{ position: 'right', formatter: moedaCurta, fontSize: 10, fill: '#64748b' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Evolução mensal do setor */}
            <ChartCard title={`Evolução Mensal — Setor ${setorSel.nome} (${ano})`}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={setorSel.evolucaoMensal} margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={moedaCurta} tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    name={`Setor ${setorSel.nome}`}
                    stroke={COR_SETOR[setorIdx % COR_SETOR.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-right text-xs text-gray-500">
                Total anual: <span className="font-bold text-gray-700">{formatarMoeda(setorSel.totalAno)}</span>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── SEÇÃO 3: Comparativo de Setores ────────────────────────────────── */}
      <div>
        <SectionTitle>Seção 3 — Comparativo de Setores</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Todos os setores por mês — empilhado */}
          <ChartCard title={`Contribuição por Setor por Mês — ${ano}`} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosEmpilhados} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={moedaCurta} tick={{ fontSize: 10 }} width={68} />
                <Tooltip
                  formatter={(v, name) => [formatarMoeda(v), `Setor ${name.replace('S', '')}`]}
                  contentStyle={TT}
                />
                <Legend
                  iconSize={8}
                  iconType="square"
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(name) => `Setor ${name.replace('S', '')}`}
                />
                {data.setores.map((s, i) => (
                  <Bar
                    key={s.id}
                    dataKey={`S${s.nome}`}
                    stackId="a"
                    fill={COR_SETOR[i % COR_SETOR.length]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Ranking de setores no ano */}
          <ChartCard title={`Ranking de Setores — ${ano}`}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={data.rankingSetores}
                margin={{ top: 4, right: 72, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={moedaCurta} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={40} />
                <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={TT} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: 'right', formatter: moedaCurta, fontSize: 10, fill: '#64748b' }}>
                  {data.rankingSetores.map((_, i) => (
                    <Cell key={i} fill={COR_SETOR[i % COR_SETOR.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [aba, setAba] = useState('resumo');
  const [anoGraficos, setAnoGraficos] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });

  const tabs = [
    { key: 'resumo',   label: 'Resumo'   },
    { key: 'graficos', label: 'Gráficos' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho + abas */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data
              ? `Visão geral — ${nomeMes(data.financeiro.mesAtual)} de ${data.financeiro.anoAtual}`
              : 'Carregando...'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                aba === t.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba */}
      {aba === 'resumo' && (
        isLoading
          ? <PageSpinner />
          : data && <TabResumo data={data} />
      )}
      {aba === 'graficos' && (
        <TabGraficos ano={anoGraficos} setAno={setAnoGraficos} />
      )}
    </div>
  );
}
