// Constantes métier. JavaScript pur : aucun import de React, aucun accès au DOM.

// L'ordre de ce tableau est l'ordre des thèmes dans l'examen blanc.
export const THEMES = ['environnement', 'ue', 'numerique', 'logique', 'anglais'];

export const LIBELLES_THEMES = {
  environnement: 'Environnement',
  ue: 'Union européenne',
  numerique: 'Numérique',
  logique: 'Logique',
  anglais: 'Anglais',
};

export const ORIGINES = ['officiel_2026', 'ia_sourcee'];
export const ORIGINE_OFFICIELLE = 'officiel_2026';

export const LIBELLES_ORIGINES = {
  officiel_2026: 'Officielle 2026',
  ia_sourcee: 'Générée (sourcée)',
};

export const STATUTS = ['a_verifier', 'concordant', 'verifie'];
export const STATUT_VERIFIE = 'verifie';

export const LIBELLES_STATUTS = {
  a_verifier: 'À vérifier',
  concordant: 'Concordant',
  verifie: 'Vérifié',
};

export const CONFIANCES = ['haute', 'moyenne', 'faible'];

export const IMAGE_A_FOURNIR = 'A_FOURNIR';

// Valeur de réponse enregistrée quand le candidat clique sur « Je m'abstiens ».
export const ABSTENTION = 'abstention';

export const RESULTATS = {
  BONNE: 'bonne',
  FAUSSE: 'fausse',
  ABSTENTION: 'abstention',
  NON_ETABLIE: 'non_etablie',
};

export const REGLAGES_PAR_DEFAUT = {
  verifieesSeulement: false,
  dureeExamenMin: 80,
  bareme: { bonne: 1, fausse: -0.5, abstention: 0 },
};

export const MENTION_BAREME = "Le barème officiel n'est pas publié : score indicatif.";
export const MENTION_REPONSE_NON_ETABLIE = 'Réponse non encore établie';
