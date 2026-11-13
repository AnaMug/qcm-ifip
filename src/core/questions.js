// Validation, filtrage, mélange et tri des questions.
// JavaScript pur : aucun import de React, aucun accès au DOM.

import {
  THEMES,
  ORIGINES,
  ORIGINE_OFFICIELLE,
  ORIGINE_GENERATEUR,
  STATUTS,
  STATUT_VERIFIE,
  CONFIANCES,
} from './constants.js';

const CLES_ATTENDUES = [
  'id',
  'origine',
  'theme',
  'enonce',
  'choix',
  'bonne_reponse',
  'explication',
  'source',
  'confiance',
  'statut',
  'image',
  'similaire_a',
  'extrait_source',
];

const estTexteNonVide = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Vérifie qu'un objet respecte le schéma strict d'une question.
 * Avec { generee: true }, on attend une question produite par un générateur :
 * origine "generateur" et champ supplémentaire "generateur" { type, seed, niveau, version }.
 * @returns {string[]} la liste des anomalies (vide si la question est valide)
 */
export function validerQuestion(q, { generee = false } = {}) {
  // Une question générée peut porter un champ facultatif « figure » (description structurée).
  const avecFigure = generee && q.figure !== undefined;
  const clesAttendues = generee
    ? [...CLES_ATTENDUES, 'generateur', ...(avecFigure ? ['figure'] : [])]
    : CLES_ATTENDUES;
  const originesAdmises = generee ? [ORIGINE_GENERATEUR] : ORIGINES;
  if (q === null || typeof q !== 'object' || Array.isArray(q)) {
    return ["la question n'est pas un objet"];
  }
  const erreurs = [];

  for (const cle of clesAttendues) {
    if (!(cle in q)) erreurs.push(`champ manquant : ${cle}`);
  }
  for (const cle of Object.keys(q)) {
    if (!clesAttendues.includes(cle)) erreurs.push(`champ inconnu : ${cle}`);
  }

  if ('id' in q && !estTexteNonVide(q.id)) erreurs.push('id : texte non vide attendu');
  if ('origine' in q && !originesAdmises.includes(q.origine)) {
    erreurs.push(`origine : valeurs admises ${originesAdmises.join(', ')}`);
  }
  if (generee && 'generateur' in q) {
    const g = q.generateur;
    const ok =
      g !== null &&
      typeof g === 'object' &&
      estTexteNonVide(g.type) &&
      Number.isInteger(g.seed) &&
      Number.isInteger(g.niveau) &&
      Number.isInteger(g.version) &&
      Object.keys(g).length === 4;
    if (!ok) erreurs.push('generateur : objet { type, seed, niveau, version } attendu');
  }
  if ('theme' in q && !THEMES.includes(q.theme)) {
    erreurs.push(`theme : valeurs admises ${THEMES.join(', ')}`);
  }
  if ('enonce' in q && !estTexteNonVide(q.enonce)) erreurs.push('enonce : texte non vide attendu');
  if ('choix' in q) {
    // Question à figure : les 4 choix sont eux aussi des descriptions (objets).
    const estChoix = avecFigure ? (c) => c !== null && typeof c === 'object' && !Array.isArray(c) : estTexteNonVide;
    const ok = Array.isArray(q.choix) && q.choix.length === 4 && q.choix.every(estChoix);
    if (!ok) {
      erreurs.push(
        avecFigure
          ? 'choix : tableau de 4 descriptions de figure attendu'
          : 'choix : tableau de 4 textes non vides attendu',
      );
    }
  }
  if (avecFigure) {
    const f = q.figure;
    const ok = f !== null && typeof f === 'object' && ['matrice', 'suite'].includes(f.kind);
    if (!ok) erreurs.push('figure : description de type « matrice » ou « suite » attendue');
  }
  if ('bonne_reponse' in q && q.bonne_reponse !== null && ![1, 2, 3, 4].includes(q.bonne_reponse)) {
    erreurs.push('bonne_reponse : 1, 2, 3, 4 ou null attendu');
  }
  if ('explication' in q && q.explication !== null && typeof q.explication !== 'string') {
    erreurs.push('explication : texte ou null attendu');
  }
  if ('source' in q) {
    const s = q.source;
    const ok =
      s !== null &&
      typeof s === 'object' &&
      !Array.isArray(s) &&
      typeof s.libelle === 'string' &&
      typeof s.url === 'string' &&
      Object.keys(s).length === 2;
    if (!ok) erreurs.push('source : objet { "libelle": texte, "url": texte } attendu');
  }
  if ('confiance' in q && q.confiance !== null && !CONFIANCES.includes(q.confiance)) {
    erreurs.push(`confiance : ${CONFIANCES.join(', ')} ou null attendu`);
  }
  if ('statut' in q && !STATUTS.includes(q.statut)) {
    erreurs.push(`statut : valeurs admises ${STATUTS.join(', ')}`);
  }
  if ('image' in q && q.image !== null && !estTexteNonVide(q.image)) {
    erreurs.push('image : null, "A_FOURNIR" ou un chemin attendu');
  }
  if ('similaire_a' in q && q.similaire_a !== null && !estTexteNonVide(q.similaire_a)) {
    erreurs.push("similaire_a : null ou l'id de la question d'origine attendu");
  }
  if ('similaire_a' in q && estTexteNonVide(q.similaire_a) && q.similaire_a === q.id) {
    erreurs.push('similaire_a : une question ne peut pas renvoyer à elle-même');
  }
  if ('extrait_source' in q && q.extrait_source !== null && !estTexteNonVide(q.extrait_source)) {
    erreurs.push('extrait_source : null ou un texte non vide attendu');
  }
  return erreurs;
}

