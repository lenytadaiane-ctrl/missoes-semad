import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

function Campo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

export default function ViewBase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: b, isLoading } = useQuery({
    queryKey: ['base', id],
    queryFn: () => api.get(`/bases-missionarias/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!b) return <p className="text-gray-500">Não encontrado.</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{b.nome}</h1>
        <div className="flex gap-2">
          <Link to={`/bases-missionarias/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/bases-missionarias')}>Voltar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
        <Campo label="Nome" value={b.nome} />
        <Campo label="Cidade" value={b.cidade} />
        <Campo label="Estado" value={b.estado} />
        <Campo label="País" value={b.pais} />
        <Campo label="Responsável" value={b.responsavelNome} />
        <Campo label="Contato Responsável" value={b.responsavelContato} />
        <Campo label="Data de Fundação" value={b.dataFundacao ? new Date(b.dataFundacao).toLocaleDateString('pt-BR') : null} />
        <Campo label="Descrição" value={b.descricao} />
      </div>
      {b._count && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>{b._count.missionarios}</strong> missionário(s) vinculado(s) a esta base.
        </div>
      )}
    </div>
  );
}
