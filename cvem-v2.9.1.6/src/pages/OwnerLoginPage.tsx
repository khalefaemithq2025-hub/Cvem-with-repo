// OwnerLoginPage is now unified — redirect to main login
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/auth/login', { replace: true }); }, [navigate]);
  return null;
}
