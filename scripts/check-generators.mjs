// Contrôle des générateurs : node scripts/check-generators.mjs (ou « npm run check »).
// Sans dépendance. Pour chaque générateur et chaque niveau, génère 1 000 questions avec des
// graines différentes et appelle verify(). Le script sort avec le code 1 au moindre échec.

import { GENERATEURS, NIVEAUX } from '../src/core/generators/index.js';
import { PERIODE_SYMETRIE } from '../src/core/figures/formes.js';

const PAR_NIVEAU = 1000;
let echecsTotal = 0;
const lignes = [];
const exemples = [];

for (const generateur of Object.values(GENERATEURS)) {
  for (const niveau of NIVEAUX) {
    const bilan = { echecs: 0, exceptions: 0, grainesRemplacees: 0, nonReproductibles: 0, faussesNonDetectees: 0, doublonsNonDetectes: 0 };
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

      enonces.add(question.enonce + JSON.stringify(question.figure ?? ''));
      positions[question.bonne_reponse - 1] += 1;
    }

    const anomalies =
      bilan.echecs + bilan.exceptions + bilan.nonReproductibles + bilan.faussesNonDetectees + bilan.doublonsNonDetectes;
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
