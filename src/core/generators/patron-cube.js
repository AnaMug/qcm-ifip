// Générateur « patron_cube » : faces opposées (niveau 1), cube obtenu à partir d'un patron avec
// des motifs sans orientation (niveau 2) ou orientés (niveau 3).
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestion, assemblerQuestionFigure, creerGenerateur } from './commun.js';
import { PATRONS, presenterPatron, sontVoisines } from '../cube/patrons.js';
import { FACES_VISIBLES, OPPOSEE, scalaire } from '../cube/reperes.js';
import { controlerCube, lireCube, pairesOpposees, plierParRoulement, rotationsDuCube, tournerReperes } from '../cube/pliage.js';
import { plierGeometriquement, vuesDuCube } from '../cube/pliage-geometrique.js';
import {
  MOTIFS,
  MOTIFS_ORIENTES,
  MOTIFS_SANS_ORIENTATION,
  cleCube,
  defautDeCube,
  normaliserFace,
} from '../cube/motifs.js';

const TYPE = 'patron_cube';
const VERSION = 1;
const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];
const NOMS_VISIBLES = { haut: 'du dessus', avant: 'de devant', droite: 'de droite' };

function tirerPatron(alea) {
  return presenterPatron(alea.choisir(PATRONS), alea.entier(0, 7));
}

// ---------------------------------------------------------------- niveau 1 : face opposée

function construireOpposee(seed, niveau, alea) {
  const etiquettes = alea.melanger(LETTRES);
  const cellules = tirerPatron(alea).map((c, i) => ({ ...c, etiquette: etiquettes[i] }));
  const reperes = plierParRoulement(cellules);
  const x = alea.entier(0, 5);
  const opposee = reperes.findIndex((r) => scalaire(r.n, reperes[x].n) === -1);
  const lettre = (i) => cellules[i].etiquette;

  // Les 4 autres faces touchent toutes la face X sur le cube : ce sont les distracteurs possibles.
  const pieges = cellules
    .map((_, i) => i)
    .filter((i) => i !== x && i !== opposee)
    .map((i) => ({
      texte: lettre(i),
      erreur: sontVoisines(cellules, x, i)
        ? `la face ${lettre(i)} touche la face ${lettre(x)} sur le patron : deux faces qui se touchent ne sont jamais opposées`
        : `une fois le cube plié, la face ${lettre(i)} partage une arête avec la face ${lettre(x)}`,
    }));

  const paires = pairesOpposees(reperes).map(([i, j]) => `${lettre(i)} et ${lettre(j)}`).join(', ');
  return assemblerQuestion({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: `Ce patron est plié pour former un cube. Quelle face est opposée à la face ${lettre(x)} ?`,
    bonne: lettre(opposee),
    pieges,
    comparer: (a, b) => a.localeCompare(b),
    explication: `Une fois le patron plié, les faces opposées sont : ${paires}. La face opposée à ${lettre(x)} est donc ${lettre(opposee)}.`,
    figure: { kind: 'patron', cellules },
    alea,
  });
}

// ---------------------------------------------------------------- niveaux 2 et 3 : quel cube ?

