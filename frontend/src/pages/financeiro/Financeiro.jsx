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
const fmtK = (v) => {
  if (!v || v === 0) return '';
  if (v >= 1000000) return `R$${(v/1000000).toFixed(1)}M`;
  if (v >= 1000)    return `R$${(v/1000).toFixed(0)}k`;
  return `R$${Number(v).toFixed(0)}`;
};

const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

// ── Célula clicável da tabela de congregações ─────────────────────────────────
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

// ── Aba Por Setor ─────────────────────────────────────────────────────────────
function TabPorSetor({ ano }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pivot-setores', ano],
    queryFn: () => api.get('/ofertas-missionarias/pivot/setores', { params: { ano } }).then(r => r.data),
  });

  const linhas = data?.linhas || [];

  // totais por coluna
  const totaisCol = KEYS.map((k, i) =>
    linhas.reduce((s, l) => s + (parseFloat(l[k]) || 0), 0)
  );
  const totalGeral = linhas.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[140px] border-r border-gray-200">
              Setor
            </th>
            {MESES_S.slice(1).map((m, i) => (
              <th key={i} className="px-2 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[72px]">{m}</th>
            ))}
            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[90px] border-l border-gray-200">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.map((linha, idx) => (
            <tr key={linha.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${linha.tipo === 'CAPITAL' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                  {linha.nome}
                </span>
              </td>
              {KEYS.map((k, i) => {
                const v = parseFloat(linha[k]) || 0;
                return (
                  <td key={i} className={`px-2 py-2.5 text-right text-xs whitespace-nowrap
                    ${v === 0 ? 'text-gray-200' : 'text-gray-700 font-medium'}`}>
                    {v === 0 ? '—' : fmtK(v)}
                  </td>
                );
              })}
              <td className="px-3 py-2.5 text-right font-bold text-blue-700 border-l border-gray-200 whitespace-nowrap">
                {parseFloat(linha.total) > 0 ? fmtK(parseFloat(linha.total)) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-600 text-white">
            <td className="sticky left-0 z-10 bg-blue-600 px-4 py-3 font-bold text-sm border-r border-blue-500">TOTAL GERAL</td>
            {totaisCol.map((t, i) => (
              <td key={i} className={`px-2 py-3 text-right text-xs font-semibold whitespace-nowrap ${t === 0 ? 'opacity-40' : ''}`}>
                {t === 0 ? '—' : fmtK(t)}
              </td>
            ))}
            <td className="px-3 py-3 text-right font-bold border-l border-blue-500 whitespace-nowrap">{fmtK(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Aba Por Congregação ───────────────────────────────────────────────────────
function TabPorCongregacao({ ano }) {
  const [setorId, setSetorId] = useState('');
  const [modal, setModal] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const qc = useQueryClient();

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pivot-congs', ano, setorId],
    queryFn: () => api.get('/ofertas-missionarias/pivot/congregacoes', { params: { ano, setorId: setorId || undefined } }).then(r => r.data),
  });

  const linhas = data?.linhas || [];

  // agrupar por setor
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
        <p className="text-xs text-gray-400">Clique em uma célula para lançar ou editar o valor</p>
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
                  {/* Cabeçalho do setor */}
                  <tr key={`h-${nomeSetor}`} className="bg-gray-100 border-y border-gray-200">
                    <td colSpan={14} className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setor {nomeSetor}</span>
                    </td>
                  </tr>
                  {/* Linhas de congregações */}
                  {grupo.linhas.map((cong, idx) => (
                    <tr key={cong.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap text-xs font-medium">
                        <span className={`inline-flex items-center gap-1`}>
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
                  {/* Subtotal do setor */}
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

// ── Aba Lançamentos (lista existente) ─────────────────────────────────────────
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
    } catch (err) { toast.error(err.message); }
  }

  const columns = [
    { key: 'cong', header: 'Congregação', render: r => r.congregacao?.nome },
    { key: 'setor', header: 'Setor', render: r => r.congregacao?.setor?.nome || '—' },
    { key: 'tipo', header: 'Tipo', render: r => r.congregacao?.tipo },
    { key: 'mes', header: 'Mês', render: r => MESES_L[r.mesReferencia] },
    { key: 'ano', header: 'Ano', render: r => r.anoReferencia },
    { key: 'valor', header: 'Valor', render: r => fmt(r.valor) },
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function Financeiro() {
  const [aba, setAba] = useState('setores');
  const [ano, setAno] = useState(String(anoAtual));

  const ABAS = [
    { id: 'setores',       label: '🗂️ Por Setor' },
    { id: 'congregacoes',  label: '⛪ Por Congregação' },
    { id: 'lancamentos',   label: '📋 Lançamentos' },
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
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === 'setores'      && <TabPorSetor ano={ano} />}
      {aba === 'congregacoes' && <TabPorCongregacao ano={ano} />}
      {aba === 'lancamentos'  && <TabLancamentos ano={ano} />}
    </div>
  );
}
