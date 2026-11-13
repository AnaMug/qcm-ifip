// Socle commun des générateurs. JavaScript pur : ni React, ni DOM, ni Math.random.

import { ORIGINE_GENERATEUR } from '../constants.js';
import { validerQuestion } from '../questions.js';

export const NIVEAUX = [1, 2, 3];
export const ESSAIS_MAX = 20;

/**
 * Assemble une question au format du schéma.
 * - `bonne` : texte de la bonne réponse, calculé par le générateur.
 * - `pieges` : distracteurs calculés [{ texte, erreur }], chacun reproduisant une erreur typique.
 * - `secours` : distracteurs calculés utilisés seulement s'il manque des pièges.
 * Les choix sont présentés triés (comme dans le sujet officiel). Pour que la place de la bonne
 * réponse ne soit pas prévisible, la graine tire le nombre de pièges voulus AVANT la bonne réponse,
 * et on s'en approche autant que les pièges disponibles le permettent.
 * Renvoie null s'il n'y a pas 3 distracteurs distincts : l'appelant essaiera la graine suivante.
 */
export function assemblerQuestion({
  type,
  version,
  seed,
  niveau,
  enonce,
  bonne,
  pieges,
  secours = [],
  comparer,
  explication,
  alea,
}) {
  const dejaPris = new Set([bonne]);
  const sansDoublon = (liste) =>
    liste.filter((p) => {
      if (dejaPris.has(p.texte)) return false;
      dejaPris.add(p.texte);
      return true;
    });
  const candidats = sansDoublon(alea.melanger(pieges));
  const avant = candidats.filter((p) => comparer(p.texte, bonne) < 0);
  const apres = candidats.filter((p) => comparer(p.texte, bonne) >= 0);
  const voulusAvant = alea.entier(0, 3);
  let nbAvant = Math.min(voulusAvant, avant.length);
  const nbApres = Math.min(3 - nbAvant, apres.length);
  nbAvant = Math.min(3 - nbApres, avant.length);
  const retenus = [...avant.slice(0, nbAvant), ...apres.slice(0, nbApres)];
  for (const piege of sansDoublon(secours)) {
    if (retenus.length === 3) break;
    retenus.push(piege);
  }
  if (retenus.length < 3) return null;

  const choix = [bonne, ...retenus.map((p) => p.texte)].sort(comparer);
  const erreurs = choix
    .filter((c) => c !== bonne)
    .map((c) => `« ${c} » (${retenus.find((p) => p.texte === c).erreur})`)
    .join(' ; ');

  return {
    id: `gen-${type}-${seed}-${niveau}`,
    origine: ORIGINE_GENERATEUR,
    theme: 'logique',
    enonce,
    choix,
    bonne_reponse: choix.indexOf(bonne) + 1,
    explication: `${explication}\nErreurs typiques parmi les autres choix : ${erreurs}.`,
    source: {
      libelle: `Réponse calculée par le générateur « ${type} » (version ${version}, graine ${seed}, niveau ${niveau})`,
      url: '',
    },
    confiance: 'haute',
    statut: 'concordant',
    image: null,
    similaire_a: null,
    extrait_source: null,
    generateur: { type, seed, niveau, version },
  };
}

/**
 * Fabrique un générateur { type, version, libelle, generate, verify }.
 * - `construire(seed, niveau)` : renvoie une question ou null.
 * - `resoudre(question)` : repart de l'énoncé AFFICHÉ et recalcule la solution par une méthode
 *   indépendante de `construire`. Renvoie { accepte(texte), cle(texte), controle?(texte) } :
 *   `accepte` dit si un choix est correct, `cle` donne sa valeur canonique (pour repérer deux
 *   choix égaux écrits différemment), `controle` renvoie un message si le choix est mal formé.
 */
export function creerGenerateur({ type, version, libelle, construire, resoudre }) {
  function verify(question) {
    const erreurs = [];
    try {
      erreurs.push(...validerQuestion(question, { generee: true }));
      if (erreurs.length === 0 && question.generateur.type !== type) {
        erreurs.push(`question du type ${question.generateur.type}, attendu ${type}`);
      }
      if (erreurs.length > 0) return { ok: false, erreurs };

      const solution = resoudre(question);
      const cles = question.choix.map((c) => solution.cle(c));
      if (new Set(question.choix).size !== 4 || new Set(cles).size !== 4) {
        erreurs.push('les 4 choix ne sont pas tous différents');
      }
      if (solution.controle) {
        for (const c of question.choix) {
          const message = solution.controle(c);
          if (message) erreurs.push(`choix « ${c} » : ${message}`);
        }
      }
      const corrects = question.choix
        .map((c, i) => (solution.accepte(c) ? i + 1 : null))
        .filter((n) => n !== null);
      if (corrects.length !== 1) {
        erreurs.push(`${corrects.length} choix corrects au lieu d'un seul`);
      } else if (corrects[0] !== question.bonne_reponse) {
        erreurs.push(
          `bonne_reponse vaut ${question.bonne_reponse} mais le recalcul désigne le choix ${corrects[0]}`,
        );
      }
    } catch (e) {
      erreurs.push(`vérification impossible : ${e.message}`);
    }
    return { ok: erreurs.length === 0, erreurs };
  }

  /**
   * Génère une question vérifiée. Si la graine demandée ne donne pas une question valide,
   * essaie les graines suivantes ; l'id et le champ `generateur.seed` portent la graine
   * réellement utilisée, ce qui permet de reproduire la question.
   */
  function generate(seed, niveau) {
    if (!Number.isInteger(seed) || seed < 0) {
      throw new Error(`Générateur ${type} : la graine doit être un entier positif (reçu ${seed}).`);
    }
    if (!NIVEAUX.includes(niveau)) {
      throw new Error(`Générateur ${type} : niveau ${niveau} inconnu (niveaux admis : ${NIVEAUX.join(', ')}).`);
    }
    let dernieresErreurs = ['aucune question construite'];
    for (let essai = 0; essai < ESSAIS_MAX; essai += 1) {
      const question = construire(seed + essai, niveau);
      if (question === null) continue;
      const controle = verify(question);
      if (controle.ok) return question;
      dernieresErreurs = controle.erreurs;
    }
    throw new Error(
      `Générateur ${type} : aucune question valide après ${ESSAIS_MAX} essais ` +
        `(graines ${seed} à ${seed + ESSAIS_MAX - 1}, niveau ${niveau}). ` +
        `Dernier motif : ${dernieresErreurs.join(' ; ')}`,
    );
  }

  return { type, version, libelle, generate, verify };
}

export function pgcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}
