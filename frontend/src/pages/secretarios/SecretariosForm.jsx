import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function SecretariosForm() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/secretarios', { replace: true }); }, []);
  return null;
}
