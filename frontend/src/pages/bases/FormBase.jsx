import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function FormBase() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: record } = useQuery({
    queryKey: ['base', id],
    queryFn: () => api.get(`/bases-missionarias/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (record) reset(record); }, [record, reset]);

  async function onSubmit(data) {
    try {
      if (isEdit) { await api.put(`/bases-missionarias/${id}`, data); toast.success('Atualizada'); }
      else { await api.post('/bases-missionarias', data); toast.success('Criada'); }
      navigate('/bases-missionarias');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Base' : 'Nova Base Missionária'}</h1>
        <Button variant="secondary" onClick={() => navigate('/bases-missionarias')}>Voltar</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <Input label="Nome *" {...register('nome', { required: true })} />
        <Input label="Endereço" {...register('endereco')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Cidade" {...register('cidade')} />
          <Input label="Estado/País" {...register('estado')} />
          <Input label="Telefone" {...register('telefone')} />
          <Input label="E-mail" type="email" {...register('email')} />
        </div>
        <Input label="Responsável" {...register('responsavelNome')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} {...register('descricao')} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar' : 'Criar'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/bases-missionarias')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
