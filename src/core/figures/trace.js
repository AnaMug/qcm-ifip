// Calcul du tracé d'une figure : transforme une description (donnée) en une liste de
// primitives géométriques simples. JavaScript pur : ni React, ni DOM, ni SVG.
// src/ui/Figure.jsx se contente de dessiner ces primitives ; un portage React Native
// (react-native-svg) réutilise ce fichier tel quel.
//
// Primitives produites :
//   { type: 'rect', x, y, largeur, hauteur, epaisseur }
//   { type: 'polygone', points: [[x, y], …], remplissage }      remplissage : plein | vide | hachure
//   { type: 'cercle', cx, cy, r, remplissage }
//   { type: 'texte', x, y, taille, texte }

const RADIANS = Math.PI / 180;
const arrondir = (x) => Math.round(x * 100) / 100;

// Contours des formes, dans un repère centré, pour un rayon de 1, rotation nulle (pointe en haut).
function contour(forme) {
  const polaire = (angle, rayon = 1) => [rayon * Math.cos(angle * RADIANS), rayon * Math.sin(angle * RADIANS)];
  switch (forme) {
    case 'carre':
      return [-135, -45, 45, 135].map((a) => polaire(a));
    case 'triangle': // équilatéral
      return [-90, 30, 150].map((a) => polaire(a));
    case 'losange': // nettement plus haut que large, pour ne pas ressembler à un carré tourné de 45°
      return [
        [0, -1.1],
        [0.5, 0],
        [0, 1.1],
        [-0.5, 0],
      ];
    case 'etoile': // 5 branches
      return Array.from({ length: 10 }, (_, i) => polaire(-90 + i * 36, i % 2 === 0 ? 1.1 : 0.45));
    case 'fleche': // pointe vers le haut
      return [
        [0, -1.1],
        [0.7, -0.15],
        [0.25, -0.15],
        [0.25, 1.05],
        [-0.25, 1.05],
        [-0.25, -0.15],
        [-0.7, -0.15],
      ];
    default:
      return null; // cercle
  }
}

/** Une forme centrée en (cx, cy), de rayon r, tournée de `rotation` degrés dans le sens horaire. */
export function tracerForme(forme, cx, cy, r, rotation, remplissage) {
  if (forme === 'cercle') return { type: 'cercle', cx: arrondir(cx), cy: arrondir(cy), r: arrondir(r * 0.95), remplissage };
  const cos = Math.cos(rotation * RADIANS);
  const sin = Math.sin(rotation * RADIANS);
  // Axe y vers le bas : cette rotation est bien dans le sens horaire à l'écran.
  const points = contour(forme).map(([x, y]) => [
    arrondir(cx + r * (x * cos - y * sin)),
    arrondir(cy + r * (x * sin + y * cos)),
  ]);
  return { type: 'polygone', points, remplissage };
}

// Disposition des éléments dans une case selon leur nombre : centres (en fraction du côté) et rayon.
const DISPOSITIONS = {
  1: { rayon: 0.2, centres: [[0, 0]] },
  2: { rayon: 0.125, centres: [[-0.16, 0], [0.16, 0]] },
  3: { rayon: 0.115, centres: [[0, -0.15], [-0.16, 0.13], [0.16, 0.13]] },
  4: { rayon: 0.11, centres: [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]] },
};

const DECALAGE_MARQUES = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  so: [-1, 1],
  o: [-1, 0],
  no: [-1, -1],
};

/** Contenu d'une case de matrice dont le coin supérieur gauche est (x, y). */
export function tracerCase(c, x, y, cote) {
  const cx = x + cote / 2;
  const cy = y + cote / 2;
  const { rayon, centres } = DISPOSITIONS[c.nombre];
  const primitives = centres.map(([dx, dy]) =>
    tracerForme(c.forme, cx + dx * cote, cy + dy * cote, rayon * cote, c.rotation, c.remplissage),
  );
  for (const marque of c.marques) {
    const [dx, dy] = DECALAGE_MARQUES[marque];
    primitives.push({
      type: 'cercle',
      cx: arrondir(cx + dx * 0.4 * cote),
      cy: arrondir(cy + dy * 0.4 * cote),
      r: arrondir(0.05 * cote),
      remplissage: 'plein',
    });
  }
  return primitives;
}

const cadre = (x, y, cote, epaisseur) => ({ type: 'rect', x, y, largeur: cote, hauteur: cote, epaisseur });
const pointInterrogation = (x, y, cote) => ({
  type: 'texte',
  x: x + cote / 2,
  y: y + cote / 2,
  taille: arrondir(cote * 0.45),
  texte: '?',
});

/** Carré découpé en taille × taille, avec ses marqueurs. */
export function tracerGrille(g, x, y, cote) {
  const pas = cote / g.taille;
  const primitives = [];
  for (let r = 0; r < g.taille; r += 1) {
    for (let c = 0; c < g.taille; c += 1) primitives.push(cadre(x + c * pas, y + r * pas, pas, 1));
  }
  primitives.push(cadre(x, y, cote, 2));
  for (const m of g.marqueurs) {
    primitives.push(
      tracerForme(m.forme, x + (m.colonne + 0.5) * pas, y + (m.ligne + 0.5) * pas, pas * 0.3, 0, m.remplissage),
    );
  }
  return primitives;
}

const MARGE = 2;

/**
 * Tracé complet d'une figure ou d'un choix.
 * @returns {{ largeur: number, hauteur: number, primitives: object[] }}
 */
export function tracerFigure(figure) {
  if (figure.kind === 'matrice') {
    const cote = 84;
    const primitives = [];
    figure.cases.forEach((ligne, r) => {
      ligne.forEach((c, col) => {
        const x = MARGE + col * cote;
        const y = MARGE + r * cote;
        primitives.push(cadre(x, y, cote, 1.5));
        if (c === null) primitives.push(pointInterrogation(x, y, cote));
        else primitives.push(...tracerCase(c, x, y, cote));
      });
    });
    return {
      largeur: figure.colonnes * cote + 2 * MARGE,
      hauteur: figure.lignes * cote + 2 * MARGE,
      primitives,
    };
  }
  if (figure.kind === 'suite') {
    const cote = 90;
    const ecart = 14;
    const primitives = [];
    figure.etapes.forEach((g, i) => primitives.push(...tracerGrille(g, MARGE + i * (cote + ecart), MARGE, cote)));
    const xDernier = MARGE + figure.etapes.length * (cote + ecart);
    primitives.push(cadre(xDernier, MARGE, cote, 2), pointInterrogation(xDernier, MARGE, cote));
    return { largeur: xDernier + cote + MARGE, hauteur: cote + 2 * MARGE, primitives };
  }
  if (figure.kind === 'grille') {
    const cote = 90;
    return { largeur: cote + 2 * MARGE, hauteur: cote + 2 * MARGE, primitives: tracerGrille(figure, MARGE, MARGE, cote) };
  }
  // kind === 'case' : un choix de réponse pour une matrice
  const cote = 84;
  return {
    largeur: cote + 2 * MARGE,
    hauteur: cote + 2 * MARGE,
    primitives: [cadre(MARGE, MARGE, cote, 1.5), ...tracerCase(figure, MARGE, MARGE, cote)],
  };
}
