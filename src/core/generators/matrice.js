// Générateur « matrice » : grille 3 × 3 dont une case manque.
// La figure et les choix sont des descriptions ; le dessin est fait par l'interface.
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestionFigure, creerGenerateur } from './commun.js';
import {
  FORMES,
  REMPLISSAGES,
  POSITIONS_MARQUES,
  cleCase,
  defautDeCase,
  trierMarques,
} from '../figures/formes.js';
import {
  NOMS_FORMES,
  NOMS_REMPLISSAGES,
  decrireCase,
  decrireMarques,
} from '../figures/description.js';
import { attributsValides } from './regles-matrice.js';

const TYPE = 'matrice';
const VERSION = 1;
const ENONCE = 'Quelle case complète logiquement la grille ?';
const REGLES = ['nombre', 'rotation', 'forme', 'remplissage', 'superposition'];
// Formes dont une rotation de 45° ou de 90° se voit nettement.
const FORMES_ORIENTEES = ['triangle', 'fleche', 'losange'];
const modulo360 = (x) => ((x % 360) + 360) % 360;

/** Ligne et rang d'une case selon que la règle se lit par ligne ou par colonne. */
const reperer = (parLigne, r, c) => (parLigne ? [r, c] : [c, r]);
const LECTURE = {
  true: { chaque: 'sur chaque ligne, de gauche à droite', serie: 'ligne', article: 'la ligne' },
  false: { chaque: 'dans chaque colonne, de haut en bas', serie: 'colonne', article: 'la colonne' },
};

