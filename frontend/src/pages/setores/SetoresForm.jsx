import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function SetoresForm() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/setores', { replace: true }); }, []);
  return null;
}
