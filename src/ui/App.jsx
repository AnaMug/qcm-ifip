import { useEffect, useState } from 'react';
import donneesQuestions from '../data/questions.json';
import { REGLAGES_PAR_DEFAUT } from '../core/constants.js';
import { preparerQuestions, filtrerQuestions } from '../core/questions.js';
import { questionsRepondues, resultatsDeSession } from '../core/session.js';
import { progressionVide, enregistrerResultats } from '../core/stats.js';
import {
  chargerReglages,
  sauverReglages,
  chargerProgression,
  sauverProgression,
  normaliserReglages,
} from '../core/persistance.js';
import Accueil from './Accueil.jsx';
import Entrainement from './Entrainement.jsx';
import Examen from './Examen.jsx';
import Resultat from './Resultat.jsx';
import Statistiques from './Statistiques.jsx';
import Reglages from './Reglages.jsx';

// Validation unique au chargement : les questions non conformes au schéma sont écartées.
const { questions: toutesLesQuestions, erreurs: erreursDeSchema } = preparerQuestions(donneesQuestions);

export default function App() {
  const [pret, setPret] = useState(false);
  const [reglages, setReglages] = useState(REGLAGES_PAR_DEFAUT);
  const [progression, setProgression] = useState(progressionVide);
  const [ecran, setEcran] = useState({ nom: 'accueil' });

  useEffect(() => {
    let actif = true;
    Promise.all([chargerReglages(), chargerProgression()]).then(([r, p]) => {
      if (!actif) return;
      setReglages(r);
      setProgression(p);
      setPret(true);
    });
    return () => {
      actif = false;
    };
  }, []);

  const allerA = (nom, parametres = {}) => {
    setEcran({ nom, ...parametres });
    window.scrollTo(0, 0);
  };

  const modifierReglages = (modifications) => {
    const nouveaux = normaliserReglages({ ...reglages, ...modifications });
    setReglages(nouveaux);
    sauverReglages(nouveaux);
  };

  const consigner = (resultats) => {
    const nouvelle = enregistrerResultats(progression, resultats, new Date().toISOString());
    setProgression(nouvelle);
    sauverProgression(nouvelle);
  };

  const questionsVisibles = filtrerQuestions(toutesLesQuestions, {
    verifieesSeulement: reglages.verifieesSeulement,
  });

  const finEntrainement = (session) => {
    const repondues = questionsRepondues(session);
    if (repondues.length === 0) {
      allerA('accueil');
      return;
    }
    allerA('resultat', { mode: 'entrainement', questions: repondues, reponses: session.reponses });
  };

  const finExamen = (session) => {
    consigner(resultatsDeSession(session.questions, session.reponses));
    allerA('resultat', { mode: 'examen', questions: session.questions, reponses: session.reponses });
  };

  let contenu;
  if (!pret) {
    contenu = <p className="discret">Chargement…</p>;
  } else if (ecran.nom === 'entrainement') {
    contenu = (
      <Entrainement
        key={ecran.cle}
        questions={questionsVisibles}
        idsImposes={ecran.ids ?? null}
        onConsigner={consigner}
        onTerminer={finEntrainement}
      />
    );
  } else if (ecran.nom === 'examen') {
    contenu = (
      <Examen
        questions={questionsVisibles}
        reglages={reglages}
        onReglages={modifierReglages}
        onTerminer={finExamen}
        onAnnuler={() => allerA('accueil')}
      />
    );
  } else if (ecran.nom === 'resultat') {
    contenu = (
      <Resultat
        mode={ecran.mode}
        questions={ecran.questions}
        reponses={ecran.reponses}
        reglages={reglages}
        onReglages={modifierReglages}
        onAccueil={() => allerA('accueil')}
        onStatistiques={() => allerA('statistiques')}
      />
    );
  } else if (ecran.nom === 'statistiques') {
    contenu = (
      <Statistiques
        questions={questionsVisibles}
        progression={progression}
        onRevoir={(ids) => allerA('entrainement', { ids, cle: `revoir-${Date.now()}` })}
      />
    );
  } else if (ecran.nom === 'reglages') {
    contenu = <Reglages reglages={reglages} onReglages={modifierReglages} />;
  } else {
    contenu = (
      <Accueil
        toutesLesQuestions={toutesLesQuestions}
        questionsVisibles={questionsVisibles}
        erreursDeSchema={erreursDeSchema}
        reglages={reglages}
        onNaviguer={allerA}
      />
    );
  }

  return (
    <div className="page">
      <header className="entete">
        <span className="entete-titre">QCM Inspecteur des finances publiques</span>
        {ecran.nom !== 'accueil' && (
          <button type="button" className="bouton bouton-lien" onClick={() => allerA('accueil')}>
            Accueil
          </button>
        )}
      </header>
      <main>{contenu}</main>
    </div>
  );
}
