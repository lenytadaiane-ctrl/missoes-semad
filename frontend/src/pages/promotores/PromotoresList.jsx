import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { promotoresApi } from '../../api/promotores';
import { setoresApi } from '../../api/setores';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import { formatarData } from '../../utils/formatters';

function PromotorForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => setoresApi.listar() });
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: inicial ? { nome: inicial.pessoa.nome, telefone: inicial.pessoa.telefone || '', email: inicial.pessoa.email || '', setorId: inicial.setorId, dataInicio: inicial.dataInicio?.split('T')[0] || '' } : {} });
  const mutation = useMutation({
    mutationFn: (d) => inicial ? promotoresApi.atualizar(inicial.id, d) : promotoresApi.criar(d),
    onSuccess: () => { qc.invalidateQueries(['promotores']); toast.success(inicial ? 'Promotor atualizado!' : 'Promotor criado!'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome *</label>
          <input {...register('nome', { required: 'Obrigatório' })} className="input" />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="label">Telefone</label>
          <input {...register('telefone')} className="input" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input {...register('email')} type="email" className="input" />
        </div>
        <div>
          <label className="label">Setor *</label>
          <select {...register('setorId', { required: 'Obrigatório' })} className="input">
            <option value="">Selecione...</option>
            {setores.map((s) => <option key={s.id} value={s.id}>{s.nome} ({s.tipo})</option>)}
          </select>
          {errors.setorId && <p className="text-red-500 text-xs mt-1">{errors.setorId.message}</p>}
        </div>
        <div>
          <label className="label">Data de Início</label>
          <input {...register('dataInicio')} type="date" className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export default function PromotoresList() {
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['promotores'], queryFn: () => promotoresApi.listar() });
  const deleteMutation = useMutation({
    mutationFn: (id) => promotoresApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['promotores']); toast.success('Promotor excluído!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = search ? data.filter((r) => r.pessoa.nome.toLowerCase().includes(search.toLowerCase())) : data;
  const columns = [
    { key: 'pessoa.nome', label: 'Nome' },
    { key: 'setor.nome', label: 'Setor', render: (v, row) => `${v} (${row.setor?.tipo === 'CAPITAL' ? 'Capital' : 'Interior'})` },
    { key: 'pessoa.telefone', label: 'Telefone' },
    { key: 'pessoa.email', label: 'E-mail' },
    { key: 'dataInicio', label: 'Início', render: (v) => formatarData(v) },
    { key: 'id', label: '', render: (_, row) => isMaster ? (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setModal({ mode: 'edit', item: row })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    ) : null },
  ];
  return (
    <div>
      <PageHeader title="Promotores de Missões" subtitle={`${data.length} registros`} actions={isMaster ? <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Novo Promotor</button> : null} />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar promotor..." className="max-w-xs" /></div>
      <Table columns={columns} data={filtered} loading={isLoading} emptyMessage="Nenhum promotor cadastrado." />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Editar Promotor' : 'Novo Promotor'}>
        {modal && <PromotorForm inicial={modal.item} onClose={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir o promotor "${confirm?.pessoa?.nome}"?`} loading={deleteMutation.isPending} />
    </div>
  );
}
