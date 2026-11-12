// Correction des réponses et calcul du score indicatif.
// JavaScript pur : aucun import de React, aucun accès au DOM.

import { ABSTENTION, RESULTATS, REGLAGES_PAR_DEFAUT } from './constants.js';

/**
 * Corrige une réponse.
 * @param {object} question
 * @param {1|2|3|4|'abstention'|undefined|null} reponse
 * @returns {'bonne'|'fausse'|'abstention'|'non_etablie'}
 */
export function evaluerReponse(question, reponse) {
  if (reponse === undefined || reponse === null || reponse === ABSTENTION) {
    return RESULTATS.ABSTENTION;
  }
  if (question.bonne_reponse === null) return RESULTATS.NON_ETABLIE;
  return reponse === question.bonne_reponse ? RESULTATS.BONNE : RESULTATS.FAUSSE;
}

const nombreOu = (valeur, defaut) =>
  typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : defaut;

/** Garantit un barème complet et numérique. */
export function normaliserBareme(bareme) {
  const d = REGLAGES_PAR_DEFAUT.bareme;
  const b = bareme && typeof bareme === 'object' ? bareme : {};
  return {
    bonne: nombreOu(b.bonne, d.bonne),
    fausse: nombreOu(b.fausse, d.fausse),
    abstention: nombreOu(b.abstention, d.abstention),
  };
}

/**
 * Bilan d'une série de questions.
 * Une question sans réponse compte comme une abstention.
 * Une question dont la bonne réponse n'est pas établie ne rapporte ni ne coûte de point.
 * @param {object[]} questions
 * @param {Record<string, 1|2|3|4|'abstention'>} reponses  réponses indexées par id de question
 * @param {{bonne:number, fausse:number, abstention:number}} bareme
 */
export function calculerBilan(questions, reponses, bareme) {
  const b = normaliserBareme(bareme);
  const details = questions.map((question) => {
    const reponse = reponses[question.id];
    return { question, reponse, resultat: evaluerReponse(question, reponse) };
  });

  const compter = (r) => details.filter((d) => d.resultat === r).length;
  const bonnes = compter(RESULTATS.BONNE);
  const fausses = compter(RESULTATS.FAUSSE);
  const abstentions = compter(RESULTATS.ABSTENTION);
  const nonEtablies = compter(RESULTATS.NON_ETABLIE);
  const notables = questions.filter((q) => q.bonne_reponse !== null).length;

  return {
    total: questions.length,
    bonnes,
    fausses,
    abstentions,
    nonEtablies,
    score: bonnes * b.bonne + fausses * b.fausse + abstentions * b.abstention,
    scoreMax: notables * b.bonne,
    details,
  };
}
