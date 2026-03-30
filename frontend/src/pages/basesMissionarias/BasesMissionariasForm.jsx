import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function BasesMissionariasForm() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/bases-missionarias', { replace: true }); }, []);
  return null;
}
