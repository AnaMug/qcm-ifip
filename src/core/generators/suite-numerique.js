// Générateur « suite_numerique ». JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestion, creerGenerateur } from './commun.js';
import {
  arithmetique,
  geometrique,
  carres,
  cubes,
  differencesCroissantes,
  affine,
  entrelacees,
  piegesUtilisables,
  piegesDeSecours,
} from './familles-suites.js';
import { predictions } from './solveur-suites.js';

const TYPE = 'suite_numerique';
const VERSION = 1;
const CONSIGNE = 'Quel nombre complète logiquement la suite ?';

// Familles proposées à chaque niveau. Chaque entrée construit une suite à partir de l'aléa.
const PAR_NIVEAU = {
  1: [
    (alea) => arithmetique(alea, { n: 5, pasMin: 2, pasMax: 9 }),
    (alea) => geometrique(alea, { n: 5, qMin: 2, qMax: 3, departMax: 5 }),
    (alea) => carres(alea, { n: 5, kMin: 1, kMax: 4 }),
  ],
  2: [
    (alea) => arithmetique(alea, { n: 5, pasMin: 3, pasMax: 12, decroissante: true }),
    (alea) => arithmetique(alea, { n: 5, pasMin: 11, pasMax: 25 }),
    (alea) => geometrique(alea, { n: 5, qMin: 2, qMax: 4, departMax: 6 }),
    (alea) => geometrique(alea, { n: 5, qMin: 2, qMax: 3, departMax: 9, decroissante: true }),
    (alea) => differencesCroissantes(alea, { n: 5, dMin: 1, dMax: 5, kMin: 1, kMax: 3 }),
    (alea) => carres(alea, { n: 5, kMin: 5, kMax: 12 }),
    (alea) => cubes(alea, { n: 5, kMin: 1, kMax: 2 }),
  ],
  3: [
    (alea) => entrelacees(alea, { n: 8 }),
    (alea) => entrelacees(alea, { n: 7 }),
    (alea) => affine(alea, { n: 5 }),
    (alea) => differencesCroissantes(alea, { n: 6, dMin: 2, dMax: 9, kMin: 2, kMax: 6 }),
    (alea) => cubes(alea, { n: 5, kMin: 2, kMax: 4 }),
  ],
};

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const suite = alea.choisir(PAR_NIVEAU[niveau])(alea);
  const enTexte = (p) => ({ texte: String(p.valeur), erreur: p.erreur });
  return assemblerQuestion({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: `${CONSIGNE}\n${suite.termes.join(' – ')} – ?`,
    bonne: String(suite.suivant),
    pieges: piegesUtilisables(suite).map(enTexte),
    secours: piegesDeSecours(suite).map(enTexte),
    comparer: (a, b) => Number(a) - Number(b),
    explication: `${suite.regle} ${suite.calcul}.`,
    alea,
  });
}

/** Relit les termes affichés dans l'énoncé. */
export function lireTermes(enonce) {
  const ligne = enonce.split('\n')[1] ?? '';
  const morceaux = ligne.split(' – ');
  if (morceaux.pop() !== '?') throw new Error('la suite ne se termine pas par « ? »');
  if (morceaux.length < 3 || !morceaux.every((m) => /^\d+$/.test(m))) {
    throw new Error('termes illisibles dans l’énoncé');
  }
  return morceaux.map(Number);
}

function resoudre(question) {
  const possibles = predictions(lireTermes(question.enonce));
  return {
    accepte: (texte) => /^\d+$/.test(texte) && possibles.has(Number(texte)),
    cle: (texte) => String(Number(texte)),
    controle: (texte) => (/^\d+$/.test(texte) ? null : 'nombre entier positif attendu'),
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Suite numérique',
  construire,
  resoudre,
});
