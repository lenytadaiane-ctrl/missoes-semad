import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { missionariosApi } from '../../api/missionarios';
import { dependentesApi } from '../../api/dependentes';
import { basesApi } from '../../api/basesMissionarias';
import PageHeader from '../../components/ui/PageHeader';
import FotoUpload from '../../components/ui/FotoUpload';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatusMissionarioBadge } from '../../components/ui/Badge';
import { formatarData } from '../../utils/formatters';
import { ESTADOS_CIVIS, SEXOS, GRAUS_INSTRUCAO, TIPOS_SANGUINEOS, PARENTESCOS } from '../../utils/constants';

const TABS = ['Dados Pessoais', 'Contato / Endereço', 'Documentos', 'Ministério', 'Dependentes'];

function DepForm({ missionarioId, inicial, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({ defaultValues: inicial ? { nome: inicial.pessoa.nome, dataNascimento: inicial.pessoa.dataNascimento?.split('T')[0] || '', sexo: inicial.pessoa.sexo || '', parentesco: inicial.parentesco } : {} });
  const mutation = useMutation({
    mutationFn: (d) => inicial ? dependentesApi.atualizar(inicial.id, d) : dependentesApi.criar({ ...d, missionarioId }),
    onSuccess: () => { qc.invalidateQueries(['missionario', String(missionarioId)]); toast.success('Dependente salvo!'); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Nome *</label><input {...register('nome', { required: true })} className="input" /></div>
        <div>
          <label className="label">Parentesco *</label>
          <select {...register('parentesco', { required: true })} className="input">
            {PARENTESCOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div><label className="label">Data de Nasc.</label><input {...register('dataNascimento')} type="date" className="input" /></div>
        <div>
          <label className="label">Sexo</label>
          <select {...register('sexo')} className="input">
            <option value="">—</option>
            {SEXOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Salvando...' : 'Salvar'}</button></div>
    </form>
  );
}

export default function MissionariosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const [tab, setTab] = useState(0);
  const [foto, setFoto] = useState(null);
  const [confirmDep, setConfirmDep] = useState(null);
  const [depModal, setDepModal] = useState(null);

  const { data: missionario, isLoading } = useQuery({
    queryKey: ['missionario', id],
    queryFn: () => missionariosApi.buscarPorId(id),
    enabled: isEdit,
  });

  const { data: bases = [] } = useQuery({ queryKey: ['bases'], queryFn: () => basesApi.listar() });
  const { data: missionariosAll = {} } = useQuery({ queryKey: ['missionarios'], queryFn: () => missionariosApi.listar({ limit: 100 }) });
  const listaMissionarios = missionariosAll.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (missionario) {
      const p = missionario.pessoa;
      reset({
        nome: p.nome, dataNascimento: p.dataNascimento?.split('T')[0] || '', cpf: p.cpf || '', rg: p.rg || '',
        orgaoEmissor: p.orgaoEmissor || '', dataEmissao: p.dataEmissao?.split('T')[0] || '',
        telefone: p.telefone || '', email: p.email || '', endereco: p.endereco || '', cep: p.cep || '',
        cidade: p.cidade || '', estado: p.estado || '', naturalidade: p.naturalidade || '',
        estadoCivil: p.estadoCivil || '', origemReligiosa: p.origemReligiosa || '', nacionalidade: p.nacionalidade || '',
        grauInstrucao: p.grauInstrucao || '', sexo: p.sexo || '', profissao: p.profissao || '',
        tituloEleitor: p.tituloEleitor || '', zona: p.zona || '', secao: p.secao || '',
        reservista: p.reservista || '', tipoSanguineo: p.tipoSanguineo || '', nomePai: p.nomePai || '',
        nomeMae: p.nomeMae || '', nomeConjuge: p.nomeConjuge || '',
        campoMissionario: missionario.campoMissionario, dataEnvio: missionario.dataEnvio?.split('T')[0] || '',
        status: missionario.status, coordenadorId: missionario.coordenadorId || '',
        baseMissionariaId: missionario.baseMissionariaId || '',
      });
    }
  }, [missionario, reset]);

  const saveMutation = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, foto: foto || undefined };
      return isEdit ? missionariosApi.atualizar(id, payload) : missionariosApi.criar(payload);
    },
    onSuccess: () => { qc.invalidateQueries(['missionarios']); toast.success(isEdit ? 'Missionário atualizado!' : 'Missionário criado!'); navigate('/missionarios'); },
    onError: (e) => toast.error(e.message),
  });

  const delDepMutation = useMutation({
    mutationFn: (depId) => dependentesApi.remover(depId),
    onSuccess: () => { qc.invalidateQueries(['missionario', id]); toast.success('Dependente removido!'); setConfirmDep(null); },
    onError: (e) => toast.error(e.message),
  });

  if (isEdit && isLoading) return <PageSpinner />;

  const dependentes = missionario?.dependentes || [];

  const F = ({ name, label, type = 'text', required = false, options, ...rest }) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      {options ? (
        <select {...register(name, required ? { required: 'Obrigatório' } : {})} className="input" {...rest}>
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} {...register(name, required ? { required: 'Obrigatório' } : {})} className="input" {...rest} />
      )}
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Missionário' : 'Novo Missionário'} backTo="/missionarios"
        actions={<button type="submit" form="missForm" disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</button>} />

      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} type="button" onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}{t === 'Dependentes' && dependentes.length > 0 && <span className="ml-1 bg-blue-100 text-blue-700 rounded-full text-xs px-1.5">{dependentes.length}</span>}
          </button>
        ))}
      </div>

      <form id="missForm" onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
        {tab === 0 && (
          <div className="card">
            <div className="flex gap-8">
              <FotoUpload currentFoto={missionario?.pessoa?.foto} onChange={setFoto} />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2"><F name="nome" label="Nome Completo" required /></div>
                <F name="dataNascimento" label="Data de Nascimento" type="date" />
                <F name="sexo" label="Sexo" options={SEXOS} />
                <F name="estadoCivil" label="Estado Civil" options={ESTADOS_CIVIS} />
                <F name="naturalidade" label="Naturalidade" />
                <F name="nacionalidade" label="Nacionalidade" />
                <F name="origemReligiosa" label="Origem Religiosa" />
                <F name="grauInstrucao" label="Grau de Instrução" options={GRAUS_INSTRUCAO} />
                <F name="profissao" label="Profissão" />
                <F name="tipoSanguineo" label="Tipo Sanguíneo" options={TIPOS_SANGUINEOS} />
                <F name="nomePai" label="Nome do Pai" />
                <F name="nomeMae" label="Nome da Mãe" />
                <F name="nomeConjuge" label="Nome do Cônjuge" />
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="card grid grid-cols-2 gap-4">
            <F name="telefone" label="Telefone" />
            <F name="email" label="E-mail" type="email" />
            <div className="col-span-2"><F name="endereco" label="Endereço" /></div>
            <F name="cep" label="CEP" />
            <F name="cidade" label="Cidade" />
            <F name="estado" label="Estado (UF)" />
          </div>
        )}

        {tab === 2 && (
          <div className="card grid grid-cols-2 gap-4">
            <F name="cpf" label="CPF" />
            <F name="rg" label="RG" />
            <F name="orgaoEmissor" label="Órgão Emissor" />
            <F name="dataEmissao" label="Data de Emissão" type="date" />
            <F name="tituloEleitor" label="Título de Eleitor" />
            <F name="zona" label="Zona" />
            <F name="secao" label="Seção" />
            <F name="reservista" label="Reservista" />
          </div>
        )}

        {tab === 3 && (
          <div className="card grid grid-cols-2 gap-4">
            <div className="col-span-2"><F name="campoMissionario" label="Campo Missionário" required /></div>
            <F name="dataEnvio" label="Data de Envio" type="date" required />
            <div>
              <label className="label">Status *</label>
              <select {...register('status', { required: true })} className="input">
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="AFASTADO">Afastado</option>
              </select>
            </div>
            <div>
              <label className="label">Coordenador</label>
              <select {...register('coordenadorId')} className="input">
                <option value="">— Nenhum —</option>
                {listaMissionarios.filter((m) => m.id !== parseInt(id)).map((m) => <option key={m.id} value={m.id}>{m.pessoa.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Base Missionária</label>
              <select {...register('baseMissionariaId')} className="input">
                <option value="">— Nenhuma —</option>
                {bases.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
          </div>
        )}
      </form>

      {tab === 4 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Dependentes ({dependentes.length})</h3>
            {isEdit && <button onClick={() => setDepModal({ mode: 'create' })} className="btn-primary text-sm">+ Adicionar Dependente</button>}
            {!isEdit && <p className="text-sm text-gray-400">Salve o missionário primeiro para adicionar dependentes.</p>}
          </div>
          {dependentes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum dependente cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-gray-500 uppercase"><th className="py-2 text-left">Nome</th><th className="py-2 text-left">Parentesco</th><th className="py-2 text-left">Nascimento</th><th className="py-2"></th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {dependentes.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50">
                    <td className="py-2.5">{dep.pessoa.nome}</td>
                    <td className="py-2.5 text-gray-600">{PARENTESCOS.find((p) => p.value === dep.parentesco)?.label || dep.parentesco}</td>
                    <td className="py-2.5 text-gray-600">{formatarData(dep.pessoa.dataNascimento)}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => setDepModal({ mode: 'edit', item: dep })} className="text-blue-600 text-xs mr-2 hover:underline">Editar</button>
                      <button onClick={() => setConfirmDep(dep)} className="text-red-500 text-xs hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={!!depModal} onClose={() => setDepModal(null)} title={depModal?.mode === 'edit' ? 'Editar Dependente' : 'Novo Dependente'} size="sm">
        {depModal && <DepForm missionarioId={parseInt(id)} inicial={depModal.item} onClose={() => setDepModal(null)} />}
      </Modal>
      <ConfirmDialog open={!!confirmDep} onClose={() => setConfirmDep(null)} onConfirm={() => delDepMutation.mutate(confirmDep.id)} message={`Excluir o dependente "${confirmDep?.pessoa?.nome}"?`} loading={delDepMutation.isPending} />
    </div>
  );
}
