// Registre des générateurs. JavaScript pur, sans Math.random.

import { creerAlea } from '../random.js';
import { ORIGINE_GENERATEUR } from '../constants.js';
import { NIVEAUX } from './commun.js';
import suiteNumerique from './suite-numerique.js';
import suiteLettresNombres from './suite-lettres-nombres.js';
import calendrier from './calendrier.js';
import probabilites from './probabilites.js';

export { NIVEAUX };

export const GENERATEURS = {
  [suiteNumerique.type]: suiteNumerique,
  [suiteLettresNombres.type]: suiteLettresNombres,
  [calendrier.type]: calendrier,
  [probabilites.type]: probabilites,
};

export const TYPES_DE_GENERATEURS = Object.keys(GENERATEURS);

export const estGeneree = (question) => question.origine === ORIGINE_GENERATEUR;

/** Même (type, graine, niveau) = même question. */
export function genererQuestion(type, seed, niveau) {
  const generateur = GENERATEURS[type];
  if (!generateur) throw new Error(`Générateur inconnu : ${type}`);
  return generateur.generate(seed, niveau);
}

/** Vérifie une question générée avec le verify() de son générateur. */
export function verifierQuestion(question) {
  const generateur = GENERATEURS[question?.generateur?.type];
  if (!generateur) return { ok: false, erreurs: ['générateur inconnu ou champ « generateur » absent'] };
  return generateur.verify(question);
}

/**
 * Série de questions générées pour une séance d'entraînement : les types et les niveaux
 * alternent, les graines dérivent de `graine`. Une question impossible à générer est ignorée.
 */
export function genererSerie(nombre, graine) {
  const alea = creerAlea(graine);
  const types = alea.melanger(TYPES_DE_GENERATEURS);
  const serie = [];
  const ids = new Set();
  for (let i = 0; i < nombre; i += 1) {
    const type = types[i % types.length];
    const niveau = NIVEAUX[alea.entier(0, NIVEAUX.length - 1)];
    try {
      const question = genererQuestion(type, alea.entier(0, 999999), niveau);
      if (!ids.has(question.id)) {
        ids.add(question.id);
        serie.push(question);
      }
    } catch {
      // aucune question valide après 20 essais : on passe à la suivante
    }
  }
  return serie;
}
