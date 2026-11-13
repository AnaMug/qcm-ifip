// Tracé d'un patron à plat et d'un cube en perspective isométrique : transforme une description
// en primitives géométriques (mêmes primitives que src/core/figures/trace.js).
// JavaScript pur : ni React, ni DOM, ni SVG. Réutilisable tel quel avec react-native-svg.

import { FACES_VISIBLES, NOMS_FACES, REPERES, fois, plus } from './reperes.js';
import { decrireFace, formesDeFace } from './motifs.js';
import { lireCube, plierParRoulement } from './pliage.js';

const arrondir = (x) => Math.round(x * 100) / 100;
const MARGE = 3;
const ECHELLE_MOTIF = 0.85;

/** Contenu d'une case carrée de centre (cx, cy) : étiquette (lettre) ou motif. */
export function tracerContenu(cellule, cx, cy, demiCote) {
  if (cellule.etiquette) {
    return [{ type: 'texte', x: cx, y: cy, taille: arrondir(demiCote * 1.1), texte: cellule.etiquette, rotation: cellule.rotation ?? 0 }];
  }
  return formesDeFace(cellule).map(({ points, remplissage }) => ({
    type: 'polygone',
    remplissage,
    // y du motif vers le haut, y de l'écran vers le bas
    points: points.map(([x, y]) => [arrondir(cx + x * demiCote * ECHELLE_MOTIF), arrondir(cy - y * demiCote * ECHELLE_MOTIF)]),
  }));
}

export function tracerPatron(figure) {
  const cote = 46;
  const primitives = [];
  for (const cellule of figure.cellules) {
    const x = MARGE + cellule.colonne * cote;
    const y = MARGE + cellule.ligne * cote;
    primitives.push({ type: 'rect', x, y, largeur: cote, hauteur: cote, epaisseur: 1.5 });
    primitives.push(...tracerContenu(cellule, x + cote / 2, y + cote / 2, cote / 2));
  }
  return {
    largeur: (Math.max(...figure.cellules.map((c) => c.colonne)) + 1) * cote + 2 * MARGE,
    hauteur: (Math.max(...figure.cellules.map((c) => c.ligne)) + 1) * cote + 2 * MARGE,
    primitives,
  };
}

// Perspective isométrique : l'observateur regarde le cube depuis l'avant, la droite et le dessus.
const DEMI_ARETE = 34;
const COS30 = Math.sqrt(3) / 2;
const projeter = ([x, y, z]) => [(x - z) * COS30 * DEMI_ARETE, (-y + (x + z) * 0.5) * DEMI_ARETE];

/**
 * Cube montrant ses faces haut, avant et droite. Chaque point du motif est placé sur la face
 * dans l'espace, puis projeté : le motif est donc déformé exactement comme la face.
 */
export function tracerCube(cube) {
  const largeur = 4 * COS30 * DEMI_ARETE + 2 * MARGE;
  const hauteur = 4 * DEMI_ARETE + 2 * MARGE;
  const versEcran = (p) => {
    const [x, y] = projeter(p);
    return [arrondir(largeur / 2 + x), arrondir(hauteur / 2 + y)];
  };
  const primitives = [];
  for (const nom of FACES_VISIBLES) {
    const { n, droite, haut } = REPERES[nom];
    const surLaFace = (a, b) => versEcran(plus(n, plus(fois(droite, a), fois(haut, b))));
    primitives.push({ type: 'polygone', remplissage: 'vide', points: [surLaFace(-1, -1), surLaFace(1, -1), surLaFace(1, 1), surLaFace(-1, 1)] });
    for (const { points, remplissage } of formesDeFace(cube.faces[nom])) {
      primitives.push({
        type: 'polygone',
        remplissage,
        points: points.map(([a, b]) => surLaFace(a * ECHELLE_MOTIF, b * ECHELLE_MOTIF)),
      });
    }
  }
  return { largeur: arrondir(largeur), hauteur: arrondir(hauteur), primitives };
}

/**
 * Les 6 faces du cube obtenu en pliant le patron (première case sur le dessus), pour la vue de
 * contrôle : { haut: { motif | etiquette, rotation, miroir, description }, bas: …, … }.
 */
export function facesDuCubePlie(figure) {
  const { cellules } = figure;
  const cube = lireCube(plierParRoulement(cellules), cellules);
  return Object.fromEntries(
    Object.entries(cube).map(([nom, { indice, rotation }]) => {
      const cellule = cellules[indice];
      const face = cellule.etiquette
        ? { etiquette: cellule.etiquette, rotation }
        : { motif: cellule.motif, rotation, miroir: false };
      return [nom, { ...face, description: cellule.etiquette ? `face ${cellule.etiquette}` : decrireFace(face) }];
    }),
  );
}

export const tracerFigureCube = (figure) => (figure.kind === 'patron' ? tracerPatron(figure) : tracerCube(figure));

/** Texte alternatif d'un patron ou d'un cube. */
export function decrireFigureCube(figure) {
  if (figure.kind === 'patron') {
    const cases = figure.cellules
      .map((c) => `ligne ${c.ligne + 1}, colonne ${c.colonne + 1} : ${c.etiquette ? `face ${c.etiquette}` : decrireFace(c)}`)
      .join(' ; ');
    return `Patron de cube à plat, 6 cases. ${cases}.`;
  }
  return `Cube vu en perspective. ${FACES_VISIBLES.map((f) => `${NOMS_FACES[f]} : ${decrireFace(figure.faces[f])}`).join(' ; ')}.`;
}
