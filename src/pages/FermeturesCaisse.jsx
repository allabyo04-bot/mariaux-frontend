import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import BordereauFermeture from '../components/BordereauFermeture';
import { api } from '../lib/api';

export default function FermeturesCaisse() {
  const [fermetures, setFermetures] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);
  const [detailOuvert, setDetailOuvert] = useState(null);

  useEffect(() => {
    api.listerFermetures().then(setFermetures).catch((e) => setErreur(e.message)).finally(() => setChargement(false));
  }, []);

  async function gererImpression(id) {
    setErreur('');
    try {
      const detail = await api.obtenirDetailFermeture(id);
      setDetailOuvert(detail);
      setTimeout(() => window.print(), 60);
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print"><EnTete titre="Fermetures de caisse" /></div>

      <div className="page-conteneur">
        {erreur && <p className="message-erreur no-print">{erreur}</p>}

        <div className="carte no-print" style={{ padding: '1.5rem' }}>
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
                    <th></th>
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
                      <td>
                        <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => gererImpression(f.id)}>
                          Bordereau
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailOuvert && (
        <div id="zone-impression-bordereau" style={{ display: 'none' }}>
          <BordereauFermeture fermeture={detailOuvert} />
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
