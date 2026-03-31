import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { setoresApi } from '../../api/setores';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TipoLocalBadge } from '../../components/ui/Badge';

function SetorForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: inicial || { tipo: 'CAPITAL' } });
  const mutation = useMutation({
    mutationFn: (d) => inicial ? setoresApi.atualizar(inicial.id, d) : setoresApi.criar(d),
    onSuccess: () => { qc.invalidateQueries(['setores']); toast.success(inicial ? 'Setor atualizado!' : 'Setor criado!'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Nome do Setor *</label>
        <input {...register('nome', { required: 'Obrigatório' })} className="input uppercase" placeholder="Ex: A, B, C1..." />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
      </div>
      <div>
        <label className="label">Tipo *</label>
        <select {...register('tipo')} className="input">
          <option value="CAPITAL">Capital</option>
          <option value="INTERIOR">Interior</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export default function SetoresList() {
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['setores'], queryFn: () => setoresApi.listar() });
  const deleteMutation = useMutation({
    mutationFn: (id) => setoresApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['setores']); toast.success('Setor excluído!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });
  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'tipo', label: 'Tipo', render: (v) => <TipoLocalBadge tipo={v} /> },
    { key: '_count.congregacoes', label: 'Congregações' },
    { key: '_count.secretarios', label: 'Secretários' },
    { key: '_count.promotores', label: 'Promotores' },
    { key: 'id', label: '', render: (_, row) => isMaster ? (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setModal({ mode: 'edit', setor: row })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    ) : null },
  ];
  return (
    <div>
      <PageHeader title="Setores" subtitle="Setores de missões" actions={isMaster ? <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Novo Setor</button> : null} />
      <Table columns={columns} data={data} loading={isLoading} emptyMessage="Nenhum setor cadastrado." />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Editar Setor' : 'Novo Setor'} size="sm">
        {modal && <SetorForm inicial={modal.setor} onClose={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir o setor "${confirm?.nome}"?`} loading={deleteMutation.isPending} />
    </div>
  );
}
