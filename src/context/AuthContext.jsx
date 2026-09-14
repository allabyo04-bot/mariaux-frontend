import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const stocke = localStorage.getItem('logespac_utilisateur');
    if (stocke) setUtilisateur(JSON.parse(stocke));
    setChargement(false);
  }, []);

  async function connexion(identifiant, pin) {
    const { token, utilisateur: u } = await api.connexion(identifiant, pin);
    localStorage.setItem('logespac_token', token);
    localStorage.setItem('logespac_utilisateur', JSON.stringify(u));
    setUtilisateur(u);
    return u;
  }

  function deconnexion() {
    localStorage.removeItem('logespac_token');
    localStorage.removeItem('logespac_utilisateur');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connexion, deconnexion, chargement }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
