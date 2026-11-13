// Contrôle des générateurs : node scripts/check-generators.mjs (ou « npm run check »).
// Sans dépendance. Pour chaque générateur et chaque niveau, génère 1 000 questions avec des
// graines différentes et appelle verify(). Le script sort avec le code 1 au moindre échec.

import { GENERATEURS, NIVEAUX } from '../src/core/generators/index.js';
import { PERIODE_SYMETRIE } from '../src/core/figures/formes.js';
import { PATRONS, presenterPatron, signaturePatron } from '../src/core/cube/patrons.js';
import { controlerCube, lireCube, plierParRoulement, rotationsDuCube, tournerReperes } from '../src/core/cube/pliage.js';
import { plierGeometriquement, vuesDuCube } from '../src/core/cube/pliage-geometrique.js';
import { FACES_VISIBLES } from '../src/core/cube/reperes.js';
import { normaliserFace } from '../src/core/cube/motifs.js';

const PAR_NIVEAU = 1000;
let echecsTotal = 0;

// ---------------------------------------------------------------------------------------------
// Test obligatoire : chacun des 11 patrons se plie en un cube valide (6 positions distinctes,
// chaque face a 4 voisines et 1 face opposée), dans ses 8 présentations et avec les deux
// méthodes de pliage, qui doivent donner les mêmes 24 vues.
// ---------------------------------------------------------------------------------------------
{
  const problemes = [];
  const signatures = new Set(PATRONS.map(signaturePatron));
  if (PATRONS.length !== 11) problemes.push(`${PATRONS.length} patrons au lieu de 11`);
  if (signatures.size !== PATRONS.length) problemes.push('deux patrons sont identiques à une rotation ou un retournement près');
  const tableau = PATRONS.map((patron, numero) => {
    let valides = 0;
    let accords = 0;
    if (patron.length !== 6) problemes.push(`patron ${numero + 1} : ${patron.length} cases au lieu de 6`);
    for (let k = 0; k < 8; k += 1) {
      const cellules = presenterPatron(patron, k).map((c, i) => ({ ...c, rotation: (i * 90) % 360 }));
      const parRoulement = plierParRoulement(cellules);
      const parGeometrie = plierGeometriquement(cellules);
      const defauts = [...controlerCube(parRoulement), ...controlerCube(parGeometrie)];
      if (defauts.length === 0) valides += 1;
      else problemes.push(`patron ${numero + 1}, présentation ${k + 1} : ${defauts.join(' ; ')}`);
      // Les deux méthodes doivent décrire le même cube : mêmes 24 vues (cases et orientations).
      const cle = (vue) => FACES_VISIBLES.map((f) => `${vue[f].indice}@${vue[f].rotation}`).join('|');
      const a = new Set(rotationsDuCube().map((m) => cle(lireCube(tournerReperes(parRoulement, m), cellules))));
      const b = new Set(vuesDuCube(parGeometrie, cellules).map(cle));
      if (a.size === 24 && b.size === 24 && [...a].every((x) => b.has(x))) accords += 1;
      else problemes.push(`patron ${numero + 1}, présentation ${k + 1} : les deux pliages ne donnent pas les mêmes vues`);
    }
    return { patron: numero + 1, 'présentations valides': `${valides}/8`, 'pliages concordants': `${accords}/8` };
  });
  console.log('Patrons de cube');
  console.table(tableau);
  if (problemes.length > 0) {
    echecsTotal += problemes.length;
    for (const p of problemes) console.log(`  - ${p}`);
  } else {
    console.log('OK : les 11 patrons, tous différents, se plient en un cube valide.\n');
  }
}

const lignes = [];
const exemples = [];

