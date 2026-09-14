import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

export default function FermeturesCaisse() {
  const [fermetures, setFermetures] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.listerFermetures().then(setFermetures).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Fermetures de caisse" />

      <div className="page-conteneur">
        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="carte" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Historique des fermetures</h2>

          {chargement ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Chargement…</p>
          ) : fermetures.length === 0 ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune fermeture pour l'instant.</p>
          ) : (
            <div className="tableau-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '0.3rem 0' }}>Période</th>
                    <th>Factures</th>
                    <th>Net à payer</th>
                    <th>Dons</th>
                    <th>Total</th>
                    <th>Fermée par</th>
                  </tr>
                </thead>
                <tbody>
                  {fermetures.map((f) => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                      <td style={{ padding: '0.55rem 0' }}>
                        {new Date(f.dateDebut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {new Date(f.dateFin).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>{f.nombreFactures}</td>
                      <td>{Number(f.totalNetAPayer).toLocaleString('fr-FR')} F</td>
                      <td>{Number(f.totalExcedent) > 0 ? `${Number(f.totalExcedent).toLocaleString('fr-FR')} F` : '—'}</td>
                      <td style={{ fontWeight: 600 }}>
                        {(Number(f.totalNetAPayer) + Number(f.totalExcedent)).toLocaleString('fr-FR')} F
                      </td>
                      <td>{f.faitPar?.nom}</td>
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
