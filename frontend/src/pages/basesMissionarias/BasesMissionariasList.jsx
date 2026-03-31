import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { basesApi } from '../../api/basesMissionarias';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';

function BaseForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: inicial || {} });
  const mutation = useMutation({
    mutationFn: (d) => inicial ? basesApi.atualizar(inicial.id, d) : basesApi.criar(d),
    onSuccess: () => { qc.invalidateQueries(['bases']); toast.success(inicial ? 'Base atualizada!' : 'Base criada!'); onClose(); },
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
        <div className="col-span-2">
          <label className="label">Endereço</label>
          <input {...register('endereco')} className="input" />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input {...register('cidade')} className="input" />
        </div>
        <div>
          <label className="label">Estado</label>
          <input {...register('estado')} className="input" maxLength={2} placeholder="UF" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input {...register('telefone')} className="input" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input {...register('email')} type="email" className="input" />
        </div>
        <div className="col-span-2">
          <label className="label">Responsável</label>
          <input {...register('responsavelNome')} className="input" />
        </div>
        <div className="col-span-2">
          <label className="label">Descrição</label>
          <textarea {...register('descricao')} className="input h-20 resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export default function BasesMissionariasList() {
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['bases', search],
    queryFn: () => basesApi.listar({ search: search || undefined }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => basesApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['bases']); toast.success('Base excluída!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });
  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado' },
    { key: 'responsavelNome', label: 'Responsável' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'id', label: '', render: (_, row) => isMaster ? (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setModal({ mode: 'edit', item: row })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    ) : null },
  ];
  return (
    <div>
      <PageHeader title="Bases Missionárias" actions={isMaster ? <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Nova Base</button> : null} />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar base..." className="max-w-xs" /></div>
      <Table columns={columns} data={data} loading={isLoading} emptyMessage="Nenhuma base cadastrada." />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Editar Base' : 'Nova Base'}>
        {modal && <BaseForm inicial={modal.item} onClose={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir a base "${confirm?.nome}"?`} loading={deleteMutation.isPending} />
    </div>
  );
}
