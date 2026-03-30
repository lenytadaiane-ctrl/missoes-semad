import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function AgentesForm() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/agentes', { replace: true }); }, []);
  return null;
}
