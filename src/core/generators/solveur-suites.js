// Solveur de suites, utilisé par verify(). Il ne connaît PAS la règle choisie par le générateur :
// il part des seuls termes affichés, essaie plusieurs hypothèses et renvoie toutes les valeurs
// qu'une hypothèse cohérente avec la suite permet de prédire. JavaScript pur.

const constante = (liste) => liste.every((x) => x === liste[0]);
const ecarts = (liste) => liste.slice(1).map((x, i) => x - liste[i]);

function suiteArithmetique(t) {
  if (t.length < 3 || !constante(ecarts(t))) return null;
  return t[t.length - 1] + (t[1] - t[0]);
}

function suiteGeometrique(t) {
  if (t.length < 3 || t.includes(0) || t[0] === t[1]) return null;
  for (let i = 1; i < t.length - 1; i += 1) {
    if (t[i + 1] * t[0] !== t[i] * t[1]) return null; // même rapport, sans division
  }
  const produit = t[t.length - 1] * t[1];
  return produit % t[0] === 0 ? produit / t[0] : null;
}

/** Écarts d'ordre `ordre` constants (2 : écarts qui croissent régulièrement, carrés ; 3 : cubes). */
function ecartsConstants(t, ordre) {
  if (t.length < ordre + 2) return null; // il faut au moins deux écarts d'ordre `ordre` pour conclure
  const niveaux = [t];
  for (let k = 0; k < ordre; k += 1) niveaux.push(ecarts(niveaux[k]));
  if (!constante(niveaux[ordre])) return null;
  let ajout = niveaux[ordre][0];
  for (let k = ordre - 1; k >= 0; k -= 1) ajout += niveaux[k][niveaux[k].length - 1];
  return ajout;
}

/** t(n+1) = a × t(n) + b, avec a et b entiers. */
function recurrenceAffine(t) {
  if (t.length < 4 || t[1] === t[0]) return null;
  if ((t[2] - t[1]) % (t[1] - t[0]) !== 0) return null;
  const a = (t[2] - t[1]) / (t[1] - t[0]);
  if (a === 0) return null;
  const b = t[1] - a * t[0];
  for (let i = 0; i < t.length - 1; i += 1) {
    if (t[i + 1] !== a * t[i] + b) return null;
  }
  return a * t[t.length - 1] + b;
}

/** Deux suites entrelacées, chacune arithmétique ou géométrique. */
function suitesEntrelacees(t) {
  if (t.length < 6) return [];
  const rangsImpairs = t.filter((_, i) => i % 2 === 0);
  const rangsPairs = t.filter((_, i) => i % 2 === 1);
  const simple = (s) => suiteArithmetique(s) !== null || suiteGeometrique(s) !== null;
  if (!simple(rangsImpairs) || !simple(rangsPairs)) return [];
  const cible = t.length % 2 === 0 ? rangsImpairs : rangsPairs;
  return [suiteArithmetique(cible), suiteGeometrique(cible)].filter((x) => x !== null);
}

/**
 * @param {number[]} termes termes affichés
 * @returns {Map<number, string[]>} valeurs possibles du terme suivant → hypothèses qui y mènent
 */
export function predictions(termes) {
  const resultat = new Map();
  const noter = (valeur, hypothese) => {
    if (valeur === null || !Number.isInteger(valeur)) return;
    resultat.set(valeur, [...(resultat.get(valeur) ?? []), hypothese]);
  };
  noter(suiteArithmetique(termes), 'arithmétique');
  noter(suiteGeometrique(termes), 'géométrique');
  noter(ecartsConstants(termes, 2), 'écarts croissant régulièrement');
  noter(ecartsConstants(termes, 3), 'écarts d’ordre 3 constants');
  noter(recurrenceAffine(termes), 'récurrence affine');
  for (const valeur of suitesEntrelacees(termes)) noter(valeur, 'suites entrelacées');
  return resultat;
}
