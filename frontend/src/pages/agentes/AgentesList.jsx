import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { agentesApi } from '../../api/agentes';
import { setoresApi } from '../../api/setores';
import { congregacoesApi } from '../../api/congregacoes';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';

function AgenteForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => setoresApi.listar() });
  const { data: congs = [] } = useQuery({ queryKey: ['congregacoes'], queryFn: () => congregacoesApi.listar() });
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: inicial ? { nome: inicial.pessoa.nome, telefone: inicial.pessoa.telefone || '', email: inicial.pessoa.email || '', setorId: inicial.setorId, congregacaoId: inicial.congregacaoId || '' } : {} });
  const setorSel = watch('setorId');
  const congsFiltradas = congs.filter((c) => !setorSel || c.setorId == setorSel);
  const mutation = useMutation({
    mutationFn: (d) => inicial ? agentesApi.atualizar(inicial.id, d) : agentesApi.criar(d),
    onSuccess: () => { qc.invalidateQueries(['agentes']); toast.success(inicial ? 'Agente atualizado!' : 'Agente criado!'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, congregacaoId: d.congregacaoId || null }))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome *</label>
          <input {...register('nome', { required: 'Obrigatório' })} className="input" />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div><label className="label">Telefone</label><input {...register('telefone')} className="input" /></div>
        <div><label className="label">E-mail</label><input {...register('email')} type="email" className="input" /></div>
        <div>
          <label className="label">Setor *</label>
          <select {...register('setorId', { required: 'Obrigatório' })} className="input">
            <option value="">Selecione...</option>
            {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Congregação</label>
          <select {...register('congregacaoId')} className="input">
            <option value="">— Nenhuma —</option>
            {congsFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export default function AgentesList() {
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['agentes'], queryFn: () => agentesApi.listar() });
  const deleteMutation = useMutation({
    mutationFn: (id) => agentesApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['agentes']); toast.success('Agente excluído!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });
  const filtered = search ? data.filter((r) => r.pessoa.nome.toLowerCase().includes(search.toLowerCase())) : data;
  const columns = [
    { key: 'pessoa.nome', label: 'Nome' },
    { key: 'setor.nome', label: 'Setor' },
    { key: 'congregacao.nome', label: 'Congregação' },
    { key: 'pessoa.telefone', label: 'Telefone' },
    { key: 'pessoa.email', label: 'E-mail' },
    { key: 'id', label: '', render: (_, row) => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setModal({ mode: 'edit', item: row })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    )},
  ];
  return (
    <div>
      <PageHeader title="Agentes de Missões" subtitle={`${data.length} registros`} actions={<button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Novo Agente</button>} />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar agente..." className="max-w-xs" /></div>
      <Table columns={columns} data={filtered} loading={isLoading} emptyMessage="Nenhum agente cadastrado." />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Editar Agente' : 'Novo Agente'}>
        {modal && <AgenteForm inicial={modal.item} onClose={() => setModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir "${confirm?.pessoa?.nome}"?`} loading={deleteMutation.isPending} />
    </div>
  );
}
