// Pliage d'un patron par simulation de roulement (utilisé par le générateur).
// JavaScript pur : ni React, ni DOM.
//
// On pose le cube sur une case du patron, puis on le fait rouler vers chaque case voisine
// (parcours en largeur). Rouler vers une case, c'est replier cette case d'un quart de tour
// autour de l'arête commune. Pour chaque case on suit donc un repère { n, u, v } :
//   n : normale sortante de la face du cube qui porte cette case (sa position : haut, avant…) ;
//   u : direction, sur le cube, de la « droite » de la case sur le patron ;
//   v : direction, sur le cube, du « haut » de la case sur le patron (l'orientation du motif).
// Le patron est vu côté imprimé, donc u × v = n pour toutes les cases.

import { DIRECTIONS, voisine } from './patrons.js';
import {
  FACES,
  REPERES,
  angleDansLeRepere,
  egaux,
  hautDuMotif,
  oppose,
  scalaire,
  vectoriel,
} from './reperes.js';

// Nouveau repère après un quart de tour vers la case voisine, selon la direction du roulement.
const ROULER = {
  droite: ({ n, u, v }) => ({ n: u, u: oppose(n), v }),
  gauche: ({ n, u, v }) => ({ n: oppose(u), u: n, v }),
  haut: ({ n, u, v }) => ({ n: v, u, v: oppose(n) }),
  bas: ({ n, u, v }) => ({ n: oppose(v), u, v: n }),
};

/**
 * @param {{ ligne: number, colonne: number }[]} cellules les 6 cases du patron
 * @returns {{ n: number[], u: number[], v: number[] }[]} un repère par case, dans le même ordre
 */
export function plierParRoulement(cellules) {
  const reperes = new Array(cellules.length).fill(null);
  reperes[0] = { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] }; // la première case est posée sur le dessus
  const file = [0];
  while (file.length > 0) {
    const i = file.shift();
    for (const direction of DIRECTIONS) {
      const j = voisine(cellules, i, direction);
      if (j === -1 || reperes[j] !== null) continue;
      reperes[j] = ROULER[direction.nom](reperes[i]);
      file.push(j);
    }
  }
  if (reperes.includes(null)) throw new Error('patron non connexe');
  return reperes;
}

/**
 * Contrôle qu'un pliage donne un cube valide : 6 positions distinctes, chaque face a exactement
 * 1 face opposée et 4 voisines, et chaque repère est cohérent (u × v = n).
 * @returns {string[]} anomalies (vide si le cube est valide)
 */
export function controlerCube(reperes) {
  const erreurs = [];
  if (reperes.length !== 6) return ['6 faces attendues'];
  const positions = new Set(reperes.map((r) => r.n.join(',')));
  if (positions.size !== 6) erreurs.push(`${positions.size} positions distinctes au lieu de 6`);
  reperes.forEach((r, i) => {
    const longueur = Math.abs(r.n[0]) + Math.abs(r.n[1]) + Math.abs(r.n[2]);
    if (longueur !== 1) erreurs.push(`face ${i + 1} : normale invalide`);
    if (!egaux(vectoriel(r.u, r.v), r.n)) erreurs.push(`face ${i + 1} : repère incohérent (motif retourné)`);
    const autres = reperes.filter((_, j) => j !== i);
    const opposees = autres.filter((a) => scalaire(a.n, r.n) === -1).length;
    const voisines = autres.filter((a) => scalaire(a.n, r.n) === 0).length;
    if (opposees !== 1 || voisines !== 4) {
      erreurs.push(`face ${i + 1} : ${opposees} face(s) opposée(s) et ${voisines} voisine(s) au lieu de 1 et 4`);
    }
  });
  return erreurs;
}

const produit = (a, b) => a.map((ligne) => [0, 1, 2].map((j) => ligne[0] * b[0][j] + ligne[1] * b[1][j] + ligne[2] * b[2][j]));
const appliquer = (m, x) => m.map((ligne) => scalaire(ligne, x));

/** Les 24 rotations du cube (matrices entières), obtenues à partir de deux quarts de tour. */
export function rotationsDuCube() {
  const autourDeX = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
  const autourDeY = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  const trouvees = new Map();
  const file = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]];
  while (file.length > 0) {
    const m = file.shift();
    const cle = m.flat().join(',');
    if (trouvees.has(cle)) continue;
    trouvees.set(cle, m);
    file.push(produit(autourDeX, m), produit(autourDeY, m));
  }
  return [...trouvees.values()];
}

export const tournerReperes = (reperes, m) =>
  reperes.map((r) => ({ n: appliquer(m, r.n), u: appliquer(m, r.u), v: appliquer(m, r.v) }));

/**
 * Lecture d'un cube plié : pour chaque position (haut, bas, avant…), la case du patron qui s'y
 * trouve et la rotation de son motif (0, 90, 180, 270°, sens horaire vu de l'extérieur).
 * @param {{ rotation?: number }[]} cellules cases du patron (rotation du motif sur le patron)
 */
export function lireCube(reperes, cellules) {
  const cube = {};
  for (const face of FACES) {
    const indice = reperes.findIndex((r) => egaux(r.n, REPERES[face].n));
    const haut = hautDuMotif(reperes[indice], cellules[indice].rotation ?? 0);
    cube[face] = { indice, rotation: angleDansLeRepere(haut, REPERES[face].droite, REPERES[face].haut) };
  }
  return cube;
}

/** Paires de cases opposées une fois le cube plié : [[i, j], …]. */
export function pairesOpposees(reperes) {
  const paires = [];
  reperes.forEach((r, i) => {
    const j = reperes.findIndex((a) => scalaire(a.n, r.n) === -1);
    if (i < j) paires.push([i, j]);
  });
  return paires;
}
