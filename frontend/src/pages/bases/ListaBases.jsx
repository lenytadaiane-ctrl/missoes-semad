import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';

export default function ListaBases() {
  const [busca, setBusca] = useState('');

  const { data: raw = [], isLoading, refetch } = useQuery({
    queryKey: ['bases'],
    queryFn: () => api.get('/bases-missionarias').then(r => r.data),
  });

  async function handleDelete(id) {
    if (!confirm('Excluir base?')) return;
    try { await api.delete(`/bases-missionarias/${id}`); toast.success('Excluída'); refetch(); }
    catch (err) { toast.error(err.message); }
  }

  const data = useMemo(() => {
    if (!busca) return raw;
    const q = busca.toLowerCase();
    return raw.filter(b =>
      b.nome?.toLowerCase().includes(q) ||
      b.cidade?.toLowerCase().includes(q) ||
      b.estado?.toLowerCase().includes(q) ||
      b.pais?.toLowerCase().includes(q) ||
      b.responsavelNome?.toLowerCase().includes(q)
    );
  }, [raw, busca]);

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'cidade', header: 'Cidade', render: r => r.cidade || '—' },
    { key: 'estado', header: 'Estado', render: r => r.estado || '—' },
    { key: 'responsavelNome', header: 'Responsável', render: r => r.responsavelNome || '—' },
    { key: '_count', header: 'Missionários', render: r => r._count?.missionarios ?? '—' },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-3">
        <Link to={`/bases-missionarias/${r.id}/ver`} className="text-gray-500 hover:underline text-sm">Ver</Link>
        <Link to={`/bases-missionarias/${r.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>
        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Bases Missionárias</h1>
        <Link to="/bases-missionarias/nova"><Button>+ Nova Base</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" placeholder="Buscar nome, cidade, país, responsável..." value={busca} onChange={e => setBusca(e.target.value)} />
        {busca && <button onClick={() => setBusca('')} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>}
      </div>
      <p className="text-xs text-gray-400">{data.length} de {raw.length} base(s)</p>
      <Table columns={columns} data={data} loading={isLoading} />
    </div>
  );
}
