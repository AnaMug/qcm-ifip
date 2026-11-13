// Générateur « probabilites » : tirages dans une urne, réponses en fractions irréductibles.
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestion, creerGenerateur, pgcd } from './commun.js';

const TYPE = 'probabilites';
const VERSION = 1;
// Accord au féminin (« une boule verte », « des boules vertes »).
const COULEURS = ['rouge', 'bleue', 'verte', 'jaune', 'noire', 'blanche'];

const fraction = (num, den) => {
  const d = pgcd(num, den);
  return { num: num / d, den: den / d };
};
const ecrire = (f) => `${f.num}/${f.den}`;
/** Écrit « 6/210 = 1/35 », ou seulement « 1/35 » si la fraction est déjà irréductible. */
const reduire = (num, den) => {
  const f = fraction(num, den);
  return f.num === num ? ecrire(f) : `${num}/${den} = ${ecrire(f)}`;
};

const TIRAGE = {
  un: 'On tire une boule au hasard.',
  remise: 'On tire une boule au hasard, on la remet dans l’urne, puis on tire une seconde boule.',
  sansRemise: 'On tire successivement deux boules au hasard, sans remise.',
};

// Chaque cas calcule la réponse par une formule et les erreurs typiques associées.
// u : { couleurs, effectifs, total } ; x et y : indices de deux couleurs distinctes.
const CAS = {
  une_couleur(u, x) {
    const k = u.effectifs[x];
    const n = u.total;
    return {
      tirage: 'un',
      question: `Quelle est la probabilité qu’elle soit ${u.couleurs[x]} ?`,
      reponse: [k, n],
      explication: `L’urne contient ${n} boules, dont ${k} ${u.couleurs[x]}s. Probabilité : ${reduire(k, n)}.`,
      pieges: [
        { f: [n - k, n], erreur: 'probabilité de l’événement contraire' },
        { f: [k, n - k], erreur: 'rapport entre boules favorables et boules défavorables, au lieu du total' },
        { f: [1, u.couleurs.length], erreur: 'couleurs supposées équiprobables, sans tenir compte des effectifs' },
        { f: [k, n - 1], erreur: 'total diminué d’une boule' },
      ],
    };
  },
  pas_une_couleur(u, x) {
    const k = u.effectifs[x];
    const n = u.total;
    return {
      tirage: 'un',
      question: `Quelle est la probabilité qu’elle ne soit pas ${u.couleurs[x]} ?`,
      reponse: [n - k, n],
      explication: `L’urne contient ${n} boules, dont ${n - k} ne sont pas ${u.couleurs[x]}s (${n} − ${k}). Probabilité : ${reduire(n - k, n)}.`,
      pieges: [
        { f: [k, n], erreur: `probabilité que la boule soit ${u.couleurs[x]} : négation oubliée` },
        { f: [n - k, k], erreur: 'rapport entre les deux groupes de boules, au lieu du total' },
        { f: [u.couleurs.length - 1, u.couleurs.length], erreur: 'couleurs supposées équiprobables, sans tenir compte des effectifs' },
        { f: [n - k - 1, n - 1], erreur: 'une boule retirée à tort du décompte' },
      ],
    };
  },
  deux_identiques_remise(u, x) {
    const k = u.effectifs[x];
    const n = u.total;
    return {
      tirage: 'remise',
      question: `Quelle est la probabilité d’obtenir deux boules ${u.couleurs[x]}s ?`,
      reponse: [k * k, n * n],
      explication: `Avec remise, les deux tirages sont identiques et indépendants : ${k}/${n} × ${k}/${n} = ${reduire(k * k, n * n)}.`,
      pieges: [
        { f: [k * (k - 1), n * (n - 1)], erreur: 'calcul fait comme si la première boule n’était pas remise' },
        { f: [2 * k, n], erreur: 'addition des deux probabilités au lieu de leur multiplication' },
        { f: [k, n], erreur: 'un seul tirage pris en compte' },
        { f: [k, n * n], erreur: 'nombre de cas favorables non élevé au carré' },
        { f: [k * (k - 1), n * n], erreur: 'boule favorable retirée à tort au second tirage, alors qu’elle a été remise' },
      ],
    };
  },
  puis_remise(u, x, y) {
    const [k, m] = [u.effectifs[x], u.effectifs[y]];
    const n = u.total;
    return {
      tirage: 'remise',
      question: `Quelle est la probabilité d’obtenir une boule ${u.couleurs[x]} puis une boule ${u.couleurs[y]} ?`,
      reponse: [k * m, n * n],
      explication: `Avec remise, les deux tirages sont indépendants : ${k}/${n} × ${m}/${n} = ${reduire(k * m, n * n)}.`,
      pieges: [
        { f: [k * m, n * (n - 1)], erreur: 'calcul fait comme si la première boule n’était pas remise' },
        { f: [k + m, n], erreur: 'addition des deux probabilités au lieu de leur multiplication' },
        { f: [2 * k * m, n * n], erreur: 'les deux ordres comptés, alors que l’ordre est imposé' },
        { f: [k, n], erreur: 'un seul tirage pris en compte' },
        { f: [k * m, 2 * n * n], erreur: 'résultat divisé par 2, comme s’il fallait corriger l’ordre des tirages' },
        { f: [k * (m - 1), n * n], erreur: 'boule retirée à tort au second tirage, alors que la première a été remise' },
      ],
    };
  },
  deux_identiques_sans_remise(u, x) {
    const k = u.effectifs[x];
    const n = u.total;
    return {
      tirage: 'sansRemise',
      question: `Quelle est la probabilité d’obtenir deux boules ${u.couleurs[x]}s ?`,
      reponse: [k * (k - 1), n * (n - 1)],
      explication: `Sans remise, il reste ${k - 1} boules ${u.couleurs[x]}s sur ${n - 1} au second tirage : ${k}/${n} × ${k - 1}/${n - 1} = ${reduire(k * (k - 1), n * (n - 1))}.`,
      pieges: [
        { f: [k * k, n * n], erreur: 'oubli de la non-remise : calcul fait avec remise' },
        { f: [k * (k - 1), n * n], erreur: 'total non diminué au second tirage' },
        { f: [k * k, n * (n - 1)], erreur: 'nombre de boules favorables non diminué au second tirage' },
        { f: [k * (n - 1) + (k - 1) * n, n * (n - 1)], erreur: 'addition des deux probabilités au lieu de leur multiplication' },
        { f: [k, n], erreur: 'un seul tirage pris en compte' },
      ],
    };
  },
  puis_sans_remise(u, x, y) {
    const [k, m] = [u.effectifs[x], u.effectifs[y]];
    const n = u.total;
    return {
      tirage: 'sansRemise',
      question: `Quelle est la probabilité d’obtenir une boule ${u.couleurs[x]} puis une boule ${u.couleurs[y]} ?`,
      reponse: [k * m, n * (n - 1)],
      explication: `Sans remise, il reste ${n - 1} boules au second tirage, dont toujours ${m} ${u.couleurs[y]}s : ${k}/${n} × ${m}/${n - 1} = ${reduire(k * m, n * (n - 1))}.`,
      pieges: [
        { f: [k * m, n * n], erreur: 'oubli de la non-remise : calcul fait avec remise' },
        { f: [2 * k * m, n * (n - 1)], erreur: 'les deux ordres comptés, alors que l’ordre est imposé' },
        { f: [k * (m - 1), n * (n - 1)], erreur: 'boule retirée de la mauvaise couleur au second tirage' },
        { f: [k * m, 2 * n * (n - 1)], erreur: 'résultat divisé par 2, comme s’il fallait corriger l’ordre des tirages' },
        { f: [k * (n - 1) + m * n, n * (n - 1)], erreur: 'addition des deux probabilités au lieu de leur multiplication' },
      ],
    };
  },
  meme_couleur_sans_remise(u) {
    const n = u.total;
    const favorables = u.effectifs.reduce((s, k) => s + k * (k - 1), 0);
    const carres = u.effectifs.reduce((s, k) => s + k * k, 0);
    const detail = u.effectifs.map((k) => `${k}/${n} × ${k - 1}/${n - 1}`).join(' + ');
    return {
      tirage: 'sansRemise',
      question: 'Quelle est la probabilité d’obtenir deux boules de la même couleur ?',
      reponse: [favorables, n * (n - 1)],
      explication: `On additionne les probabilités d’obtenir deux boules de chaque couleur, sans remise : ${detail} = ${reduire(favorables, n * (n - 1))}.`,
      pieges: [
        { f: [carres, n * n], erreur: 'oubli de la non-remise : calcul fait avec remise' },
        { f: [n * (n - 1) - favorables, n * (n - 1)], erreur: 'probabilité de l’événement contraire (deux couleurs différentes)' },
        { f: [1, u.couleurs.length], erreur: 'couleurs supposées équiprobables, sans tenir compte des effectifs' },
        { f: [u.effectifs[0] * (u.effectifs[0] - 1), n * (n - 1)], erreur: `une seule couleur prise en compte (${u.couleurs[0]})` },
      ],
    };
  },
  couleurs_differentes_sans_remise(u) {
    const n = u.total;
    const identiques = u.effectifs.reduce((s, k) => s + k * (k - 1), 0);
    const carres = u.effectifs.reduce((s, k) => s + k * k, 0);
    const favorables = n * (n - 1) - identiques;
    return {
      tirage: 'sansRemise',
      question: 'Quelle est la probabilité d’obtenir deux boules de couleurs différentes ?',
      reponse: [favorables, n * (n - 1)],
      explication:
        `On passe par l’événement contraire. Probabilité de deux boules de la même couleur, sans remise : ` +
        `${u.effectifs.map((k) => `${k}/${n} × ${k - 1}/${n - 1}`).join(' + ')} = ${reduire(identiques, n * (n - 1))}. ` +
        `Probabilité cherchée : 1 − ${ecrire(fraction(identiques, n * (n - 1)))} = ${ecrire(fraction(favorables, n * (n - 1)))}.`,
      pieges: [
        { f: [n * n - carres, n * n], erreur: 'oubli de la non-remise : calcul fait avec remise' },
        { f: [identiques, n * (n - 1)], erreur: 'probabilité de l’événement contraire (deux boules de la même couleur)' },
        { f: [favorables, 2 * n * (n - 1)], erreur: 'un seul ordre de tirage compté au lieu des deux' },
        { f: [u.couleurs.length - 1, u.couleurs.length], erreur: 'couleurs supposées équiprobables, sans tenir compte des effectifs' },
      ],
    };
  },
};

