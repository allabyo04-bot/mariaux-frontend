import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const [nom, setNom] = useState('');
  const [identifiant, setIdentifiant] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('CAISSE');
  const [enCours, setEnCours] = useState(false);

  const [pinEnCoursId, setPinEnCoursId] = useState(null);
  const [nouveauPinSaisi, setNouveauPinSaisi] = useState('');

  useEffect(() => { charger(); }, []);

  function charger() {
    api.listerUtilisateurs().then(setUtilisateurs).catch((e) => setErreur(e.message));
  }

  async function gererCreation(e) {
    e.preventDefault();
    setErreur(''); setSucces('');
    if (!nom.trim() || !identifiant.trim() || !pin) {
      setErreur('Nom, identifiant et PIN sont requis');
      return;
    }
    setEnCours(true);
    try {
      await api.creerUtilisateur({ nom: nom.trim(), identifiant: identifiant.trim(), pin, role });
      setNom(''); setIdentifiant(''); setPin(''); setRole('CAISSE');
      setSucces('Compte créé.');
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  async function gererBascule(u) {
    setErreur('');
    try {
      await api.modifierUtilisateur(u.id, { actif: !u.actif });
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function gererReinitialisationPin(id) {
    setErreur(''); setSucces('');
    if (!nouveauPinSaisi || nouveauPinSaisi.length < 4) {
      setErreur('Le nouveau PIN doit faire au moins 4 chiffres');
      return;
    }
    try {
      await api.reinitialiserPin(id, nouveauPinSaisi);
      setPinEnCoursId(null);
      setNouveauPinSaisi('');
      setSucces('PIN réinitialisé.');
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Utilisateurs" />

      <div className="page-conteneur">
        <div className="carte" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Créer un compte</h2>
          <form onSubmit={gererCreation} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label className="etiquette">Nom</label>
              <input className="champ" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Sr Marie Reine" />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Identifiant</label>
              <input className="champ" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} placeholder="Ex : mreine" />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="etiquette">PIN</label>
              <input type="password" inputMode="numeric" className="champ" value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Rôle</label>
              <select className="champ" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="CAISSE">Caisse</option>
                <option value="CURE">Curé</option>
              </select>
            </div>
            <button className="bouton bouton-primaire" disabled={enCours}>Créer</button>
          </form>
          {erreur && <p className="message-erreur">{erreur}</p>}
          {succes && <p style={{ color: 'var(--couleur-succes)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{succes}</p>}
        </div>

        <div className="carte" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Comptes existants</h2>
          <div className="tableau-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '0.3rem 0' }}>Nom</th>
                  <th>Identifiant</th>
                  <th>Rôle</th>
                  <th>Actif</th>
                  <th>PIN</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--couleur-bordure)', opacity: u.actif ? 1 : 0.5 }}>
                    <td style={{ padding: '0.5rem 0' }}>{u.nom}</td>
                    <td>{u.identifiant}</td>
                    <td>{u.role === 'CURE' ? 'Curé' : 'Caisse'}</td>
                    <td>
                      <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => gererBascule(u)}>
                        {u.actif ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                    <td>
                      {pinEnCoursId === u.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input
                            type="password"
                            inputMode="numeric"
                            placeholder="Nouveau PIN"
                            value={nouveauPinSaisi}
                            onChange={(e) => setNouveauPinSaisi(e.target.value)}
                            style={{ width: 100, padding: '0.2rem 0.4rem', border: '1px solid var(--couleur-bordure)', borderRadius: 4 }}
                          />
                          <button className="bouton bouton-accent" style={{ padding: '0.25rem 0.6rem' }} onClick={() => gererReinitialisationPin(u.id)}>OK</button>
                          <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => { setPinEnCoursId(null); setNouveauPinSaisi(''); }}>Annuler</button>
                        </div>
                      ) : (
                        <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => { setPinEnCoursId(u.id); setNouveauPinSaisi(''); }}>
                          Réinitialiser le PIN
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
