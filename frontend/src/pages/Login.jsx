import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(data) {
    try {
      const res = await api.post('/auth/login', data);
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900">SEMAD IEADMS</h1>
          <p className="text-gray-500 mt-1 text-sm">Sistema de Gestão — Departamento de Missões</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Usuário"
            placeholder="Digite seu usuário"
            error={errors.usuario?.message}
            {...register('usuario', { required: 'Usuário obrigatório' })}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            error={errors.senha?.message}
            {...register('senha', { required: 'Senha obrigatória' })}
          />
          <Button type="submit" loading={isSubmitting} className="w-full justify-center">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