for (const generateur of Object.values(GENERATEURS)) {
  for (const niveau of NIVEAUX) {
    const bilan = { echecs: 0, exceptions: 0, grainesRemplacees: 0, nonReproductibles: 0, faussesNonDetectees: 0, doublonsNonDetectes: 0, vuesNonDetectees: 0 };
    const enonces = new Set();
    const positions = [0, 0, 0, 0];

    for (let seed = 0; seed < PAR_NIVEAU; seed += 1) {
      let question;
      try {
        question = generateur.generate(seed, niveau);
      } catch (e) {
        bilan.exceptions += 1;
        if (exemples.length < 10) exemples.push(`${generateur.type} niveau ${niveau} graine ${seed} : ${e.message}`);
        continue;
      }

      // 1. verify() sur la question générée
      const controle = generateur.verify(question);
      if (!controle.ok) {
        bilan.echecs += 1;
        if (exemples.length < 10) exemples.push(`${question.id} : ${controle.erreurs.join(' ; ')}`);
      }
      // 2. La graine demandée a-t-elle dû être remplacée par une suivante ?
      if (question.generateur.seed !== seed) bilan.grainesRemplacees += 1;
      // 3. Même graine = même question
      if (JSON.stringify(generateur.generate(seed, niveau)) !== JSON.stringify(question)) {
        bilan.nonReproductibles += 1;
      }
      // 4. Contre-épreuve : si on désigne un autre choix comme bonne réponse, verify() doit refuser
      const faussee = { ...question, bonne_reponse: (question.bonne_reponse % 4) + 1 };
      if (generateur.verify(faussee).ok) bilan.faussesNonDetectees += 1;

      // 5. Grilles : un distracteur remplacé par la bonne case tournée d'un angle de symétrie
      //    (visuellement identique à la bonne réponse) doit être refusé par verify()
      if (question.figure?.kind === 'matrice') {
        const bonne = question.choix[question.bonne_reponse - 1];
        const jumelle = { ...bonne, rotation: bonne.rotation + (PERIODE_SYMETRIE[bonne.forme] || 45) };
        const choix = question.choix.slice();
        choix[question.bonne_reponse % 4] = jumelle;
        if (generateur.verify({ ...question, choix }).ok) bilan.doublonsNonDetectes += 1;
      }

      // 6. Cubes : un distracteur remplacé par une AUTRE vue réelle du cube plié rend deux choix
      //    corrects ; verify() doit refuser la question
      if (question.choix[0]?.kind === 'cube') {
        const { cellules } = question.figure;
        const bonne = question.choix[question.bonne_reponse - 1];
        const clef = (c) => JSON.stringify(FACES_VISIBLES.map((f) => normaliserFace(c.faces[f])));
        const autre = rotationsDuCube()
          .map((m) => lireCube(tournerReperes(plierParRoulement(cellules), m), cellules))
          .map((vue) => ({
            kind: 'cube',
            faces: Object.fromEntries(
              FACES_VISIBLES.map((f) => [f, { motif: cellules[vue[f].indice].motif, rotation: vue[f].rotation, miroir: false }]),
            ),
          }))
          .find((c) => clef(c) !== clef(bonne) && !question.choix.some((x) => clef(x) === clef(c)));
        const choix = question.choix.slice();
        choix[question.bonne_reponse % 4] = autre;
        if (generateur.verify({ ...question, choix }).ok) bilan.vuesNonDetectees += 1;
      }

      enonces.add(question.enonce + JSON.stringify(question.figure ?? ''));
      positions[question.bonne_reponse - 1] += 1;
    }

    const anomalies =
      bilan.echecs +
      bilan.exceptions +
      bilan.nonReproductibles +
      bilan.faussesNonDetectees +
      bilan.doublonsNonDetectes +
      bilan.vuesNonDetectees;
    echecsTotal += anomalies;
    lignes.push({
      'générateur': generateur.type,
      niveau,
      'générées': PAR_NIVEAU - bilan.exceptions,
      'échecs verify': bilan.echecs,
      'erreurs generate': bilan.exceptions,
      'non reproductibles': bilan.nonReproductibles,
      'fausses non détectées': bilan.faussesNonDetectees,
      'jumelles non détectées': generateur.type === 'matrice' ? bilan.doublonsNonDetectes : '—',
      'autres vues non détectées': generateur.type === 'patron_cube' && niveau > 1 ? bilan.vuesNonDetectees : '—',
      'graines remplacées': bilan.grainesRemplacees,
      'énoncés distincts': enonces.size,
      'position bonne réponse (1-2-3-4)': positions.join('-'),
    });
  }
}

console.table(lignes);
if (exemples.length > 0) {
  console.log('Premiers problèmes rencontrés :');
  for (const e of exemples) console.log(`  - ${e}`);
}
console.log(
  echecsTotal === 0
    ? `OK : ${lignes.length * PAR_NIVEAU} questions générées, 0 échec.`
    : `ÉCHEC : ${echecsTotal} anomalie(s) sur ${lignes.length * PAR_NIVEAU} questions.`,
);
process.exit(echecsTotal === 0 ? 0 : 1);
