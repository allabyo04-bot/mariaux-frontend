import { useState } from 'react';
import EnTete from '../components/EnTete';
import RecuFacture from '../components/RecuFacture';
import { api } from '../lib/api';

export default function HistoriqueFactures() {
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [numero, setNumero] = useState('');
  const [fidele, setFidele] = useState('');

  const [resultats, setResultats] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [factureOuverte, setFactureOuverte] = useState(null);

  async function gererRecherche(e) {
    e?.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const params = {};
      if (debut && fin) { params.debut = debut; params.fin = fin; }
      if (numero.trim()) params.numero = numero.trim();
      if (fidele.trim()) params.fidele = fidele.trim();
      const donnees = await api.listerFactures(params);
      setResultats(donnees);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererOuverture(id) {
    setErreur('');
    try {
      const facture = await api.obtenirFacture(id);
      setFactureOuverte(facture);
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function gererSuppression(f) {
    const confirme = window.confirm(`Supprimer définitivement la facture n° ${f.numero} (${f.fidele}) ? Cette action est irréversible.`);
    if (!confirme) return;

    setErreur('');
    try {
      await api.annulerFacture(f.id);
      setResultats((r) => r.filter((x) => x.id !== f.id));
      if (factureOuverte?.id === f.id) setFactureOuverte(null);
    } catch (e) {
      setErreur(e.message);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print"><EnTete titre="Historique des factures" /></div>

      <div className="page-conteneur">
        <div className="carte no-print" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Rechercher une facture</h2>
          <form onSubmit={gererRecherche} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Du</label>
              <input type="date" className="champ" value={debut} onChange={(e) => setDebut(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Au</label>
              <input type="date" className="champ" value={fin} onChange={(e) => setFin(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">N° de reçu</label>
              <input className="champ" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex : 13579" />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label className="etiquette">Fidèle</label>
              <input className="champ" value={fidele} onChange={(e) => setFidele(e.target.value)} placeholder="Nom du fidèle" />
            </div>
            <button className="bouton bouton-primaire" disabled={chargement}>
              {chargement ? 'Recherche…' : 'Rechercher'}
            </button>
          </form>
          <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '0.6rem' }}>
            Sans filtre, les 100 dernières factures sont affichées.
          </p>
        </div>

        {erreur && <p className="message-erreur no-print">{erreur}</p>}

        {factureOuverte && (
          <div className="carte no-print" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem' }}>Reçu n° {factureOuverte.numero}</h2>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="bouton bouton-accent" onClick={() => window.print()}>Imprimer</button>
                <button className="bouton bouton-discret" onClick={() => setFactureOuverte(null)}>Fermer</button>
              </div>
            </div>
            <div style={{ border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon)', padding: '1rem 0' }}>
              <RecuFacture facture={factureOuverte} />
            </div>
          </div>
        )}
        <div className="carte no-print" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Résultats {resultats.length > 0 && `(${resultats.length})`}</h2>
          {resultats.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--couleur-texte-doux)' }}>
              {chargement ? 'Chargement…' : 'Aucun résultat — lance une recherche.'}
            </p>
          ) : (
            <div className="tableau-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '0.3rem 0' }}>N°</th>
                    <th>Date</th>
                    <th>Fidèle</th>
                    <th>Net à payer</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((f) => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                      <td style={{ padding: '0.5rem 0' }}>{f.numero}</td>
                      <td>{new Date(f.date).toLocaleDateString('fr-FR')}</td>
                      <td>{f.fidele}</td>
                      <td>{Number(f.netAPayer).toLocaleString('fr-FR')} F</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => gererOuverture(f.id)}>
                            Voir / Imprimer
                          </button>
                          <button
                            className="bouton"
                            style={{ padding: '0.25rem 0.6rem', background: 'transparent', color: 'var(--couleur-danger)', border: '1px solid var(--couleur-danger)' }}
                            onClick={() => gererSuppression(f)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {factureOuverte && (
        <div id="zone-impression-recu" style={{ display: 'none' }}>
          <RecuFacture facture={factureOuverte} />
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #zone-impression-recu, #zone-impression-recu * { visibility: visible; display: block !important; }
          #zone-impression-recu { position: absolute; top: 0; left: 0; }
        }
      `}</style>
    </div>
  );
}
