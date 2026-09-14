function formaterDateHeure(dateISO) {
  return new Date(dateISO).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function BordereauFermeture({ fermeture }) {
  if (!fermeture) return null;
  const total = Number(fermeture.totalNetAPayer) + Number(fermeture.totalExcedent);

  return (
    <div id="bordereau-impression" style={{ padding: '2rem', background: '#fff' }}>
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

      <h1 style={{ fontSize: '1.15rem', textAlign: 'center', marginBottom: '0.3rem' }}>
        Bordereau de remise de caisse
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--couleur-texte-doux)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
        Du {formaterDateHeure(fermeture.dateDebut)} au {formaterDateHeure(fermeture.dateFin)}
      </p>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="etiquette">Total remis</span>
        <div style={{ fontFamily: 'var(--police-titre)', fontSize: '2.2rem', color: 'var(--couleur-primaire)' }}>
          {total.toLocaleString('fr-FR')} F
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--couleur-texte-doux)', marginTop: '0.2rem' }}>
          {fermeture.nombreFactures} facture(s)
        </p>
      </div>

      <h2 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--couleur-accent)', borderBottom: '1px solid var(--couleur-bordure)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
        Détail par rubrique
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', marginBottom: '2.5rem' }}>
        <tbody>
          {(fermeture.recapRubriques || []).map((r) => (
            <tr key={r.rubrique} style={{ borderTop: '1px solid var(--couleur-bordure)' }}>
              <td style={{ padding: '0.6rem 0' }}>{r.rubrique}</td>
              <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 600 }}>{r.montant.toLocaleString('fr-FR')} F</td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--couleur-primaire)' }}>
            <td style={{ padding: '0.6rem 0', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700 }}>{total.toLocaleString('fr-FR')} F</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginTop: '3rem' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '2.5rem' }}>
            Remis par : <strong>{fermeture.faitPar?.nom}</strong>
          </p>
          <div style={{ borderTop: '1px solid var(--couleur-texte)', width: '80%', margin: '0 auto' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--couleur-texte-doux)', marginTop: '0.3rem' }}>Signature</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '2.5rem' }}>Reçu par le Curé</p>
          <div style={{ borderTop: '1px solid var(--couleur-texte)', width: '80%', margin: '0 auto' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--couleur-texte-doux)', marginTop: '0.3rem' }}>Signature</p>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--couleur-texte-doux)', marginTop: '2.5rem', borderTop: '1px solid var(--couleur-bordure)', paddingTop: '0.6rem' }}>
        Document généré le {new Date().toLocaleDateString('fr-FR')} — LOGESPAC
      </p>
    </div>
  );
}
