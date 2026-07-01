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

export default function ViewSecretario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: s, isLoading } = useQuery({
    queryKey: ['secretario', id],
    queryFn: () => api.get(`/secretarios-missoes/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!s) return <p className="text-gray-500">Não encontrado.</p>;

  const pessoa = s.pessoa || {};
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{pessoa.nome}</h1>
        <div className="flex gap-2">
          <Link to={`/secretarios/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/secretarios')}>Voltar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
        <Campo label="Nome" value={pessoa.nome} />
        <Campo label="Setor" value={s.setor?.nome} />
        <Campo label="CPF" value={pessoa.cpf} />
        <Campo label="Telefone" value={pessoa.telefone} />
        <Campo label="E-mail" value={pessoa.email} />
        <Campo label="Endereço" value={pessoa.endereco} />
        <Campo label="Cidade" value={pessoa.cidade} />
        <Campo label="Estado" value={pessoa.estado} />
      </div>
    </div>
  );
}
