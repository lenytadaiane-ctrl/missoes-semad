import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const MESES_L = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_S = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const KEYS    = ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12'];
const MES_ATUAL = new Date().getMonth() + 1;

const fmt  = (v) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
const fmtK = (v) => (!v || v === 0) ? '' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const keyMes = k => parseInt(k.substring(1));

const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

// ── Célula clicável ───────────────────────────────────────────────────────────
function Celula({ valor, onClick }) {
  const vazio = !valor || valor === 0;
  return (
    <td onClick={onClick}
      className={`px-1 py-2 text-right text-xs whitespace-nowrap cursor-pointer select-none transition-colors
        ${vazio ? 'text-gray-200 hover:bg-blue-50 hover:text-blue-400' : 'text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700'}`}
      title={valor ? fmt(valor) : 'Clique para lançar'}>
      {vazio ? '—' : fmtK(valor)}
    </td>
  );
}

// ── Modal de lançamento rápido ────────────────────────────────────────────────
function ModalLancamento({ open, onClose, prefill, ano, onSalvo }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const qc = useQueryClient();
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const [setorSel, setSetorSel] = useState(prefill?.setorId || '');
  const { data: congregacoes = [] } = useQuery({
    queryKey: ['congregacoes', setorSel],
    queryFn: () => api.get('/congregacoes', { params: { setorId: setorSel || undefined } }).then(r => r.data),
  });

  async function onSubmit(data) {
    try {
      await api.post('/ofertas-missionarias/upsert', { ...data, anoReferencia: ano });
      toast.success('Lançamento salvo!');
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-capital']);
      qc.invalidateQueries(['pivot-interior']);
      qc.invalidateQueries(['ofertas']);
      onSalvo?.();
      onClose();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar / Editar Oferta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Setor</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={setorSel} onChange={e => setSetorSel(e.target.value)}>
            <option value="">Todos</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Congregação *</label>
          <select required {...register('congregacaoId')} defaultValue={prefill?.congregacaoId || ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Selecione</option>
            {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Mês *</label>
            <select required {...register('mesReferencia')} defaultValue={prefill?.mes || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor (R$) *</label>
            <input required type="number" step="0.01" min="0" {...register('valor')}
              defaultValue={prefill?.valor || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Observação</label>
          <input {...register('observacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Toggle Anual / Mensal ─────────────────────────────────────────────────────
function ModoToolbar({ modo, setModo, mesSel, setMesSel }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setModo('anual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
            ${modo === 'anual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          📅 Panorama Anual
        </button>
        <button onClick={() => setModo('mensal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
            ${modo === 'mensal' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          📆 Mensal
        </button>
      </div>
      {modo === 'mensal' && (
        <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none"
          value={mesSel} onChange={e => setMesSel(e.target.value)}>
          {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      )}
    </div>
  );
}

// ── Tabela pivot simples (setores) ────────────────────────────────────────────
function PivotSetor({ linhas, modo, mesSel, loading }) {
  const mesK = `m${mesSel}`;
  const totaisAnual = KEYS.map(k => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalMes    = linhas.reduce((s, l) => s + (parseFloat(l[mesK]) || 0), 0);
  const totalGeral  = modo === 'anual' ? linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0) : totalMes;

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!linhas.length) return <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado encontrado.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[160px] border-r border-gray-200">Setor</th>
            {modo === 'anual'
              ? MESES_S.slice(1).map((m, i) => <th key={i} className="px-2 py-3 text-right text-xs font-bold text-gray-500 uppercase min-w-[72px]">{m}</th>)
              : <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase min-w-[130px]">{MESES_L[parseInt(mesSel)]}</th>
            }
            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase min-w-[100px] border-l border-gray-200">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.map((l, idx) => {
            const vMes   = parseFloat(l[mesK]) || 0;
            const total  = modo === 'anual' ? parseFloat(l.total) || 0 : vMes;
            return (
              <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${l.tipo === 'CAPITAL' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                    {l.nome}
                  </span>
                </td>
                {modo === 'anual'
                  ? KEYS.map((k, i) => { const v = parseFloat(l[k]) || 0; return <td key={i} className={`px-2 py-2.5 text-right text-xs whitespace-nowrap ${v === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>{v === 0 ? '—' : fmtK(v)}</td>; })
                  : <td className={`px-3 py-2.5 text-right text-sm whitespace-nowrap ${vMes === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>{vMes === 0 ? '—' : fmtK(vMes)}</td>
                }
                <td className="px-3 py-2.5 text-right font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">{total > 0 ? fmtK(total) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
            {modo === 'anual'
              ? totaisAnual.map((t, i) => <td key={i} className={`px-2 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>{t === 0 ? '—' : fmtK(t)}</td>)
              : <td className="px-3 py-3 text-right text-sm font-semibold">{totalMes === 0 ? '—' : fmtK(totalMes)}</td>
            }
            <td className="px-3 py-3 text-right font-bold border-l border-blue-500">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Tabela pivot de congregações (colunas flexíveis, agrupada por setor ou cidade) ─
function PivotCongs({ linhas, colunas, agrupador = 'setor', loading, onCelulaClick }) {
  const grupos = {};
  linhas.forEach(l => {
    const chave = (agrupador === 'cidade' ? l.cidade : l.setor) || '(Sem ' + agrupador + ')';
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(l);
  });

  const totaisGeral = colunas.map(k => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalGeral  = totaisGeral.reduce((s, v) => s + v, 0);
  const colSpan     = 1 + colunas.length + 1;

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!linhas.length) return <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado encontrado.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[180px] border-r border-gray-200">Congregação</th>
            {colunas.map((k, i) => (
              <th key={i} className="px-1 py-3 text-right text-xs font-bold text-gray-500 uppercase min-w-[60px]">
                {MESES_S[keyMes(k)]}
              </th>
            ))}
            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase min-w-[100px] border-l border-gray-200">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grupos).map(([grupo, gLinhas]) => {
            const subTotais = colunas.map(k => gLinhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
            const subTotal  = subTotais.reduce((s, v) => s + v, 0);
            return (
              <>
                <tr key={`h-${grupo}`} className="bg-gray-100 border-y border-gray-200">
                  <td colSpan={colSpan} className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {agrupador === 'cidade' ? '📍' : '🗂️'} {grupo}
                    </span>
                  </td>
                </tr>
                {gLinhas.map((cong, idx) => {
                  const vals  = colunas.map(k => parseFloat(cong[k]) || 0);
                  const total = vals.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={cong.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap text-xs font-medium">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cong.tipo === 'CAPITAL' ? 'bg-blue-400' : 'bg-violet-400'}`} />
                          {cong.nome}
                        </span>
                      </td>
                      {colunas.map((k, i) => (
                        onCelulaClick
                          ? <Celula key={i} valor={vals[i]} onClick={() => onCelulaClick(cong, keyMes(k))} />
                          : <td key={i} className={`px-1 py-2 text-right text-xs whitespace-nowrap ${vals[i] === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>{vals[i] === 0 ? '—' : fmtK(vals[i])}</td>
                      ))}
                      <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">{total > 0 ? fmtK(total) : '—'}</td>
                    </tr>
                  );
                })}
                <tr key={`sub-${grupo}`} className="bg-gray-100 border-b border-gray-300">
                  <td className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600 border-r border-gray-200">Subtotal</td>
                  {subTotais.map((t, i) => (
                    <td key={i} className={`px-1 py-1.5 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'text-gray-200' : 'text-gray-700'}`}>{t === 0 ? '—' : fmtK(t)}</td>
                  ))}
                  <td className="px-3 py-1.5 text-right text-xs font-bold text-blue-700 border-l border-gray-200">{fmtK(subTotal)}</td>
                </tr>
              </>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
            {totaisGeral.map((t, i) => (
              <td key={i} className={`px-1 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>{t === 0 ? '—' : fmtK(t)}</td>
            ))}
            <td className="px-3 py-3 text-right font-bold border-l border-blue-500">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Aba Capital (com setores) ─────────────────────────────────────────────────
function TabCapital({ ano }) {
  const [subAba, setSubAba]   = useState('setores');
  const [modo, setModo]       = useState('anual');
  const [mesSel, setMesSel]   = useState(String(MES_ATUAL));
  const [modoCong, setModoCong] = useState('lancamentos'); // 'lancamentos' | 'atual'
  const [cidadeSel, setCidadeSel] = useState('');
  const [modal, setModal]     = useState(false);
  const [prefill, setPrefill] = useState(null);
  const qc = useQueryClient();

  const { data: dataSetores, isLoading: loadSetores } = useQuery({
    queryKey: ['pivot-setores', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/setores', { params: { ano } }).then(r => r.data),
  });
  const { data: dataCap, isLoading: loadCap } = useQuery({
    queryKey: ['pivot-capital', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, tipo: 'CAPITAL' } }).then(r => r.data),
  });

  const todasCap = dataCap?.linhas || [];
  const cidades  = [...new Set(todasCap.map(l => l.cidade).filter(Boolean))].sort();
  const congsCidade = cidadeSel ? todasCap.filter(l => l.cidade === cidadeSel) : [];

  // Para "Por Congregação": decide quais colunas exibir
  const mesesComDados = KEYS.filter(k => todasCap.some(l => parseFloat(l[k]) > 0));
  const colunasAnualMensal = modo === 'anual' ? KEYS : [`m${mesSel}`];
  const colunasCong = modoCong === 'lancamentos'
    ? (mesesComDados.length ? mesesComDados : KEYS)
    : [`m${MES_ATUAL}`];

  function abrirCelula(cong, mes) {
    setPrefill({ congregacaoId: cong.id, setorId: cong.setorId, mes, valor: parseFloat(cong[`m${mes}`]) || '' });
    setModal(true);
  }

  const SUB_ABAS = [
    { id: 'setores',      label: '🗂️ Por Setor' },
    { id: 'cidades',      label: '📍 Por Cidade' },
    { id: 'congregacoes', label: '🏘️ Por Congregação' },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {SUB_ABAS.map(s => (
            <button key={s.id} onClick={() => setSubAba(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                ${subAba === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Anual/Mensal — só para setor e cidade */}
        {(subAba === 'setores' || subAba === 'cidades') && (
          <ModoToolbar modo={modo} setModo={setModo} mesSel={mesSel} setMesSel={setMesSel} />
        )}

        {/* Seletor de cidade */}
        {subAba === 'cidades' && (
          <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none"
            value={cidadeSel} onChange={e => setCidadeSel(e.target.value)}>
            <option value="">Selecione uma cidade...</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Toggle meses — só para congregações */}
        {subAba === 'congregacoes' && (
          <>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setModoCong('lancamentos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${modoCong === 'lancamentos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                📋 Meses com lançamentos
              </button>
              <button onClick={() => setModoCong('atual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${modoCong === 'atual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                📆 {MESES_L[MES_ATUAL]} (atual)
              </button>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <p className="text-xs text-gray-400 hidden sm:block">Clique em célula para lançar</p>
              <Button onClick={() => { setPrefill(null); setModal(true); }}>+ Novo Lançamento</Button>
            </div>
          </>
        )}
      </div>

      {/* Por Setor */}
      {subAba === 'setores' && (
        <PivotSetor linhas={dataSetores?.linhas || []} modo={modo} mesSel={mesSel} loading={loadSetores} />
      )}

      {/* Por Cidade */}
      {subAba === 'cidades' && !cidadeSel && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Selecione uma cidade acima para ver as congregações
        </div>
      )}
      {subAba === 'cidades' && cidadeSel && (
        <PivotCongs
          linhas={congsCidade}
          colunas={colunasAnualMensal}
          agrupador="setor"
          loading={loadCap}
          onCelulaClick={abrirCelula}
        />
      )}

      {/* Por Congregação */}
      {subAba === 'congregacoes' && (
        <PivotCongs
          linhas={todasCap}
          colunas={colunasCong}
          agrupador="setor"
          loading={loadCap}
          onCelulaClick={abrirCelula}
        />
      )}

      <ModalLancamento open={modal} onClose={() => setModal(false)} prefill={prefill} ano={ano}
        onSalvo={() => { qc.invalidateQueries(['pivot-setores']); qc.invalidateQueries(['pivot-capital']); }} />
    </div>
  );
}

// ── Aba Interior (fora dos setores, agrupado por cidade) ──────────────────────
function TabInterior({ ano }) {
  const [subAba, setSubAba]   = useState('cidades');
  const [modo, setModo]       = useState('anual');
  const [mesSel, setMesSel]   = useState(String(MES_ATUAL));
  const [modoCong, setModoCong] = useState('lancamentos');
  const [cidadeSel, setCidadeSel] = useState('');
  const [modal, setModal]     = useState(false);
  const [prefill, setPrefill] = useState(null);
  const qc = useQueryClient();

  const { data: dataInt, isLoading: loadInt } = useQuery({
    queryKey: ['pivot-interior', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, tipo: 'INTERIOR' } }).then(r => r.data),
  });

  const todasInt = dataInt?.linhas || [];
  const cidades  = [...new Set(todasInt.map(l => l.cidade).filter(Boolean))].sort();
  const congsCity = cidadeSel ? todasInt.filter(l => l.cidade === cidadeSel) : [];

  const mesesComDados = KEYS.filter(k => todasInt.some(l => parseFloat(l[k]) > 0));
  const colunasAnualMensal = modo === 'anual' ? KEYS : [`m${mesSel}`];
  const colunasCong = modoCong === 'lancamentos'
    ? (mesesComDados.length ? mesesComDados : KEYS)
    : [`m${MES_ATUAL}`];

  function abrirCelula(cong, mes) {
    setPrefill({ congregacaoId: cong.id, mes, valor: parseFloat(cong[`m${mes}`]) || '' });
    setModal(true);
  }

  const SUB_ABAS = [
    { id: 'cidades',      label: '📍 Por Cidade' },
    { id: 'congregacoes', label: '🏘️ Por Congregação' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {SUB_ABAS.map(s => (
            <button key={s.id} onClick={() => setSubAba(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                ${subAba === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {subAba === 'cidades' && (
          <>
            <ModoToolbar modo={modo} setModo={setModo} mesSel={mesSel} setMesSel={setMesSel} />
            <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none"
              value={cidadeSel} onChange={e => setCidadeSel(e.target.value)}>
              <option value="">Selecione uma cidade...</option>
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}

        {subAba === 'congregacoes' && (
          <>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setModoCong('lancamentos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${modoCong === 'lancamentos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                📋 Meses com lançamentos
              </button>
              <button onClick={() => setModoCong('atual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                  ${modoCong === 'atual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                📆 {MESES_L[MES_ATUAL]} (atual)
              </button>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <p className="text-xs text-gray-400 hidden sm:block">Clique em célula para lançar</p>
              <Button onClick={() => { setPrefill(null); setModal(true); }}>+ Novo Lançamento</Button>
            </div>
          </>
        )}
      </div>

      {subAba === 'cidades' && !cidadeSel && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Selecione uma cidade acima para ver as congregações
        </div>
      )}
      {subAba === 'cidades' && cidadeSel && (
        <PivotCongs
          linhas={congsCity}
          colunas={colunasAnualMensal}
          agrupador="cidade"
          loading={loadInt}
          onCelulaClick={abrirCelula}
        />
      )}
      {subAba === 'congregacoes' && (
        <PivotCongs
          linhas={todasInt}
          colunas={colunasCong}
          agrupador="cidade"
          loading={loadInt}
          onCelulaClick={abrirCelula}
        />
      )}

      <ModalLancamento open={modal} onClose={() => setModal(false)} prefill={prefill} ano={ano}
        onSalvo={() => qc.invalidateQueries(['pivot-interior'])} />
    </div>
  );
}

// ── Aba Lançamentos ───────────────────────────────────────────────────────────
function TabLancamentos({ ano }) {
  const [filtros, setFiltros] = useState({ mes: '', tipo: '', setorId: '', congregacaoId: '', page: 1 });
  const [modal, setModal] = useState(false);
  const [modalImport, setModalImport] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const qc = useQueryClient();

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: congregacoes = [] } = useQuery({
    queryKey: ['congregacoes', filtros.setorId],
    queryFn: () => api.get('/congregacoes', { params: { setorId: filtros.setorId || undefined } }).then(r => r.data),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['ofertas', ano, filtros],
    queryFn: () => api.get('/ofertas-missionarias', { params: { ano, ...filtros } }).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  function openNew()  { setEditRecord(null); reset({ anoReferencia: ano }); setModal(true); }
  function openEdit(r){ setEditRecord(r); reset({ congregacaoId: String(r.congregacaoId), mesReferencia: String(r.mesReferencia), anoReferencia: r.anoReferencia, valor: r.valor, observacao: r.observacao || '' }); setModal(true); }

  async function onSubmit(d) {
    try {
      if (editRecord) await api.put(`/ofertas-missionarias/${editRecord.id}`, d);
      else await api.post('/ofertas-missionarias', d);
      toast.success(editRecord ? 'Atualizado' : 'Registrado');
      setModal(false);
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-capital']);
      qc.invalidateQueries(['pivot-interior']);
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir lançamento?')) return;
    try {
      await api.delete(`/ofertas-missionarias/${id}`);
      toast.success('Excluído');
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-capital']);
      qc.invalidateQueries(['pivot-interior']);
    } catch (err) { toast.error(err.message); }
  }

  const columns = [
    { key: 'cong',  header: 'Congregação', render: r => r.congregacao?.nome },
    { key: 'setor', header: 'Setor',        render: r => r.congregacao?.setor?.nome || '—' },
    { key: 'tipo',  header: 'Tipo',         render: r => r.congregacao?.tipo },
    { key: 'mes',   header: 'Mês',          render: r => MESES_L[r.mesReferencia] },
    { key: 'ano',   header: 'Ano',          render: r => r.anoReferencia },
    { key: 'valor', header: 'Valor',        render: r => fmt(r.valor) },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline text-xs">Editar</button>
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.mes} onChange={e => setFiltros(f => ({ ...f, mes: e.target.value, page: 1 }))}>
            <option value="">Todos os meses</option>
            {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value, page: 1 }))}>
            <option value="">Capital + Interior</option>
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.setorId} onChange={e => setFiltros(f => ({ ...f, setorId: e.target.value, congregacaoId: '', page: 1 }))}>
            <option value="">Todos os setores</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.congregacaoId} onChange={e => setFiltros(f => ({ ...f, congregacaoId: e.target.value, page: 1 }))}>
            <option value="">Todas as congregações</option>
            {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModalImport(true)}>⬆ Importar Arquivo</Button>
          <Button onClick={openNew}>+ Novo Lançamento</Button>
        </div>
      </div>

      {data && (
        <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="text-blue-700">{data.total} registro(s)</span>
          <span className="font-bold text-blue-900">Total: {fmt(data.soma)}</span>
        </div>
      )}

      <Table columns={columns} data={data?.data || []} loading={isLoading} />

      {data && data.total > 50 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total: {data.total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={filtros.page <= 1} onClick={() => setFiltros(f => ({ ...f, page: f.page - 1 }))}>Anterior</Button>
            <span className="py-2 px-3">Pág. {filtros.page}</span>
            <Button variant="secondary" disabled={filtros.page * 50 >= data.total} onClick={() => setFiltros(f => ({ ...f, page: f.page + 1 }))}>Próxima</Button>
          </div>
        </div>
      )}

      <ModalImportacao open={modalImport} onClose={() => setModalImport(false)} ano={ano}
        onImportado={() => setFiltros(f => ({ ...f }))} />

      <Modal open={modal} onClose={() => setModal(false)} title={editRecord ? 'Editar Lançamento' : 'Novo Lançamento'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Setor (filtro)</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onChange={e => setFiltros(f => ({ ...f, setorId: e.target.value }))}>
              <option value="">Todos</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Congregação *</label>
            <select required {...register('congregacaoId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mês *</label>
              <select required {...register('mesReferencia')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ano *</label>
              <input type="number" required {...register('anoReferencia')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor (R$) *</label>
            <input required type="number" step="0.01" min="0" {...register('valor')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Observação</label>
            <textarea rows={2} {...register('observacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : editRecord ? 'Salvar' : 'Lançar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Modal Importação de Arquivo ───────────────────────────────────────────────
function ModalImportacao({ open, onClose, ano, onImportado }) {
  const [arquivo, setArquivo]       = useState(null);
  const [mes, setMes]               = useState(String(MES_ATUAL));
  const [anoRef, setAnoRef]         = useState(String(ano));
  const [carregando, setCarregando] = useState(false);
  const [preview, setPreview]       = useState(null);
  const [linhasEdit, setLinhasEdit] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const { data: congregacoes = [] }  = useQuery({
    queryKey: ['congregacoes-todas'],
    queryFn: () => api.get('/congregacoes').then(r => r.data),
  });
  const qc = useQueryClient();

  function resetar() {
    setArquivo(null); setPreview(null); setLinhasEdit([]);
  }

  function handleClose() { resetar(); onClose(); }

  async function enviarPreview() {
    if (!arquivo) return toast.error('Selecione um arquivo');
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('mesReferencia', mes);
    form.append('anoReferencia', anoRef);
    setCarregando(true);
    try {
      const res = await api.post('/ofertas-missionarias/importar-preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res.data);
      setLinhasEdit(res.data.preview.map(r => ({ ...r, _skip: !r.matched })));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erro ao processar arquivo');
    } finally { setCarregando(false); }
  }

  function atualizarCong(idx, congregacaoId) {
    setLinhasEdit(ls => ls.map((l, i) => {
      if (i !== idx) return l;
      const cong = congregacoes.find(c => String(c.id) === String(congregacaoId));
      return { ...l, congregacaoId: cong?.id || null, congregacaoNome: cong?.nome || null, _skip: !cong };
    }));
  }

  function toggleSkip(idx) {
    setLinhasEdit(ls => ls.map((l, i) => i === idx ? { ...l, _skip: !l._skip } : l));
  }

  async function confirmar() {
    const linhas = linhasEdit.filter(l => !l._skip && l.congregacaoId && l.valor > 0);
    if (linhas.length === 0) return toast.error('Nenhuma linha selecionada para importar');
    setConfirmando(true);
    try {
      const res = await api.post('/ofertas-missionarias/confirmar-importacao', {
        linhas, mesReferencia: preview.mesReferencia, anoReferencia: preview.anoReferencia,
      });
      toast.success(`${res.data.importados} lançamento(s) importado(s)!`);
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-capital']);
      qc.invalidateQueries(['pivot-interior']);
      onImportado?.();
      handleClose();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally { setConfirmando(false); }
  }

  if (!open) return null;
  const linhasSelecionadas = linhasEdit.filter(l => !l._skip && l.congregacaoId).length;

  return (
    <Modal open={open} onClose={handleClose} title="Importar Ofertas por Arquivo">
      <div className="space-y-4 min-w-[600px] max-w-full">
        {!preview ? (
          <>
            <p className="text-sm text-gray-500">
              Envie uma planilha Excel (<strong>.xlsx / .xls</strong>) ou PDF com colunas de congregação e valor.
              O sistema fará a correspondência automática.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Mês de referência *</label>
                <select value={mes} onChange={e => setMes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ano *</label>
                <select value={anoRef} onChange={e => setAnoRef(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {anos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Arquivo (.xlsx, .xls, .pdf) *</label>
              <input type="file" accept=".xlsx,.xls,.pdf,.csv"
                onChange={e => setArquivo(e.target.files?.[0] || null)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            {arquivo && (
              <p className="text-xs text-gray-400">Selecionado: <strong>{arquivo.name}</strong> ({(arquivo.size/1024).toFixed(1)} KB)</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
              <Button onClick={enviarPreview} disabled={carregando || !arquivo}>
                {carregando ? 'Processando...' : 'Analisar Arquivo'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{preview.total}</span> linhas encontradas —{' '}
                <span className="text-green-600 font-semibold">{preview.matched}</span> correspondidas automaticamente,{' '}
                <span className="text-orange-500 font-semibold">{preview.total - preview.matched}</span> sem correspondência.
              </div>
              <button onClick={resetar} className="text-xs text-blue-500 hover:underline">↩ Trocar arquivo</button>
            </div>
            <p className="text-xs text-gray-400">
              Período: <strong>{MESES_L[preview.mesReferencia]} / {preview.anoReferencia}</strong>.
              Revise as linhas, corrija as não encontradas e confirme a importação.
            </p>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-6"><input type="checkbox" checked={linhasEdit.every(l => !l._skip)} onChange={e => setLinhasEdit(ls => ls.map(l => ({ ...l, _skip: !e.target.checked })))} /></th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Nome no arquivo</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500">Congregação correspondente</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasEdit.map((l, idx) => (
                    <tr key={idx} className={`border-t border-gray-100 ${l._skip ? 'opacity-40' : ''}`}>
                      <td className="px-2 py-1.5">
                        <input type="checkbox" checked={!l._skip} onChange={() => toggleSkip(idx)} />
                      </td>
                      <td className="px-2 py-1.5 max-w-[160px] truncate" title={l.nomeOriginal}>
                        {l.nomeOriginal}
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.congregacaoId || ''}
                          onChange={e => atualizarCong(idx, e.target.value)}
                          className={`w-full text-xs border rounded px-1.5 py-1 ${l.congregacaoId ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                          <option value="">— Selecionar —</option>
                          {congregacoes.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium text-gray-700">
                        {fmt(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500">{linhasSelecionadas} linha(s) serão importadas</span>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={handleClose}>Cancelar</Button>
                <Button onClick={confirmar} disabled={confirmando || linhasSelecionadas === 0}>
                  {confirmando ? 'Importando...' : `Confirmar Importação (${linhasSelecionadas})`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Modal Nova Congregação ────────────────────────────────────────────────────
function ModalNovaCongregacao({ open, onClose }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const qc = useQueryClient();
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });

  async function onSubmit(data) {
    try {
      await api.post('/congregacoes', data);
      toast.success('Congregação criada!');
      qc.invalidateQueries(['congregacoes']);
      qc.invalidateQueries(['pivot-capital']);
      qc.invalidateQueries(['pivot-interior']);
      reset();
      onClose();
    } catch (e) { toast.error(e.response?.data?.error || e.message); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Congregação">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Nome *</label>
            <input required {...register('nome')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tipo *</label>
            <select required {...register('tipo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione</option>
              <option value="CAPITAL">Capital</option>
              <option value="INTERIOR">Interior</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Setor (Capital)</label>
            <select {...register('setorId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Sem setor</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Cidade</label>
            <input {...register('cidade')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Pastor</label>
            <input {...register('pastor')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Endereço</label>
            <input {...register('endereco')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Meta de Oferta (R$)</label>
            <input type="number" step="0.01" {...register('metaOferta')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Criar Congregação'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Financeiro() {
  const [aba, setAba] = useState('capital');
  const [ano, setAno] = useState(String(anoAtual));
  const [modalCong, setModalCong] = useState(false);

  const ABAS = [
    { id: 'capital',     label: '🏙️ Capital' },
    { id: 'interior',    label: '🌳 Interior' },
    { id: 'lancamentos', label: '📋 Lançamentos' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800 mr-2">Ofertas Missionárias</h1>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-sm">
          <span className="text-gray-400 text-xs">Ano:</span>
          <select className="bg-transparent focus:outline-none font-medium text-gray-700"
            value={ano} onChange={e => setAno(e.target.value)}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Capital
          <span className="inline-block w-2 h-2 rounded-full bg-violet-500 ml-1" /> Interior
        </div>
        <div className="ml-auto">
          <Button onClick={() => setModalCong(true)}>+ Nova Congregação</Button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'capital'     && <TabCapital ano={ano} />}
      {aba === 'interior'    && <TabInterior ano={ano} />}
      {aba === 'lancamentos' && <TabLancamentos ano={ano} />}

      <ModalNovaCongregacao open={modalCong} onClose={() => setModalCong(false)} />
    </div>
  );
}
