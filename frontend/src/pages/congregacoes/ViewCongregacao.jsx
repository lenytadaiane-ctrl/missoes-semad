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
      <div className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</div>
    </div>
  );
}

export default function ViewCongregacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery({
    queryKey: ['congregacao', id],
    queryFn: () => api.get(`/congregacoes/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!c) return <p className="text-gray-500">Não encontrado.</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{c.nome}</h1>
          <Badge text={c.tipo} />
        </div>
        <div className="flex gap-2">
          <Link to={`/congregacoes/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/congregacoes')}>Voltar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
        <Campo label="Nome" value={c.nome} />
        <Campo label="Tipo" value={<Badge text={c.tipo} />} />
        <Campo label="Setor" value={c.setor?.nome} />
        <Campo label="Cidade" value={c.cidade} />
        <Campo label="Estado" value={c.estado} />
        <Campo label="Endereço" value={c.endereco} />
        <Campo label="CEP" value={c.cep} />
        <Campo label="Telefone" value={c.telefone} />
        <Campo label="Pastor / Responsável" value={c.pastor} />
      </div>
    </div>
  );
}
