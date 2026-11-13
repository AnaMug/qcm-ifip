// Générateur « suite_lettres_nombres » (du type « A1 – C4 – E9 – G16 – ? »).
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestion, creerGenerateur } from './commun.js';
import {
  arithmetique,
  geometrique,
  carres,
  differencesCroissantes,
  piegesUtilisables,
  piegesDeSecours,
} from './familles-suites.js';
import { predictions } from './solveur-suites.js';

const TYPE = 'suite_lettres_nombres';
const VERSION = 1;
const CONSIGNE = 'Complétez la série suivante.';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lettre = (rang) => ALPHABET[rang - 1];
const rangDe = (l) => ALPHABET.indexOf(l) + 1;

// n : nombre de termes affichés ; pas : avancée dans l'alphabet ; nombres : familles possibles.
const PAR_NIVEAU = {
  1: {
    n: 4,
    pas: [1, 2],
    descendant: false,
    nombres: [(alea, n) => arithmetique(alea, { n, pasMin: 1, pasMax: 5 })],
  },
  2: {
    n: 4,
    pas: [2, 3],
    descendant: false,
    nombres: [
      (alea, n) => carres(alea, { n, kMin: 1, kMax: 5 }),
      (alea, n) => geometrique(alea, { n, qMin: 2, qMax: 3, departMax: 4 }),
      (alea, n) => arithmetique(alea, { n, pasMin: 6, pasMax: 12 }),
    ],
  },
  3: {
    n: 5,
    pas: [2, 3, 4],
    descendant: true, // la série de lettres peut aussi reculer dans l'alphabet
    nombres: [
      (alea, n) => differencesCroissantes(alea, { n, dMin: 1, dMax: 4, kMin: 1, kMax: 3 }),
      (alea, n) => carres(alea, { n, kMin: 2, kMax: 7 }),
      (alea, n) => geometrique(alea, { n, qMin: 2, qMax: 3, departMax: 3 }),
      (alea, n) => arithmetique(alea, { n, pasMin: 3, pasMax: 9, decroissante: true }),
    ],
  },
};

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const reglage = PAR_NIVEAU[niveau];
  const { n } = reglage;
  const pas = alea.choisir(reglage.pas) * (reglage.descendant && alea.booleen() ? -1 : 1);
  // Le rang de départ est choisi pour que la lettre cherchée ET la lettre d'après restent dans l'alphabet.
  const marge = Math.abs(pas) * (n + 1);
  const depart = pas > 0 ? alea.entier(1, 26 - marge) : alea.entier(1 + marge, 26);
  const rangs = Array.from({ length: n }, (_, i) => depart + i * pas);
  const rangCherche = depart + n * pas;
  const suite = alea.choisir(reglage.nombres)(alea, n);

  const bonneLettre = lettre(rangCherche);
  // Lettres fausses : voisines immédiates dans l'alphabet, et lettre un cran trop loin dans la série.
  const lettresFausses = [
    { rang: rangCherche + 1, erreur: 'lettre décalée d’un rang dans l’alphabet' },
    { rang: rangCherche - 1, erreur: 'lettre décalée d’un rang dans l’alphabet' },
    { rang: rangCherche + pas, erreur: 'lettre un cran trop loin dans la série' },
  ].filter((l) => l.rang >= 1 && l.rang <= 26);
  // Nombres faux : deux erreurs typiques de la suite numérique.
  const nombresFaux = [...alea.melanger(piegesUtilisables(suite)), ...piegesDeSecours(suite)].slice(0, 2);
  if (nombresFaux.length < 2) return null;

  const sens = pas > 0 ? `avancent de ${pas}` : `reculent de ${-pas}`;
  const pieges = [];
  for (const faux of nombresFaux) {
    pieges.push({ texte: `${bonneLettre}${faux.valeur}`, erreur: `bonne lettre, mais nombre faux : ${faux.erreur}` });
  }
  for (const l of lettresFausses) {
    pieges.push({ texte: `${lettre(l.rang)}${suite.suivant}`, erreur: `bon nombre, mais ${l.erreur}` });
    pieges.push({
      texte: `${lettre(l.rang)}${nombresFaux[0].valeur}`,
      erreur: `${l.erreur} et nombre faux : ${nombresFaux[0].erreur}`,
    });
  }

  return assemblerQuestion({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: `${CONSIGNE}\n${rangs.map((r, i) => `${lettre(r)}${suite.termes[i]}`).join(' – ')} – ?`,
    bonne: `${bonneLettre}${suite.suivant}`,
    pieges,
    comparer: (a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)),
    explication:
      `Lettres : les rangs dans l’alphabet ${sens} à chaque terme ` +
      `(${rangs.map((r) => `${lettre(r)} = ${r}`).join(', ')}), donc ${bonneLettre} (rang ${rangCherche}). ` +
      `Nombres : ${suite.regle[0].toLowerCase()}${suite.regle.slice(1)} ${suite.calcul}. La réponse est ${bonneLettre}${suite.suivant}.`,
    alea,
  });
}

function resoudre(question) {
  const ligne = question.enonce.split('\n')[1] ?? '';
  const morceaux = ligne.split(' – ');
  if (morceaux.pop() !== '?') throw new Error('la série ne se termine pas par « ? »');
  const lus = morceaux.map((m) => /^([A-Z])(\d+)$/.exec(m));
  if (lus.length < 3 || lus.includes(null)) throw new Error('termes illisibles dans l’énoncé');

  // Lettres : les rangs doivent former une progression régulière, prolongée d'un cran.
  const rangs = lus.map((m) => rangDe(m[1]));
  const pas = rangs[1] - rangs[0];
  if (pas === 0 || rangs.some((r, i) => r !== rangs[0] + i * pas)) {
    throw new Error('les lettres ne suivent pas une progression régulière');
  }
  const rangAttendu = rangs[rangs.length - 1] + pas;
  if (rangAttendu < 1 || rangAttendu > 26) throw new Error('la lettre cherchée sort de l’alphabet');
  // Nombres : toutes les valeurs qu'une hypothèse cohérente permet de prédire.
  const possibles = predictions(lus.map((m) => Number(m[2])));

  const lire = (texte) => /^([A-Z])(\d+)$/.exec(texte);
  return {
    accepte: (texte) => {
      const m = lire(texte);
      return m !== null && rangDe(m[1]) === rangAttendu && possibles.has(Number(m[2]));
    },
    cle: (texte) => texte,
    controle: (texte) => (lire(texte) ? null : 'format « lettre + nombre » attendu'),
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Suite de lettres et de nombres',
  construire,
  resoudre,
});
