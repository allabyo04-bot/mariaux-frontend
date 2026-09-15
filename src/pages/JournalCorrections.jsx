import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

export default function JournalCorrections() {
  const [corrections, setCorrections] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.listerCorrectionsIntention().then(setCorrections).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Journal des corrections" />

      <div className="page-conteneur">
        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="carte" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Corrections d'intentions de messe</h2>

          {chargement ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Chargement…</p>
          ) : corrections.length === 0 ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune correction pour l'instant.</p>
          ) : (
            <div className="tableau-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '0.3rem 0' }}>Messe</th>
                    <th>Ancienne intention</th>
                    <th>Nouvelle intention</th>
                    <th>Motif</th>
                    <th>Par</th>
                    <th>Quand</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                      <td style={{ padding: '0.5rem 0', whiteSpace: 'nowrap' }}>
                        {new Date(c.demandeMesse.dateMesse).toLocaleDateString('fr-FR')} {c.demandeMesse.heureDebut}
                      </td>
                      <td style={{ maxWidth: 220 }}>{c.ancienneIntention}</td>
                      <td style={{ maxWidth: 220 }}>{c.nouvelleIntention}</td>
                      <td style={{ maxWidth: 180 }}>{c.motif}</td>
                      <td>{c.faitPar?.nom}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
