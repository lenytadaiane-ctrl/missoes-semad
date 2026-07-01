import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const MESES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Financeiro() {
  const anoAtual = new Date().getFullYear();
  const [filtros, setFiltros] = useState({ ano: String(anoAtual), mes: '', tipo: '', setorId: '', congregacaoId: '', page: 1 });
  const [modal, setModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const qc = useQueryClient();

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: congregacoes = [] } = useQuery({
    queryKey: ['congregacoes', filtros.setorId],
    queryFn: () => api.get('/congregacoes', { params: { setorId: filtros.setorId } }).then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ofertas', filtros],
    queryFn: () => api.get('/ofertas-missionarias', { params: filtros }).then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  function openNew() { setEditRecord(null); reset({ anoReferencia: anoAtual }); setModal(true); }
  function openEdit(r) { setEditRecord(r); reset({ congregacaoId: r.congregacaoId, mesReferencia: r.mesReferencia, anoReferencia: r.anoReferencia, valor: r.valor, observacao: r.observacao || '' }); setModal(true); }

  async function onSubmit(data) {
    try {
      if (editRecord) { await api.put(`/ofertas-missionarias/${editRecord.id}`, data); toast.success('Atualizado'); }
      else { await api.post('/ofertas-missionarias', data); toast.success('Lançamento registrado'); }
      setModal(false);
      qc.invalidateQueries({ queryKey: ['ofertas'] });
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir lançamento?')) return;
    try { await api.delete(`/ofertas-missionarias/${id}`); toast.success('Excluído'); qc.invalidateQueries({ queryKey: ['ofertas'] }); }
    catch (err) { toast.error(err.message); }
  }

  const columns = [
    { key: 'cong', header: 'Congregação', render: r => r.congregacao?.nome },
    { key: 'setor', header: 'Setor', render: r => r.congregacao?.setor?.nome || '—' },
    { key: 'tipo', header: 'Tipo', render: r => r.congregacao?.tipo },
    { key: 'mes', header: 'Mês', render: r => MESES[r.mesReferencia] },
    { key: 'ano', header: 'Ano', render: r => r.anoReferencia },
    { key: 'valor', header: 'Valor', render: r => fmt(r.valor) },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="text-primary-600 hover:underline text-sm">Editar</button>
        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
      </div>
    )},
  ];

  const anos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Ofertas Missionárias</h1>
        <Button onClick={openNew}>+ Novo Lançamento</Button>
      </div>

      <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.ano} onChange={e => setFiltros(f => ({ ...f, ano: e.target.value, page: 1 }))}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtros.mes} onChange={e => setFiltros(f => ({ ...f, mes: e.target.value, page: 1 }))}>
          <option value="">Todos os meses</option>
          {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
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

      {data && <div className="bg-blue-50 rounded-xl px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-blue-700">{data.total} registro(s) encontrado(s)</span>
        <span className="font-bold text-blue-900 text-lg">Total: {fmt(data.soma)}</span>
      </div>}

      <Table columns={columns} data={data?.data || []} loading={isLoading} />

      {data && (
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Congregação *</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('congregacaoId', { required: true })}>
              <option value="">Selecione</option>
              {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mês *</label>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('mesReferencia', { required: true })}>
                <option value="">Mês</option>
                {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <Input label="Ano *" type="number" {...register('anoReferencia', { required: true })} />
          </div>
          <Input label="Valor (R$) *" type="number" step="0.01" {...register('valor', { required: true })} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observação</label>
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} {...register('observacao')} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={isSubmitting}>{editRecord ? 'Salvar' : 'Lançar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
