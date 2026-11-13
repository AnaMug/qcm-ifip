// Générateur pseudo-aléatoire à graine. JavaScript pur : ni React, ni DOM.
// Les générateurs de questions n'utilisent JAMAIS Math.random : même graine = même question.

/** Transforme un texte en graine entière sur 32 bits (hachage de type xmur3). */
export function graineDepuisTexte(texte) {
  let h = 1779033703 ^ texte.length;
  for (let i = 0; i < texte.length; i += 1) {
    h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32 : renvoie une fonction qui produit des nombres dans [0, 1[. */
export function mulberry32(graine) {
  let a = graine >>> 0;
  return function suivant() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Petite boîte à outils de tirages, tous issus de la même graine. */
export function creerAlea(graine) {
  const suivant = mulberry32(graine);
  return {
    suivant,
    /** Entier entre min et max inclus. */
    entier(min, max) {
      return min + Math.floor(suivant() * (max - min + 1));
    },
    choisir(liste) {
      return liste[Math.floor(suivant() * liste.length)];
    },
    booleen() {
      return suivant() < 0.5;
    },
    /** Mélange de Fisher-Yates ; renvoie une nouvelle liste. */
    melanger(liste) {
      const copie = liste.slice();
      for (let i = copie.length - 1; i > 0; i -= 1) {
        const j = Math.floor(suivant() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
      }
      return copie;
    },
  };
}

/** Aléa propre à un triplet (type, graine, niveau) : les générateurs ne partagent pas leurs suites. */
export function aleaPour(type, seed, niveau) {
  return creerAlea(graineDepuisTexte(`${type}:${niveau}:${seed}`));
}
