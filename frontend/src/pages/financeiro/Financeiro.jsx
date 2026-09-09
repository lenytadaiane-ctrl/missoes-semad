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
const KEYS   = ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12'];

const fmt  = (v) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
const fmtK = (v) => (!v || v === 0) ? '' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

// ── Célula clicável ───────────────────────────────────────────────────────────
function Celula({ valor, onClick }) {
  const vazio = !valor || valor === 0;
  return (
    <td
      onClick={onClick}
      className={`px-1 py-2 text-right text-xs whitespace-nowrap cursor-pointer select-none transition-colors
        ${vazio
          ? 'text-gray-200 hover:bg-blue-50 hover:text-blue-400'
          : 'text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700'}`}
      title={valor ? fmt(valor) : 'Clique para lançar'}
    >
      {vazio ? '—' : fmtK(valor)}
    </td>
  );
}

// ── Modal de lançamento rápido ────────────────────────────────────────────────
function ModalLancamento({ open, onClose, prefill, ano, onSalvo }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
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
      qc.invalidateQueries(['pivot-congs']);
      qc.invalidateQueries(['pivot-congs-setor']);
      qc.invalidateQueries(['pivot-cidades']);
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
          <select required {...register('congregacaoId')}
            defaultValue={prefill?.congregacaoId || ''}
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

// ── Toolbar de modo (Anual / Mensal) ─────────────────────────────────────────
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
        <select
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none"
          value={mesSel} onChange={e => setMesSel(e.target.value)}>
          {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      )}
    </div>
  );
}

