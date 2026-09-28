import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

const RESULTATS = {
  SUCCES: { libelle: 'Réussie', couleur: 'var(--couleur-succes)' },
  ECHEC: { libelle: 'Mot de passe erroné', couleur: 'var(--couleur-danger)' },
  BLOQUE: { libelle: 'Refusée (compte bloqué)', couleur: 'var(--couleur-danger)' },
  INCONNU: { libelle: 'Identifiant inconnu', couleur: 'var(--couleur-danger)' },
  DESACTIVE: { libelle: 'Compte désactivé', couleur: 'var(--couleur-accent)' },
};

export default function JournalConnexions() {
  const [lignes, setLignes] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);
  const [seulementIncidents, setSeulementIncidents] = useState(false);

  useEffect(() => {
    api.journalConnexions().then(setLignes).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }, []);

  const affichees = seulementIncidents ? lignes.filter((l) => l.resultat !== 'SUCCES') : lignes;

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Journal des connexions" />

      <div className="page-conteneur">
        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="carte" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>Tentatives de connexion</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--couleur-texte-doux)', marginBottom: '1rem' }}>
            Les 300 dernières tentatives. Après 5 mots de passe erronés de suite sur un identifiant, le compte est bloqué 15 minutes.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={seulementIncidents} onChange={(e) => setSeulementIncidents(e.target.checked)} />
            Afficher seulement les incidents (échecs, blocages, identifiants inconnus)
          </label>

          {chargement ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Chargement…</p>
          ) : affichees.length === 0 ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>
              {seulementIncidents ? 'Aucun incident.' : 'Aucune tentative enregistrée pour l\'instant.'}
            </p>
          ) : (
            <div className="tableau-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '0.3rem 0' }}>Quand</th>
                    <th>Identifiant</th>
                    <th>Résultat</th>
                    <th>Adresse IP</th>
                  </tr>
                </thead>
                <tbody>
                  {affichees.map((l) => {
                    const r = RESULTATS[l.resultat] || { libelle: l.resultat, couleur: 'inherit' };
                    return (
                      <tr key={l.id} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                        <td style={{ padding: '0.5rem 0', whiteSpace: 'nowrap' }}>
                          {new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{l.identifiant}</td>
                        <td style={{ color: r.couleur, fontWeight: 600 }}>{r.libelle}</td>
                        <td style={{ color: 'var(--couleur-texte-doux)' }}>{l.ip || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
