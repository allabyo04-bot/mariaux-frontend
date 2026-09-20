import { useEffect, useRef, useState } from 'react';
import EnTete from '../components/EnTete';
import ModaleDemandeMesse from '../components/ModaleDemandeMesse';
import RecuFacture from '../components/RecuFacture';
import { api } from '../lib/api';

export default function Caisse() {
  const [designations, setDesignations] = useState([]);
  const [designationChoisieId, setDesignationChoisieId] = useState('');
  const [quantite, setQuantite] = useState(1);

  const [fidele, setFidele] = useState('FIDELE');
  const [suggestions, setSuggestions] = useState([]);
  const [fideleSelectionne, setFideleSelectionne] = useState(null);
  const suggestionsTimer = useRef(null);

  const [lignes, setLignes] = useState([]);
  const [designationEnAttente, setDesignationEnAttente] = useState(null);
  const [montantRecu, setMontantRecu] = useState('');
  const [montantRecuTouche, setMontantRecuTouche] = useState(false);
  const [erreur, setErreur] = useState('');
  const [dernierRecu, setDernierRecu] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [facturesJour, setFacturesJour] = useState([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const recuRef = useRef(null);

  useEffect(() => {
    api.listerDesignations().then(setDesignations).catch((e) => setErreur(e.message));
  }, []);

  const designationChoisie = designations.find((d) => d.id === designationChoisieId);

  function gererChangementFidele(valeur) {
    setFidele(valeur);
    setFideleSelectionne(null);
    clearTimeout(suggestionsTimer.current);
    if (!valeur.trim() || valeur.trim().toUpperCase() === 'FIDELE') {
      setSuggestions([]);
      return;
    }
    suggestionsTimer.current = setTimeout(() => {
      api.rechercherFideles(valeur.trim()).then(setSuggestions).catch(() => {});
    }, 250);
  }

  function choisirSuggestion(f) {
    setFidele(f.nom);
    setFideleSelectionne(f);
    setSuggestions([]);
  }

  function gererAjoutLigne() {
    setErreur('');
    if (!designationChoisie) {
      setErreur('Choisis une désignation');
      return;
    }
    if (designationChoisie.type === 'B') {
      setDesignationEnAttente(designationChoisie);
      return;
    }
    ajouterLigneSimple(designationChoisie, Number(quantite) || 1);
  }

  function ajouterLigneSimple(designation, quantite) {
    setLignes((l) => [
      ...l,
      {
        cle: crypto.randomUUID(),
        designationId: designation.id,
        libelle: designation.libelle,
        type: designation.type,
        quantite,
        prixUnitaire: Number(designation.prixUnitaire),
        demandeMesse: null,
      },
    ]);
    setDesignationChoisieId('');
    setQuantite(1);
  }

  async function gererValidationMesse(donnees) {
    const designation = designationEnAttente;
    setLignes((l) => [
      ...l,
      {
        cle: crypto.randomUUID(),
        designationId: designation.id,
        libelle: designation.libelle,
        type: designation.type,
        quantite: donnees.dates.length,
        prixUnitaire: Number(designation.prixUnitaire),
        demandeMesse: {
          typeIntention: donnees.typeIntention,
          intention: donnees.intention,
          dates: donnees.dates,
        },
      },
    ]);
    setDesignationChoisieId('');
    setDesignationEnAttente(null);

    if (donnees.memoriser && fidele.trim()) {
      try {
        const f = await api.enregistrerFidele({
          nom: fidele.trim(),
          typeIntentionParDefaut: donnees.typeIntention,
          intentionParDefaut: donnees.intention,
        });
        setFideleSelectionne(f);
      } catch (e) {
        // pas bloquant pour la facture en cours
      }
    }
  }

  function retirerLigne(cle) {
    setLignes((l) => l.filter((ligne) => ligne.cle !== cle));
  }

  const total = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const recuNombre = montantRecu === '' ? null : Number(montantRecu);
  const excedentPrevu = recuNombre !== null && recuNombre > total ? recuNombre - total : 0;

  // Tant que la Caisse n'a pas touché le champ, il reflète toujours le total exact
  // (une vraie valeur affichée, pas un simple indice grisé) — elle n'a qu'à le
  // modifier si le fidèle donne plus.
  useEffect(() => {
    if (!montantRecuTouche) {
      setMontantRecu(total > 0 ? String(total) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function gererChangementMontantRecu(valeur) {
    setMontantRecuTouche(true);
    setMontantRecu(valeur);
  }

  function gererFermerRecu() {
    setDernierRecu(null);
  }

  async function gererAnnulationSaisie() {
    if (lignes.length === 0 && fidele.trim().toUpperCase() === 'FIDELE') return;
    const confirme = window.confirm('Annuler cette facture en cours ? Rien ne sera enregistré.');
    if (!confirme) return;

    setLignes([]);
    setFidele('FIDELE');
    setFideleSelectionne(null);
    setSuggestions([]);
    setDesignationChoisieId('');
    setQuantite(1);
    setMontantRecu('');
    setMontantRecuTouche(false);
    setErreur('');
  }

  function gererOuvrirHistorique() {
    setAfficherHistorique((v) => !v);
    if (!afficherHistorique) {
      setChargementHistorique(true);
      api.listerFactures().then(setFacturesJour).catch((e) => setErreur(e.message)).finally(() => setChargementHistorique(false));
    }
  }

  async function gererReimpression(id) {
    setErreur('');
    try {
      const facture = await api.obtenirFacture(id);
      setDernierRecu(facture);
      setAfficherHistorique(false);
      setTimeout(() => recuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function gererEnregistrement() {
    setErreur('');
    if (!fidele.trim()) {
      setErreur('Le nom du fidèle est requis');
      return;
    }
    if (lignes.length === 0) {
      setErreur('Ajoute au moins une ligne');
      return;
    }

    setEnCours(true);
    try {
      const facture = await api.creerFacture({
        fidele: fidele.trim(),
        montantRecu: recuNombre,
        lignes: lignes.map((l) => ({
          designationId: l.designationId,
          quantite: l.quantite,
          demandeMesse: l.demandeMesse
            ? { typeIntention: l.demandeMesse.typeIntention, intention: l.demandeMesse.intention, dates: l.demandeMesse.dates }
            : undefined,
        })),
      });
      setDernierRecu(facture);
      setLignes([]);
      setFidele('FIDELE');
      setFideleSelectionne(null);
      setMontantRecu('');
      setMontantRecuTouche(false);
      // Descend automatiquement jusqu'au reçu — sur une longue facture (neuvaine, etc.)
      // il se trouve loin en dessous du bouton et pouvait sembler "introuvable".
      setTimeout(() => recuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <EnTete titre="Caisse" />

      <div className="page-conteneur" style={{ maxWidth: 1100 }}>
        {dernierRecu && (
          <div ref={recuRef} className="carte no-print" style={{ padding: '1.75rem', borderColor: 'var(--couleur-succes)', marginBottom: '1.5rem', scrollMarginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.05rem', color: 'var(--couleur-succes)' }}>
                Reçu n° {dernierRecu.numero} enregistré
              </h2>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="bouton bouton-accent" onClick={() => window.print()}>Imprimer le reçu</button>
                <button className="bouton bouton-primaire" onClick={gererFermerRecu}>Nouvelle facture</button>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--couleur-texte-doux)', marginBottom: '1rem' }}>
              Imprime le reçu, puis clique sur « Nouvelle facture » pour passer au fidèle suivant.
            </p>
            <div style={{ border: '1px solid var(--couleur-bordure)', borderRadius: 'var(--rayon)', padding: '1rem 0' }}>
              <RecuFacture facture={dernierRecu} />
            </div>
          </div>
        )}

        <div className="caisse-grille" style={{ display: dernierRecu ? 'none' : 'flex' }}>
          <div className="caisse-colonne">
            <div className="carte" style={{ padding: '1.75rem', marginBottom: '1.5rem', position: 'relative' }}>
              <label className="etiquette">Nom du fidèle</label>
              <input
                className="champ"
                value={fidele}
                onChange={(e) => gererChangementFidele(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
              {fideleSelectionne?.intentionParDefaut && (
                <p style={{ fontSize: '0.8rem', color: 'var(--couleur-accent)', marginTop: '0.4rem' }}>
                  Intention habituelle enregistrée pour ce fidèle — elle sera proposée automatiquement.
                </p>
              )}
              {suggestions.length > 0 && (
                <div
                  className="carte"
                  style={{ position: 'absolute', left: '1.75rem', right: '1.75rem', top: '100%', marginTop: '0.25rem', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}
                >
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => choisirSuggestion(s)}
                      style={{ padding: '0.6rem 0.9rem', cursor: 'pointer', borderBottom: '1px solid var(--couleur-bordure)', fontSize: '0.9rem' }}
                    >
                      {s.nom}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="carte" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Ajouter une ligne</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '3 1 180px' }}>
                  <label className="etiquette">Désignation</label>
                  <select className="champ" value={designationChoisieId} onChange={(e) => setDesignationChoisieId(e.target.value)}>
                    <option value="">— Choisir —</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.libelle} {d.type === 'B' ? '(Demande de Messe)' : ''} — {Number(d.prixUnitaire).toLocaleString('fr-FR')} F
                      </option>
                    ))}
                  </select>
                </div>
                {designationChoisie?.type !== 'B' && (
                  <div style={{ flex: '1 1 80px' }}>
                    <label className="etiquette">Quantité</label>
                    <input type="number" min={1} className="champ" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
                  </div>
                )}
                <button className="bouton bouton-primaire" onClick={gererAjoutLigne}>Ajouter</button>
              </div>
            </div>

            <div className="carte no-print" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem' }}>Mes factures du jour</h2>
                <button className="bouton bouton-discret" onClick={gererOuvrirHistorique}>
                  {afficherHistorique ? 'Masquer' : 'Afficher'}
                </button>
              </div>

              {afficherHistorique && (
                <div style={{ marginTop: '1rem' }}>
                  {chargementHistorique && <p style={{ fontSize: '0.9rem', color: 'var(--couleur-texte-doux)' }}>Chargement…</p>}
                  {!chargementHistorique && facturesJour.length === 0 && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--couleur-texte-doux)' }}>Aucune facture aujourd'hui.</p>
                  )}
                  {!chargementHistorique && facturesJour.length > 0 && (
                    <>
                      <p style={{ fontSize: '0.82rem', color: 'var(--couleur-texte-doux)', marginBottom: '0.5rem' }}>
                        {facturesJour.length} facture(s) — clique sur une ligne pour la revoir/imprimer
                      </p>
                      <div className="tableau-scroll" style={{ maxHeight: 420, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.72rem', position: 'sticky', top: 0, background: 'var(--couleur-surface)' }}>
                              <th style={{ padding: '0.3rem 0.3rem 0.3rem 0' }}>Heure</th>
                              <th>N°</th>
                              <th>Fidèle</th>
                              <th style={{ textAlign: 'right' }}>Net à payer</th>
                              <th style={{ textAlign: 'right' }}>Reçu</th>
                              <th style={{ textAlign: 'right' }}>Excédent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facturesJour.map((f) => {
                              const net = Number(f.netAPayer);
                              const recu = f.montantRecu !== null && f.montantRecu !== undefined ? Number(f.montantRecu) : null;
                              const excedent = recu !== null && recu > net ? recu - net : 0;
                              return (
                                <tr
                                  key={f.id}
                                  onClick={() => gererReimpression(f.id)}
                                  style={{ borderTop: '1px solid var(--couleur-bordure)', cursor: 'pointer' }}
                                >
                                  <td style={{ padding: '0.5rem 0.3rem 0.5rem 0', whiteSpace: 'nowrap' }}>
                                    {new Date(f.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td style={{ whiteSpace: 'nowrap' }}>{f.numero}</td>
                                  <td>{f.fidele}</td>
                                  <td style={{ textAlign: 'right' }}>{net.toLocaleString('fr-FR')} F</td>
                                  <td style={{ textAlign: 'right' }}>{recu !== null ? `${recu.toLocaleString('fr-FR')} F` : '—'}</td>
                                  <td style={{ textAlign: 'right', fontWeight: excedent > 0 ? 700 : 400, color: excedent > 0 ? 'var(--couleur-accent)' : 'inherit' }}>
                                    {excedent > 0 ? `${excedent.toLocaleString('fr-FR')} F` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="caisse-colonne">
            <div className="carte" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Lignes de la facture</h2>
              {lignes.length === 0 ? (
                <p style={{ color: 'var(--couleur-texte-doux)', fontSize: '0.9rem' }}>Aucune ligne pour l'instant.</p>
              ) : (
                <div className="tableau-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--couleur-texte-doux)', fontSize: '0.8rem' }}>
                        <th style={{ padding: '0.4rem 0' }}>Désignation</th>
                        <th>Qté</th>
                        <th>Montant</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((l) => (
                        <tr key={l.cle} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
                          <td style={{ padding: '0.55rem 0' }}>
                            {l.libelle}
                            {l.demandeMesse && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)' }}>
                                {l.demandeMesse.dates.length === 1
                                  ? `${l.demandeMesse.dates[0].dateMesse} à ${l.demandeMesse.dates[0].heureDebut}`
                                  : `${l.demandeMesse.dates.length} dates (${l.demandeMesse.dates[0].dateMesse} → ${l.demandeMesse.dates[l.demandeMesse.dates.length - 1].dateMesse})`}
                                {' — '}{l.demandeMesse.typeIntention}
                              </div>
                            )}
                          </td>
                          <td>{l.quantite}</td>
                          <td>{(l.quantite * l.prixUnitaire).toLocaleString('fr-FR')} F</td>
                          <td>
                            <button className="bouton bouton-discret" style={{ padding: '0.3rem 0.6rem' }} onClick={() => retirerLigne(l.cle)}>
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.25rem', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', maxWidth: 260 }}>
                  <label className="etiquette">Montant reçu</label>
                  <input
                    type="number"
                    min={0}
                    className="champ"
                    value={montantRecu}
                    onChange={(e) => gererChangementMontantRecu(e.target.value)}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginTop: '0.35rem' }}>
                    Prérempli au montant dû — modifie-le si le fidèle donne plus.
                  </p>
                  {excedentPrevu > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--couleur-accent)', marginTop: '0.35rem' }}>
                      Excédent compté comme don : {excedentPrevu.toLocaleString('fr-FR')} F
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 600 }}>
                  Net à payer : {total.toLocaleString('fr-FR')} F
                </div>
              </div>

              {erreur && <p className="message-erreur">{erreur}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                <button className="bouton bouton-discret" onClick={gererAnnulationSaisie} disabled={enCours}>
                  Annuler
                </button>
                <button className="bouton bouton-accent" onClick={gererEnregistrement} disabled={enCours}>
                  {enCours ? 'Enregistrement…' : 'Enregistrer la facture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dernierRecu && (
        <div id="zone-impression-recu" style={{ display: 'none' }}>
          <RecuFacture facture={dernierRecu} />
        </div>
      )}

      <style>{`
        .caisse-grille {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .caisse-colonne {
          flex: 1 1 380px;
          min-width: 0;
        }
        @media (max-width: 860px) {
          .caisse-grille { flex-direction: column; }
        }
        @media print {
          body * { visibility: hidden; }
          #zone-impression-recu, #zone-impression-recu * { visibility: visible; display: block !important; }
          #zone-impression-recu { position: absolute; top: 0; left: 0; }
        }
      `}</style>

      {designationEnAttente && (
        <ModaleDemandeMesse
          designation={designationEnAttente}
          fideleParDefaut={fideleSelectionne}
          fideleNom={fidele}
          onValider={gererValidationMesse}
          onAnnuler={() => setDesignationEnAttente(null)}
        />
      )}
    </div>
  );
}
