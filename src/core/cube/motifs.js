// Motifs dessinés sur les faces du cube : géométrie, symétries, comparaison. JavaScript pur.
//
// Un motif est une liste de polygones dans un repère centré ([-1, 1] × [-1, 1], y vers le haut).
// Une face affichée vaut { motif, rotation, miroir } : le motif est d'abord retourné
// (gauche-droite, si miroir), puis tourné de `rotation` degrés dans le sens horaire.

const rectangle = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
const disque = (cx, cy, r, de = 0, a = 360) => {
  const n = Math.round((a - de) / 15);
  return Array.from({ length: n + (a - de === 360 ? 0 : 1) }, (_, i) => {
    const angle = ((de + (i * (a - de)) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
};
const plein = (points) => ({ points, remplissage: 'plein' });
const vide = (points) => ({ points, remplissage: 'vide' });

// periode : plus petite rotation qui laisse le motif inchangé (0 : toute rotation).
// chiral : vrai si le motif en miroir ne peut être obtenu par aucune rotation.
export const MOTIFS = {
  disque: { le: 'le disque', periode: 0, chiral: false, formes: [plein(disque(0, 0, 0.55))] },
  anneau: { le: 'l’anneau', periode: 0, chiral: false, formes: [plein(disque(0, 0, 0.6)), vide(disque(0, 0, 0.36))] },
  vide: { le: 'la face vide', periode: 0, chiral: false, formes: [] },
  carre: { le: 'le carré', periode: 90, chiral: false, formes: [plein(rectangle(-0.5, -0.5, 0.5, 0.5))] },
  croix: {
    le: 'la croix',
    periode: 90,
    chiral: false,
    formes: [plein(rectangle(-0.65, -0.17, 0.65, 0.17)), plein(rectangle(-0.17, -0.65, 0.17, 0.65))],
  },
  points: {
    le: 'les quatre points',
    periode: 90,
    chiral: false,
    formes: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => plein(disque(0.38 * x, 0.38 * y, 0.19))),
  },
  fleche: {
    le: 'la flèche',
    periode: 360,
    chiral: false,
    formes: [plein([[0, 0.7], [0.5, 0.05], [0.18, 0.05], [0.18, -0.7], [-0.18, -0.7], [-0.18, 0.05], [-0.5, 0.05]])],
  },
  demi_disque: { le: 'le demi-disque', periode: 360, chiral: false, formes: [plein(disque(0, -0.3, 0.65, 0, 180))] },
  F: {
    le: 'la lettre F',
    periode: 360,
    chiral: true,
    formes: [plein(rectangle(-0.4, -0.65, -0.12, 0.65)), plein(rectangle(-0.4, 0.37, 0.48, 0.65)), plein(rectangle(-0.4, -0.12, 0.28, 0.14))],
  },
  L: {
    le: 'la lettre L',
    periode: 360,
    chiral: true,
    formes: [plein(rectangle(-0.4, -0.65, -0.12, 0.65)), plein(rectangle(-0.4, -0.65, 0.48, -0.37))],
  },
  R: {
    le: 'la lettre R',
    periode: 360,
    chiral: true,
    formes: [
      plein(rectangle(-0.42, -0.65, -0.16, 0.65)),
      plein(rectangle(-0.42, 0.41, 0.3, 0.65)),
      plein(rectangle(-0.42, -0.05, 0.3, 0.19)),
      plein(rectangle(0.2, 0.05, 0.46, 0.55)),
      plein([[-0.02, -0.05], [0.26, -0.05], [0.5, -0.65], [0.22, -0.65]]),
    ],
  },
};

export const MOTIFS_SANS_ORIENTATION = ['disque', 'anneau', 'vide', 'carre', 'croix', 'points'];
export const MOTIFS_ORIENTES = ['fleche', 'demi_disque', 'F', 'L', 'R', 'disque'];

/** Forme canonique d'une face : deux faces visuellement identiques ont la même. */
export function normaliserFace(face) {
  const motif = MOTIFS[face.motif];
  const rotation = motif.periode === 0 ? 0 : (((face.rotation ?? 0) % motif.periode) + motif.periode) % motif.periode;
  return { motif: face.motif, rotation, miroir: motif.chiral ? Boolean(face.miroir) : false };
}

export const cleFace = (face) => {
  const f = normaliserFace(face);
  return `${f.motif}@${f.rotation}${f.miroir ? 'm' : ''}`;
};

/** Clé d'un cube vu en perspective (faces haut, avant, droite). */
export const cleCube = (cube) => ['haut', 'avant', 'droite'].map((f) => cleFace(cube.faces[f])).join('|');

export function defautDeCube(cube) {
  if (cube === null || typeof cube !== 'object' || cube.kind !== 'cube' || !cube.faces) return 'description de cube attendue';
  for (const nom of ['haut', 'avant', 'droite']) {
    const face = cube.faces[nom];
    if (!face || !MOTIFS[face.motif]) return `face « ${nom} » : motif inconnu`;
    if (![0, 90, 180, 270].includes(face.rotation)) return `face « ${nom} » : rotation 0, 90, 180 ou 270 attendue`;
    if (typeof face.miroir !== 'boolean') return `face « ${nom} » : champ miroir attendu`;
  }
  return null;
}

/** Points d'un motif après retournement éventuel et rotation horaire, toujours dans [-1, 1]². */
export function formesDeFace(face) {
  const angle = ((face.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return MOTIFS[face.motif].formes.map(({ points, remplissage }) => ({
    remplissage,
    points: points.map(([x, y]) => {
      const mx = face.miroir ? -x : x;
      return [mx * cos + y * sin, -mx * sin + y * cos];
    }),
  }));
}

/** Ex. : « la lettre F tournée de 90° ». */
export function decrireFace(face) {
  const f = normaliserFace(face);
  let texte = MOTIFS[f.motif].le;
  if (f.rotation !== 0) texte += ` (rotation de ${f.rotation}°)`;
  if (f.miroir) texte += ' en miroir';
  return texte;
}
