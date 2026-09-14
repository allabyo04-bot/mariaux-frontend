const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function requete(chemin, options = {}) {
  const token = localStorage.getItem('logespac_token');

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    throw new Error(donnees.erreur || 'Une erreur est survenue');
  }

  return donnees;
}

// Pour les endpoints qui renvoient un fichier (CSV, etc.) plutôt que du JSON.
async function telechargerFichier(chemin, nomFichier) {
  const token = localStorage.getItem('logespac_token');
  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (!reponse.ok) {
    const donnees = await reponse.json().catch(() => ({}));
    throw new Error(donnees.erreur || 'Une erreur est survenue');
  }

  const blob = await reponse.blob();
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  connexion: (identifiant, pin) =>
    requete('/api/auth/connexion', { method: 'POST', body: JSON.stringify({ identifiant, pin }) }),

  listerDesignations: (tous = false) => requete(`/api/designations${tous ? '?tous=1' : ''}`),
  creerDesignation: (donnees) =>
    requete('/api/designations', { method: 'POST', body: JSON.stringify(donnees) }),
  modifierDesignation: (id, donnees) =>
    requete(`/api/designations/${id}`, { method: 'PUT', body: JSON.stringify(donnees) }),

  listerRubriques: () => requete('/api/designations/rubriques/liste'),
  creerRubrique: (donnees) =>
    requete('/api/designations/rubriques', { method: 'POST', body: JSON.stringify(donnees) }),

  creerFacture: (donnees) =>
    requete('/api/factures', { method: 'POST', body: JSON.stringify(donnees) }),

  listerFactures: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return requete(`/api/factures${qs ? `?${qs}` : ''}`);
  },
  obtenirFacture: (id) => requete(`/api/factures/${id}`),
  annulerFacture: (id) => requete(`/api/factures/${id}`, { method: 'DELETE' }),

  obtenirPeriodeOuverte: () => requete('/api/fermetures/periode-ouverte'),
  creerFermeture: () => requete('/api/fermetures', { method: 'POST' }),
  listerFermetures: () => requete('/api/fermetures'),
  obtenirDetailFermeture: (id) => requete(`/api/fermetures/${id}/detail`),

  recettesDuJour: () => requete('/api/dashboard/recettes-jour'),
  etatRecettes: (params) => {
    const qs = new URLSearchParams(params).toString();
    return requete(`/api/dashboard/etat-recettes${qs ? `?${qs}` : ''}`);
  },
  exporterRecettesCsv: (params) => {
    const qs = new URLSearchParams(params).toString();
    return telechargerFichier(`/api/dashboard/export-recettes-csv?${qs}`, `recettes_${params.debut}_${params.fin}.csv`);
  },

  listerMesses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return requete(`/api/messes${qs ? `?${qs}` : ''}`);
  },

  listerHoraires: () => requete('/api/horaires'),
  modifierDemandeMesse: (id, donnees) =>
    requete(`/api/messes/${id}`, { method: 'PUT', body: JSON.stringify(donnees) }),
  listerHorairesDetail: () => requete('/api/horaires/detail'),
  creerHoraire: (donnees) =>
    requete('/api/horaires', { method: 'POST', body: JSON.stringify(donnees) }),
  supprimerHoraire: (id) => requete(`/api/horaires/${id}`, { method: 'DELETE' }),

  rechercherFideles: (q) => requete(`/api/fideles${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  enregistrerFidele: (donnees) =>
    requete('/api/fideles', { method: 'POST', body: JSON.stringify(donnees) }),

  listerUtilisateurs: () => requete('/api/utilisateurs'),
  creerUtilisateur: (donnees) =>
    requete('/api/utilisateurs', { method: 'POST', body: JSON.stringify(donnees) }),
  modifierUtilisateur: (id, donnees) =>
    requete(`/api/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(donnees) }),
  reinitialiserPin: (id, nouveauPin) =>
    requete(`/api/utilisateurs/${id}/pin`, { method: 'PUT', body: JSON.stringify({ nouveauPin }) }),
  changerMonPin: (ancienPin, nouveauPin) =>
    requete('/api/utilisateurs/moi/pin', { method: 'PUT', body: JSON.stringify({ ancienPin, nouveauPin }) }),
};
