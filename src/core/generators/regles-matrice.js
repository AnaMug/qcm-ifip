// Contrôle des règles d'une grille 3 × 3 COMPLÈTE, utilisé par verify() du générateur « matrice ».
// Ce fichier ne sait pas quelles règles le générateur a choisies : pour chaque attribut, il
// cherche si une règle de la famille est respectée sur toute la grille. JavaScript pur.

import { normaliserRotation, trierMarques } from '../figures/formes.js';

const transposer = (g) => [0, 1, 2].map((c) => g.map((ligne) => ligne[c]));
const tousEgaux = (g) => g.flat().every((v) => v === g[0][0]);

/** Même écart non nul entre cases voisines, sur chaque ligne. */
function progressionParLigne(valeurs) {
  const pas = valeurs[0][1] - valeurs[0][0];
  return pas !== 0 && valeurs.every((l) => l[1] - l[0] === pas && l[2] - l[1] === pas);
}

/** Chaque ligne contient une fois chacune des trois mêmes valeurs. */
function cycleParLigne(valeurs) {
  const reference = [...valeurs[0]].sort().join('|');
  return new Set(valeurs[0]).size === 3 && valeurs.every((l) => [...l].sort().join('|') === reference);
}

function nombreValide(grille) {
  const v = grille.map((l) => l.map((c) => c.nombre));
  return tousEgaux(v) || progressionParLigne(v) || progressionParLigne(transposer(v));
}

function cycleValide(grille, attribut) {
  const v = grille.map((l) => l.map((c) => c[attribut]));
  return tousEgaux(v) || cycleParLigne(v) || cycleParLigne(transposer(v));
}

// Les orientations sont comparées après normalisation par la symétrie de la forme :
// un carré tourné de 90° ou un losange tourné de 180° sont identiques à l'original.
function rotationValide(grille) {
  const reference = grille[0][0].rotation;
  const constante = grille.flat().every(
    (c) => normaliserRotation(c.forme, c.rotation) === normaliserRotation(c.forme, reference),
  );
  if (constante) return true;
  for (const lignes of [grille, transposer(grille)]) {
    for (const angle of [45, 90, 270, 315]) {
      const respectee = lignes.every((l) =>
        [0, 1].every(
          (i) =>
            normaliserRotation(l[i + 1].forme, l[i + 1].rotation) ===
            normaliserRotation(l[i + 1].forme, l[i].rotation + angle),
        ),
      );
      if (respectee) return true;
    }
  }
  return false;
}

const reunion = (a, b) => trierMarques([...a, ...b]).join('+');
const exclusif = (a, b) =>
  trierMarques([...a.filter((m) => !b.includes(m)), ...b.filter((m) => !a.includes(m))]).join('+');

function marquesValides(grille) {
  const v = grille.map((l) => l.map((c) => trierMarques(c.marques)));
  if (tousEgaux(v.map((l) => l.map((m) => m.join('+'))))) return true;
  for (const lignes of [v, transposer(v)]) {
    for (const operation of [reunion, exclusif]) {
      if (lignes.every((l) => l[2].join('+') === operation(l[0], l[1]))) return true;
    }
  }
  return false;
}

/**
 * @param {object[][]} grille 3 × 3 cases, toutes renseignées
 * @returns {Record<string, boolean>} pour chaque attribut, vrai si une règle de sa famille est respectée
 */
export function attributsValides(grille) {
  return {
    nombre: nombreValide(grille),
    rotation: rotationValide(grille),
    forme: cycleValide(grille, 'forme'),
    remplissage: cycleValide(grille, 'remplissage'),
    marques: marquesValides(grille),
  };
}