/**
 * Valide le contenu brut de questions.json.
 * Les questions invalides, en doublon ou renvoyant (similaire_a) à une question absente
 * sont écartées et signalées.
 * @returns {{ questions: object[], erreurs: { position: number, id: string|null, messages: string[] }[] }}
 */
export function preparerQuestions(brut) {
  if (!Array.isArray(brut)) {
    return {
      questions: [],
      erreurs: [{ position: 0, id: null, messages: ['questions.json doit contenir un tableau'] }],
    };
  }
  const retenues = [];
  const erreurs = [];
  const idsVus = new Set();

  brut.forEach((q, i) => {
    const messages = validerQuestion(q);
    const id = q && typeof q === 'object' && typeof q.id === 'string' ? q.id : null;
    if (id !== null && idsVus.has(id)) messages.push(`id en doublon : ${id}`);
    if (messages.length > 0) {
      erreurs.push({ position: i + 1, id, messages });
      return;
    }
    idsVus.add(id);
    retenues.push({ q, position: i + 1 });
  });

  // Second passage : similaire_a doit désigner une question présente et valide du fichier.
  const questions = [];
  for (const { q, position } of retenues) {
    if (q.similaire_a !== null && !idsVus.has(q.similaire_a)) {
      erreurs.push({
        position,
        id: q.id,
        messages: [`similaire_a : question d'origine introuvable (${q.similaire_a})`],
      });
      continue;
    }
    questions.push(q);
  }
  erreurs.sort((a, b) => a.position - b.position);

  return { questions, erreurs };
}

/**
 * Filtre une liste de questions.
 * @param {object[]} questions
 * @param {{ themes?: string[], origine?: string, verifieesSeulement?: boolean, ids?: string[] }} criteres
 */
export function filtrerQuestions(questions, criteres = {}) {
  const { themes, origine, verifieesSeulement, ids } = criteres;
  return questions.filter((q) => {
    if (themes && !themes.includes(q.theme)) return false;
    if (origine && q.origine !== origine) return false;
    if (verifieesSeulement && q.statut !== STATUT_VERIFIE) return false;
    if (ids && !ids.includes(q.id)) return false;
    return true;
  });
}

/** Mélange de Fisher-Yates. Renvoie une nouvelle liste ; `alea` est injectable. */
export function melanger(liste, alea = Math.random) {
  const copie = liste.slice();
  for (let i = copie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(alea() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Trie selon l'ordre de THEMES en conservant l'ordre du fichier dans chaque thème. */
export function ordonnerParTheme(questions) {
  return questions
    .map((q, i) => ({ q, i }))
    .sort((a, b) => THEMES.indexOf(a.q.theme) - THEMES.indexOf(b.q.theme) || a.i - b.i)
    .map(({ q }) => q);
}

/** Questions du mode entraînement : thèmes choisis (ou ids imposés), ordre aléatoire. */
export function selectionEntrainement(questions, criteres = {}, alea = Math.random) {
  return melanger(filtrerQuestions(questions, criteres), alea);
}

/** Questions de l'examen blanc : toutes les questions officielles, dans l'ordre des thèmes. */
export function selectionExamen(questions, criteres = {}) {
  return ordonnerParTheme(
    filtrerQuestions(questions, { ...criteres, origine: ORIGINE_OFFICIELLE }),
  );
}

export function compterParStatut(questions) {
  const compte = Object.fromEntries(STATUTS.map((s) => [s, 0]));
  for (const q of questions) compte[q.statut] += 1;
  return compte;
}

export function compterParTheme(questions) {
  const compte = Object.fromEntries(THEMES.map((t) => [t, 0]));
  for (const q of questions) compte[q.theme] += 1;
  return compte;
}
