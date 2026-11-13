// Vocabulaire des figures : formes, remplissages, symétries, clés de comparaison.
// Une figure est une DONNÉE (objets simples), jamais du SVG ni du HTML.
// JavaScript pur : ni React, ni DOM.

export const FORMES = ['cercle', 'carre', 'triangle', 'losange', 'etoile', 'fleche'];
export const REMPLISSAGES = ['plein', 'vide', 'hachure'];

// Positions des points placés sur le pourtour d'une case (utilisés par la règle de superposition).
export const POSITIONS_MARQUES = ['n', 'ne', 'e', 'se', 's', 'so', 'o', 'no'];

// Plus petite rotation (en degrés) qui laisse la forme visuellement inchangée.
// cercle : n'importe laquelle ; flèche : aucune (360).
export const PERIODE_SYMETRIE = {
  cercle: 0,
  carre: 90,
  triangle: 120,
  losange: 180,
  etoile: 72,
  fleche: 360,
};

/** Ramène une rotation à sa valeur canonique compte tenu de la symétrie de la forme. */
export function normaliserRotation(forme, rotation) {
  const periode = PERIODE_SYMETRIE[forme];
  if (periode === 0) return 0;
  return ((rotation % periode) + periode) % periode;
}

export const trierMarques = (marques) =>
  [...new Set(marques)].sort((a, b) => POSITIONS_MARQUES.indexOf(a) - POSITIONS_MARQUES.indexOf(b));

/**
 * Clé d'une case : deux cases visuellement identiques ont la même clé
 * (la rotation est normalisée selon la symétrie de la forme).
 */
export function cleCase(c) {
  return [
    c.forme,
    c.nombre,
    c.remplissage,
    normaliserRotation(c.forme, c.rotation),
    trierMarques(c.marques).join('+'),
  ].join('|');
}

/** Message si l'objet n'est pas une description de case valide, sinon null. */
export function defautDeCase(c) {
  if (c === null || typeof c !== 'object') return 'description de case attendue';
  if (!FORMES.includes(c.forme)) return `forme inconnue : ${c.forme}`;
  if (!Number.isInteger(c.nombre) || c.nombre < 1 || c.nombre > 4) return 'nombre d’éléments attendu entre 1 et 4';
  if (!REMPLISSAGES.includes(c.remplissage)) return `remplissage inconnu : ${c.remplissage}`;
  if (!Number.isInteger(c.rotation)) return 'rotation entière attendue (degrés)';
  if (!Array.isArray(c.marques) || !c.marques.every((m) => POSITIONS_MARQUES.includes(m))) {
    return 'marques : positions du pourtour attendues';
  }
  return null;
}

/** Clé d'une grille de suite de figures (l'ordre des marqueurs ne compte pas). */
export function cleGrille(g) {
  const marqueurs = g.marqueurs
    .map((m) => `${m.forme}:${m.remplissage}:${m.ligne}:${m.colonne}`)
    .sort()
    .join(',');
  return `${g.taille}#${marqueurs}`;
}

export function defautDeGrille(g) {
  if (g === null || typeof g !== 'object') return 'description de grille attendue';
  if (g.taille !== 2 && g.taille !== 3) return 'taille 2 ou 3 attendue';
  if (!Array.isArray(g.marqueurs) || g.marqueurs.length === 0) return 'au moins un marqueur attendu';
  const cases = new Set();
  for (const m of g.marqueurs) {
    if (!FORMES.includes(m.forme)) return `forme inconnue : ${m.forme}`;
    if (!REMPLISSAGES.includes(m.remplissage)) return `remplissage inconnu : ${m.remplissage}`;
    const dedans = [m.ligne, m.colonne].every((x) => Number.isInteger(x) && x >= 0 && x < g.taille);
    if (!dedans) return 'marqueur hors de la grille';
    cases.add(`${m.ligne}:${m.colonne}`);
  }
  if (cases.size !== g.marqueurs.length) return 'deux marqueurs dans la même case';
  if (new Set(g.marqueurs.map((m) => m.forme)).size !== g.marqueurs.length) return 'deux marqueurs de même forme';
  return null;
}
