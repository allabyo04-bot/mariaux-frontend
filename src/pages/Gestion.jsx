import { useEffect, useState } from 'react';
import EnTete from '../components/EnTete';
import { api } from '../lib/api';

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const JOURS_LABEL = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

const ONGLETS = [
  { cle: 'designations', label: 'Désignations' },
  { cle: 'rubriques', label: 'Rubriques' },
  { cle: 'horaires', label: 'Horaires de messe' },
];

export default function Gestion() {
  const [onglet, setOnglet] = useState('designations');

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Gestion" />

      <div className="page-conteneur">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              className={onglet === o.cle ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
              onClick={() => setOnglet(o.cle)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {onglet === 'designations' && <SectionDesignations />}
        {onglet === 'rubriques' && <SectionRubriques />}
        {onglet === 'horaires' && <SectionHoraires />}
      </div>
    </div>
  );
}

function SectionDesignations() {
  const [designations, setDesignations] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const [libelle, setLibelle] = useState('');
  const [type, setType] = useState('A');
  const [prixUnitaire, setPrixUnitaire] = useState('');
  const [rubriqueId, setRubriqueId] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => { charger(); }, []);

  function charger() {
    api.listerDesignations(true).then(setDesignations).catch((e) => setErreur(e.message));
    api.listerRubriques().then(setRubriques).catch(() => {});
  }

  async function gererAjout(e) {
    e.preventDefault();
    setErreur(''); setSucces('');
    if (!libelle.trim()) { setErreur('Libellé requis'); return; }

    setEnCours(true);
    try {
      await api.creerDesignation({
        libelle: libelle.trim(), type,
        prixUnitaire: Number(prixUnitaire) || 0, rubriqueId: rubriqueId || null,
      });
      setLibelle(''); setPrixUnitaire(''); setRubriqueId(''); setType('A');
      setSucces('Désignation ajoutée.');
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  async function gererChangementPrix(d, nouveauPrix) {
    try {
      await api.modifierDesignation(d.id, { libelle: d.libelle, prixUnitaire: Number(nouveauPrix) || 0, rubriqueId: d.rubriqueId, actif: d.actif });
      charger();
    } catch (e) { setErreur(e.message); }
  }

  async function gererChangementRubrique(d, nouvelleRubriqueId) {
    try {
      await api.modifierDesignation(d.id, { libelle: d.libelle, prixUnitaire: d.prixUnitaire, rubriqueId: nouvelleRubriqueId || null, actif: d.actif });
      charger();
    } catch (e) { setErreur(e.message); }
  }

  async function gererBascule(d) {
    try {
      await api.modifierDesignation(d.id, { libelle: d.libelle, prixUnitaire: d.prixUnitaire, rubriqueId: d.rubriqueId, actif: !d.actif });
      charger();
    } catch (e) { setErreur(e.message); }
  }

  return (
    <>
      <div className="carte" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Ajouter une désignation</h2>
        <form onSubmit={gererAjout} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label className="etiquette">Libellé</label>
            <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : ATTESTATION" />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label className="etiquette">Type</label>
            <select className="champ" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="A">A (simple)</option>
              <option value="B">B (demande de messe)</option>
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label className="etiquette">Prix unitaire</label>
            <input type="number" className="champ" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="etiquette">Rubrique</label>
            <select className="champ" value={rubriqueId} onChange={(e) => setRubriqueId(e.target.value)}>
              <option value="">— Aucune —</option>
              {rubriques.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
            </select>
          </div>
          <button className="bouton bouton-primaire" disabled={enCours}>Ajouter</button>
        </form>
        {erreur && <p className="message-erreur">{erreur}</p>}
        {succes && <p style={{ color: 'var(--couleur-succes)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{succes}</p>}
        <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '0.5rem' }}>
          Le code (D001, D002…) est généré automatiquement, pas besoin d'y penser.
        </p>
      </div>

      <div className="carte" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Désignations existantes</h2>
        <div className="tableau-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.78rem' }}>
                <th style={{ padding: '0.3rem 0' }}>Code</th>
                <th>Libellé</th>
                <th>Type</th>
                <th>Prix</th>
                <th>Rubrique</th>
                <th>Actif</th>
              </tr>
            </thead>
            <tbody>
              {designations.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--couleur-bordure)', opacity: d.actif ? 1 : 0.5 }}>
                  <td style={{ padding: '0.4rem 0' }}>{d.code}</td>
                  <td>{d.libelle}</td>
                  <td>{d.type}</td>
                  <td>
                    <input
                      type="number"
                      defaultValue={Number(d.prixUnitaire)}
                      onBlur={(e) => gererChangementPrix(d, e.target.value)}
                      style={{ width: 80, padding: '0.2rem 0.4rem', border: '1px solid var(--couleur-bordure)', borderRadius: 4 }}
                    />
                  </td>
                  <td>
                    <select
                      value={d.rubriqueId || ''}
                      onChange={(e) => gererChangementRubrique(d, e.target.value)}
                      style={{ padding: '0.2rem 0.4rem', border: '1px solid var(--couleur-bordure)', borderRadius: 4 }}
                    >
                      <option value="">— Aucune —</option>
                      {rubriques.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="bouton bouton-discret" style={{ padding: '0.25rem 0.6rem' }} onClick={() => gererBascule(d)}>
                      {d.actif ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SectionRubriques() {
  const [rubriques, setRubriques] = useState([]);
  const [libelle, setLibelle] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => { charger(); }, []);

  function charger() {
    api.listerRubriques().then(setRubriques).catch((e) => setErreur(e.message));
  }

  async function gererAjout(e) {
    e.preventDefault();
    setErreur('');
    if (!libelle.trim()) { setErreur('Libellé requis'); return; }
    setEnCours(true);
    try {
      await api.creerRubrique({ libelle: libelle.trim() });
      setLibelle('');
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="carte" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Rubriques (regroupement des recettes)</h2>
      <form onSubmit={gererAjout} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : Dons libres" style={{ flex: 1 }} />
        <button className="bouton bouton-primaire" disabled={enCours}>Ajouter</button>
      </form>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {rubriques.map((r) => (
        <div key={r.id} style={{ padding: '0.55rem 0', borderTop: '1px solid var(--couleur-bordure)', fontSize: '0.9rem' }}>
          {r.libelle}
        </div>
      ))}
    </div>
  );
}

function SectionHoraires() {
  const [horaires, setHoraires] = useState([]);
  const [jour, setJour] = useState('LUNDI');
  const [heure, setHeure] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => { charger(); }, []);

  function charger() {
    api.listerHorairesDetail().then(setHoraires).catch((e) => setErreur(e.message));
  }

  async function gererAjout(e) {
    e.preventDefault();
    setErreur('');
    if (!heure) { setErreur('Heure requise'); return; }
    setEnCours(true);
    try {
      await api.creerHoraire({ jour, heure });
      setHeure('');
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  async function gererSuppression(id) {
    try {
      await api.supprimerHoraire(id);
      charger();
    } catch (e) { setErreur(e.message); }
  }

  return (
    <div className="carte" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Grille des horaires de messe</h2>
      <form onSubmit={gererAjout} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="etiquette">Jour</label>
          <select className="champ" value={jour} onChange={(e) => setJour(e.target.value)}>
            {JOURS_ORDRE.map((j) => <option key={j} value={j}>{JOURS_LABEL[j]}</option>)}
          </select>
        </div>
        <div>
          <label className="etiquette">Heure</label>
          <input type="time" className="champ" value={heure} onChange={(e) => setHeure(e.target.value)} />
        </div>
        <button className="bouton bouton-primaire" disabled={enCours}>Ajouter</button>
      </form>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {JOURS_ORDRE.map((j) => {
        const creneaux = horaires.filter((h) => h.jour === j);
        return (
          <div key={j} style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>{JOURS_LABEL[j]}</div>
            {creneaux.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--couleur-texte-doux)' }}>Aucune messe.</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {creneaux.map((h) => (
                  <span
                    key={h.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      border: '1px solid var(--couleur-bordure)', borderRadius: 20,
                      padding: '0.25rem 0.5rem 0.25rem 0.75rem', fontSize: '0.85rem',
                    }}
                  >
                    {h.heure}
                    <button
                      onClick={() => gererSuppression(h.id)}
                      style={{ border: 'none', background: 'none', color: 'var(--couleur-danger)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                      title="Retirer ce créneau"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
