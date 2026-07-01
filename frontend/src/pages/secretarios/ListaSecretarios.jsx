import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';

export default function ListaSecretarios() {
  const [busca, setBusca] = useState('');
  const [setorId, setSetorId] = useState('');

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: raw = [], isLoading, refetch } = useQuery({
    queryKey: ['secretarios'],
    queryFn: () => api.get('/secretarios-missoes').then(r => r.data),
  });

  async function handleDelete(id) {
    if (!confirm('Excluir secretário?')) return;
    try { await api.delete(`/secretarios-missoes/${id}`); toast.success('Excluído'); refetch(); }
    catch (err) { toast.error(err.message); }
  }

  const data = useMemo(() => {
    let d = raw;
    if (setorId) d = d.filter(s => String(s.setorId) === setorId);
    if (busca) {
      const q = busca.toLowerCase();
      d = d.filter(s =>
        s.pessoa?.nome?.toLowerCase().includes(q) ||
        s.setor?.nome?.toLowerCase().includes(q) ||
        s.pessoa?.telefone?.includes(q) ||
        s.pessoa?.cidade?.toLowerCase().includes(q)
      );
    }
    return d;
  }, [raw, busca, setorId]);

  const columns = [
    { key: 'nome', header: 'Nome', render: r => r.pessoa?.nome },
    { key: 'setor', header: 'Setor', render: r => r.setor?.nome || '—' },
    { key: 'telefone', header: 'Telefone', render: r => r.pessoa?.telefone || '—' },
    { key: 'cidade', header: 'Cidade', render: r => r.pessoa?.cidade || '—' },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-3">
        <Link to={`/secretarios/${r.id}/ver`} className="text-gray-500 hover:underline text-sm">Ver</Link>
        <Link to={`/secretarios/${r.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>
        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Secretários de Missões</h1>
        <Link to="/secretarios/novo"><Button>+ Novo Secretário</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56" placeholder="Buscar nome, setor, cidade..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={setorId} onChange={e => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        {(busca || setorId) && <button onClick={() => { setBusca(''); setSetorId(''); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>}
      </div>
      <p className="text-xs text-gray-400">{data.length} de {raw.length} secretário(s)</p>
      <Table columns={columns} data={data} loading={isLoading} />
    </div>
  );
}
