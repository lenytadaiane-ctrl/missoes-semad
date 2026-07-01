import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ListaCongregacoes() {
  const [busca, setBusca] = useState('');
  const [setorId, setSetorId] = useState('');
  const [tipo, setTipo] = useState('');

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: raw = [], isLoading, refetch } = useQuery({
    queryKey: ['congregacoes'],
    queryFn: () => api.get('/congregacoes').then(r => r.data),
  });

  async function handleDelete(id) {
    if (!confirm('Excluir congregação?')) return;
    try { await api.delete(`/congregacoes/${id}`); toast.success('Excluída'); refetch(); }
    catch (err) { toast.error(err.message); }
  }

  const data = useMemo(() => {
    let d = raw;
    if (setorId) d = d.filter(c => String(c.setorId) === setorId);
    if (tipo) d = d.filter(c => c.tipo === tipo);
    if (busca) {
      const q = busca.toLowerCase();
      d = d.filter(c =>
        c.nome?.toLowerCase().includes(q) ||
        c.cidade?.toLowerCase().includes(q) ||
        c.setor?.nome?.toLowerCase().includes(q) ||
        c.pastor?.toLowerCase().includes(q)
      );
    }
    return d;
  }, [raw, busca, setorId, tipo]);

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'setor', header: 'Setor', render: r => r.setor?.nome || '—' },
    { key: 'tipo', header: 'Tipo', render: r => <Badge text={r.tipo} /> },
    { key: 'cidade', header: 'Cidade', render: r => r.cidade || '—' },
    { key: 'acoes', header: 'Ações', render: r => (
      <div className="flex gap-3">
        <Link to={`/congregacoes/${r.id}/ver`} className="text-gray-500 hover:underline text-sm">Ver</Link>
        <Link to={`/congregacoes/${r.id}`} className="text-primary-600 hover:underline text-sm">Editar</Link>
        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Congregações</h1>
        <Link to="/congregacoes/nova"><Button>+ Nova Congregação</Button></Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56" placeholder="Buscar nome, cidade, setor..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={setorId} onChange={e => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Capital + Interior</option>
          <option value="CAPITAL">Capital</option>
          <option value="INTERIOR">Interior</option>
        </select>
        {(busca || setorId || tipo) && <button onClick={() => { setBusca(''); setSetorId(''); setTipo(''); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpar</button>}
      </div>
      <p className="text-xs text-gray-400">{data.length} de {raw.length} congregação(ões)</p>
      <Table columns={columns} data={data} loading={isLoading} />
    </div>
  );
}
