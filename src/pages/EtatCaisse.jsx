import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import BordereauFermeture from '../components/BordereauFermeture';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function TableauDesignations({ donnees }) {
  if (!donnees || (donnees.parDesignation?.length || 0) === 0) {
    return <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune recette sur cette période.</p>;
  }
  return (
    <div className="tableau-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
            <th style={{ padding: '0.3rem 0' }}>Désignation</th>
            <th style={{ textAlign: 'right' }}>Qté</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {donnees.parDesignation.map((d) => (
            <tr key={d.libelle} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
              <td style={{ padding: '0.55rem 0' }}>{d.libelle}</td>
              <td style={{ textAlign: 'right' }}>{d.quantite}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.montant.toLocaleString('fr-FR')} F</td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--couleur-primaire)' }}>
            <td style={{ padding: '0.55rem 0', fontWeight: 700 }}>Total</td>
            <td></td>
            <td style={{ textAlign: 'right', fontWeight: 700 }}>
              {(donnees.totalJour ?? donnees.totalSemaine ?? 0).toLocaleString('fr-FR')} F
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function EtatCaisse() {
  const { utilisateur } = useAuth();
  const [recapJour, setRecapJour] = useState(null);
  const [recapSemaine, setRecapSemaine] = useState(null);
  const [recapAImprimer, setRecapAImprimer] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.recettesDuJour().then(setRecapJour).catch((e) => setErreur(e.message));
    api.recettesSemaine().then(setRecapSemaine).catch((e) => setErreur(e.message));
  }, []);

  async function gererImpressionRecapJour() {
    setErreur('');
    try {
      const factures = await api.listerFactures();
      const debut = new Date();
      debut.setHours(0, 0, 0, 0);
      setRecapAImprimer({
        dateDebut: debut.toISOString(),
        dateFin: new Date().toISOString(),
        nombreFactures: factures.length,
        totalNetAPayer: recapJour?.totalJour || 0,
        totalExcedent: 0,
        recapRubriques: recapJour?.parRubrique || [],
        detailDesignations: recapJour?.parDesignation || [],
        faitPar: { nom: utilisateur?.nom },
      });
      setTimeout(() => window.print(), 60);
    } catch (e) {
      setErreur(e.message);
    }
  }

  function gererImpressionRecapSemaine() {
    if (!recapSemaine) return;
    setErreur('');
    setRecapAImprimer({
      dateDebut: recapSemaine.dateDebut,
      dateFin: recapSemaine.dateFin,
      nombreFactures: recapSemaine.nombreFactures,
      totalNetAPayer: recapSemaine.totalSemaine,
      totalExcedent: 0,
      recapRubriques: recapSemaine.parRubrique,
      detailDesignations: recapSemaine.parDesignation || [],
      faitPar: { nom: utilisateur?.nom },
    });
    setTimeout(() => window.print(), 60);
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print"><EnTete titre="État" /></div>

      <div className="page-conteneur no-print">
        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="carte" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>Récap du jour</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)' }}>Depuis minuit aujourd'hui</p>
            </div>
            {recapJour && (
              <button className="bouton bouton-accent" onClick={gererImpressionRecapJour} disabled={!recapJour.totalJour}>
                Imprimer
              </button>
            )}
          </div>
          <TableauDesignations donnees={recapJour} />
        </div>

        <div className="carte" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>Bilan de la semaine</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)' }}>Lundi à samedi, semaine en cours</p>
            </div>
            {recapSemaine && (
              <button className="bouton bouton-accent" onClick={gererImpressionRecapSemaine} disabled={!recapSemaine.totalSemaine}>
                Imprimer
              </button>
            )}
          </div>
          <TableauDesignations donnees={recapSemaine} />
        </div>
      </div>

      {recapAImprimer && (
        <div id="zone-impression-bordereau" style={{ display: 'none' }}>
          <BordereauFermeture fermeture={recapAImprimer} />
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #zone-impression-bordereau, #zone-impression-bordereau * { visibility: visible; display: block !important; }
          #zone-impression-bordereau { position: absolute; top: 0; left: 0; }
        }
      `}</style>
    </div>
  );
}
