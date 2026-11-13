// Progression du candidat et statistiques par thème.
// JavaScript pur : aucun import de React, aucun accès au DOM.

import { THEMES, RESULTATS } from './constants.js';

const COMPTEURS = {
  [RESULTATS.BONNE]: 'bonnes',
  [RESULTATS.FAUSSE]: 'fausses',
  [RESULTATS.ABSTENTION]: 'abstentions',
};

const compteursVides = () => ({ bonnes: 0, fausses: 0, abstentions: 0 });
const entier = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);

/**
 * parQuestion : une fiche par question du fichier questions.json.
 * generees : un simple cumul par thème pour les questions générées, qui sont en nombre illimité
 * et ne sont donc pas suivies une à une.
 */
export function progressionVide() {
  return { version: 1, parQuestion: {}, generees: {} };
}

/** Rend exploitable une progression relue depuis le stockage (éventuellement abîmée). */
export function normaliserProgression(brut) {
  if (!brut || typeof brut !== 'object' || !brut.parQuestion || typeof brut.parQuestion !== 'object') {
    return progressionVide();
  }
  const parQuestion = {};
  for (const [id, f] of Object.entries(brut.parQuestion)) {
    if (!f || typeof f !== 'object') continue;
    parQuestion[id] = {
      bonnes: entier(f.bonnes),
      fausses: entier(f.fausses),
      abstentions: entier(f.abstentions),
      dernier: Object.keys(COMPTEURS).includes(f.dernier) ? f.dernier : null,
      date: typeof f.date === 'string' ? f.date : null,
    };
  }
  const generees = {};
  if (brut.generees && typeof brut.generees === 'object') {
    for (const theme of THEMES) {
      const c = brut.generees[theme];
      if (!c || typeof c !== 'object') continue;
      generees[theme] = {
        bonnes: entier(c.bonnes),
        fausses: entier(c.fausses),
        abstentions: entier(c.abstentions),
      };
    }
  }
  return { version: 1, parQuestion, generees };
}

/**
 * Ajoute des résultats à la progression (sans la modifier : renvoie une nouvelle progression).
 * Les questions dont la réponse n'est pas établie ne sont pas comptabilisées.
 * Une question générée (generee: true) alimente seulement le cumul de son thème.
 * @param {{ id: string, resultat: string, theme?: string, generee?: boolean }[]} resultats
 * @param {string} dateIso
 */
export function enregistrerResultats(progression, resultats, dateIso) {
  const parQuestion = { ...progression.parQuestion };
  const generees = { ...(progression.generees ?? {}) };
  for (const { id, resultat, theme, generee } of resultats) {
    const compteur = COMPTEURS[resultat];
    if (!compteur) continue;
    if (generee) {
      if (!THEMES.includes(theme)) continue;
      const cumul = generees[theme] ?? compteursVides();
      generees[theme] = { ...cumul, [compteur]: cumul[compteur] + 1 };
      continue;
    }
    const fiche = parQuestion[id] ?? { bonnes: 0, fausses: 0, abstentions: 0, dernier: null, date: null };
    parQuestion[id] = {
      ...fiche,
      [compteur]: fiche[compteur] + 1,
      dernier: resultat,
      date: dateIso,
    };
  }
  return { ...progression, parQuestion, generees };
}

/**
 * Statistiques par thème, dans l'ordre de THEMES.
 * `taux` vaut null tant qu'aucune réponse n'a été donnée dans le thème.
 * Les réponses aux questions générées sont incluses dans bonnes / fausses / abstentions ;
 * `reponsesGenerees` indique combien de réponses elles représentent.
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
    const cumul = progression.generees?.[theme] ?? compteursVides();
    const reponsesGenerees = cumul.bonnes + cumul.fausses + cumul.abstentions;
    bonnes += cumul.bonnes;
    fausses += cumul.fausses;
    abstentions += cumul.abstentions;
    const reponses = bonnes + fausses + abstentions;
    return {
      theme,
      nbQuestions: duTheme.length,
      vues,
      bonnes,
      fausses,
      abstentions,
      reponses,
      reponsesGenerees,
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
