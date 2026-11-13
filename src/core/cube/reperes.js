// Repères du cube et petits outils vectoriels. JavaScript pur : ni React, ni DOM.
//
// Axes : x vers la droite, y vers le haut, z vers l'observateur (repère direct).
// Chaque face a une normale sortante et un repère de lecture « vu de l'extérieur » :
// `droite` et `haut` indiquent où sont la droite et le haut du motif quand sa rotation vaut 0.
// Pour toutes les faces : droite × haut = normale. C'est la convention commune au générateur,
// à la vérification et au dessin (elle coïncide avec celle d'un cube CSS 3D classique).

export const FACES = ['haut', 'bas', 'avant', 'arriere', 'droite', 'gauche'];
export const FACES_VISIBLES = ['haut', 'avant', 'droite'];

export const OPPOSEE = {
  haut: 'bas',
  bas: 'haut',
  avant: 'arriere',
  arriere: 'avant',
  droite: 'gauche',
  gauche: 'droite',
};

export const REPERES = {
  haut: { n: [0, 1, 0], droite: [1, 0, 0], haut: [0, 0, -1] },
  bas: { n: [0, -1, 0], droite: [1, 0, 0], haut: [0, 0, 1] },
  avant: { n: [0, 0, 1], droite: [1, 0, 0], haut: [0, 1, 0] },
  arriere: { n: [0, 0, -1], droite: [-1, 0, 0], haut: [0, 1, 0] },
  droite: { n: [1, 0, 0], droite: [0, 0, -1], haut: [0, 1, 0] },
  gauche: { n: [-1, 0, 0], droite: [0, 0, 1], haut: [0, 1, 0] },
};

export const NOMS_FACES = {
  haut: 'dessus',
  bas: 'dessous',
  avant: 'devant',
  arriere: 'derrière',
  droite: 'à droite',
  gauche: 'à gauche',
};

export const plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const fois = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const oppose = (a) => fois(a, -1);
export const scalaire = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vectoriel = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const egaux = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Angle (0, 90, 180 ou 270°, sens horaire vu de l'extérieur) d'un vecteur « haut du motif »
 * par rapport au repère de lecture (droite, haut) d'une face.
 */
export function angleDansLeRepere(hautDuMotif, droite, haut) {
  const versLeHaut = scalaire(hautDuMotif, haut);
  const versLaDroite = scalaire(hautDuMotif, droite);
  if (versLeHaut === 1) return 0;
  if (versLaDroite === 1) return 90;
  if (versLeHaut === -1) return 180;
  if (versLaDroite === -1) return 270;
  throw new Error('vecteur hors du plan de la face');
}

/** Vecteur « haut du motif » d'une case dont le motif est tourné de `rotation` sur le patron. */
export function hautDuMotif(repere, rotation) {
  const r = ((rotation % 360) + 360) % 360;
  if (r === 0) return repere.v;
  if (r === 90) return repere.u;
  if (r === 180) return oppose(repere.v);
  if (r === 270) return oppose(repere.u);
  throw new Error(`rotation de motif non prise en charge : ${rotation}`);
}