const PAR_NIVEAU = {
  1: { cas: ['une_couleur', 'pas_une_couleur'], nbCouleurs: [3], effectifMax: 8 },
  2: { cas: ['deux_identiques_remise', 'puis_remise'], nbCouleurs: [2, 3], effectifMax: 6 },
  3: {
    cas: ['deux_identiques_sans_remise', 'puis_sans_remise', 'meme_couleur_sans_remise', 'couleurs_differentes_sans_remise'],
    nbCouleurs: [2, 3],
    effectifMax: 6,
  },
};

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const reglage = PAR_NIVEAU[niveau];
  const couleurs = alea.melanger(COULEURS).slice(0, alea.choisir(reglage.nbCouleurs));
  const effectifs = couleurs.map(() => alea.entier(2, reglage.effectifMax));
  const urne = { couleurs, effectifs, total: effectifs.reduce((s, k) => s + k, 0) };
  const [x, y] = alea.melanger(couleurs.map((_, i) => i));
  const cas = CAS[alea.choisir(reglage.cas)](urne, x, y);

  const reponse = fraction(...cas.reponse);
  if (reponse.num <= 0 || reponse.num >= reponse.den) return null;
  const pieges = cas.pieges
    .filter(({ f }) => f[0] > 0 && f[0] < f[1]) // une probabilité strictement entre 0 et 1
    .map(({ f, erreur }) => ({ texte: ecrire(fraction(...f)), erreur }));

  const contenu = couleurs.map((c, i) => `${effectifs[i]} boules ${c}s`);
  const liste = `${contenu.slice(0, -1).join(', ')} et ${contenu[contenu.length - 1]}`;
  const valeur = (texte) => {
    const [num, den] = texte.split('/').map(Number);
    return num / den;
  };

  return assemblerQuestion({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce: `Une urne contient ${liste}. ${TIRAGE[cas.tirage]} ${cas.question}`,
    bonne: ecrire(reponse),
    pieges,
    comparer: (a, b) => valeur(a) - valeur(b),
    explication: cas.explication,
    alea,
  });
}

