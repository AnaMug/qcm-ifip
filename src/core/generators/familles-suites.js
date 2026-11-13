// Familles de suites numériques : construction des termes, de la règle en clair et des
// distracteurs (erreurs typiques calculées). JavaScript pur, sans Math.random.
// Chaque famille renvoie { famille, termes, suivant, regle, calcul, pieges }.

const signe = (x) => (x < 0 ? `− ${Math.abs(x)}` : `+ ${x}`);
const dernier = (t) => t[t.length - 1];
const avantDernier = (t) => t[t.length - 2];

export function arithmetique(alea, { n, pasMin, pasMax, decroissante = false }) {
  const pas = alea.entier(pasMin, pasMax);
  const d = decroissante ? -pas : pas;
  const depart = decroissante ? pas * (n + 2) + alea.entier(1, 20) : alea.entier(1, 20);
  const termes = Array.from({ length: n }, (_, i) => depart + i * d);
  const fin = dernier(termes);
  const suivant = fin + d;
  const pieges = [
    { valeur: suivant + d, erreur: 'décalage d’un rang : c’est le terme d’après' },
    { valeur: fin + d + 1, erreur: 'écart mal relevé, trop grand de 1' },
    { valeur: fin + d - 1, erreur: 'écart mal relevé, trop petit de 1' },
    { valeur: fin + avantDernier(termes), erreur: 'addition des deux derniers termes' },
  ];
  if ((fin * fin) % avantDernier(termes) === 0) {
    pieges.push({
      valeur: (fin * fin) / avantDernier(termes),
      erreur: 'lecture en suite géométrique à partir des deux derniers termes',
    });
  }
  return {
    famille: 'arithmetique',
    termes,
    suivant,
    regle: `Chaque terme est le précédent ${signe(d)}.`,
    calcul: `${fin} ${signe(d)} = ${suivant}`,
    pieges,
  };
}

export function geometrique(alea, { n, qMin, qMax, departMax, decroissante = false }) {
  const q = alea.entier(qMin, qMax);
  const a = alea.entier(1, departMax);
  let termes;
  let suivant;
  let pieges;
  if (!decroissante) {
    termes = Array.from({ length: n }, (_, i) => a * q ** i);
    const fin = dernier(termes);
    suivant = fin * q;
    pieges = [
      { valeur: fin + (fin - avantDernier(termes)), erreur: 'dernier écart répété, comme dans une suite arithmétique' },
      { valeur: fin * (q + 1), erreur: `multiplication par ${q + 1} au lieu de ${q}` },
      { valeur: suivant * q, erreur: 'décalage d’un rang : c’est le terme d’après' },
      { valeur: fin + avantDernier(termes), erreur: 'addition des deux derniers termes' },
      { valeur: 2 * suivant - fin, erreur: 'nouvel écart ajouté deux fois' },
    ];
    if (q > 2) pieges.push({ valeur: fin * (q - 1), erreur: `multiplication par ${q - 1} au lieu de ${q}` });
  } else {
    termes = Array.from({ length: n }, (_, i) => a * q ** (n - i));
    const fin = dernier(termes);
    suivant = fin / q;
    pieges = [{ valeur: fin - q, erreur: `soustraction de ${q} au lieu de la division par ${q}` }];
    if (suivant % q === 0) pieges.push({ valeur: suivant / q, erreur: 'décalage d’un rang : c’est le terme d’après' });
    if (fin % (q + 1) === 0) pieges.push({ valeur: fin / (q + 1), erreur: `division par ${q + 1} au lieu de ${q}` });
    if (q > 2 && fin % (q - 1) === 0) pieges.push({ valeur: fin / (q - 1), erreur: `division par ${q - 1} au lieu de ${q}` });
  }
  const fin = dernier(termes);
  return {
    famille: 'geometrique',
    termes,
    suivant,
    regle: decroissante ? `Chaque terme est le précédent ÷ ${q}.` : `Chaque terme est le précédent × ${q}.`,
    calcul: decroissante ? `${fin} ÷ ${q} = ${suivant}` : `${fin} × ${q} = ${suivant}`,
    pieges,
  };
}