// ── Tabela pivot: linhas simples (setores ou cidades) ─────────────────────────
function PivotTable({ linhas, nomeHeader, getLabel, modo, mesSel, loading, extraCols = [] }) {
  const mesK = `m${mesSel}`;

  const totaisAnual = KEYS.map(k => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalMes    = linhas.reduce((s, l) => s + (parseFloat(l[mesK]) || 0), 0);
  const totalGeral  = modo === 'anual'
    ? linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0)
    : totalMes;

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!linhas.length) return <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado encontrado.</p>;

  const colSpanTotal = 1 + extraCols.length + (modo === 'anual' ? 12 : 1) + 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[160px] border-r border-gray-200">
              {nomeHeader}
            </th>
            {extraCols.map((col, i) => (
              <th key={i} className="px-2 py-3 text-right text-xs font-bold text-gray-500 uppercase min-w-[50px]">{col.header}</th>
            ))}
            {modo === 'anual' ? (
              MESES_S.slice(1).map((m, i) => (
                <th key={i} className="px-2 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[72px]">{m}</th>
              ))
            ) : (
              <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[130px]">
                {MESES_L[parseInt(mesSel)]}
              </th>
            )}
            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[100px] border-l border-gray-200">
              {modo === 'anual' ? 'Total Anual' : 'Total'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.map((linha, idx) => {
            const valorMes  = parseFloat(linha[mesK]) || 0;
            const totalLinha = modo === 'anual' ? parseFloat(linha.total) || 0 : valorMes;
            return (
              <tr key={linha.id || linha.cidade || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap text-sm">
                  {getLabel(linha)}
                </td>
                {extraCols.map((col, i) => (
                  <td key={i} className="px-2 py-2.5 text-center text-xs text-gray-400">{col.render(linha)}</td>
                ))}
                {modo === 'anual' ? (
                  KEYS.map((k, i) => {
                    const v = parseFloat(linha[k]) || 0;
                    return (
                      <td key={i} className={`px-2 py-2.5 text-right text-xs whitespace-nowrap ${v === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>
                        {v === 0 ? '—' : fmtK(v)}
                      </td>
                    );
                  })
                ) : (
                  <td className={`px-3 py-2.5 text-right text-sm whitespace-nowrap ${valorMes === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>
                    {valorMes === 0 ? '—' : fmtK(valorMes)}
                  </td>
                )}
                <td className="px-3 py-2.5 text-right font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">
                  {totalLinha > 0 ? fmtK(totalLinha) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
            {extraCols.map((col, i) => (
              <td key={i} className="px-2 py-3 text-center text-xs opacity-60">
                {col.total ? col.total(linhas) : ''}
              </td>
            ))}
            {modo === 'anual' ? (
              totaisAnual.map((t, i) => (
                <td key={i} className={`px-2 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>
                  {t === 0 ? '—' : fmtK(t)}
                </td>
              ))
            ) : (
              <td className="px-3 py-3 text-right text-sm font-semibold whitespace-nowrap">
                {totalMes === 0 ? '—' : fmtK(totalMes)}
              </td>
            )}
            <td className="px-3 py-3 text-right font-bold border-l border-blue-500 whitespace-nowrap">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Tabela pivot: congregações agrupadas por setor ────────────────────────────
function PivotTableCongs({ linhas, modo, mesSel, loading, onCelulaClick }) {
  const mesK = `m${mesSel}`;

  const grupos = {};
  linhas.forEach(l => {
    const chave = l.setor || '(Sem setor)';
    if (!grupos[chave]) grupos[chave] = { linhas: [] };
    grupos[chave].linhas.push(l);
  });

  const totaisAnual = KEYS.map(k => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalMes    = linhas.reduce((s, l) => s + (parseFloat(l[mesK]) || 0), 0);
  const totalGeral  = modo === 'anual'
    ? linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0)
    : totalMes;

  const numColsData = modo === 'anual' ? 12 : 1;
  const colSpanTotal = 1 + numColsData + 1;

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!linhas.length) return <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado encontrado.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[180px] border-r border-gray-200">
              Congregação
            </th>
            {modo === 'anual' ? (
              MESES_S.slice(1).map((m, i) => (
                <th key={i} className="px-1 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[60px]">{m}</th>
              ))
            ) : (
              <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[130px]">
                {MESES_L[parseInt(mesSel)]}
              </th>
            )}
            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[100px] border-l border-gray-200">
              {modo === 'anual' ? 'Total Anual' : 'Total'}
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grupos).map(([nomeSetor, grupo]) => {
            const subAnual = KEYS.map(k => grupo.linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
            const subMes   = grupo.linhas.reduce((s, l) => s + (parseFloat(l[mesK]) || 0), 0);
            const subtotal = modo === 'anual'
              ? grupo.linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0)
              : subMes;

            return (
              <>
                <tr key={`h-${nomeSetor}`} className="bg-gray-100 border-y border-gray-200">
                  <td colSpan={colSpanTotal} className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setor {nomeSetor}</span>
                  </td>
                </tr>
                {grupo.linhas.map((cong, idx) => {
                  const valorMes  = parseFloat(cong[mesK]) || 0;
                  const totalCong = modo === 'anual' ? parseFloat(cong.total) || 0 : valorMes;
                  return (
                    <tr key={cong.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap text-xs font-medium">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cong.tipo === 'CAPITAL' ? 'bg-blue-400' : 'bg-violet-400'}`} />
                          {cong.nome}
                        </span>
                      </td>
                      {modo === 'anual' ? (
                        KEYS.map((k, i) => (
                          <Celula key={i} valor={parseFloat(cong[k]) || 0}
                            onClick={() => onCelulaClick?.(cong, i + 1)} />
                        ))
                      ) : (
                        <td
                          className={`px-3 py-2 text-right text-sm whitespace-nowrap cursor-pointer select-none transition-colors
                            ${valorMes === 0 ? 'text-gray-200 hover:bg-blue-50 hover:text-blue-400' : 'text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700'}`}
                          title={valorMes ? fmt(valorMes) : 'Clique para lançar'}
                          onClick={() => onCelulaClick?.(cong, parseInt(mesSel))}
                        >
                          {valorMes === 0 ? '—' : fmtK(valorMes)}
                        </td>
                      )}
                      <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">
                        {totalCong > 0 ? fmtK(totalCong) : '—'}
                      </td>
                    </tr>
                  );
                })}
                <tr key={`sub-${nomeSetor}`} className="bg-gray-100 border-b border-gray-300">
                  <td className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600 border-r border-gray-200">
                    Subtotal {nomeSetor}
                  </td>
                  {modo === 'anual' ? (
                    subAnual.map((t, i) => (
                      <td key={i} className={`px-1 py-1.5 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'text-gray-200' : 'text-gray-700'}`}>
                        {t === 0 ? '—' : fmtK(t)}
                      </td>
                    ))
                  ) : (
                    <td className={`px-3 py-1.5 text-right text-sm font-semibold whitespace-nowrap ${subMes === 0 ? 'text-gray-200' : 'text-gray-700'}`}>
                      {subMes === 0 ? '—' : fmtK(subMes)}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-right text-xs font-bold text-blue-700 border-l border-gray-200">{fmtK(subtotal)}</td>
                </tr>
              </>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
            {modo === 'anual' ? (
              totaisAnual.map((t, i) => (
                <td key={i} className={`px-1 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>
                  {t === 0 ? '—' : fmtK(t)}
                </td>
              ))
            ) : (
              <td className="px-3 py-3 text-right text-sm font-semibold whitespace-nowrap">
                {totalMes === 0 ? '—' : fmtK(totalMes)}
              </td>
            )}
            <td className="px-3 py-3 text-right font-bold border-l border-blue-500 whitespace-nowrap">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Aba Setores (hub com 3 sub-visões + toggle Anual/Mensal) ─────────────────
function TabRelatorioSetor({ ano }) {
  const [subAba, setSubAba] = useState('setores');
  const [modo, setModo]     = useState('anual');
  const [mesSel, setMesSel] = useState(String(new Date().getMonth() + 1));
  const [modal, setModal]   = useState(false);
  const [prefill, setPrefill] = useState(null);
  const qc = useQueryClient();

  const { data: dataSetores, isLoading: loadSetores } = useQuery({
    queryKey: ['pivot-setores', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/setores', { params: { ano } }).then(r => r.data),
  });
  const { data: dataCidades, isLoading: loadCidades } = useQuery({
    queryKey: ['pivot-cidades', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/cidades', { params: { ano } }).then(r => r.data),
    enabled: subAba === 'cidades',
  });
  const { data: dataCongs, isLoading: loadCongs } = useQuery({
    queryKey: ['pivot-congs-setor', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano } }).then(r => r.data),
    enabled: subAba === 'congregacoes',
  });

  function abrirCelula(cong, mes) {
    setPrefill({
      congregacaoId: cong.id,
      congregacaoNome: cong.nome,
      setorId: cong.setorId,
      mes,
      valor: parseFloat(cong[`m${mes}`]) || '',
    });
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
        {/* Sub-navegação */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {SUB_ABAS.map(s => (
            <button key={s.id} onClick={() => setSubAba(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
                ${subAba === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Toggle Anual / Mensal */}
        <ModoToolbar modo={modo} setModo={setModo} mesSel={mesSel} setMesSel={setMesSel} />

        {/* Botão lançamento (só na visão de congregações) */}
        {subAba === 'congregacoes' && (
          <div className="ml-auto flex items-center gap-3">
            <p className="text-xs text-gray-400 hidden sm:block">Clique em uma célula para lançar</p>
            <Button onClick={() => { setPrefill(null); setModal(true); }}>+ Novo Lançamento</Button>
          </div>
        )}
      </div>

      {/* Tabelas */}
      {subAba === 'setores' && (
        <PivotTable
          linhas={dataSetores?.linhas || []}
          nomeHeader="Setor"
          getLabel={l => (
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${l.tipo === 'CAPITAL' ? 'bg-blue-500' : 'bg-violet-500'}`} />
              {l.nome}
            </span>
          )}
          modo={modo}
          mesSel={mesSel}
          loading={loadSetores}
        />
      )}

      {subAba === 'cidades' && (
        <PivotTable
          linhas={dataCidades?.linhas || []}
          nomeHeader="Cidade"
          getLabel={l => l.cidade}
          extraCols={[{
            header: 'Cong.',
            render: l => l.qtdCongregacoes,
            total: ls => ls.reduce((s, l) => s + (l.qtdCongregacoes || 0), 0),
          }]}
          modo={modo}
          mesSel={mesSel}
          loading={loadCidades}
        />
      )}

      {subAba === 'congregacoes' && (
        <PivotTableCongs
          linhas={dataCongs?.linhas || []}
          modo={modo}
          mesSel={mesSel}
          loading={loadCongs}
          onCelulaClick={abrirCelula}
        />
      )}

      <ModalLancamento
        open={modal}
        onClose={() => setModal(false)}
        prefill={prefill}
        ano={ano}
        onSalvo={() => {
          qc.invalidateQueries(['pivot-setores']);
          qc.invalidateQueries(['pivot-cidades']);
          qc.invalidateQueries(['pivot-congs-setor']);
        }}
      />
    </div>
  );
}

// ── Aba Por Congregação (Capital / Interior) ──────────────────────────────────
function TabPorCongregacao({ ano, tipo }) {
  const [setorId, setSetorId] = useState('');
  const [modal, setModal] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const qc = useQueryClient();

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pivot-congs', ano, setorId, tipo],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, setorId: setorId || undefined, tipo: tipo || undefined } }).then(r => r.data),
  });

  const linhas = data?.linhas || [];

  const grupos = {};
  linhas.forEach(l => {
    const chave = l.setor || '(Sem setor)';
    if (!grupos[chave]) grupos[chave] = { setorId: l.setorId, linhas: [] };
    grupos[chave].linhas.push(l);
  });

  function abrirCelula(cong, mes) {
    setPrefill({ congregacaoId: cong.id, congregacaoNome: cong.nome, mes, valor: parseFloat(cong[`m${mes}`]) || '' });
    setModal(true);
  }

  const totaisCol = KEYS.map((k) => linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
  const totalGeral = linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-sm">
          <span className="text-gray-400 text-xs">Setor:</span>
          <select className="bg-transparent focus:outline-none text-gray-700 font-medium"
            value={setorId} onChange={e => setSetorId(e.target.value)}>
            <option value="">Todos</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">Clique em uma célula para lançar ou editar</p>
        <div className="ml-auto">
          <Button onClick={() => { setPrefill(null); setModal(true); }}>+ Novo Lançamento</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[160px] border-r border-gray-200">
                Congregação
              </th>
              {MESES_S.slice(1).map((m, i) => (
                <th key={i} className="px-1 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[60px]">{m}</th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[90px] border-l border-gray-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grupos).map(([nomeSetor, grupo]) => {
              const subtotaisCol = KEYS.map(k => grupo.linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0));
              const subtotal = grupo.linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
              return (
                <>
                  <tr key={`h-${nomeSetor}`} className="bg-gray-100 border-y border-gray-200">
                    <td colSpan={14} className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setor {nomeSetor}</span>
                    </td>
                  </tr>
                  {grupo.linhas.map((cong, idx) => (
                    <tr key={cong.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap text-xs font-medium">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cong.tipo === 'CAPITAL' ? 'bg-blue-400' : 'bg-violet-400'}`} />
                          {cong.nome}
                        </span>
                      </td>
                      {KEYS.map((k, i) => (
                        <Celula key={i} valor={parseFloat(cong[k]) || 0} onClick={() => abrirCelula(cong, i + 1)} />
                      ))}
                      <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">
                        {parseFloat(cong.total) > 0 ? fmtK(parseFloat(cong.total)) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr key={`sub-${nomeSetor}`} className="bg-gray-100 border-b border-gray-300">
                    <td className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600 border-r border-gray-200">
                      Subtotal {nomeSetor}
                    </td>
                    {subtotaisCol.map((t, i) => (
                      <td key={i} className={`px-1 py-1.5 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'text-gray-200' : 'text-gray-700'}`}>
                        {t === 0 ? '—' : fmtK(t)}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right text-xs font-bold text-blue-700 border-l border-gray-200">{fmtK(subtotal)}</td>
                  </tr>
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-blue-600 text-white">
              <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
              {totaisCol.map((t, i) => (
                <td key={i} className={`px-1 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>
                  {t === 0 ? '—' : fmtK(t)}
                </td>
              ))}
              <td className="px-3 py-3 text-right font-bold border-l border-blue-500 whitespace-nowrap">{fmtK(totalGeral)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ModalLancamento
        open={modal}
        onClose={() => setModal(false)}
        prefill={prefill}
        ano={ano}
        onSalvo={() => refetch()}
      />
    </div>
  );
}

// ── Aba Lançamentos ───────────────────────────────────────────────────────────
function TabLancamentos({ ano }) {
  const [filtros, setFiltros] = useState({ mes: '', tipo: '', setorId: '', congregacaoId: '', page: 1 });
  const [modal, setModal] = useState(false);
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

  function openNew() { setEditRecord(null); reset({ anoReferencia: ano }); setModal(true); }
  function openEdit(r) { setEditRecord(r); reset({ congregacaoId: String(r.congregacaoId), mesReferencia: String(r.mesReferencia), anoReferencia: r.anoReferencia, valor: r.valor, observacao: r.observacao || '' }); setModal(true); }

  async function onSubmit(d) {
    try {
      if (editRecord) await api.put(`/ofertas-missionarias/${editRecord.id}`, d);
      else await api.post('/ofertas-missionarias', d);
      toast.success(editRecord ? 'Atualizado' : 'Lançamento registrado');
      setModal(false);
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-congs']);
      qc.invalidateQueries(['pivot-congs-setor']);
      qc.invalidateQueries(['pivot-cidades']);
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir lançamento?')) return;
    try {
      await api.delete(`/ofertas-missionarias/${id}`);
      toast.success('Excluído');
      qc.invalidateQueries({ queryKey: ['ofertas'] });
      qc.invalidateQueries(['pivot-setores']);
      qc.invalidateQueries(['pivot-congs']);
      qc.invalidateQueries(['pivot-congs-setor']);
      qc.invalidateQueries(['pivot-cidades']);
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
        <Button onClick={openNew}>+ Novo Lançamento</Button>
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
            <select required {...register('congregacaoId')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mês *</label>
              <select required {...register('mesReferencia')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ano *</label>
              <input type="number" required {...register('anoReferencia')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor (R$) *</label>
            <input required type="number" step="0.01" min="0" {...register('valor')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Observação</label>
            <textarea rows={2} {...register('observacao')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
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
      qc.invalidateQueries(['pivot-congs']);
      qc.invalidateQueries(['pivot-congs-setor']);
      qc.invalidateQueries(['pivot-cidades']);
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
            <label className="text-xs text-gray-500 block mb-1">Setor</label>
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
  const [aba, setAba] = useState('setores');
  const [ano, setAno] = useState(String(anoAtual));
  const [modalCong, setModalCong] = useState(false);

  const ABAS = [
    { id: 'setores',    label: '🗂️ Setores' },
    { id: 'capital',    label: '🏙️ Capital' },
    { id: 'interior',   label: '🌳 Interior' },
    { id: 'lancamentos',label: '📋 Lançamentos' },
  ];

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
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

      {/* Abas principais */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === 'setores'     && <TabRelatorioSetor ano={ano} />}
      {aba === 'capital'     && <TabPorCongregacao ano={ano} tipo="CAPITAL" />}
      {aba === 'interior'    && <TabPorCongregacao ano={ano} tipo="INTERIOR" />}
      {aba === 'lancamentos' && <TabLancamentos ano={ano} />}

      <ModalNovaCongregacao open={modalCong} onClose={() => setModalCong(false)} />
    </div>
  );
}
