import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function CongregacoesForm() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/congregacoes', { replace: true }); }, []);
  return null;
}