function tirerSousEnsemble(alea) {
  return trierMarques(alea.melanger(POSITIONS_MARQUES).slice(0, alea.entier(1, 3)));
}

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const actives = alea.melanger(REGLES).slice(0, niveau);
  const active = (regle) => actives.includes(regle);
  const explications = [];
  // Position de la case manquante : avec la superposition, la dernière case (celle du résultat).
  const [mr, mc] = active('superposition') ? [2, 2] : [alea.entier(0, 2), alea.entier(0, 2)];

  // --- Forme : cycle de 3 formes (chaque forme une fois par ligne et par colonne), ou forme unique.
  // Avec la superposition, pas de cercle : il se confondrait avec les points du pourtour.
  const formesPossibles = active('rotation')
    ? FORMES_ORIENTEES
    : FORMES.filter((f) => !(active('superposition') && f === 'cercle'));
  let formeDe;
  let cycleFormes = null;
  if (active('forme')) {
    cycleFormes = alea.melanger(formesPossibles).slice(0, 3);
    const decalage = alea.choisir([1, 2]);
    formeDe = (r, c) => cycleFormes[(c + decalage * r) % 3];
  } else {
    const forme = alea.choisir(formesPossibles);
    formeDe = () => forme;
  }

  // --- Remplissage : cycle des 3 remplissages, ou remplissage unique.
  let remplissageDe;
  if (active('remplissage')) {
    const cycle = alea.melanger(REMPLISSAGES);
    const decalage = alea.choisir([1, 2]);
    remplissageDe = (r, c) => cycle[(c + decalage * r) % 3];
  } else {
    const remplissage = alea.choisir(REMPLISSAGES);
    remplissageDe = () => remplissage;
  }

  // --- Nombre d'éléments : progression de 1 en 1, par ligne ou par colonne.
  let nombreDe = () => 1;
  let nombre = null;
  if (active('nombre')) {
    const parLigne = alea.booleen();
    const pas = alea.choisir([1, -1]);
    const bases = [0, 1, 2].map(() => (pas > 0 ? alea.entier(1, 2) : alea.entier(3, 4)));
    nombre = { parLigne, pas };
    nombreDe = (r, c) => {
      const [serie, rang] = reperer(parLigne, r, c);
      return bases[serie] + pas * rang;
    };
  }

  // --- Rotation constante de 45° ou 90°, par ligne ou par colonne.
  let rotationDe = () => 0;
  let rotation = null;
  if (active('rotation')) {
    const parLigne = alea.booleen();
    const formesUtilisees = cycleFormes ?? [formeDe(0, 0)];
    // Un losange tourné de 90° deux fois de suite revient à sa position : on impose 45°.
    const angle = formesUtilisees.includes('losange') ? 45 : alea.choisir([45, 90]);
    const sens = alea.choisir([1, -1]);
    const bases = [0, 1, 2].map(() => alea.entier(0, 7) * 45);
    rotation = { parLigne, angle, sens };
    rotationDe = (r, c) => {
      const [serie, rang] = reperer(parLigne, r, c);
      return modulo360(bases[serie] + sens * angle * rang);
    };
  }

  // --- Superposition : la 3e case réunit les points des deux premières, ou garde ceux présents une seule fois.
  let marquesDe = () => [];
  let superposition = null;
  if (active('superposition')) {
    const parLigne = alea.booleen();
    const reunion = alea.booleen();
    const series = [];
    for (let s = 0; s < 3; s += 1) {
      let trouve = null;
      for (let essai = 0; essai < 60 && trouve === null; essai += 1) {
        const a = tirerSousEnsemble(alea);
        const b = tirerSousEnsemble(alea);
        const communs = a.filter((m) => b.includes(m));
        const resultat = reunion
          ? trierMarques([...a, ...b])
          : trierMarques([...a.filter((m) => !b.includes(m)), ...b.filter((m) => !a.includes(m))]);
        const distincts = new Set([a.join('+'), b.join('+'), resultat.join('+')]).size === 3;
        // Les deux premières séries ont des points communs : réunion et « présents une seule fois » y diffèrent.
        if (distincts && resultat.length > 0 && (s === 2 || communs.length > 0)) trouve = [a, b, resultat];
      }
      if (trouve === null) return null;
      series.push(trouve);
    }
    superposition = { parLigne, reunion, series };
    marquesDe = (r, c) => {
      const [serie, rang] = reperer(parLigne, r, c);
      return series[serie][rang];
    };
  }

  const grille = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => ({
      forme: formeDe(r, c),
      nombre: nombreDe(r, c),
      remplissage: remplissageDe(r, c),
      rotation: rotationDe(r, c),
      marques: marquesDe(r, c),
    })),
  );
  const bonne = grille[mr][mc];
  const avec = (modification) => ({ ...bonne, ...modification });

  // --- Explication : une phrase par règle réellement utilisée.
  if (nombre) {
    explications.push(
      `Nombre d’éléments : il ${nombre.pas > 0 ? 'augmente' : 'diminue'} de 1 ${LECTURE[nombre.parLigne].chaque}.`,
    );
  }
  if (rotation) {
    explications.push(
      `Orientation : la forme tourne de ${rotation.angle}° dans le sens ${rotation.sens > 0 ? 'horaire' : 'antihoraire'} d’une case à la suivante, ${LECTURE[rotation.parLigne].chaque}.`,
    );
  }
  if (cycleFormes) {
    explications.push(
      `Formes : chaque ligne et chaque colonne contient une fois ${cycleFormes.map((f) => NOMS_FORMES[f].le).join(', ')} ; il manque ${NOMS_FORMES[bonne.forme].le}.`,
    );
  }
  if (active('remplissage')) {
    explications.push(
      `Remplissage : chaque ligne et chaque colonne contient une forme pleine, une vide et une hachurée ; il manque le remplissage ${NOMS_REMPLISSAGES[bonne.remplissage]}.`,
    );
  }
  if (superposition) {
    const lecture = LECTURE[superposition.parLigne];
    explications.push(
      superposition.reunion
        ? `Points du pourtour : dans chaque ${lecture.serie}, la troisième case réunit les points des deux premières.`
        : `Points du pourtour : dans chaque ${lecture.serie}, la troisième case ne garde que les points présents dans une seule des deux premières.`,
    );
  }

  // --- Distracteurs : chacun ne diffère de la bonne case que par UN attribut, donc viole une seule règle.
  const candidats = {
    nombre: [bonne.nombre + 1, bonne.nombre - 1, bonne.nombre + 2, bonne.nombre - 2]
      .filter((n) => n >= 1 && n <= 4)
      .map((n) => ({
        valeur: avec({ nombre: n }),
        erreur: nombre
          ? `nombre d’éléments faux : ${n} au lieu de ${bonne.nombre}`
          : `nombre d’éléments différent de celui des autres cases (${n} au lieu de ${bonne.nombre})`,
      })),
    rotation: (rotation
      ? [-1, 1, 2, -2, 3, -3, 4].map((k) => ({
          ecart: k * rotation.sens * rotation.angle,
          erreur:
            k === -1
              ? `orientation fausse : rotation de ${rotation.angle}° non appliquée`
              : k === 1
                ? `orientation fausse : rotation de ${rotation.angle}° appliquée une fois de trop`
                : `orientation fausse : la rotation de ${rotation.angle}° n’est pas respectée`,
        }))
      : [45, 90, 180].map((ecart) => ({ ecart, erreur: 'orientation différente de celle des autres cases' }))
    ).map(({ ecart, erreur }) => ({ valeur: avec({ rotation: modulo360(bonne.rotation + ecart) }), erreur })),
    forme: [
      ...(cycleFormes ?? []).filter((f) => f !== bonne.forme).map((f) => ({
        valeur: avec({ forme: f }),
        erreur: `forme déjà présente dans la ligne et la colonne (${NOMS_FORMES[f].nom})`,
      })),
      ...alea
        .melanger(formesPossibles.filter((f) => f !== bonne.forme && !(cycleFormes ?? []).includes(f)))
        .map((f) => ({
          valeur: avec({ forme: f }),
          erreur: cycleFormes
            ? `forme étrangère à la grille (${NOMS_FORMES[f].nom})`
            : `forme différente de celle des autres cases (${NOMS_FORMES[f].nom})`,
        })),
    ],
    remplissage: alea.melanger(REMPLISSAGES.filter((x) => x !== bonne.remplissage)).map((x) => ({
      valeur: avec({ remplissage: x }),
      erreur: active('remplissage')
        ? `remplissage déjà présent dans la ligne et la colonne (${NOMS_REMPLISSAGES[x]})`
        : `remplissage différent de celui des autres cases (${NOMS_REMPLISSAGES[x]})`,
    })),
    superposition: [],
  };
  if (superposition) {
    const [a, b, resultat] = superposition.series[2];
    const autreOperation = superposition.reunion
      ? trierMarques([...a.filter((m) => !b.includes(m)), ...b.filter((m) => !a.includes(m))])
      : trierMarques([...a, ...b]);
    const absent = POSITIONS_MARQUES.find((m) => !a.includes(m) && !b.includes(m));
    candidats.superposition = [
      {
        marques: autreOperation,
        erreur: superposition.reunion
          ? 'points communs aux deux cases retirés à tort'
          : 'points communs aux deux cases conservés à tort (simple réunion)',
      },
      { marques: a, erreur: 'points de la première case seulement' },
      { marques: b, erreur: 'points de la deuxième case seulement' },
      { marques: resultat.slice(1), erreur: 'un point oublié' },
      { marques: trierMarques([...resultat, absent]), erreur: 'un point ajouté, absent des deux premières cases' },
    ]
      .filter((x) => x.marques.length > 0)
      .map(({ marques, erreur }) => ({ valeur: avec({ marques }), erreur: `points du pourtour faux : ${erreur}` }));
  } else {
    candidats.superposition = [
      {
        valeur: avec({ marques: [alea.choisir(POSITIONS_MARQUES)] }),
        erreur: 'point ajouté sur le pourtour, absent des autres cases',
      },
    ];
  }

  // Répartition : niveau 1 → 3 pièges sur la règle ; niveau 2 → 2 + 1 ; niveau 3 → 1 par règle.
  const quotas = { 1: [3], 2: alea.melanger([2, 1]), 3: [1, 1, 1] }[niveau];
  const pieges = [];
  const reste = [];
  actives.forEach((regle, i) => {
    pieges.push(...candidats[regle].slice(0, quotas[i]));
    reste.push(...candidats[regle].slice(quotas[i]));
  });
  // Complément si une règle n'offre pas assez d'erreurs visuellement distinctes : d'abord les
  // autres erreurs des règles actives, puis un attribut qui est le même dans toute la grille.
  const complement = REGLES.filter((regle) => !active(regle)).flatMap((regle) => candidats[regle].slice(0, 1));

  const figure = {
    kind: 'matrice',
    lignes: 3,
    colonnes: 3,
    cases: grille.map((ligne, r) => ligne.map((c, col) => (r === mr && col === mc ? null : c))),
    manquante: [mr, mc],
  };

  return assemblerQuestionFigure({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: ENONCE,
    figure,
    bonne,
    pieges: [...pieges, ...reste, ...complement],
    cle: cleCase,
    explication: `${explications.join(' ')} La case manquante (ligne ${mr + 1}, colonne ${mc + 1}) contient donc : ${decrireCase(bonne)}${bonne.marques.length === 0 && superposition ? `, ${decrireMarques([])}` : ''}.`,
    alea,
  });
}

