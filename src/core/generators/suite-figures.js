// Générateur « suite_figures » : un carré découpé en 2 × 2 ou 3 × 3 dans lequel un ou deux
// marqueurs se déplacent d'un pas constant. La figure et les choix sont des descriptions.
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestionFigure, creerGenerateur } from './commun.js';
import { cleGrille, defautDeGrille } from '../figures/formes.js';
import { NOMS_FORMES, NOMS_REMPLISSAGES, accorder, decrirePosition } from '../figures/description.js';

const TYPE = 'suite_figures';
const VERSION = 1;
const NOMBRES = { 3: 'trois', 4: 'quatre' };
const FORMES_MARQUEURS = ['cercle', 'carre', 'triangle', 'etoile'];

// Parcours possibles, en numéros de case (ligne × taille + colonne).
// pourtour : cases du bord dans le sens horaire, en partant du coin supérieur gauche.
const POURTOUR = { 2: [0, 1, 3, 2], 3: [0, 1, 2, 5, 8, 7, 6, 3] };
const parcours = (genre, taille) =>
  genre === 'pourtour' ? POURTOUR[taille] : Array.from({ length: taille * taille }, (_, i) => i);
const modulo = (x, n) => ((x % n) + n) % n;

// etapes : nombre de figures données ; mouvements : [genre, pas possibles] ; alternance du remplissage possible.
const PAR_NIVEAU = {
  1: { tailles: [2, 3], marqueurs: 1, etapes: [3], alternance: false, mouvements: [['pourtour', [1, -1]]] },
  2: {
    tailles: [3],
    marqueurs: 1,
    etapes: [3, 4],
    alternance: true,
    mouvements: [
      ['pourtour', [2, -2, 3, -3]],
      ['lecture', [1, 2, 4]],
    ],
  },
  3: {
    tailles: [3],
    marqueurs: 2,
    etapes: [4],
    alternance: true,
    mouvements: [
      ['pourtour', [1, -1, 2, -2, 3, -3]],
      ['lecture', [1, 2, 4]],
    ],
  },
};

/** Position et remplissage d'un marqueur à l'étape t. */
function etat(marqueur, taille, t, pas = marqueur.pas) {
  const chemin = parcours(marqueur.genre, taille);
  const numero = chemin[modulo(marqueur.depart + pas * t, chemin.length)];
  return {
    forme: marqueur.forme,
    remplissage: marqueur.remplissages[t % marqueur.remplissages.length],
    ligne: Math.floor(numero / taille),
    colonne: numero % taille,
  };
}

const grilleDe = (taille, marqueurs) => ({ kind: 'grille', taille, marqueurs });

function decrireMouvement(m, taille) {
  const { le } = NOMS_FORMES[m.forme];
  const sujet = le[0].toUpperCase() + le.slice(1);
  const n = Math.abs(m.pas);
  const cases = `${n} case${n > 1 ? 's' : ''}`;
  let texte;
  if (m.genre === 'pourtour') {
    const ou = taille === 2 ? 'en tournant dans le carré' : 'en suivant le pourtour du carré';
    texte = `${sujet} se déplace de ${cases} à chaque figure dans le sens ${m.pas > 0 ? 'horaire' : 'antihoraire'}, ${ou}.`;
  } else {
    texte = `${sujet} avance de ${cases} à chaque figure dans le sens de la lecture (de gauche à droite, puis à la ligne suivante ; après la dernière case, on repart de la première).`;
  }
  if (m.remplissages.length > 1) {
    texte += ` Son remplissage alterne : ${m.remplissages.map((r) => NOMS_REMPLISSAGES[r]).join(', ')}, et ainsi de suite.`;
  }
  return texte;
}

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const reglage = PAR_NIVEAU[niveau];
  const taille = alea.choisir(reglage.tailles);
  const nbEtapes = alea.choisir(reglage.etapes);
  const formes = alea.melanger(FORMES_MARQUEURS).slice(0, reglage.marqueurs);

  const marqueurs = formes.map((forme) => {
    const [genre, pasPossibles] = alea.choisir(reglage.mouvements);
    const alterne = reglage.alternance && alea.booleen();
    const remplissages = alterne ? alea.melanger(['plein', 'vide', 'hachure']).slice(0, 2) : [alea.choisir(['plein', 'vide', 'hachure'])];
    return {
      forme,
      genre,
      pas: alea.choisir(pasPossibles),
      depart: alea.entier(0, parcours(genre, taille).length - 1),
      remplissages,
    };
  });

  const sansCollision = (liste) => new Set(liste.map((m) => `${m.ligne}:${m.colonne}`)).size === liste.length;
  const etapes = [];
  for (let t = 0; t <= nbEtapes; t += 1) {
    const liste = marqueurs.map((m) => etat(m, taille, t));
    if (!sansCollision(liste)) return null; // deux marqueurs dans la même case : graine suivante
    etapes.push(liste);
  }
  const attendus = etapes[nbEtapes];
  const derniers = etapes[nbEtapes - 1];

  // Distracteurs : une erreur typique sur UN marqueur, les autres étant à leur place.
  const pieges = [];
  marqueurs.forEach((m, i) => {
    const { le } = NOMS_FORMES[m.forme];
    const nom = marqueurs.length > 1 ? ` (${le})` : '';
    const remplacer = (nouveau) => attendus.map((a, j) => (j === i ? { ...a, ...nouveau } : a));
    const position = (e) => ({ ligne: e.ligne, colonne: e.colonne });
    const autreGenre = m.genre === 'pourtour' ? 'lecture' : 'pourtour';
    const cheminAutre = parcours(autreGenre, taille);
    const numeroDernier = derniers[i].ligne * taille + derniers[i].colonne;
    const erreurs = [
      { e: position(derniers[i]), erreur: `marqueur resté à sa place${nom}` },
      { e: position(etat(m, taille, nbEtapes + 1)), erreur: `déplacement appliqué deux fois${nom}` },
      { e: position(etat({ ...m, depart: m.depart + m.pas * (nbEtapes - 1) }, taille, 1, -m.pas)), erreur: `déplacement dans le mauvais sens${nom}` },
      { e: position(etat({ ...m, depart: m.depart + m.pas * nbEtapes }, taille, 1, 1)), erreur: `une case de trop${nom}` },
      { e: position(etat({ ...m, depart: m.depart + m.pas * nbEtapes }, taille, 1, -1)), erreur: `une case de moins${nom}` },
    ];
    if (cheminAutre.includes(numeroDernier)) {
      const suivant = cheminAutre[modulo(cheminAutre.indexOf(numeroDernier) + m.pas, cheminAutre.length)];
      erreurs.push({
        e: { ligne: Math.floor(suivant / taille), colonne: suivant % taille },
        erreur:
          m.genre === 'pourtour'
            ? `déplacement compté dans le sens de la lecture au lieu du pourtour${nom}`
            : `déplacement compté sur le pourtour au lieu du sens de la lecture${nom}`,
      });
    }
    if (m.remplissages.length > 1) {
      erreurs.push({ e: { remplissage: derniers[i].remplissage }, erreur: `bonne case, mais remplissage non alterné${nom}` });
    }
    for (const { e, erreur } of erreurs) {
      const liste = remplacer(e);
      if (sansCollision(liste)) pieges.push({ valeur: grilleDe(taille, liste), erreur });
    }
  });

  const bonne = grilleDe(taille, attendus);
  const conclusion = attendus
    .map((a) => {
      const f = NOMS_FORMES[a.forme];
      return `${f.le} ${accorder(a.remplissage, f.feminin, false)} se trouve ${decrirePosition(a)}`;
    })
    .join(' et ');

  return assemblerQuestionFigure({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: `Quelle figure fait suite aux ${NOMBRES[nbEtapes]} premiers carrés ?`,
    figure: { kind: 'suite', etapes: etapes.slice(0, nbEtapes).map((liste) => grilleDe(taille, liste)) },
    bonne,
    pieges: alea.melanger(pieges),
    cle: cleGrille,
    explication: `${marqueurs.map((m) => decrireMouvement(m, taille)).join(' ')} Dans la figure suivante, ${conclusion}.`,
    alea,
  });
}

