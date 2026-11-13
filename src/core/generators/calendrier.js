// Générateur « calendrier » : jour de la semaine dans N jours, ou il y a N jours.
// JavaScript pur, sans Math.random.

import { aleaPour } from '../random.js';
import { assemblerQuestion, creerGenerateur } from './commun.js';

const TYPE = 'calendrier';
const VERSION = 1;
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const majuscule = (texte) => texte[0].toUpperCase() + texte.slice(1);
const modulo7 = (x) => ((x % 7) + 7) % 7;

// Nombre de semaines entières contenues dans N, et sens autorisés.
const PAR_NIVEAU = {
  1: { semainesMin: 1, semainesMax: 4, passe: false },
  2: { semainesMin: 5, semainesMax: 14, passe: true },
  3: { semainesMin: 15, semainesMax: 140, passe: true },
};

function construire(seed, niveau) {
  const alea = aleaPour(TYPE, seed, niveau);
  const reglage = PAR_NIVEAU[niveau];
  const depart = alea.entier(0, 6);
  const semaines = alea.entier(reglage.semainesMin, reglage.semainesMax);
  const reste = alea.entier(1, 6); // jamais un multiple de 7 : la réponse serait le jour de départ
  const n = semaines * 7 + reste;
  const versLePasse = reglage.passe && alea.booleen();
  const sens = versLePasse ? -1 : 1;
  const reponse = modulo7(depart + sens * reste);

  const pieges = [
    { jour: modulo7(reponse - sens), erreur: 'le jour de départ a été compté comme premier jour' },
    { jour: modulo7(depart - sens * reste), erreur: versLePasse ? 'décompte vers l’avenir au lieu du passé' : 'décompte vers le passé au lieu de l’avenir' },
    { jour: depart, erreur: `reste de la division par 7 oublié (${n} traité comme un nombre entier de semaines)` },
    { jour: modulo7(reponse + sens), erreur: 'un jour de trop' },
    { jour: modulo7(depart + sens * semaines), erreur: `quotient (${semaines}) utilisé à la place du reste (${reste})` },
  ];

  const enonce = versLePasse
    ? `Si aujourd’hui est ${JOURS[depart]}, quel jour était-on il y a ${n} jours ?`
    : `Si aujourd’hui est ${JOURS[depart]}, quel jour sera-t-on dans ${n} jours ?`;
  const pluriel = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  const explication =
    `${n} = ${semaines} × 7 + ${reste}. ${majuscule(pluriel(semaines, 'semaine'))} ` +
    `${semaines > 1 ? 'entières ramènent' : 'entière ramène'} au même jour, un ${JOURS[depart]}. ` +
    `Il reste ${pluriel(reste, 'jour')} à compter ${versLePasse ? 'en arrière' : 'en avant'} : ${JOURS[reponse]}.`;

  return assemblerQuestion({
    type: TYPE,
    version: VERSION,
    seed,
    niveau,
    enonce,
    bonne: majuscule(JOURS[reponse]),
    pieges: pieges.filter((p) => p.jour !== reponse).map((p) => ({ texte: majuscule(JOURS[p.jour]), erreur: p.erreur })),
    comparer: (a, b) => JOURS.indexOf(a.toLowerCase()) - JOURS.indexOf(b.toLowerCase()),
    explication,
    alea,
  });
}

function resoudre(question) {
  const lu = /^Si aujourd’hui est (\S+), quel jour (sera-t-on dans|était-on il y a) (\d+) jours \?$/.exec(question.enonce);
  if (lu === null) throw new Error('énoncé illisible');
  let jour = JOURS.indexOf(lu[1]);
  if (jour < 0) throw new Error(`jour de départ inconnu : ${lu[1]}`);
  const versLePasse = lu[2] !== 'sera-t-on dans';
  // Méthode indépendante : on avance (ou recule) d'un jour à la fois, sans division.
  for (let i = 0; i < Number(lu[3]); i += 1) {
    if (versLePasse) jour = jour === 0 ? 6 : jour - 1;
    else jour = jour === 6 ? 0 : jour + 1;
  }
  return {
    accepte: (texte) => texte.toLowerCase() === JOURS[jour],
    cle: (texte) => texte.toLowerCase(),
    controle: (texte) => (JOURS.includes(texte.toLowerCase()) ? null : 'jour de la semaine attendu'),
  };
}

export default creerGenerateur({
  type: TYPE,
  version: VERSION,
  libelle: 'Calendrier',
  construire,
  resoudre,
});
