import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ListaSetores() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');

  const { data: raw = [], isLoading, refetch } = useQuery({
    queryKey: ['setores'],
    queryFn: () => api.get('/setores').then(r => r.data),
  });

  async function handleDelete(id) {
    if (!confirm('Excluir setor?')) return;
    try { await api.delete(`/setores/${id}`); toast.success('Excluído'); refetch(); }
    catch (err) { toast.error(err.message); }
  }

  const data = useMemo(() => {
    let d = raw;
    if (tipo) d = d.filter(s => s.tipo === tipo);
    if (busca) d = d.filter(s => s.nome?.toLowerCase().includes(busca.toLowerCase()));
    return d;
  }, [raw, busca, tipo]);

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'tipo', header: 'Tipo', render: r => <Badge text={r.tipo} /> },
    { key: 'congregacoes', header: 'Congregações', render: r => r._count?.congregacoes ?? '—' },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-3">
        <Link to={`/setores/${r.id}/ver`} className="text-gray-500 hover:underline text-sm">Ver</Link>
        <Link to={`/setores/${r.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>
        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Setores</h1>
        <Link to="/setores/novo"><Button>+ Novo Setor</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56" placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="CAPITAL">Capital</option>
          <option value="INTERIOR">Interior</option>
        </select>
        {(busca || tipo) && <button onClick={() => { setBusca(''); setTipo(''); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>}
      </div>
      <p className="text-xs text-gray-400">{data.length} de {raw.length} setor(es)</p>
      <Table columns={columns} data={data} loading={isLoading} />
    </div>
  );
}
