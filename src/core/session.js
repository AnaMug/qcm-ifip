// État d'une séance (entraînement ou examen blanc), manipulé par fonctions pures.
// JavaScript pur : aucun import de React, aucun accès au DOM.

import { evaluerReponse } from './score.js';

/** @returns {{ questions: object[], reponses: Record<string, any>, index: number }} */
export function creerSession(questions) {
  return { questions, reponses: {}, index: 0 };
}

export function questionCourante(session) {
  return session.questions[session.index] ?? null;
}

export function reponseCourante(session) {
  const q = questionCourante(session);
  return q ? session.reponses[q.id] : undefined;
}

export function estPremiere(session) {
  return session.index === 0;
}

export function estDerniere(session) {
  return session.index >= session.questions.length - 1;
}

/** Enregistre la réponse (1 à 4, ou ABSTENTION) à la question courante. */
export function repondre(session, reponse) {
  const q = questionCourante(session);
  if (!q) return session;
  return { ...session, reponses: { ...session.reponses, [q.id]: reponse } };
}

export function allerA(session, index) {
  const borne = Math.min(Math.max(index, 0), session.questions.length - 1);
  return { ...session, index: borne };
}

export const suivante = (session) => allerA(session, session.index + 1);
export const precedente = (session) => allerA(session, session.index - 1);

export function nombreDeReponses(session) {
  return session.questions.filter((q) => session.reponses[q.id] !== undefined).length;
}

/** Questions auxquelles une réponse (ou une abstention explicite) a été donnée. */
export function questionsRepondues(session) {
  return session.questions.filter((q) => session.reponses[q.id] !== undefined);
}

/** Résultats à consigner dans la progression : [{ id, resultat }]. */
export function resultatsDeSession(questions, reponses) {
  return questions.map((q) => ({ id: q.id, resultat: evaluerReponse(q, reponses[q.id]) }));
}
