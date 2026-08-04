import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function FormPromotor() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: congregacoes = [] } = useQuery({ queryKey: ['congregacoes'], queryFn: () => api.get('/congregacoes').then(r => r.data) });
  const { data: record } = useQuery({
    queryKey: ['promotor', id],
    queryFn: () => api.get(`/promotores-missoes/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (record) reset({ ...record.pessoa, setorId: record.setorId, dataInicio: record.dataInicio?.slice(0, 10) || '' });
  }, [record, reset]);

  async function onSubmit(data) {
    try {
      if (isEdit) { await api.put(`/promotores-missoes/${id}`, data); toast.success('Atualizado'); }
      else { await api.post('/promotores-missoes', data); toast.success('Cadastrado'); }
      navigate('/promotores');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Promotor' : 'Novo Promotor'}</h1>
        <Button variant="secondary" onClick={() => navigate('/promotores')}>Voltar</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <Input label="Nome *" {...register('nome', { required: true })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Telefone" {...register('telefone')} />
          <Input label="E-mail" type="email" {...register('email')} />
          <Input label="CPF" {...register('cpf')} />
          <Input label="Data de Nascimento" type="date" {...register('dataNascimento')} />
          <Input label="Data Início" type="date" {...register('dataInicio')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Setor *</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('setorId', { required: true })}>
            <option value="">Selecione o setor</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Congregação que Pertence</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('congregacaoOrigemId')}>
            <option value="">Selecione a congregação</option>
            {congregacoes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.setor ? ` — Setor ${c.setor.nome}` : ''}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/promotores')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
