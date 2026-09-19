import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

export default function TableauDeBord() {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');
  const [detailOuvert, setDetailOuvert] = useState(false);

  useEffect(() => {
    api.recettesDuJour().then(setDonnees).catch((e) => setErreur(e.message));
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Tableau de bord" />

      <div className="page-conteneur">
        {erreur && <p className="message-erreur">{erreur}</p>}

        {donnees && (
          <>
            <div className="grille-cartes" style={{ marginBottom: '1.5rem' }}>
              <div
                className="carte"
                style={{ padding: '1.5rem', cursor: 'pointer' }}
                onClick={() => setDetailOuvert((v) => !v)}
                title="Cliquer pour voir le détail par désignation"
              >
                <span className="etiquette">Recettes du jour</span>
                <div style={{ fontFamily: 'var(--police-titre)', fontSize: '2rem', color: 'var(--couleur-primaire)' }}>
                  {donnees.totalJour.toLocaleString('fr-FR')} F
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--couleur-texte-doux)', marginTop: '0.3rem' }}>
                  {detailOuvert ? 'Masquer le détail ▴' : 'Voir le détail par désignation ▾'}
                </p>
              </div>
              <div className="carte" style={{ padding: '1.5rem' }}>
                <span className="etiquette">Cumul de la semaine</span>
                <div style={{ fontFamily: 'var(--police-titre)', fontSize: '2rem', color: 'var(--couleur-primaire)' }}>
                  {donnees.cumulSemaine.toLocaleString('fr-FR')} F
                </div>
              </div>
              <div className="carte" style={{ padding: '1.5rem' }}>
                <span className="etiquette">Cumul du mois</span>
                <div style={{ fontFamily: 'var(--police-titre)', fontSize: '2rem', color: 'var(--couleur-accent)' }}>
                  {donnees.cumulMois.toLocaleString('fr-FR')} F
                </div>
              </div>
            </div>

            {detailOuvert && (
              <div className="carte" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Recettes du jour par désignation</h2>
                {(donnees.parDesignation?.length || 0) === 0 ? (
                  <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune recette aujourd'hui.</p>
                ) : (
                  <div className="tableau-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        {donnees.parDesignation.map((d) => (
                          <tr key={d.libelle} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                            <td style={{ padding: '0.6rem 0' }}>{d.libelle} ({d.quantite})</td>
                            <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>
                              {d.montant.toLocaleString('fr-FR')} F
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