function puissances(alea, { n, kMin, kMax }, exposant) {
  const k = alea.entier(kMin, kMax);
  const termes = Array.from({ length: n }, (_, i) => (k + i) ** exposant);
  const m = k + n; // entier dont on cherche la puissance
  const suivant = m ** exposant;
  const fin = dernier(termes);
  const ecart = fin - avantDernier(termes);
  const symbole = exposant === 2 ? '²' : '³';
  const pieges = [
    { valeur: (m + 1) ** exposant, erreur: `décalage d’un rang : c’est ${m + 1}${symbole}` },
    { valeur: fin + ecart, erreur: 'dernier écart répété' },
    { valeur: 2 * suivant - fin, erreur: 'nouvel écart ajouté deux fois' },
  ];
  if (exposant === 2) {
    pieges.push({ valeur: fin + ecart + 1, erreur: 'écart augmenté de 1 au lieu de 2' });
    pieges.push({ valeur: m * (m - 1), erreur: `produit ${m} × ${m - 1} au lieu du carré de ${m}` });
    pieges.push({ valeur: m * (m + 1), erreur: `produit ${m} × ${m + 1} au lieu du carré de ${m}` });
  } else {
    const ecartPrecedent = avantDernier(termes) - termes[termes.length - 3];
    pieges.push({
      valeur: fin + ecart + (ecart - ecartPrecedent),
      erreur: 'écarts supposés augmenter d’une quantité constante',
    });
    pieges.push({ valeur: m * m * (m - 1), erreur: `${m}² × ${m - 1} au lieu de ${m}³` });
  }
  const liste = termes.map((_, i) => `${k + i}${symbole}`).join(', ');
  return {
    famille: exposant === 2 ? 'carres' : 'cubes',
    termes,
    suivant,
    regle: `Ce sont les ${exposant === 2 ? 'carrés' : 'cubes'} d’entiers consécutifs : ${liste}.`,
    calcul: `${m}${symbole} = ${suivant}`,
    pieges,
  };
}

export const carres = (alea, options) => puissances(alea, options, 2);
export const cubes = (alea, options) => puissances(alea, options, 3);

export function differencesCroissantes(alea, { n, dMin, dMax, kMin, kMax }) {
  const d = alea.entier(dMin, dMax);
  const k = alea.entier(kMin, kMax);
  const termes = [alea.entier(1, 12)];
  const ecarts = [];
  for (let i = 0; i < n - 1; i += 1) {
    ecarts.push(d + i * k);
    termes.push(dernier(termes) + d + i * k);
  }
  const fin = dernier(termes);
  const dernierEcart = dernier(ecarts);
  const prochainEcart = dernierEcart + k;
  const suivant = fin + prochainEcart;
  return {
    famille: 'differences_croissantes',
    termes,
    suivant,
    regle: `Les écarts entre deux termes augmentent de ${k} à chaque fois : ${ecarts.map((e) => `+ ${e}`).join(', ')}, donc + ${prochainEcart}.`,
    calcul: `${fin} + ${prochainEcart} = ${suivant}`,
    pieges: [
      { valeur: fin + dernierEcart, erreur: `dernier écart (+ ${dernierEcart}) répété` },
      { valeur: fin + prochainEcart + k, erreur: 'écart augmenté deux fois : décalage d’un rang' },
      { valeur: fin + 2 * dernierEcart, erreur: 'dernier écart doublé' },
      { valeur: suivant + prochainEcart + k, erreur: 'c’est le terme d’après' },
      { valeur: fin + d, erreur: `premier écart (+ ${d}) réutilisé` },
      ...(k > 1 ? [{ valeur: fin + dernierEcart + 1, erreur: 'écarts supposés augmenter de 1 seulement' }] : []),
    ],
  };
}

