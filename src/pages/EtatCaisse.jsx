import { useEffect, useRef, useState } from 'react';
import EnTete from '../components/EnTete';
import BordereauFermeture from '../components/BordereauFermeture';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

// Dates AAAA-MM-JJ construites à partir de l'heure locale (et non UTC), pour ne
// jamais décaler d'un jour.
function versDate(d) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

function formaterDate(dateISO) {
  const [a, m, j] = dateISO.split('-');
  return `${j}/${m}/${a}`;
}

function libellePeriode(debut, fin) {
  return debut === fin ? `Le ${formaterDate(debut)}` : `Du ${formaterDate(debut)} au ${formaterDate(fin)}`;
}

function ajouterJours(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Une semaine va du lundi au samedi (fin du service) ; le dimanche est rattaché à
// la semaine qui vient de se terminer.
function lundiDeLaSemaine() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()));
  return d;
}

const RACCOURCIS = [
  {
    cle: 'jour',
    libelle: "Aujourd'hui",
    periode: () => {
      const t = versDate(new Date());
      return [t, t];
    },
  },
  {
    cle: 'semaine',
    libelle: 'Semaine en cours',
    periode: () => {
      const lundi = lundiDeLaSemaine();
      return [versDate(lundi), versDate(ajouterJours(lundi, 5))];
    },
  },
  {
    cle: 'semaine-precedente',
    libelle: 'Semaine précédente',
    periode: () => {
      const lundi = lundiDeLaSemaine();
      return [versDate(ajouterJours(lundi, -7)), versDate(ajouterJours(lundi, -2))];
    },
  },
  {
    cle: 'mois',
    libelle: 'Mois en cours',
    periode: () => {
      const n = new Date();
      return [
        versDate(new Date(n.getFullYear(), n.getMonth(), 1, 12)),
        versDate(new Date(n.getFullYear(), n.getMonth() + 1, 0, 12)),
      ];
    },
  },
];

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
            <td style={{ textAlign: 'right', fontWeight: 700 }}>{donnees.total.toLocaleString('fr-FR')} F</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function EtatCaisse() {
  const { utilisateur } = useAuth();
  const [actif, setActif] = useState('jour');
  const [debutLibre, setDebutLibre] = useState('');
  const [finLibre, setFinLibre] = useState('');
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [recapAImprimer, setRecapAImprimer] = useState(null);
  // Numéro de la dernière demande : si la secrétaire change vite de période, une
  // réponse arrivée en retard sur un choix précédent est ignorée.
  const requeteEnCours = useRef(0);

  function afficher(debut, fin, cle) {
    const id = ++requeteEnCours.current;
    setActif(cle);
    setErreur('');
    setChargement(true);
    api.recettesPeriode(debut, fin)
      .then((d) => {
        if (id === requeteEnCours.current) setDonnees(d);
      })
      .catch((e) => {
        if (id !== requeteEnCours.current) return;
        setDonnees(null);
        setErreur(e.message);
      })
      .finally(() => {
        if (id === requeteEnCours.current) setChargement(false);
      });
  }

  function choisirRaccourci(raccourci) {
    const [debut, fin] = raccourci.periode();
    setDebutLibre(debut);
    setFinLibre(fin);
    afficher(debut, fin, raccourci.cle);
  }

  function afficherPeriodeLibre(e) {
    e.preventDefault();
    if (!debutLibre || !finLibre) {
      setErreur('Choisis la date de début et la date de fin');
      return;
    }
    if (finLibre < debutLibre) {
      setErreur('La date de fin doit être après la date de début');
      return;
    }
    afficher(debutLibre, finLibre, 'libre');
  }

  useEffect(() => {
    choisirRaccourci(RACCOURCIS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function gererImpression() {
    if (!donnees) return;
    setErreur('');
    setRecapAImprimer({
      dateDebut: donnees.dateDebut,
      dateFin: donnees.dateFin,
      sansHeure: true,
      nombreFactures: donnees.nombreFactures,
      totalNetAPayer: donnees.total,
      totalExcedent: 0,
      detailDesignations: donnees.parDesignation,
      faitPar: { nom: utilisateur?.nom },
    });
    setTimeout(() => window.print(), 60);
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="no-print"><EnTete titre="État" /></div>

      <div className="page-conteneur no-print">
        <div className="carte" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Choisir la période</h2>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {RACCOURCIS.map((r) => (
              <button
                key={r.cle}
                type="button"
                className={`bouton ${actif === r.cle ? 'bouton-primaire' : 'bouton-discret'}`}
                onClick={() => choisirRaccourci(r)}
              >
                {r.libelle}
              </button>
            ))}
          </div>

          <form onSubmit={afficherPeriodeLibre} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label className="etiquette">Du</label>
              <input type="date" className="champ" value={debutLibre} onChange={(e) => setDebutLibre(e.target.value)} />
            </div>
            <div>
              <label className="etiquette">Au</label>
              <input type="date" className="champ" value={finLibre} onChange={(e) => setFinLibre(e.target.value)} />
            </div>
            <button
              type="submit"
              className={`bouton ${actif === 'libre' ? 'bouton-primaire' : 'bouton-accent'}`}
            >
              Afficher cette période
            </button>
          </form>
          <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '0.75rem' }}>
            Les semaines vont du lundi au samedi.
          </p>
        </div>

        {erreur && <p className="message-erreur">{erreur}</p>}

        <div className="carte" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                {donnees ? libellePeriode(donnees.dateDebut, donnees.dateFin) : 'Recettes'}
              </h2>
              {donnees && !chargement && (
                <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)' }}>
                  {donnees.nombreFactures} facture(s)
                </p>
              )}
            </div>
            <button
              className="bouton bouton-accent"
              onClick={gererImpression}
              disabled={chargement || !donnees || !donnees.total}
            >
              Imprimer
            </button>
          </div>

          {chargement ? (
            <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Chargement…</p>
          ) : (
            <TableauDesignations donnees={donnees} />
          )}
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
