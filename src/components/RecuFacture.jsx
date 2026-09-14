const JOURS_LABEL_COURT = {
  0: 'dim.', 1: 'lun.', 2: 'mar.', 3: 'mer.', 4: 'jeu.', 5: 'ven.', 6: 'sam.',
};

function formaterDateJourHeure(dateISO) {
  const d = new Date(dateISO);
  return {
    jour: JOURS_LABEL_COURT[d.getDay()],
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  };
}

function formaterDateEmission(dateISO) {
  const d = new Date(dateISO);
  return {
    date: d.toLocaleDateString('fr-FR'),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function RecuFacture({ facture }) {
  if (!facture) return null;
  const emission = formaterDateEmission(facture.createdAt || facture.date);

  return (
    <div
      id="ticket-impression"
      style={{
        width: 320,
        margin: '0 auto',
        background: '#fff',
        padding: '1.25rem 1rem',
        fontFamily: 'var(--police-corps)',
        fontSize: '0.82rem',
        lineHeight: 1.45,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontFamily: 'var(--police-titre)', fontWeight: 700, fontSize: '0.95rem' }}>
          Archidiocèse de Cotonou
        </div>
        <div style={{ fontFamily: 'var(--police-titre)', fontSize: '0.85rem' }}>
          Paroisse Marie Auxiliatrice de Mènontin
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--couleur-texte-doux)' }}>
          Cotonou, Bénin
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '0.5rem 0', marginBottom: '0.6rem' }}>
        <div>Date : {emission.date} — Heure : {emission.heure}</div>
        <div>Reçu N° : {facture.numero}</div>
        <div>Émis par : {facture.etablitPar?.nom || '—'}</div>
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <strong>Doit : {facture.fidele}</strong>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.6rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
            <th style={{ padding: '0.2rem 0' }}>Désignation</th>
            <th style={{ textAlign: 'center' }}>Qté</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px dotted #ddd' }}>
              <td style={{ padding: '0.25rem 0' }}>{l.designation?.libelle}</td>
              <td style={{ textAlign: 'center' }}>{l.quantite}</td>
              <td style={{ textAlign: 'right' }}>{Number(l.montant).toLocaleString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {facture.lignes.filter((l) => l.demandesMesse?.length > 0).map((l) => (
        <div key={l.id} style={{ marginBottom: '0.6rem', border: '1px solid #ddd', borderRadius: 4, padding: '0.5rem 0.6rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginBottom: '0.25rem' }}>
            {l.demandesMesse[0].typeIntention}
          </div>
          <div style={{ marginBottom: '0.4rem' }}>
            Intention : {l.demandesMesse[0].intention.slice(0, 90)}
            {l.demandesMesse[0].intention.length > 90 ? '…' : ''}
          </div>

          {l.demandesMesse.length > 1 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--couleur-texte-doux)', marginBottom: '0.3rem' }}>
              Programme des messes sollicitées ({l.demandesMesse.length})
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: l.demandesMesse.length > 1 ? '1fr 1fr' : '1fr',
              columnGap: '0.6rem',
              rowGap: '0.15rem',
            }}
          >
            {l.demandesMesse.map((dm) => {
              const { jour, date } = formaterDateJourHeure(dm.dateMesse);
              return (
                <div
                  key={dm.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: '0.4rem',
                    fontSize: '0.74rem', padding: '0.1rem 0',
                  }}
                >
                  <span style={{ color: 'var(--couleur-texte-doux)' }}>{jour} {date}</span>
                  <span style={{ fontWeight: 600 }}>{dm.heureDebut}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed #999', paddingTop: '0.5rem', marginBottom: '0.6rem' }}>
        {Number(facture.remise) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Remise</span><span>{Number(facture.remise).toLocaleString('fr-FR')}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
          <span>NET À PAYER</span><span>{Number(facture.netAPayer).toLocaleString('fr-FR')} F</span>
        </div>
        {facture.montantRecu !== null && facture.montantRecu !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Montant reçu</span><span>{Number(facture.montantRecu).toLocaleString('fr-FR')}</span>
          </div>
        )}
        {facture.excedent > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--couleur-accent)' }}>
            <span>Don complémentaire</span><span>{Number(facture.excedent).toLocaleString('fr-FR')}</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--couleur-texte-doux)' }}>
        Merci de votre générosité.
        <br />
        LOGESPAC
      </div>
    </div>
  );
}
