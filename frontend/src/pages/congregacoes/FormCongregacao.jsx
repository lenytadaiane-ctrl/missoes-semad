import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function FormCongregacao() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { tipo: 'CAPITAL' } });

  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });
  const { data: record } = useQuery({
    queryKey: ['congregacao', id],
    queryFn: () => api.get(`/congregacoes/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => { if (record) reset({ ...record, setorId: record.setorId || '' }); }, [record, reset]);

  async function onSubmit(data) {
    try {
      if (isEdit) { await api.put(`/congregacoes/${id}`, data); toast.success('Atualizada'); }
      else { await api.post('/congregacoes', data); toast.success('Criada'); }
      navigate('/congregacoes');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Editar Congregação' : 'Nova Congregação'}</h1>
        <Button variant="secondary" onClick={() => navigate('/congregacoes')}>Voltar</Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <Input label="Nome *" {...register('nome', { required: true })} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Setor</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('setorId')}>
            <option value="">Sem setor (Interior)</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" {...register('tipo')}>
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
        </div>
        <Input label="Cidade" {...register('cidade')} />
        <Input label="Endereço" {...register('endereco')} />
        <Input label="Local / Bairro" {...register('local')} />
        <Input label="Pastor" {...register('pastor')} />
        <Input label="Meta de Oferta (R$)" type="number" step="0.01" min="0" {...register('metaOferta')} />
        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar' : 'Criar'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/congregacoes')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
