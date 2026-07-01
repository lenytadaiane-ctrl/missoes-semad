import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function FormSetor() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { tipo: 'CAPITAL' } });

  const { data: record } = useQuery({
    queryKey: ['setor', id],
    queryFn: () => api.get(`/setores/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (record) reset(record); }, [record, reset]);

  async function onSubmit(data) {
    try {
      if (isEdit) { await api.put(`/setores/${id}`, data); toast.success('Atualizado'); }
      else { await api.post('/setores', data); toast.success('Criado'); }
      navigate('/setores');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="max-w-md space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Setor' : 'Novo Setor'}</h1>
        <Button variant="secondary" onClick={() => navigate('/setores')}>Voltar</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <Input label="Nome *" {...register('nome', { required: true })} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('tipo')}>
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar' : 'Criar'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/setores')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
