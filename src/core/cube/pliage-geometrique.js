// Second pliage, indépendant du premier, utilisé par verify().
// Ici on ne « roule » rien et on n'utilise aucune table de règles : le patron est posé à plat
// dans l'espace, et chaque case est réellement repliée d'un quart de tour autour de l'arête
// qu'elle partage avec sa voisine (rotation de points autour d'un axe). JavaScript pur.
//
// Repère du patron à plat : x vers la droite, y vers le haut de la page, z vers l'observateur
// (côté imprimé visible). On replie vers l'arrière (z négatif) : l'imprimé reste à l'extérieur.

import { sontVoisines } from './patrons.js';
import { FACES_VISIBLES, angleDansLeRepere, egaux, fois, hautDuMotif, oppose, plus, scalaire, vectoriel } from './reperes.js';

const moins = (a, b) => plus(a, fois(b, -1));

/** Quart de tour du point p autour de l'axe passant par `origine`, de direction unitaire `axe`. */
function quartDeTour(p, origine, axe, sens) {
  const w = moins(p, origine);
  const tourne = plus(fois(vectoriel(axe, w), sens), fois(axe, scalaire(axe, w)));
  return plus(origine, tourne);
}

/**
 * @param {{ ligne: number, colonne: number }[]} cellules
 * @returns {{ n: number[], u: number[], v: number[] }[]} un repère par case (vecteurs entiers)
 */
export function plierGeometriquement(cellules) {
  // Trois points par case : son centre, le milieu de son bord droit, le milieu de son bord haut.
  const points = cellules.map(({ ligne, colonne }) => {
    const centre = [colonne + 0.5, -(ligne + 0.5), 0];
    return { centre, droite: plus(centre, [0.5, 0, 0]), haut: plus(centre, [0, 0.5, 0]) };
  });
  const visitees = new Set();

  // Replie tout ce qui est accroché à la case i, et renvoie la liste des cases concernées.
  function replier(i) {
    visitees.add(i);
    const branche = [i];
    cellules.forEach((_, k) => {
      if (visitees.has(k) || !sontVoisines(cellules, i, k)) return;
      const sousBranche = replier(k); // d'abord ce qui dépend de k, tant que k est encore à plat
      const versK = moins(points[k].centre, points[i].centre);
      const charniere = fois(plus(points[i].centre, points[k].centre), 0.5);
      const axe = [-versK[1], versK[0], 0];
      // Le sens du quart de tour est celui qui envoie la case k vers l'arrière.
      const sens = quartDeTour(points[k].centre, charniere, axe, 1)[2] < 0 ? 1 : -1;
      for (const j of sousBranche) {
        for (const nom of ['centre', 'droite', 'haut']) {
          points[j][nom] = quartDeTour(points[j][nom], charniere, axe, sens);
        }
      }
      branche.push(...sousBranche);
    });
    return branche;
  }
  if (replier(0).length !== cellules.length) throw new Error('patron non connexe');

  const centreDuCube = plus(points[0].centre, [0, 0, -0.5]);
  const entier = (x) => x.map((t) => Math.round(2 * t));
  return points.map((p) => ({
    n: entier(moins(p.centre, centreDuCube)),
    u: entier(moins(p.droite, p.centre)),
    v: entier(moins(p.haut, p.centre)),
  }));
}

/**
 * Les 24 vues possibles du cube plié, sans matrice de rotation : on choisit la face du dessus
 * (6 possibilités) puis, parmi ses 4 voisines, la face de devant ; la face de droite s'en déduit
 * (dessus × devant). Chaque vue donne, pour haut / avant / droite, la case et la rotation du motif.
 */
export function vuesDuCube(reperes, cellules) {
  const vues = [];
  reperes.forEach((dessus, t) => {
    reperes.forEach((devant, f) => {
      if (scalaire(dessus.n, devant.n) !== 0) return;
      const versLaDroite = vectoriel(dessus.n, devant.n);
      const d = reperes.findIndex((r) => egaux(r.n, versLaDroite));
      if (d === -1) throw new Error('cube incomplet');
      // Repères de lecture des trois faces visibles, exprimés dans le repère de la vue.
      const lecture = {
        haut: { indice: t, droite: versLaDroite, haut: oppose(devant.n) },
        avant: { indice: f, droite: versLaDroite, haut: dessus.n },
        droite: { indice: d, droite: oppose(devant.n), haut: dessus.n },
      };
      const vue = {};
      for (const face of FACES_VISIBLES) {
        const { indice, droite, haut } = lecture[face];
        vue[face] = {
          indice,
          rotation: angleDansLeRepere(hautDuMotif(reperes[indice], cellules[indice].rotation ?? 0), droite, haut),
        };
      }
      vues.push(vue);
    });
  });
  return vues;
}
