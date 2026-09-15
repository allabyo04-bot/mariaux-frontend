import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EnTete({ titre }) {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  function gererDeconnexion() {
    deconnexion();
    navigate('/');
  }

  function allerA(chemin) {
    navigate(chemin);
    // ferme le menu <details> si ouvert
    document.getElementById('menu-admin')?.removeAttribute('open');
  }

  return (
    <header className="en-tete">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--police-titre)', fontSize: '1.15rem', fontWeight: 600 }}>
          LOGESPAC
        </span>
        <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>{titre}</span>
      </div>
      <div className="en-tete-liens">
        <button
          onClick={() => allerA(utilisateur?.role === 'CURE' ? '/tableau-de-bord' : '/caisse')}
          className="bouton bouton-discret"
          style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Accueil
        </button>
        <button
          onClick={() => allerA('/listing-messes')}
          className="bouton bouton-discret"
          style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Listing des messes
        </button>

        {utilisateur?.role === 'CURE' && (
          <details id="menu-admin" style={{ position: 'relative' }}>
            <summary
              className="bouton bouton-discret"
              style={{
                background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)',
                listStyle: 'none', display: 'inline-block',
              }}
            >
              Administration ▾
            </summary>
            <div
              style={{
                position: 'absolute', top: '110%', right: 0, background: 'var(--couleur-surface)',
                border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon)',
                boxShadow: 'var(--ombre)', minWidth: 200, zIndex: 20, overflow: 'hidden',
              }}
            >
              {[
                { chemin: '/gestion', label: 'Gestion' },
                { chemin: '/historique', label: 'Historique' },
                { chemin: '/etat-recettes', label: 'État des recettes' },
                { chemin: '/utilisateurs', label: 'Utilisateurs' },
                { chemin: '/fermetures', label: 'Fermetures de caisse' },
                { chemin: '/journal-corrections', label: 'Journal des corrections' },
              ].map((item) => (
                <button
                  key={item.chemin}
                  onClick={() => allerA(item.chemin)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 1rem',
                    border: 'none', background: 'none', color: 'var(--couleur-texte)', fontSize: '0.9rem',
                    borderBottom: '1px solid var(--couleur-bordure)', cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </details>
        )}

        <button
          onClick={() => allerA('/mon-compte')}
          className="bouton bouton-discret"
          style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Mon compte
        </button>

        <span className="en-tete-role" style={{ fontSize: '0.9rem', opacity: 0.85 }}>
          {utilisateur?.nom} — {utilisateur?.role === 'CURE' ? 'Curé' : 'Caisse'}
        </span>
        <button
          onClick={gererDeconnexion}
          className="bouton"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