function construireCube(seed, niveau, alea) {
  const oriente = niveau === 3;
  const motifs = alea.melanger(oriente ? MOTIFS_ORIENTES : MOTIFS_SANS_ORIENTATION);
  const cellules = tirerPatron(alea).map((c, i) => ({
    ...c,
    motif: motifs[i],
    // Au niveau 3, chaque motif orienté est posé sur le patron dans une orientation tirée par la graine.
    rotation: MOTIFS[motifs[i]].periode === 360 ? alea.entier(0, 3) * 90 : 0,
  }));
  const reperes = plierParRoulement(cellules);

  // Les 24 orientations réelles du cube plié.
  const orientations = rotationsDuCube().map((m) => lireCube(tournerReperes(reperes, m), cellules));
  const face = ({ indice, rotation }) => normaliserFace({ motif: cellules[indice].motif, rotation, miroir: false });
  const le = (f) => MOTIFS[f.motif].le;

  const bonneVue = alea.choisir(orientations);
  const cubeDe = (faces) => ({ kind: 'cube', faces });
  const visibles = (vue) => Object.fromEntries(FACES_VISIBLES.map((f) => [f, face(vue[f])]));
  const bonne = cubeDe(visibles(bonneVue));

  // Chaque distracteur part d'une vraie orientation du cube, tirée par la graine, et y introduit
  // UNE erreur. Les 4 cubes ne montrent donc pas tous les mêmes faces.
  const fabriques = {
    echange(vue) {
      const [a, b] = alea.melanger(FACES_VISIBLES);
      const faces = visibles(vue);
      [faces[a], faces[b]] = [faces[b], faces[a]];
      return { faces, erreur: `faces ${NOMS_VISIBLES[a]} et ${NOMS_VISIBLES[b]} échangées : c’est le cube vu dans un miroir` };
    },
    opposees(vue) {
      const [a, b] = alea.melanger(FACES_VISIBLES);
      const faces = visibles(vue);
      const cachee = face(vue[OPPOSEE[a]]);
      faces[b] = cachee;
      return { faces, erreur: `${le(faces[a])} et ${le(cachee)} sont sur des faces opposées : ils ne peuvent pas se toucher` };
    },
    mauvaisCote(vue) {
      const a = alea.choisir(FACES_VISIBLES);
      const faces = visibles(vue);
      const reelle = faces[a];
      faces[a] = face(vue[OPPOSEE[a]]);
      return { faces, erreur: `${le(faces[a])} est montré à la place de ${le(reelle)}, qui est sur la face opposée` };
    },
    rotation(vue) {
      const faces = visibles(vue);
      const candidates = FACES_VISIBLES.filter((f) => MOTIFS[faces[f].motif].periode === 360);
      if (candidates.length === 0) return null;
      const a = alea.choisir(candidates);
      const angle = alea.choisir([90, 180, 270]);
      faces[a] = { ...faces[a], rotation: (faces[a].rotation + angle) % 360 };
      return { faces, erreur: `${le(faces[a])} est tourné de ${angle}° par rapport à sa vraie position` };
    },
    miroir(vue) {
      const faces = visibles(vue);
      const candidates = FACES_VISIBLES.filter((f) => MOTIFS[faces[f].motif].chiral);
      if (candidates.length === 0) return null;
      const a = alea.choisir(candidates);
      faces[a] = { ...faces[a], miroir: true };
      return { faces, erreur: `${le(faces[a])} est dessiné en miroir` };
    },
  };
  const categories = oriente
    ? ['rotation', 'miroir', 'echange', 'opposees', 'rotation', 'mauvaisCote']
    : ['echange', 'opposees', 'mauvaisCote', 'echange', 'opposees', 'mauvaisCote'];
  const pieges = [];
  for (const categorie of alea.melanger(categories)) {
    for (let essai = 0; essai < 6; essai += 1) {
      const resultat = fabriques[categorie](alea.choisir(orientations));
      if (resultat !== null) {
        pieges.push({ valeur: cubeDe(resultat.faces), erreur: resultat.erreur });
        break;
      }
    }
  }

  const paires = pairesOpposees(reperes)
    .map(([i, j]) => `${MOTIFS[cellules[i].motif].le} et ${MOTIFS[cellules[j].motif].le}`)
    .join(' ; ');
  return assemblerQuestionFigure({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: oriente
      ? 'Lequel de ces cubes peut être obtenu avec ce patron ? L’orientation de chaque motif doit être respectée.'
      : 'Lequel de ces cubes peut être obtenu avec ce patron ?',
    figure: { kind: 'patron', cellules },
    bonne,
    pieges,
    cle: cleCube,
    explication:
      `Une fois le patron plié, les faces opposées sont : ${paires}. Deux faces opposées ne sont jamais visibles ensemble. ` +
      `Le bon cube montre trois faces qui se touchent deux à deux, disposées dans le même ordre autour du sommet que sur le patron` +
      `${oriente ? ', chaque motif gardant son orientation par rapport aux faces voisines' : ''} : ` +
      `${FACES_VISIBLES.map((f) => `${le(bonne.faces[f])} ${{ haut: 'dessus', avant: 'devant', droite: 'à droite' }[f]}`).join(', ')}.`,
    alea,
  });
}

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  return niveau === 1 ? construireOpposee(seed, niveau, alea) : construireCube(seed, niveau, alea);
}

/**
 * Méthode indépendante : le patron est replié géométriquement (rotation de points autour des
 * arêtes, pliage-geometrique.js), puis chaque choix est comparé aux 24 vues possibles du cube.
 */
function resoudre(question) {
  const { figure } = question;
  if (figure.kind !== 'patron' || !Array.isArray(figure.cellules) || figure.cellules.length !== 6) {
    throw new Error('patron de 6 cases attendu');
  }
  const { cellules } = figure;
  const reperes = plierGeometriquement(cellules);
  const defauts = controlerCube(reperes);
  if (defauts.length > 0) throw new Error(`le patron ne se plie pas en cube : ${defauts.join(' ; ')}`);

  // Niveau 1 : choix en texte, face opposée à la face nommée dans l'énoncé.
  if (typeof question.choix[0] === 'string') {
    const lu = /opposée à la face ([A-F]) \?$/.exec(question.enonce);
    if (lu === null) throw new Error('énoncé illisible');
    const x = cellules.findIndex((c) => c.etiquette === lu[1]);
    if (x === -1) throw new Error(`face ${lu[1]} absente du patron`);
    const opposee = reperes.findIndex((r) => scalaire(r.n, reperes[x].n) === -1);
    const etiquettes = cellules.map((c) => c.etiquette);
    if (new Set(etiquettes).size !== 6) throw new Error('étiquettes en double sur le patron');
    return {
      accepte: (texte) => texte === cellules[opposee].etiquette,
      cle: (texte) => texte,
      controle: (texte) => (etiquettes.includes(texte) && texte !== lu[1] ? null : 'face du patron attendue, autre que la face de l’énoncé'),
    };
  }

  // Niveaux 2 et 3 : un cube est possible s'il coïncide avec l'une des 24 vues du cube plié.
  if (new Set(cellules.map((c) => c.motif)).size !== 6) throw new Error('motifs en double sur le patron');
  const vuesPossibles = new Set(
    vuesDuCube(reperes, cellules).map((vue) =>
      cleCube({
        faces: Object.fromEntries(
          FACES_VISIBLES.map((f) => [f, { motif: cellules[vue[f].indice].motif, rotation: vue[f].rotation, miroir: false }]),
        ),
      }),
    ),
  );
  const motifsDuPatron = cellules.map((c) => c.motif);
  return {
    accepte: (choix) => defautDeCube(choix) === null && vuesPossibles.has(cleCube(choix)),
    // Clé visuelle : rotation ramenée à la symétrie du motif, miroir ignoré pour un motif symétrique.
    cle: (choix) => (defautDeCube(choix) === null ? cleCube(choix) : JSON.stringify(choix)),
    controle: (choix) => {
      const defaut = defautDeCube(choix);
      if (defaut) return defaut;
      return FACES_VISIBLES.every((f) => motifsDuPatron.includes(choix.faces[f].motif)) ? null : 'motif absent du patron';
    },
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Patron de cube',
  construire,
  resoudre,
});
