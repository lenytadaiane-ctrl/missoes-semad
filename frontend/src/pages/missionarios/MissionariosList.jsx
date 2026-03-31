import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { missionariosApi } from '../../api/missionarios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import { StatusMissionarioBadge } from '../../components/ui/Badge';
import { formatarData } from '../../utils/formatters';

export default function MissionariosList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const qc = useQueryClient();

  const { data: resp = {}, isLoading } = useQuery({
    queryKey: ['missionarios', search, status],
    queryFn: () => missionariosApi.listar({ search: search || undefined, status: status || undefined, limit: 100 }),
  });
  const lista = resp.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => missionariosApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['missionarios']); toast.success('Missionário excluído!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    { key: 'pessoa.foto', label: '', render: (foto) => (
      foto
        ? <img src={`/${foto}`} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
        : <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
    )},
    { key: 'pessoa.nome', label: 'Nome' },
    { key: 'campoMissionario', label: 'Campo' },
    { key: 'dataEnvio', label: 'Envio', render: (v) => formatarData(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusMissionarioBadge status={v} /> },
    { key: 'baseMissionaria.nome', label: 'Base' },
    { key: 'id', label: '', render: (_, row) => isMaster ? (
      <div className="flex gap-2 justify-end">
        <button onClick={() => navigate(`/missionarios/${row.id}`)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
      </div>
    ) : null },
  ];

  return (
    <div>
      <PageHeader title="Missionários" subtitle={`${lista.length} registros`}
        actions={isMaster ? <button onClick={() => navigate('/missionarios/novo')} className="btn-primary">+ Novo Missionário</button> : null} />
      <div className="flex gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar missionário..." className="flex-1 max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-40">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
          <option value="AFASTADO">Afastado</option>
        </select>
      </div>
      <Table columns={columns} data={lista} loading={isLoading} emptyMessage="Nenhum missionário encontrado." />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => deleteMutation.mutate(confirm.id)} message={`Excluir o missionário "${confirm?.pessoa?.nome}"? Os dependentes também serão excluídos.`} loading={deleteMutation.isPending} />
    </div>
  );
}
