// Progression du candidat et statistiques par thème.
// JavaScript pur : aucun import de React, aucun accès au DOM.

import { THEMES, RESULTATS } from './constants.js';

const COMPTEURS = {
  [RESULTATS.BONNE]: 'bonnes',
  [RESULTATS.FAUSSE]: 'fausses',
  [RESULTATS.ABSTENTION]: 'abstentions',
};

export function progressionVide() {
  return { version: 1, parQuestion: {} };
}

/** Rend exploitable une progression relue depuis le stockage (éventuellement abîmée). */
export function normaliserProgression(brut) {
  if (!brut || typeof brut !== 'object' || !brut.parQuestion || typeof brut.parQuestion !== 'object') {
    return progressionVide();
  }
  const parQuestion = {};
  for (const [id, f] of Object.entries(brut.parQuestion)) {
    if (!f || typeof f !== 'object') continue;
    const entier = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
    parQuestion[id] = {
      bonnes: entier(f.bonnes),
      fausses: entier(f.fausses),
      abstentions: entier(f.abstentions),
      dernier: Object.keys(COMPTEURS).includes(f.dernier) ? f.dernier : null,
      date: typeof f.date === 'string' ? f.date : null,
    };
  }
  return { version: 1, parQuestion };
}

/**
 * Ajoute des résultats à la progression (sans la modifier : renvoie une nouvelle progression).
 * Les questions dont la réponse n'est pas établie ne sont pas comptabilisées.
 * @param {{ id: string, resultat: string }[]} resultats
 * @param {string} dateIso
 */
export function enregistrerResultats(progression, resultats, dateIso) {
  const parQuestion = { ...progression.parQuestion };
  for (const { id, resultat } of resultats) {
    const compteur = COMPTEURS[resultat];
    if (!compteur) continue;
    const fiche = parQuestion[id] ?? { bonnes: 0, fausses: 0, abstentions: 0, dernier: null, date: null };
    parQuestion[id] = {
      ...fiche,
      [compteur]: fiche[compteur] + 1,
      dernier: resultat,
      date: dateIso,
    };
  }
  return { ...progression, parQuestion };
}

/**
 * Statistiques par thème, dans l'ordre de THEMES.
 * `taux` vaut null tant qu'aucune réponse n'a été donnée dans le thème.
 */
export function statsParTheme(questions, progression) {
  return THEMES.map((theme) => {
    const duTheme = questions.filter((q) => q.theme === theme);
    let vues = 0;
    let bonnes = 0;
    let fausses = 0;
    let abstentions = 0;
    for (const q of duTheme) {
      const f = progression.parQuestion[q.id];
      if (!f) continue;
      vues += 1;
      bonnes += f.bonnes;
      fausses += f.fausses;
      abstentions += f.abstentions;
    }
    const reponses = bonnes + fausses + abstentions;
    return {
      theme,
      nbQuestions: duTheme.length,
      vues,
      bonnes,
      fausses,
      abstentions,
      reponses,
      taux: reponses > 0 ? bonnes / reponses : null,
    };
  });
}

/**
 * Questions à revoir : celles dont la DERNIÈRE réponse était fausse.
 * Une question quitte la liste dès qu'on y répond correctement.
 */
export function questionsARevoir(questions, progression) {
  return questions.filter((q) => progression.parQuestion[q.id]?.dernier === RESULTATS.FAUSSE);
}
