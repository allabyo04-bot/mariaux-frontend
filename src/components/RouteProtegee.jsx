import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RouteProtegee({ enfant, roleRequis }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return null;
  if (!utilisateur) return <Navigate to="/" replace />;
  if (roleRequis && utilisateur.role !== roleRequis) {
    return <Navigate to={utilisateur.role === 'CURE' ? '/tableau-de-bord' : '/caisse'} replace />;
  }

  return enfant;
}
