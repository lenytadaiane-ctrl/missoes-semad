import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ListaMissionarios() {
  const [status, setStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['missionarios', status, busca, page],
    queryFn: () => api.get('/missionarios', { params: { status, busca, page, limit: 20 } }).then(r => r.data),
  });

  async function handleDelete(id) {
    if (!confirm('Excluir missionário?')) return;
    try {
      await api.delete(`/missionarios/${id}`);
      toast.success('Excluído com sucesso');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    { key: 'nome', header: 'Nome', render: (r) => r.pessoa?.nome },
    { key: 'campo', header: 'Campo', render: (r) => r.campoMissionario || '—' },
    { key: 'status', header: 'Status', render: (r) => <Badge text={r.status} /> },
    { key: 'base', header: 'Base', render: (r) => r.baseMissionaria?.nome || '—' },
    {
      key: 'acoes', header: 'Ações', render: (r) => (
        <div className="flex gap-2">
          <Link to={`/missionarios/${r.id}/ver`} className="text-gray-500 hover:underline text-sm">Ver</Link>
          <Link to={`/missionarios/${r.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>
          <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Missionários</h1>
        <Link to="/missionarios/novo"><Button>+ Novo Missionário</Button></Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" placeholder="Buscar por nome..." value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="AFASTADO">Afastado</option>
          <option value="INATIVO">Inativo</option>
        </select>
      </div>
      <Table columns={columns} data={data?.data || []} loading={isLoading} />
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total: {data.total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="py-2 px-3">Pág. {page}</span>
            <Button variant="secondary" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}
