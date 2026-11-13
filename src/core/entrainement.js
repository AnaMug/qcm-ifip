// Composition d'une séance d'entraînement. JavaScript pur : ni React, ni DOM.

import { NB_GENEREES_PAR_SEANCE, THEME_DES_GENERATEURS } from './constants.js';
import { filtrerQuestions, melanger } from './questions.js';
import { genererSerie } from './generators/index.js';

/**
 * Les questions générées sont ajoutées si le réglage est actif et si le thème logique est choisi.
 * Elles ont le statut « concordant » (deux calculs indépendants d'accord) : le réglage
 * « N'afficher que les questions vérifiées » les écarte donc, comme toute question non validée.
 */
export function generationActive({ themes, inclureGenerees, verifieesSeulement }) {
  return Boolean(inclureGenerees) && !verifieesSeulement && themes.includes(THEME_DES_GENERATEURS);
}

/**
 * @param {object[]} questions questions du fichier (déjà filtrées selon les réglages)
 * @param {{ themes: string[], inclureGenerees: boolean, verifieesSeulement: boolean, graine: number }} options
 *   `graine` : entier fourni par l'interface (par exemple l'heure courante) ; même graine = mêmes questions générées.
 * @param {() => number} alea ordre de présentation (Math.random par défaut, hors générateurs)
 */
export function composerEntrainement(questions, options, alea = Math.random) {
  const duFichier = filtrerQuestions(questions, { themes: options.themes });
  const generees = generationActive(options) ? genererSerie(NB_GENEREES_PAR_SEANCE, options.graine) : [];
  return melanger([...duFichier, ...generees], alea);
}
