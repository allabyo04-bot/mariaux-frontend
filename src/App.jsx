import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RouteProtegee from './components/RouteProtegee';
import Connexion from './pages/Connexion';
import Caisse from './pages/Caisse';
import TableauDeBord from './pages/TableauDeBord';
import ListingMesses from './pages/ListingMesses';
import Gestion from './pages/Gestion';
import HistoriqueFactures from './pages/HistoriqueFactures';
import EtatRecettes from './pages/EtatRecettes';
import Utilisateurs from './pages/Utilisateurs';
import MonCompte from './pages/MonCompte';
import FermeturesCaisse from './pages/FermeturesCaisse';
import PiedDePage from './components/PiedDePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Connexion />} />
          <Route path="/caisse" element={<RouteProtegee roleRequis="CAISSE" enfant={<Caisse />} />} />
          <Route path="/tableau-de-bord" element={<RouteProtegee roleRequis="CURE" enfant={<TableauDeBord />} />} />
          <Route path="/listing-messes" element={<RouteProtegee enfant={<ListingMesses />} />} />
          <Route path="/gestion" element={<RouteProtegee roleRequis="CURE" enfant={<Gestion />} />} />
          <Route path="/historique" element={<RouteProtegee roleRequis="CURE" enfant={<HistoriqueFactures />} />} />
          <Route path="/etat-recettes" element={<RouteProtegee roleRequis="CURE" enfant={<EtatRecettes />} />} />
          <Route path="/utilisateurs" element={<RouteProtegee roleRequis="CURE" enfant={<Utilisateurs />} />} />
          <Route path="/mon-compte" element={<RouteProtegee enfant={<MonCompte />} />} />
          <Route path="/fermetures" element={<RouteProtegee roleRequis="CURE" enfant={<FermeturesCaisse />} />} />
        </Routes>
        <PiedDePage />
      </AuthProvider>
    </BrowserRouter>
  );
}
