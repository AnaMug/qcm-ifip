import { useState } from 'react';
import {
  THEMES,
  LIBELLES_THEMES,
  NB_GENEREES_PAR_SEANCE,
  THEME_DES_GENERATEURS,
} from '../core/constants.js';
import { compterParTheme, filtrerQuestions, selectionEntrainement } from '../core/questions.js';
import { composerEntrainement, generationActive } from '../core/entrainement.js';
import {
  creerSession,
  questionCourante,
  reponseCourante,
  estDerniere,
  repondre,
  suivante,
  resultatDeQuestion,
} from '../core/session.js';
import QuestionCarte from './QuestionCarte.jsx';
import Correction from './Correction.jsx';

export default function Entrainement({
  questions,
  idsImposes,
  reglages,
  onReglages,
  onConsigner,
  onTerminer,
}) {
  const [themes, setThemes] = useState(THEMES);
  const [session, setSession] = useState(() =>
    idsImposes ? creerSession(selectionEntrainement(questions, { ids: idsImposes })) : null,
  );

  // Étape 1 : choix des thèmes
  if (session === null) {
    const parTheme = compterParTheme(questions);
    const nbFichier = filtrerQuestions(questions, { themes }).length;
    const avecGenerees = generationActive({ themes, ...reglages });
    const nbSelection = nbFichier + (avecGenerees ? NB_GENEREES_PAR_SEANCE : 0);
    const commencer = () => {
      // La graine vient de l'heure courante : chaque séance reçoit de nouvelles questions générées.
      const graine = Date.now() % 2147483647;
      setSession(creerSession(composerEntrainement(questions, { themes, ...reglages, graine })));
    };
    const basculer = (theme) =>
      setThemes((actuels) =>
        actuels.includes(theme) ? actuels.filter((t) => t !== theme) : [...actuels, theme],
      );

    return (
      <>
        <h1>Entraînement</h1>
        <section className="carte">
          <h2>Thèmes</h2>
          <ul className="liste-cases">
            {THEMES.map((t) => (
              <li key={t}>
                <label className="case">
                  <input type="checkbox" checked={themes.includes(t)} onChange={() => basculer(t)} />
                  <span>{LIBELLES_THEMES[t]}</span>
                  <span className="discret">
                    {parTheme[t]} question{parTheme[t] > 1 ? 's' : ''}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <label className="case">
            <input
              type="checkbox"
              checked={reglages.inclureGenerees}
              onChange={(e) => onReglages({ inclureGenerees: e.target.checked })}
            />
            <span>Inclure des questions générées (thème {LIBELLES_THEMES[THEME_DES_GENERATEURS]})</span>
          </label>
          <p className="discret">
            {avecGenerees
              ? `${NB_GENEREES_PAR_SEANCE} questions de logique calculées par l’application s’ajoutent à la séance ; elles changent à chaque séance.`
              : reglages.inclureGenerees && reglages.verifieesSeulement
                ? 'Aucune question générée : le réglage « N’afficher que les questions vérifiées » les écarte.'
                : reglages.inclureGenerees
                  ? `Les questions générées s’ajoutent quand le thème ${LIBELLES_THEMES[THEME_DES_GENERATEURS]} est coché.`
                  : 'Seules les questions du sujet sont proposées.'}
          </p>
          <button
            type="button"
            className="bouton bouton-principal"
            disabled={nbSelection === 0}
            onClick={commencer}
          >
            Commencer ({nbSelection} question{nbSelection > 1 ? 's' : ''})
          </button>
          {nbSelection === 0 && <p className="note">Aucune question disponible pour cette sélection.</p>}
        </section>
      </>
    );
  }

  const question = questionCourante(session);
  if (question === null) {
    return (
      <>
        <h1>Entraînement</h1>
        <p className="note">Aucune question disponible.</p>
      </>
    );
  }

  // Étape 2 : questions une à une, correction immédiate
  const reponse = reponseCourante(session);
  const aRepondu = reponse !== undefined;

  const choisir = (numero) => {
    if (aRepondu) return;
    setSession(repondre(session, numero));
    onConsigner([resultatDeQuestion(question, numero)]);
  };

  const continuer = () => {
    if (estDerniere(session)) {
      onTerminer(session);
    } else {
      setSession(suivante(session));
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <h1>Entraînement</h1>
      <QuestionCarte
        question={question}
        etiquette={`Question ${session.index + 1} / ${session.questions.length}`}
        reponse={reponse}
        onChoisir={choisir}
        corrige={aRepondu}
      />
      {aRepondu && <Correction question={question} reponse={reponse} />}
      <div className="rangee">
        {aRepondu && (
          <button type="button" className="bouton bouton-principal" onClick={continuer}>
            {estDerniere(session) ? 'Voir le résultat' : 'Question suivante'}
          </button>
        )}
        {!(aRepondu && estDerniere(session)) && (
          <button type="button" className="bouton" onClick={() => onTerminer(session)}>
            Terminer la séance
          </button>
        )}
      </div>
    </>
  );
}
