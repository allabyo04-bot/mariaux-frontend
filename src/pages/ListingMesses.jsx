import { useEffect, useMemo, useRef, useState } from 'react';
import EnTete from '../components/EnTete';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const CATEGORIES_ORDRE = [
  "Messe pour le repos de l'âme de",
  "Messe d'action de grâce",
  "Messe en l'honneur de",
  'Autres intentions',
];

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

function jourSemaineDepuisDate(chaineDate) {
  const date = new Date(`${chaineDate}T12:00:00`);
  const index = date.getDay();
  return index === 0 ? 'DIMANCHE' : JOURS_ORDRE[index - 1];
}

function aujourdHui() {
  return new Date().toISOString().slice(0, 10);
}

function formaterDateLongue(chaineDate) {
  const date = new Date(`${chaineDate}T12:00:00`);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ListingMesses() {
  const { utilisateur } = useAuth();
  const [date, setDate] = useState(aujourdHui());
  const [heure, setHeure] = useState('');
  const [grilleHoraires, setGrilleHoraires] = useState(null);
  const [messes, setMesses] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [correctionId, setCorrectionId] = useState(null);
  const [correctionDate, setCorrectionDate] = useState('');
  const [correctionHeure, setCorrectionHeure] = useState('');
  const [correctionIntentionId, setCorrectionIntentionId] = useState(null);
  const [nouvelleIntentionTexte, setNouvelleIntentionTexte] = useState('');
  const [motifCorrection, setMotifCorrection] = useState('');

  useEffect(() => {
    api.listerHoraires().then(setGrilleHoraires).catch((e) => setErreur(e.message));
  }, []);

  const heuresDuJour = useMemo(() => {
    if (!grilleHoraires || !date) return [];
    const jour = jourSemaineDepuisDate(date);
    return grilleHoraires[jour] || [];
  }, [grilleHoraires, date]);

  // Dès que la date change (ou que la grille arrive), on sélectionne aussitôt
  // la première heure disponible et on charge ses intentions.
  useEffect(() => {
    if (heuresDuJour.length === 0) {
      setHeure('');
      setMesses([]);
      return;
    }
    const premiereHeure = heuresDuJour[0];
    setHeure(premiereHeure);
    charger(date, premiereHeure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heuresDuJour, date]);

  // Numéro de la dernière demande lancée — si l'utilisatrice change vite de
  // date/heure, une réponse arrivée en retard sur un choix précédent est
  // ignorée au lieu d'écraser l'affichage courant avec le mauvais contenu.
  const requeteEnCours = useRef(0);

  function charger(d, h) {
    const idRequete = ++requeteEnCours.current;
    setChargement(true);
    setErreur('');
    api.listerMesses({ date: d })
      .then((tout) => {
        if (idRequete !== requeteEnCours.current) return;
        setMesses(tout.filter((m) => m.heureDebut === h));
      })
      .catch((e) => {
        if (idRequete !== requeteEnCours.current) return;
        setErreur(e.message);
      })
      .finally(() => {
        if (idRequete === requeteEnCours.current) setChargement(false);
      });
  }

  function gererChangementHeure(nouvelleHeure) {
    setHeure(nouvelleHeure);
    charger(date, nouvelleHeure);
  }

  function heuresPourDate(chaineDate) {
    if (!grilleHoraires || !chaineDate) return [];
    return grilleHoraires[jourSemaineDepuisDate(chaineDate)] || [];
  }

  function ouvrirCorrection(m) {
    setCorrectionId(m.id);
    setCorrectionDate(date);
    setCorrectionHeure(m.heureDebut);
    setErreur('');
  }

  function annulerCorrection() {
    setCorrectionId(null);
  }

  function ouvrirCorrectionIntention(m) {
    setCorrectionIntentionId(m.id);
    setNouvelleIntentionTexte(m.intention);
    setMotifCorrection('');
    setErreur('');
  }

  function annulerCorrectionIntention() {
    setCorrectionIntentionId(null);
  }

  async function validerCorrectionIntention() {
    if (!nouvelleIntentionTexte.trim()) {
      setErreur("La nouvelle intention ne peut pas être vide");
      return;
    }
    if (!motifCorrection.trim()) {
      setErreur('Le motif de la correction est requis');
      return;
    }
    setErreur('');
    try {
      await api.corrigerIntention(correctionIntentionId, {
        nouvelleIntention: nouvelleIntentionTexte.trim(),
        motif: motifCorrection.trim(),
      });
      setCorrectionIntentionId(null);
      charger(date, heure);
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function validerCorrection() {
    if (!correctionDate || !correctionHeure) {
      setErreur('Date et heure requises pour la correction');
      return;
    }
    setErreur('');
    try {
      await api.modifierDemandeMesse(correctionId, { dateMesse: correctionDate, heureDebut: correctionHeure });
      setCorrectionId(null);
      charger(date, heure);
    } catch (e) {
      setErreur(e.message);
    }
  }

  const parCategorie = CATEGORIES_ORDRE.map((categorie) => ({
    categorie,
    entrees: messes.filter((m) => m.typeIntention === categorie),
  }));

  const categoriesConnues = new Set(CATEGORIES_ORDRE);
  const orphelines = messes.filter((m) => !categoriesConnues.has(m.typeIntention));
  if (orphelines.length > 0) {
    const autres = parCategorie.find((c) => c.categorie === 'Autres intentions');
    autres.entrees = [...autres.entrees, ...orphelines];
  }

  const nombreDeLignes = messes.length;
  const titre = heure
    ? `Intentions de messe du ${formaterDateLongue(date)} à ${heure}`
    : `Intentions de messe du ${formaterDateLongue(date)}`;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print">
        <EnTete titre="Listing des messes" />
      </div>

      <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="carte no-print" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label className="etiquette">Date</label>
            <input type="date" className="champ" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="etiquette">Heure</label>
            <select className="champ" value={heure} onChange={(e) => gererChangementHeure(e.target.value)} disabled={heuresDuJour.length === 0}>
              {heuresDuJour.length === 0 && <option value="">Aucune messe ce jour</option>}
              {heuresDuJour.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <button className="bouton bouton-accent" onClick={() => window.print()}>
            Imprimer
          </button>
        </div>

        {erreur && <p className="message-erreur no-print">{erreur}</p>}

        <div id="feuille-impression" className="carte" style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '2px solid var(--couleur-primaire)', paddingBottom: '0.6rem', marginBottom: '0.9rem' }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: '50%', background: 'var(--couleur-primaire)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                fontFamily: 'var(--police-titre)', fontSize: '1.1rem', flexShrink: 0,
              }}
            >
              +
            </div>
            <div>
              <div style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--couleur-primaire)' }}>
                Archidiocèse de Cotonou
              </div>
              <div style={{ fontFamily: 'var(--police-titre)', fontSize: '0.85rem' }}>
                Paroisse Marie Auxiliatrice de Mènontin
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--couleur-texte-doux)' }}>
                Cotonou, Bénin
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1.1rem', textTransform: 'capitalize' }}>
            {titre}
          </h1>

          {nombreDeLignes === 0 && !chargement && (
            <p style={{ textAlign: 'center', color: 'var(--couleur-texte-doux)' }}>Aucune intention pour cette messe.</p>
          )}

          {parCategorie.map(({ categorie, entrees }) => {
            if (entrees.length === 0) return null;
            return (
              // Chaque catégorie est son propre tableau : le navigateur répète
              // automatiquement le <thead> (type d'intention) en haut de chaque
              // nouvelle page, si cette catégorie s'étale sur plusieurs pages
              // à l'impression — plus jamais de page "orpheline" sans repère.
              <table key={categorie} style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.35rem', marginBottom: '0.65rem' }}>
                <thead style={{ display: 'table-header-group' }}>
                  <tr style={{ breakAfter: 'avoid' }}>
                    <td style={{ padding: 0, breakAfter: 'avoid' }}>
                      <h2
                        style={{
                          fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.02em',
                          color: 'var(--couleur-accent)', borderBottom: '1px solid var(--couleur-bordure)',
                          paddingBottom: '0.25rem', marginBottom: '0.4rem', breakAfter: 'avoid',
                        }}
                      >
                        {categorie}
                      </h2>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {entrees.map((m) => (
                    <tr key={m.id} style={{ breakInside: 'avoid' }}>
                      <td
                        style={{
                          border: '1px solid var(--couleur-bordure)', borderRadius: '4px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.88rem', lineHeight: 1.35,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
                          <span>{m.intention}</span>
                          <div className="no-print" style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                            <button
                              className="bouton bouton-discret"
                              style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => ouvrirCorrectionIntention(m)}
                              disabled={utilisateur?.role === 'CAISSE' && m.nombreCorrections >= 1}
                              title={utilisateur?.role === 'CAISSE' && m.nombreCorrections >= 1 ? "Déjà corrigée une fois — demande au Curé" : ''}
                            >
                              Corriger l'intention
                            </button>
                            <button
                              className="bouton bouton-discret"
                              style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => ouvrirCorrection(m)}
                            >
                              Corriger date/heure
                            </button>
                          </div>
                        </div>

                        {correctionIntentionId === m.id && (
                          <div className="no-print" style={{ marginTop: '0.6rem', padding: '0.6rem', background: 'var(--couleur-fond)', borderRadius: '4px' }}>
                            <label className="etiquette" style={{ fontSize: '0.7rem' }}>Nouvelle intention</label>
                            <textarea
                              className="champ"
                              rows={3}
                              style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                              value={nouvelleIntentionTexte}
                              onChange={(e) => setNouvelleIntentionTexte(e.target.value)}
                            />
                            <label className="etiquette" style={{ fontSize: '0.7rem' }}>Motif de la correction</label>
                            <input
                              className="champ"
                              style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}
                              value={motifCorrection}
                              onChange={(e) => setMotifCorrection(e.target.value)}
                              placeholder="Ex : faute de frappe sur le nom"
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="bouton bouton-accent" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }} onClick={validerCorrectionIntention}>
                                Valider
                              </button>
                              <button className="bouton bouton-discret" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }} onClick={annulerCorrectionIntention}>
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}

                        {correctionId === m.id && (
                          <div className="no-print" style={{ marginTop: '0.6rem', padding: '0.6rem', background: 'var(--couleur-fond)', borderRadius: '4px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div>
                              <label className="etiquette" style={{ fontSize: '0.7rem' }}>Nouvelle date</label>
                              <input
                                type="date"
                                className="champ"
                                style={{ fontSize: '0.85rem', padding: '0.35rem' }}
                                value={correctionDate}
                                onChange={(e) => { setCorrectionDate(e.target.value); setCorrectionHeure(''); }}
                              />
                            </div>
                            <div>
                              <label className="etiquette" style={{ fontSize: '0.7rem' }}>Nouvelle heure</label>
                              <select
                                className="champ"
                                style={{ fontSize: '0.85rem', padding: '0.35rem' }}
                                value={correctionHeure}
                                onChange={(e) => setCorrectionHeure(e.target.value)}
                              >
                                <option value="">— Choisir —</option>
                                {heuresPourDate(correctionDate).map((h) => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                            <button className="bouton bouton-accent" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }} onClick={validerCorrection}>
                              Valider
                            </button>
                            <button className="bouton bouton-discret" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }} onClick={annulerCorrection}>
                              Annuler
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}

          {nombreDeLignes > 0 && (
            <p style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '0.9rem', borderTop: '1px solid var(--couleur-bordure)', paddingTop: '0.5rem' }}>
              Nombre de lignes : {nombreDeLignes}
            </p>
          )}

          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--couleur-texte-doux)', marginTop: '1.5rem', opacity: 0.6 }}>
            LOGESPAC
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          #feuille-impression { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
