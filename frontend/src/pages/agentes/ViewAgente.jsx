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

export default function ViewAgente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: a, isLoading } = useQuery({
    queryKey: ['agente', id],
    queryFn: () => api.get(`/agentes-missoes/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!a) return <p className="text-gray-500">Não encontrado.</p>;

  const pessoa = a.pessoa || {};
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{pessoa.nome}</h1>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Link to={`/agentes/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/agentes')}>Voltar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid sm:grid-cols-2 gap-4">
        <Campo label="Nome" value={pessoa.nome} />
        <Campo label="Setor" value={a.setor?.nome} />
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