export function affine(alea, { n }) {
  const a = alea.choisir([2, 3]);
  const depart = alea.entier(1, 6);
  let b = alea.entier(1, 5) * (alea.booleen() ? 1 : -1);
  if (a * depart + b <= depart) b = Math.abs(b); // la suite doit rester croissante et positive
  const termes = [depart];
  for (let i = 1; i < n; i += 1) termes.push(a * dernier(termes) + b);
  const fin = dernier(termes);
  const suivant = a * fin + b;
  return {
    famille: 'affine',
    termes,
    suivant,
    regle: `Chaque terme est le précédent × ${a} ${signe(b)}.`,
    calcul: `${fin} × ${a} ${signe(b)} = ${suivant}`,
    pieges: [
      { valeur: a * fin, erreur: `oubli du « ${signe(b)} »` },
      { valeur: a * fin - b, erreur: `« ${signe(-b)} » au lieu de « ${signe(b)} »` },
      { valeur: a * (fin + b), erreur: 'addition faite avant la multiplication' },
      { valeur: fin + (fin - avantDernier(termes)), erreur: 'dernier écart répété' },
    ],
  };
}

export function entrelacees(alea, { n }) {
  const r = alea.entier(2, 6);
  const suiteA = { depart: alea.entier(1, 10), terme: (i, dep) => dep + i * r, regle: `+ ${r}`, suite: (x) => x + r };
  let suiteB;
  if (alea.booleen()) {
    let s = alea.entier(2, 7);
    if (s === r) s += 1;
    suiteB = { depart: alea.entier(1, 30), terme: (i, dep) => dep + i * s, regle: `+ ${s}`, suite: (x) => x + s };
  } else {
    suiteB = { depart: alea.entier(1, 3), terme: (i, dep) => dep * 2 ** i, regle: '× 2', suite: (x) => x * 2 };
  }
  const termes = Array.from({ length: n }, (_, i) =>
    i % 2 === 0 ? suiteA.terme(i / 2, suiteA.depart) : suiteB.terme((i - 1) / 2, suiteB.depart),
  );
  const impairs = termes.filter((_, i) => i % 2 === 0); // rangs 1, 3, 5… (comptés à partir de 1)
  const pairs = termes.filter((_, i) => i % 2 === 1);
  const cibleDansA = n % 2 === 0;
  const propre = cibleDansA ? suiteA : suiteB;
  const autre = cibleDansA ? suiteB : suiteA;
  const finPropre = dernier(cibleDansA ? impairs : pairs);
  const finAutre = dernier(cibleDansA ? pairs : impairs);
  const suivant = propre.suite(finPropre);
  const fin = dernier(termes);
  return {
    famille: 'entrelacees',
    termes,
    suivant,
    regle:
      `Deux suites sont entrelacées. Termes de rang impair : ${impairs.join(', ')} (${suiteA.regle}). ` +
      `Termes de rang pair : ${pairs.join(', ')} (${suiteB.regle}). ` +
      `Le terme cherché est de rang ${n + 1} : il prolonge la suite des rangs ${cibleDansA ? 'impairs' : 'pairs'}.`,
    calcul: `${finPropre} ${propre.regle} = ${suivant}`,
    pieges: [
      { valeur: autre.suite(finAutre), erreur: 'terme suivant de l’autre suite' },
      { valeur: fin + (fin - avantDernier(termes)), erreur: 'écart entre les deux derniers termes répété, sans séparer les deux suites' },
      { valeur: propre.suite(fin), erreur: `« ${propre.regle} » appliqué au dernier terme affiché, qui appartient à l’autre suite` },
      { valeur: propre.suite(suivant), erreur: 'décalage d’un rang dans la bonne suite' },
    ],
  };
}

/** Écarte les distracteurs négatifs ou nuls, égaux à la réponse ou déjà affichés dans la suite. */
export function piegesUtilisables(suite) {
  const interdits = new Set([suite.suivant, ...suite.termes]);
  return suite.pieges.filter((p) => Number.isInteger(p.valeur) && p.valeur > 0 && !interdits.has(p.valeur));
}

/** Distracteurs de secours : erreur de calcul d'une unité. Utilisés seulement s'il manque des pièges. */
export function piegesDeSecours(suite) {
  const interdits = new Set([suite.suivant, ...suite.termes]);
  return [
    { valeur: suite.suivant + 1, erreur: 'erreur de calcul d’une unité' },
    { valeur: suite.suivant - 1, erreur: 'erreur de calcul d’une unité' },
    { valeur: suite.suivant + 2, erreur: 'erreur de calcul de deux unités' },
  ].filter((p) => p.valeur > 0 && !interdits.has(p.valeur));
}