/** Cases où le marqueur peut se trouver ensuite, selon toutes les hypothèses compatibles avec les figures données. */
function casesPossibles(numeros, taille) {
  const possibles = new Set();
  for (const genre of ['pourtour', 'lecture']) {
    const chemin = parcours(genre, taille);
    const rangs = numeros.map((n) => chemin.indexOf(n));
    if (rangs.includes(-1)) continue;
    const pas = modulo(rangs[1] - rangs[0], chemin.length);
    const constant = rangs.every((r, i) => i === 0 || modulo(r - rangs[i - 1], chemin.length) === pas);
    if (constant) possibles.add(chemin[modulo(rangs[rangs.length - 1] + pas, chemin.length)]);
  }
  return possibles;
}

/** Remplissages possibles ensuite : suite constante, alternée (période 2) ou cyclique (période 3) déjà observée. */
function remplissagesPossibles(observes) {
  const possibles = new Set();
  for (let periode = 1; periode <= 3 && periode < observes.length; periode += 1) {
    const periodique = observes.every((r, i) => i < periode || r === observes[i - periode]);
    if (periodique) possibles.add(observes[observes.length - periode]);
  }
  return possibles;
}

/**
 * Méthode indépendante : on relit les figures données, on en déduit pour chaque marqueur toutes
 * les suites possibles (pourtour ou sens de la lecture, pas constant ; remplissage périodique),
 * puis on teste chaque choix contre ces règles.
 */
function resoudre(question) {
  const { figure } = question;
  if (figure.kind !== 'suite' || !Array.isArray(figure.etapes) || figure.etapes.length < 3) {
    throw new Error('suite d’au moins 3 figures attendue');
  }
  const { taille } = figure.etapes[0];
  const formes = figure.etapes[0].marqueurs.map((m) => m.forme).sort();
  for (const g of figure.etapes) {
    if (defautDeGrille(g) !== null || g.taille !== taille) throw new Error('figure illisible');
    if (g.marqueurs.map((m) => m.forme).sort().join() !== formes.join()) throw new Error('marqueurs différents d’une figure à l’autre');
  }
  const regles = formes.map((forme) => {
    const suivi = figure.etapes.map((g) => g.marqueurs.find((m) => m.forme === forme));
    return {
      forme,
      cases: casesPossibles(suivi.map((m) => m.ligne * taille + m.colonne), taille),
      remplissages: remplissagesPossibles(suivi.map((m) => m.remplissage)),
    };
  });
  return {
    accepte: (choix) =>
      defautDeGrille(choix) === null &&
      choix.taille === taille &&
      choix.marqueurs.length === formes.length &&
      regles.every((regle) => {
        const m = choix.marqueurs.find((x) => x.forme === regle.forme);
        return m !== undefined && regle.cases.has(m.ligne * taille + m.colonne) && regle.remplissages.has(m.remplissage);
      }),
    cle: (choix) => (defautDeGrille(choix) === null ? cleGrille(choix) : JSON.stringify(choix)),
    controle: (choix) => defautDeGrille(choix),
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Suite de figures',
  construire,
  resoudre,
});
