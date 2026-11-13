// Description en français d'une case ou d'une grille : sert aux explications et à
// l'accessibilité (texte alternatif des figures). JavaScript pur : ni React, ni DOM.

import { normaliserRotation, trierMarques } from './formes.js';

// nom, pluriel, genre, article défini
export const NOMS_FORMES = {
  cercle: { nom: 'cercle', pluriel: 'cercles', feminin: false, le: 'le cercle' },
  carre: { nom: 'carré', pluriel: 'carrés', feminin: false, le: 'le carré' },
  triangle: { nom: 'triangle', pluriel: 'triangles', feminin: false, le: 'le triangle' },
  losange: { nom: 'losange', pluriel: 'losanges', feminin: false, le: 'le losange' },
  etoile: { nom: 'étoile', pluriel: 'étoiles', feminin: true, le: 'l’étoile' },
  fleche: { nom: 'flèche', pluriel: 'flèches', feminin: true, le: 'la flèche' },
};

const ADJECTIFS = { plein: 'plein', vide: 'vide', hachure: 'hachuré' };

export const NOMS_REMPLISSAGES = { plein: 'plein', vide: 'vide', hachure: 'hachuré' };

export const NOMS_POSITIONS = {
  n: 'en haut',
  ne: 'en haut à droite',
  e: 'à droite',
  se: 'en bas à droite',
  s: 'en bas',
  so: 'en bas à gauche',
  o: 'à gauche',
  no: 'en haut à gauche',
};

/** « plein », « pleine », « pleins », « hachurées »… */
export function accorder(remplissage, feminin, pluriel) {
  let mot = ADJECTIFS[remplissage];
  if (feminin && !mot.endsWith('e')) mot += 'e';
  if (pluriel) mot += 's';
  return mot;
}

export function decrireMarques(marques) {
  const liste = trierMarques(marques);
  if (liste.length === 0) return 'aucun point sur le pourtour';
  return `${liste.length > 1 ? 'points' : 'point'} ${liste.map((m) => NOMS_POSITIONS[m]).join(', ')}`;
}

/** Ex. : « 3 triangles hachurés, tournés de 90°, point en haut ». */
export function decrireCase(c) {
  const f = NOMS_FORMES[c.forme];
  const pluriel = c.nombre > 1;
  let texte = `${c.nombre} ${pluriel ? f.pluriel : f.nom} ${accorder(c.remplissage, f.feminin, pluriel)}`;
  const rotation = normaliserRotation(c.forme, c.rotation);
  if (rotation !== 0) {
    const tourne = `tourné${f.feminin ? 'e' : ''}${pluriel ? 's' : ''}`;
    texte += `, ${tourne} de ${rotation}° dans le sens horaire`;
  }
  if (c.marques.length > 0) texte += `, ${decrireMarques(c.marques)}`;
  return texte;
}

export const decrirePosition = (m) => `ligne ${m.ligne + 1}, colonne ${m.colonne + 1}`;

/** Ex. : « carré 3 × 3 : cercle plein ligne 1, colonne 3 ». */
export function decrireGrille(g) {
  const marqueurs = g.marqueurs
    .map((m) => {
      const f = NOMS_FORMES[m.forme];
      return `${f.nom} ${accorder(m.remplissage, f.feminin, false)} ${decrirePosition(m)}`;
    })
    .join(' ; ');
  return `carré ${g.taille} × ${g.taille} : ${marqueurs}`;
}

/** Texte alternatif d'une figure complète (matrice ou suite) ou d'un choix. */
export function decrireFigure(figure) {
  if (figure.kind === 'matrice') {
    const lignes = figure.cases.map(
      (ligne, r) =>
        `ligne ${r + 1} : ${ligne.map((c) => (c === null ? 'case manquante' : decrireCase(c))).join(' | ')}`,
    );
    return `Grille de ${figure.lignes} lignes et ${figure.colonnes} colonnes. ${lignes.join('. ')}.`;
  }
  if (figure.kind === 'suite') {
    return `Suite de ${figure.etapes.length} figures. ${figure.etapes
      .map((g, i) => `Figure ${i + 1} : ${decrireGrille(g)}`)
      .join('. ')}. Figure suivante à trouver.`;
  }
  if (figure.kind === 'grille') return decrireGrille(figure);
  return decrireCase(figure);
}
