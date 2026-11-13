// Les 11 patrons du cube, codés comme 6 cases sur une grille. JavaScript pur.

const DESSINS = [
  // 1 - 4 - 1
  ['X...', 'XXXX', 'X...'],
  ['X...', 'XXXX', '.X..'],
  ['X...', 'XXXX', '..X.'],
  ['X...', 'XXXX', '...X'],
  ['.X..', 'XXXX', '.X..'],
  ['.X..', 'XXXX', '..X.'],
  // 2 - 3 - 1
  ['XX..', '.XXX', '.X..'],
  ['XX..', '.XXX', '..X.'],
  ['XX..', '.XXX', '...X'],
  // 2 - 2 - 2
  ['XX..', '.XX.', '..XX'],
  // 3 - 3
  ['XXX..', '..XXX'],
];

const trier = (cellules) => [...cellules].sort((a, b) => a.ligne - b.ligne || a.colonne - b.colonne);

/** @type {{ ligne: number, colonne: number }[][]} */
export const PATRONS = DESSINS.map((lignes) =>
  lignes.flatMap((texte, ligne) =>
    [...texte].flatMap((caractere, colonne) => (caractere === 'X' ? [{ ligne, colonne }] : [])),
  ),
);

/**
 * Une des 8 présentations d'un patron : k quarts de tour (k modulo 4), retourné si k ≥ 4.
 * Les cases sont ramenées contre le bord haut et le bord gauche, puis triées.
 */
export function presenterPatron(cellules, k) {
  let cases = cellules.map(({ ligne, colonne }) => ({ ligne, colonne: k >= 4 ? -colonne : colonne }));
  for (let i = 0; i < k % 4; i += 1) cases = cases.map(({ ligne, colonne }) => ({ ligne: colonne, colonne: -ligne }));
  const ligneMin = Math.min(...cases.map((c) => c.ligne));
  const colonneMin = Math.min(...cases.map((c) => c.colonne));
  return trier(cases.map((c) => ({ ligne: c.ligne - ligneMin, colonne: c.colonne - colonneMin })));
}

/** Signature indépendante de la présentation : deux patrons identiques à une rotation ou un retournement près ont la même. */
export function signaturePatron(cellules) {
  const signatures = [];
  for (let k = 0; k < 8; k += 1) {
    signatures.push(presenterPatron(cellules, k).map((c) => `${c.ligne}:${c.colonne}`).join(' '));
  }
  return signatures.sort()[0];
}

// Déplacements vers les 4 cases voisines d'une case du patron.
export const DIRECTIONS = [
  { nom: 'droite', ligne: 0, colonne: 1 },
  { nom: 'gauche', ligne: 0, colonne: -1 },
  { nom: 'haut', ligne: -1, colonne: 0 },
  { nom: 'bas', ligne: 1, colonne: 0 },
];

/** Indice de la case voisine dans une direction, ou -1. */
export function voisine(cellules, i, direction) {
  return cellules.findIndex(
    (c) => c.ligne === cellules[i].ligne + direction.ligne && c.colonne === cellules[i].colonne + direction.colonne,
  );
}

export function sontVoisines(cellules, i, j) {
  return Math.abs(cellules[i].ligne - cellules[j].ligne) + Math.abs(cellules[i].colonne - cellules[j].colonne) === 1;
}
