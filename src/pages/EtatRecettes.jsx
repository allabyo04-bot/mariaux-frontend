import { useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

function aujourdHui() {
  return new Date().toISOString().slice(0, 10);
}

function debutAnnee() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
}

function formaterPeriode(periode, granularite) {
  if (granularite === 'annee') return periode;
  if (granularite === 'mois') {
    const [annee, mois] = periode.split('-');
    const date = new Date(`${annee}-${mois}-01T12:00:00`);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  return new Date(`${periode}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function EtatRecettes() {
  const [debut, setDebut] = useState(debutAnnee());
  const [fin, setFin] = useState(aujourdHui());
  const [granularite, setGranularite] = useState('mois');
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);

  async function gererRecherche(e) {
    e?.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const d = await api.etatRecettes({ debut, fin, granularite });
      setDonnees(d);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function gererExportCsv() {
    setErreur('');
    setExportEnCours(true);
    try {
      await api.exporterRecettesCsv({ debut, fin });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setExportEnCours(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print"><EnTete titre="État des recettes" /></div>

      <div className="page-conteneur">
        <div className="carte no-print" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Regrouper les recettes</h2>
          <form onSubmit={gererRecherche} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Du</label>
              <input type="date" className="champ" value={debut} onChange={(e) => setDebut(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="etiquette">Au</label>
              <input type="date" className="champ" value={fin} onChange={(e) => setFin(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className="etiquette">Regrouper par</label>
              <select className="champ" value={granularite} onChange={(e) => setGranularite(e.target.value)}>
                <option value="jour">Jour</option>
                <option value="mois">Mois</option>
                <option value="annee">Année</option>
              </select>
            </div>
            <button className="bouton bouton-primaire" disabled={chargement}>
              {chargement ? 'Calcul…' : 'Afficher'}
            </button>
            {donnees && (
              <button type="button" className="bouton bouton-accent" onClick={() => window.print()}>
                Imprimer
              </button>
            )}
            {donnees && (
              <button type="button" className="bouton bouton-discret" onClick={gererExportCsv} disabled={exportEnCours}>
                {exportEnCours ? 'Export…' : 'Export CSV'}
              </button>
            )}
          </form>
        </div>

        {erreur && <p className="message-erreur no-print">{erreur}</p>}

        {donnees && (
          <div id="rapport-recettes" className="carte" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderBottom: '2px solid var(--couleur-primaire)', paddingBottom: '0.9rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 46, height: 46, borderRadius: '50%', background: 'var(--couleur-primaire)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  fontFamily: 'var(--police-titre)', fontSize: '1.25rem', flexShrink: 0,
                }}
              >
                +
              </div>
              <div>
                <div style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: '1rem', color: 'var(--couleur-primaire)' }}>
                  Archidiocèse de Cotonou
                </div>
                <div style={{ fontFamily: 'var(--police-titre)', fontSize: '0.9rem' }}>
                  Paroisse Marie Auxiliatrice de Mènontin
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--couleur-texte-doux)' }}>
                  Cotonou, Bénin
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '0.3rem' }}>
              État des recettes
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--couleur-texte-doux)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Du {new Date(`${debut}T12:00:00`).toLocaleDateString('fr-FR')} au {new Date(`${fin}T12:00:00`).toLocaleDateString('fr-FR')}
            </p>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="etiquette">Total de la période</span>
              <div style={{ fontFamily: 'var(--police-titre)', fontSize: '2.1rem', color: 'var(--couleur-primaire)' }}>
                {donnees.total.toLocaleString('fr-FR')} F
              </div>
            </div>

            <h2 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--couleur-accent)', borderBottom: '1px solid var(--couleur-bordure)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              Récapitulatif par rubrique
            </h2>
            {donnees.recapRubriques.length === 0 ? (
              <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem', marginBottom: '2rem' }}>Aucune recette sur cette période.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem' }}>
                <tbody>
                  {donnees.recapRubriques.map((r) => (
                    <tr key={r.rubrique} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                      <td style={{ padding: '0.55rem 0' }}>{r.rubrique}</td>
                      <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 600 }}>{r.montant.toLocaleString('fr-FR')} F</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--couleur-primaire)' }}>
                    <td style={{ padding: '0.55rem 0', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {donnees.recapRubriques.reduce((s, r) => s + r.montant, 0).toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            <h2 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--couleur-accent)', borderBottom: '1px solid var(--couleur-bordure)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              Détail par {granularite === 'jour' ? 'jour' : granularite === 'mois' ? 'mois' : 'année'}
            </h2>
            {donnees.resultat.length === 0 ? (
              <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune recette sur cette période.</p>
            ) : (
              <div className="tableau-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    {donnees.resultat.map((r) => (
                      <tr key={r.periode} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                        <td style={{ padding: '0.5rem 0', textTransform: 'capitalize' }}>{formaterPeriode(r.periode, granularite)}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>{r.montant.toLocaleString('fr-FR')} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '2rem', borderTop: '1px solid var(--couleur-bordure)', paddingTop: '0.75rem' }}>
              Document généré le {new Date().toLocaleDateString('fr-FR')} — LOGESPAC
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          #rapport-recettes { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
