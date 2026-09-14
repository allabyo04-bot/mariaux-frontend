import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const TYPES_INTENTION = [
  "Messe pour le repos de l'âme de",
  "Messe d'action de grâce",
  "Messe en l'honneur de",
  'Autres intentions',
];

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const JOURS_LABEL = {
  LUNDI: 'lundi', MARDI: 'mardi', MERCREDI: 'mercredi', JEUDI: 'jeudi',
  VENDREDI: 'vendredi', SAMEDI: 'samedi', DIMANCHE: 'dimanche',
};

function jourSemaineDepuisDate(chaineDate) {
  if (!chaineDate) return null;
  const date = new Date(`${chaineDate}T12:00:00`);
  const index = date.getDay();
  return index === 0 ? 'DIMANCHE' : JOURS_ORDRE[index - 1];
}

function formaterDateCourte(chaineDate) {
  const date = new Date(`${chaineDate}T12:00:00`);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function genererDatesEntre(debut, fin) {
  const dates = [];
  let curseur = new Date(`${debut}T12:00:00`);
  const finDate = new Date(`${fin}T12:00:00`);
  while (curseur <= finDate) {
    dates.push(curseur.toISOString().slice(0, 10));
    curseur.setDate(curseur.getDate() + 1);
  }
  return dates;
}

export default function ModaleDemandeMesse({ designation, fideleParDefaut, fideleNom, onValider, onAnnuler }) {
  const [mode, setMode] = useState('unique'); // 'unique' | 'periode'
  const [typeIntention, setTypeIntention] = useState(fideleParDefaut?.typeIntentionParDefaut || TYPES_INTENTION[0]);
  const [intention, setIntention] = useState(fideleParDefaut?.intentionParDefaut || '');
  const [memoriser, setMemoriser] = useState(false);
  const [grilleHoraires, setGrilleHoraires] = useState(null);
  const [erreur, setErreur] = useState('');

  // Mode "une messe"
  const [dateMesse, setDateMesse] = useState('');
  const [heureDebut, setHeureDebut] = useState('');

  // Mode "période"
  const [debutPeriode, setDebutPeriode] = useState('');
  const [finPeriode, setFinPeriode] = useState('');
  const [momentPeriode, setMomentPeriode] = useState('matin'); // 'matin' | 'soir'
  const [heuresParDate, setHeuresParDate] = useState({}); // { '2026-08-01': '19:00' }

  // Mode "même jour de la semaine, même heure"
  const [jourFixe, setJourFixe] = useState('');
  const [heureFixe, setHeureFixe] = useState('');
  const [debutJourFixe, setDebutJourFixe] = useState('');
  const [finJourFixe, setFinJourFixe] = useState('');

  useEffect(() => {
    api.listerHoraires().then(setGrilleHoraires).catch((e) => setErreur(e.message));
  }, []);

  const jourUnique = useMemo(() => jourSemaineDepuisDate(dateMesse), [dateMesse]);
  const heuresDisponiblesUnique = jourUnique && grilleHoraires ? grilleHoraires[jourUnique] || [] : [];

  useEffect(() => { setHeureDebut(''); }, [dateMesse]);

  const datesPeriode = useMemo(() => {
    if (!debutPeriode || !finPeriode || finPeriode < debutPeriode) return [];
    return genererDatesEntre(debutPeriode, finPeriode);
  }, [debutPeriode, finPeriode]);

  const heuresDuJourFixe = jourFixe && grilleHoraires ? grilleHoraires[jourFixe] || [] : [];
  useEffect(() => { setHeureFixe(''); }, [jourFixe]);

  const datesJourFixe = useMemo(() => {
    if (!jourFixe || !debutJourFixe || !finJourFixe || finJourFixe < debutJourFixe) return [];
    return genererDatesEntre(debutJourFixe, finJourFixe).filter((d) => jourSemaineDepuisDate(d) === jourFixe);
  }, [jourFixe, debutJourFixe, finJourFixe]);

  function heurePourMoment(dispo, moment) {
    if (dispo.length === 0) return '';
    return moment === 'matin' ? dispo[0] : dispo[dispo.length - 1];
  }

  // Remplit les dates manquantes de la période selon le moment choisi (matin/soir),
  // sans écraser les ajustements déjà faits manuellement ligne par ligne.
  useEffect(() => {
    if (!grilleHoraires || datesPeriode.length === 0) return;
    setHeuresParDate((precedent) => {
      const suivant = { ...precedent };
      for (const d of datesPeriode) {
        if (!suivant[d]) {
          const jour = jourSemaineDepuisDate(d);
          const dispo = grilleHoraires[jour] || [];
          suivant[d] = heurePourMoment(dispo, momentPeriode);
        }
      }
      for (const cle of Object.keys(suivant)) {
        if (!datesPeriode.includes(cle)) delete suivant[cle];
      }
      return suivant;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesPeriode, grilleHoraires]);

  // Choix explicite de "Matin" ou "Soir" : réapplique la préférence à TOUTES les dates de la période
  function gererChangementMoment(nouveauMoment) {
    setMomentPeriode(nouveauMoment);
    if (!grilleHoraires) return;
    setHeuresParDate((precedent) => {
      const suivant = { ...precedent };
      for (const d of datesPeriode) {
        const jour = jourSemaineDepuisDate(d);
        const dispo = grilleHoraires[jour] || [];
        suivant[d] = heurePourMoment(dispo, nouveauMoment);
      }
      return suivant;
    });
  }

  function gererValider() {
    if (!intention.trim()) {
      setErreur("L'intention de messe est requise");
      return;
    }

    if (mode === 'unique') {
      if (!dateMesse || !heureDebut) {
        setErreur('Date et heure de messe sont requises');
        return;
      }
      onValider({ typeIntention, intention: intention.trim(), dates: [{ dateMesse, heureDebut }], memoriser });
      return;
    }

    if (mode === 'jour-fixe') {
      if (!jourFixe || !heureFixe || datesJourFixe.length === 0) {
        setErreur('Choisis un jour, une heure et une période valide');
        return;
      }
      const dates = datesJourFixe.map((d) => ({ dateMesse: d, heureDebut: heureFixe }));
      onValider({ typeIntention, intention: intention.trim(), dates, memoriser });
      return;
    }

    if (datesPeriode.length === 0) {
      setErreur('Choisis une période valide (fin après ou égale au début)');
      return;
    }
    const dates = datesPeriode.map((d) => ({ dateMesse: d, heureDebut: heuresParDate[d] }));
    if (dates.some((d) => !d.heureDebut)) {
      setErreur('Une des dates de la période ne dispose pas de messe — ajuste ou retire ce jour');
      return;
    }
    onValider({ typeIntention, intention: intention.trim(), dates, memoriser });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(31, 45, 69, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem',
      }}
    >
      <div className="carte" style={{ width: 560, maxWidth: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.3rem' }}>Demande de messe</h2>
        <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {designation?.libelle}
          {fideleParDefaut?.intentionParDefaut && (
            <span style={{ color: 'var(--couleur-accent)' }}> — intention habituelle préremplie</span>
          )}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={mode === 'unique' ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setMode('unique')}
          >
            Une messe
          </button>
          <button
            type="button"
            className={mode === 'periode' ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setMode('periode')}
          >
            Période (neuvaine, triduum…)
          </button>
          <button
            type="button"
            className={mode === 'jour-fixe' ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setMode('jour-fixe')}
          >
            Même jour chaque semaine
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="etiquette">Type d'intention</label>
          <select className="champ" value={typeIntention} onChange={(e) => setTypeIntention(e.target.value)}>
            {TYPES_INTENTION.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="etiquette">Intention de messe <span style={{ color: 'var(--couleur-danger)' }}>*</span></label>
          <textarea
            className="champ"
            rows={3}
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Ex : Pour implorer l'assistance et l'intercession de Marie..."
            required
            style={!intention.trim() && erreur ? { borderColor: 'var(--couleur-danger)' } : undefined}
          />
        </div>

        {mode === 'unique' ? (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className="etiquette">Date de la messe</label>
              <input type="date" className="champ" value={dateMesse} onChange={(e) => setDateMesse(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="etiquette">Heure de la messe</label>
              <select className="champ" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} disabled={!dateMesse}>
                <option value="">
                  {!dateMesse ? "— Choisir une date d'abord —" : heuresDisponiblesUnique.length === 0 ? 'Aucune messe ce jour' : '— Choisir —'}
                </option>
                {heuresDisponiblesUnique.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        ) : mode === 'jour-fixe' ? (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Jour de la semaine</label>
                <select className="champ" value={jourFixe} onChange={(e) => setJourFixe(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {JOURS_ORDRE.map((j) => <option key={j} value={j}>{JOURS_LABEL[j]}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Heure</label>
                <select className="champ" value={heureFixe} onChange={(e) => setHeureFixe(e.target.value)} disabled={!jourFixe}>
                  <option value="">
                    {!jourFixe ? '— Choisir un jour d\'abord —' : heuresDuJourFixe.length === 0 ? 'Aucune messe ce jour' : '— Choisir —'}
                  </option>
                  {heuresDuJourFixe.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Du</label>
                <input type="date" className="champ" value={debutJourFixe} onChange={(e) => setDebutJourFixe(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Au</label>
                <input type="date" className="champ" value={finJourFixe} onChange={(e) => setFinJourFixe(e.target.value)} />
              </div>
            </div>

            {jourFixe && debutJourFixe && finJourFixe && (
              <div style={{ border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon)', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--couleur-texte-doux)' }}>
                {datesJourFixe.length === 0 ? (
                  <span>Aucun {JOURS_LABEL[jourFixe]} dans cette période.</span>
                ) : (
                  <>
                    {datesJourFixe.length} messe(s) — tous les {JOURS_LABEL[jourFixe]}{heureFixe ? ` à ${heureFixe}` : ''}, du{' '}
                    {formaterDateCourte(datesJourFixe[0])} au {formaterDateCourte(datesJourFixe[datesJourFixe.length - 1])}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Du</label>
                <input type="date" className="champ" value={debutPeriode} onChange={(e) => setDebutPeriode(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="etiquette">Au</label>
                <input type="date" className="champ" value={finPeriode} onChange={(e) => setFinPeriode(e.target.value)} />
              </div>
            </div>

            {datesPeriode.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className={momentPeriode === 'matin' ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
                    style={{ flex: 1, padding: '0.5rem' }}
                    onClick={() => gererChangementMoment('matin')}
                  >
                    Matin (1ʳᵉ messe du jour)
                  </button>
                  <button
                    type="button"
                    className={momentPeriode === 'soir' ? 'bouton bouton-primaire' : 'bouton bouton-discret'}
                    style={{ flex: 1, padding: '0.5rem' }}
                    onClick={() => gererChangementMoment('soir')}
                  >
                    Soir (dernière messe du jour)
                  </button>
                </div>

                <div style={{ border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--couleur-fond)', fontSize: '0.8rem', color: 'var(--couleur-texte-doux)' }}>
                    {datesPeriode.length} messe(s) — ajuste l'heure si besoin sur chaque ligne
                  </div>
                  {datesPeriode.map((d) => {
                    const jour = jourSemaineDepuisDate(d);
                    const dispo = (grilleHoraires && grilleHoraires[jour]) || [];
                    return (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0.75rem', borderTop: '1px solid var(--couleur-bordure)' }}>
                        <span style={{ flex: 1, fontSize: '0.88rem' }}>{formaterDateCourte(d)}</span>
                        <select
                          className="champ"
                          style={{ flex: 1 }}
                          value={heuresParDate[d] || ''}
                          onChange={(e) => setHeuresParDate((prev) => ({ ...prev, [d]: e.target.value }))}
                        >
                          {dispo.length === 0 && <option value="">Aucune messe</option>}
                          {dispo.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {erreur && <p className="message-erreur">{erreur}</p>}

        {fideleNom && fideleNom.trim() && fideleNom.trim().toUpperCase() !== 'FIDELE' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--couleur-texte-doux)' }}>
            <input type="checkbox" checked={memoriser} onChange={(e) => setMemoriser(e.target.checked)} />
            Mémoriser cette intention comme habituelle pour « {fideleNom} »
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="bouton bouton-discret" onClick={onAnnuler}>Annuler</button>
          <button className="bouton bouton-accent" onClick={gererValider}>Valider et revenir à la facture</button>
        </div>
      </div>
    </div>
  );
}
