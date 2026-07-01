import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

function Campo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <div className="mt-0.5">{value || <span className="text-sm text-gray-300">—</span>}</div>
    </div>
  );
}

export default function ViewSetor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: s, isLoading } = useQuery({
    queryKey: ['setor', id],
    queryFn: () => api.get(`/setores/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!s) return <p className="text-gray-500">Não encontrado.</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{s.nome}</h1>
          <Badge text={s.tipo} />
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Link to={`/setores/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/setores')}>Voltar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
        <Campo label="Nome" value={<span className="text-sm text-gray-800">{s.nome}</span>} />
        <Campo label="Tipo" value={<Badge text={s.tipo} />} />
        <Campo label="Congregações" value={<span className="text-sm text-gray-800">{s._count?.congregacoes ?? 0} congregação(ões)</span>} />
      </div>
      {s.congregacoes && s.congregacoes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Congregações do Setor</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {s.congregacoes.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-800">{c.nome}</span>
                <Badge text={c.tipo} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