/**
 * Méthode indépendante : on place chaque choix dans la case manquante et on teste la grille
 * complète contre toutes les familles de règles (regles-matrice.js), sans savoir lesquelles
 * le générateur a utilisées.
 */
function resoudre(question) {
  const { figure } = question;
  if (figure.kind !== 'matrice' || figure.lignes !== 3 || figure.colonnes !== 3) {
    throw new Error('grille 3 × 3 attendue');
  }
  const [mr, mc] = figure.manquante;
  figure.cases.forEach((ligne, r) =>
    ligne.forEach((c, col) => {
      const manquante = r === mr && col === mc;
      if (manquante ? c !== null : defautDeCase(c) !== null) throw new Error(`case illisible (ligne ${r + 1}, colonne ${col + 1})`);
    }),
  );
  const evaluer = (choix) => {
    const grille = figure.cases.map((ligne) => ligne.slice());
    grille[mr][mc] = choix;
    return attributsValides(grille);
  };
  const violations = (choix) => Object.values(evaluer(choix)).filter((ok) => !ok).length;
  return {
    accepte: (choix) => defautDeCase(choix) === null && violations(choix) === 0,
    // Clé visuelle : la rotation est normalisée selon la symétrie de la forme.
    cle: (choix) => (defautDeCase(choix) === null ? cleCase(choix) : JSON.stringify(choix)),
    controle: (choix) => {
      const defaut = defautDeCase(choix);
      if (defaut) return defaut;
      const n = violations(choix);
      return n > 1 ? `viole ${n} règles au lieu d’une seule` : null;
    },
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Grille 3 × 3 (case manquante)',
  construire,
  resoudre,
});

