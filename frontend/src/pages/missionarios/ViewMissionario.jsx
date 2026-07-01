import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

function Campo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

function Secao({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : null;

export default function ViewMissionario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: m, isLoading } = useQuery({
    queryKey: ['missionario', id],
    queryFn: () => api.get(`/missionarios/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!m) return <p className="text-gray-500">Não encontrado.</p>;

  const p = m.pessoa || {};

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {p.foto ? (
            <img src={`/${p.foto}`} alt="foto" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold shadow">
              {p.nome?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{p.nome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge text={m.status} />
              {m.campoMissionario && <span className="text-sm text-gray-500">{m.campoMissionario}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Link to={`/missionarios/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/missionarios')}>Voltar</Button>
        </div>
      </div>

      <Secao title="Dados Missionários">
        <Campo label="Campo Missionário" value={m.campoMissionario} />
        <Campo label="Data de Envio" value={fmtData(m.dataEnvio)} />
        <Campo label="Status" value={m.status} />
        <Campo label="Base Missionária" value={m.baseMissionaria?.nome} />
        <Campo label="Coordenador" value={m.coordenador?.pessoa?.nome} />
      </Secao>

      <Secao title="Dados Pessoais">
        <Campo label="Nome Completo" value={p.nome} />
        <Campo label="CPF" value={p.cpf} />
        <Campo label="RG" value={p.rg} />
        <Campo label="Órgão Emissor" value={p.orgaoEmissor} />
        <Campo label="Data de Nascimento" value={fmtData(p.dataNascimento)} />
        <Campo label="Sexo" value={p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Feminino' : p.sexo} />
        <Campo label="Estado Civil" value={p.estadoCivil} />
        <Campo label="Nacionalidade" value={p.nacionalidade} />
        <Campo label="Naturalidade" value={p.naturalidade} />
        <Campo label="Grau de Instrução" value={p.grauInstrucao} />
        <Campo label="Profissão" value={p.profissao} />
        <Campo label="Origem Religiosa" value={p.origemReligiosa} />
        <Campo label="Tipo Sanguíneo" value={p.tipoSanguineo} />
        <Campo label="Reservista" value={p.reservista} />
      </Secao>

      <Secao title="Contato & Endereço">
        <Campo label="Telefone" value={p.telefone} />
        <Campo label="E-mail" value={p.email} />
        <Campo label="Endereço" value={p.endereco} />
        <Campo label="CEP" value={p.cep} />
        <Campo label="Cidade" value={p.cidade} />
        <Campo label="Estado" value={p.estado} />
      </Secao>

      <Secao title="Documentos">
        <Campo label="Título de Eleitor" value={p.tituloEleitor} />
        <Campo label="Zona" value={p.zona} />
        <Campo label="Seção" value={p.secao} />
      </Secao>

      <Secao title="Família">
        <Campo label="Nome do Pai" value={p.nomePai} />
        <Campo label="Nome da Mãe" value={p.nomeMae} />
        <Campo label="Nome do Cônjuge" value={p.nomeConjuge} />
      </Secao>

      {m.dependentes && m.dependentes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Dependentes</h3>
          <div className="divide-y divide-gray-100">
            {m.dependentes.map(dep => (
              <div key={dep.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{dep.pessoa?.nome}</p>
                  <p className="text-xs text-gray-400">{dep.parentesco}</p>
                </div>
                <span className="text-xs text-gray-400">{dep.pessoa?.sexo === 'M' ? 'Masculino' : dep.pessoa?.sexo === 'F' ? 'Feminino' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {m.supervisionados && m.supervisionados.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Missionários Supervisionados</h3>
          <div className="space-y-2">
            {m.supervisionados.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-800">{s.pessoa?.nome}</p>
                <Badge text={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
