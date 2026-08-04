import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const SECTION = ({ title, children }) => (
  <div className="border border-gray-200 rounded-xl p-5 space-y-4">
    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h3>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

export default function FormMissionario() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fotoRef = useRef();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const { data: bases } = useQuery({ queryKey: ['bases'], queryFn: () => api.get('/bases-missionarias').then(r => r.data) });
  const { data: missionarios } = useQuery({ queryKey: ['missionarios-todos'], queryFn: () => api.get('/missionarios', { params: { limit: 100 } }).then(r => r.data?.data) });
  const { data: congregacoes = [] } = useQuery({ queryKey: ['congregacoes'], queryFn: () => api.get('/congregacoes').then(r => r.data) });

  const { data: record, isLoading } = useQuery({
    queryKey: ['missionario', id],
    queryFn: () => api.get(`/missionarios/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (record) {
      const flat = {
        ...record.pessoa,
        ...record,
        dataNascimento: record.pessoa?.dataNascimento?.slice(0, 10) || '',
        dataEmissao: record.pessoa?.dataEmissao?.slice(0, 10) || '',
        dataEnvio: record.dataEnvio?.slice(0, 10) || '',
      };
      reset(flat);
    }
  }, [record, reset]);

  async function onSubmit(data) {
    try {
      if (isEdit) {
        await api.put(`/missionarios/${id}`, data);
        toast.success('Missionário atualizado');
      } else {
        await api.post('/missionarios', data);
        toast.success('Missionário cadastrado');
        navigate('/missionarios');
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleFotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('foto', file);
    try {
      await api.put(`/missionarios/${id}/foto`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Foto atualizada');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (isEdit && isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Missionário' : 'Novo Missionário'}</h1>
        <Button variant="secondary" onClick={() => navigate('/missionarios')}>Voltar</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SECTION title="Dados Pessoais">
          <Input label="Nome *" error={errors.nome?.message} {...register('nome', { required: 'Nome obrigatório' })} />
          <Input label="CPF" {...register('cpf')} />
          <Input label="Data de Nascimento" type="date" {...register('dataNascimento')} />
          <Input label="RG" {...register('rg')} />
          <Input label="Órgão Emissor" {...register('orgaoEmissor')} />
          <Input label="Data Emissão" type="date" {...register('dataEmissao')} />
          <Input label="Telefone" {...register('telefone')} />
          <Input label="E-mail" type="email" {...register('email')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sexo</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('sexo')}>
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Estado Civil</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('estadoCivil')}>
              <option value="">Selecione</option>
              <option>Solteiro(a)</option><option>Casado(a)</option><option>Viúvo(a)</option><option>Divorciado(a)</option>
            </select>
          </div>
          <Input label="Profissão" {...register('profissao')} />
          <Input label="Nacionalidade" {...register('nacionalidade')} />
          <Input label="Naturalidade" {...register('naturalidade')} />
          <Input label="Grau de Instrução" {...register('grauInstrucao')} />
          <Input label="Nome do Pai" {...register('nomePai')} />
          <Input label="Nome da Mãe" {...register('nomeMae')} />
          <Input label="Nome do Cônjuge" {...register('nomeConjuge')} />
          <Input label="Tipo Sanguíneo" {...register('tipoSanguineo')} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Congregação que Pertence</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('congregacaoOrigemId')}>
              <option value="">Selecione a congregação</option>
              {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.setor ? ` — Setor ${c.setor.nome}` : ''}</option>)}
            </select>
          </div>
          <Input label="Reservista" {...register('reservista')} />
          <Input label="Título de Eleitor" {...register('tituloEleitor')} />
          <Input label="Zona" {...register('zona')} />
          <Input label="Seção" {...register('secao')} />
        </SECTION>
        <SECTION title="Endereço">
          <Input label="Endereço" {...register('endereco')} />
          <Input label="CEP" {...register('cep')} />
          <Input label="Cidade" {...register('cidade')} />
          <Input label="Estado" {...register('estado')} />
        </SECTION>
        <SECTION title="Dados Missionários">
          <Input label="Campo Missionário" {...register('campoMissionario')} />
          <Input label="Data de Envio" type="date" {...register('dataEnvio')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('status')}>
              <option value="ATIVO">Ativo</option>
              <option value="AFASTADO">Afastado</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Base Missionária</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('baseMissionariaId')}>
              <option value="">Sem base</option>
              {(bases || []).map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Coordenador</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('coordenadorId')}>
              <option value="">Sem coordenador</option>
              {(missionarios || []).filter(m => m.id !== parseInt(id)).map(m => (
                <option key={m.id} value={m.id}>{m.pessoa?.nome}</option>
              ))}
            </select>
          </div>
        </SECTION>

        {isEdit && (
          <div className="border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Foto</h3>
            {record?.pessoa?.foto && (
              <img src={`/${record.pessoa.foto}`} alt="foto" className="w-24 h-24 rounded-full object-cover mb-3 border" />
            )}
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
            <Button type="button" variant="secondary" onClick={() => fotoRef.current?.click()}>Alterar Foto</Button>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/missionarios')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
