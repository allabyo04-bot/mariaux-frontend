import { useState } from 'react';
import EnTete from '../components/EnTete';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function MonCompte() {
  const { utilisateur } = useAuth();
  const [ancienPin, setAncienPin] = useState('');
  const [nouveauPin, setNouveauPin] = useState('');
  const [confirmationPin, setConfirmationPin] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur(''); setSucces('');

    if (nouveauPin.length < 4) {
      setErreur('Le nouveau PIN doit faire au moins 4 chiffres');
      return;
    }
    if (nouveauPin !== confirmationPin) {
      setErreur('La confirmation ne correspond pas au nouveau PIN');
      return;
    }

    setEnCours(true);
    try {
      await api.changerMonPin(ancienPin, nouveauPin);
      setSucces('PIN modifié avec succès.');
      setAncienPin(''); setNouveauPin(''); setConfirmationPin('');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Mon compte" />

      <div className="page-conteneur" style={{ maxWidth: 480 }}>
        <div className="carte" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>{utilisateur?.nom}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--couleur-texte-doux)', marginBottom: '1.5rem' }}>
            Rôle : {utilisateur?.role === 'CURE' ? 'Curé' : 'Caisse'}
          </p>

          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Changer mon PIN</h3>
          <form onSubmit={gererSoumission}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="etiquette">PIN actuel</label>
              <input type="password" inputMode="numeric" className="champ" value={ancienPin} onChange={(e) => setAncienPin(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="etiquette">Nouveau PIN</label>
              <input type="password" inputMode="numeric" className="champ" value={nouveauPin} onChange={(e) => setNouveauPin(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="etiquette">Confirmer le nouveau PIN</label>
              <input type="password" inputMode="numeric" className="champ" value={confirmationPin} onChange={(e) => setConfirmationPin(e.target.value)} />
            </div>

            {erreur && <p className="message-erreur">{erreur}</p>}
            {succes && <p style={{ color: 'var(--couleur-succes)', fontSize: '0.9rem', marginBottom: '1rem' }}>{succes}</p>}

            <button className="bouton bouton-primaire" style={{ width: '100%' }} disabled={enCours}>
              {enCours ? 'Modification…' : 'Changer le PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
