import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { congregacoesApi } from '../../api/congregacoes';
import { setoresApi } from '../../api/setores';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import { TipoLocalBadge } from '../../components/ui/Badge';

function CongregacaoForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => setoresApi.listar() });
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: inicial || { tipo: 'CAPITAL' } });
  const mutation = useMutation({
    mutationFn: (d) => inicial ? congregacoesApi.atualizar(inicial.id, d) : congregacoesApi.criar(d),
    onSuccess: () => { qc.invalidateQueries(['congregacoes']); toast.success(inicial ? 'Congregação atualizada!' : 'Congregação criada!'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, setorId: d.setorId || null }))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome *</label>
          <input {...register('nome', { required: 'Obrigatório' })} className="input" />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select {...register('tipo')} className="input">
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
        </div>
        <div>
          <label className="label">Setor</label>
          <select {...register('setorId')} className="input">
            <option value="">— Sem setor —</option>
            {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cidade</label>
          <input {...register('cidade')} className="input" />
        </div>
        <div>
          <label className="label">Pastor</label>
          <input {...register('pastor')} className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export default function CongregacoesList() {
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['congregacoes', search, tipoFiltro],
    queryFn: () => congregacoesApi.listar({ search: search || undefined, tipo: tipoFiltro || undefined }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => congregacoesApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['congregacoes']); toast.success('Congregação excluída!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });
  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'setor.nome', label: 'Setor', render: (v) => v ?? <span className="text-gray-400 text-xs">Sem setor</span> },
    { key: 'tipo', label: 'Tipo', render: (v) => <TipoLocalBadge tipo={v} /> },
    { key: 'cidade', label: 'Cidade' },
    { key: 'pastor', label: 'Pastor' },
    { key: 'id', label: '', render: (_, row) => isMaster ? (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setModal({ mode: 'edit', item: { ...row, setorId: row.setorId || '' } })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    ) : null },
  ];
  return (
    <div>
      <PageHeader title="Congregações" subtitle={`${data.length} registros`} actions={isMaster ? <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Nova Congregação</button> : null} />
      <div className="flex gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar..." className="flex-1 max-w-xs" />
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="input w-36">
          <option value="">Todos os tipos</option>
          <option value="CAPITAL">Capital</option>
          <option value="INTERIOR">Interior</option>
        </select>
      </div>
      <Table columns={columns} data={data} loading={isLoading} emptyMessage="Nenhuma congregação encontrada." />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Editar Congregação' : 'Nova Congregação'}>
        {modal && <CongregacaoForm inicial={modal.item} onClose={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir "${confirm?.nome}"?`} loading={deleteMutation.isPending} />
    </div>
  );
}