/**
 * Méthode indépendante : on relit l'énoncé, on reconstitue l'urne boule par boule, on énumère
 * toutes les issues équiprobables et on compte les issues favorables. Aucune formule.
 */
function resoudre(question) {
  const { enonce } = question;
  const boules = [];
  const composition = /^Une urne contient (.+?)\. On tire /.exec(enonce);
  if (composition === null) throw new Error('composition de l’urne illisible');
  for (const m of composition[1].matchAll(/(\d+) boules ([a-z]+)s/g)) {
    if (!COULEURS.includes(m[2])) throw new Error(`couleur inconnue : ${m[2]}`);
    for (let i = 0; i < Number(m[1]); i += 1) boules.push(m[2]);
  }
  if (boules.length < 2) throw new Error('urne vide ou illisible');

  let issues;
  if (enonce.includes(TIRAGE.un)) {
    issues = boules.map((b) => [b]);
  } else {
    const avecRemise = enonce.includes('on la remet dans l’urne');
    if (!avecRemise && !enonce.includes('sans remise')) throw new Error('mode de tirage illisible');
    issues = [];
    boules.forEach((premiere, i) => {
      boules.forEach((seconde, j) => {
        if (avecRemise || i !== j) issues.push([premiere, seconde]);
      });
    });
  }

  const demande = enonce.slice(enonce.lastIndexOf('Quelle est la probabilité'));
  let favorable;
  let boulesAttendues = 2;
  let m;
  if ((m = /qu’elle ne soit pas ([a-z]+) \?$/.exec(demande))) {
    boulesAttendues = 1;
    favorable = ([a]) => a !== m[1];
  } else if ((m = /qu’elle soit ([a-z]+) \?$/.exec(demande))) {
    boulesAttendues = 1;
    favorable = ([a]) => a === m[1];
  } else if ((m = /d’obtenir une boule ([a-z]+) puis une boule ([a-z]+) \?$/.exec(demande))) {
    favorable = ([a, b]) => a === m[1] && b === m[2];
  } else if (/d’obtenir deux boules de la même couleur \?$/.test(demande)) {
    favorable = ([a, b]) => a === b;
  } else if (/d’obtenir deux boules de couleurs différentes \?$/.test(demande)) {
    favorable = ([a, b]) => a !== b;
  } else if ((m = /d’obtenir deux boules ([a-z]+)s \?$/.exec(demande))) {
    favorable = ([a, b]) => a === m[1] && b === m[1];
  } else {
    throw new Error('événement illisible');
  }
  if (issues[0].length !== boulesAttendues) {
    throw new Error('l’événement demandé ne correspond pas au nombre de boules tirées');
  }

  const cas = issues.filter(favorable).length;
  const total = issues.length;
  const lire = (texte) => /^(\d+)\/(\d+)$/.exec(texte);
  return {
    // Égalité de fractions par produit en croix : pas de division, pas d'arrondi.
    accepte: (texte) => {
      const f = lire(texte);
      return f !== null && Number(f[1]) * total === cas * Number(f[2]);
    },
    cle: (texte) => {
      const f = lire(texte);
      return f === null ? texte : ecrire(fraction(Number(f[1]), Number(f[2])));
    },
    controle: (texte) => {
      const f = lire(texte);
      if (f === null) return 'fraction « a/b » attendue';
      const [num, den] = [Number(f[1]), Number(f[2])];
      if (num <= 0 || num >= den) return 'probabilité attendue strictement entre 0 et 1';
      return pgcd(num, den) === 1 ? null : 'fraction non irréductible';
    },
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Probabilités (urne)',
  construire,
  resoudre,
});
