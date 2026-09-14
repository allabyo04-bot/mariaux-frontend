import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Connexion() {
  const [identifiant, setIdentifiant] = useState('');
  const [pin, setPin] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const { connexion } = useAuth();
  const navigate = useNavigate();

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    setEnCours(true);
    try {
      const u = await connexion(identifiant.trim(), pin.trim());
      navigate(u.role === 'CURE' ? '/tableau-de-bord' : '/caisse');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(160deg, var(--couleur-primaire) 0%, var(--couleur-primaire) 55%, var(--couleur-fond) 55%)',
      }}
    >
      <div className="carte" style={{ width: 380, padding: '2.5rem 2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--couleur-accent)',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: 'var(--police-titre)',
              fontSize: '1.3rem',
            }}
          >
            +
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>LOGESPAC</h1>
          <p style={{ color: 'var(--couleur-texte-doux)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
            Gestion de paroisse
          </p>
        </div>

        <form onSubmit={gererSoumission}>
          <div style={{ marginBottom: '1.1rem' }}>
            <label className="etiquette" htmlFor="identifiant">Identifiant</label>
            <input
              id="identifiant"
              className="champ"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="etiquette" htmlFor="pin">Code PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              className="champ"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          {erreur && <p className="message-erreur">{erreur}</p>}

          <button type="submit" className="bouton bouton-primaire" style={{ width: '100%' }} disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
