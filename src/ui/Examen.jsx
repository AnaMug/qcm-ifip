import { useEffect, useRef, useState } from 'react';
import { ABSTENTION } from '../core/constants.js';
import { selectionExamen } from '../core/questions.js';
import {
  demarrerChrono,
  secondesRestantes,
  formaterDuree,
  normaliserDureeMinutes,
} from '../core/chrono.js';
import {
  creerSession,
  questionCourante,
  reponseCourante,
  estPremiere,
  estDerniere,
  repondre,
  suivante,
  precedente,
  nombreDeReponses,
} from '../core/session.js';
import QuestionCarte from './QuestionCarte.jsx';

export default function Examen({ questions, reglages, onReglages, onTerminer, onAnnuler }) {
  const [session, setSession] = useState(() => creerSession(selectionExamen(questions)));
  const [saisieDuree, setSaisieDuree] = useState(String(reglages.dureeExamenMin));
  const [chrono, setChrono] = useState(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [confirmation, setConfirmation] = useState(false);
  const termine = useRef(false);

  // Rafraîchit l'heure courante ; le temps restant est calculé par src/core/chrono.js.
  useEffect(() => {
    if (chrono === null) return undefined;
    const minuteur = setInterval(() => setMaintenant(Date.now()), 500);
    return () => clearInterval(minuteur);
  }, [chrono]);

  const restant = chrono === null ? null : secondesRestantes(chrono, maintenant);

  const terminer = () => {
    if (termine.current) return;
    termine.current = true;
    onTerminer(session);
  };

  // Fin automatique quand le temps est écoulé.
  useEffect(() => {
    if (restant !== null && restant <= 0) terminer();
  });

  const total = session.questions.length;

  // Étape 1 : réglage de la durée
  if (chrono === null) {
    const demarrer = () => {
      const minutes = normaliserDureeMinutes(saisieDuree, reglages.dureeExamenMin);
      onReglages({ dureeExamenMin: minutes });
      const debut = Date.now();
      setMaintenant(debut);
      setChrono(demarrerChrono(minutes * 60, debut));
    };

    return (
      <>
        <h1>Examen blanc</h1>
        <section className="carte">
          <p>
            {total} question{total > 1 ? 's' : ''} officielle{total > 1 ? 's' : ''}, dans l'ordre des thèmes.
            La correction n'est affichée qu'à la fin. Une question laissée sans réponse compte comme une
            abstention.
          </p>
          <label className="champ">
            <span>Durée du chronomètre (minutes)</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="600"
              value={saisieDuree}
              onChange={(e) => setSaisieDuree(e.target.value)}
            />
          </label>
          <div className="rangee">
            <button type="button" className="bouton bouton-principal" disabled={total === 0} onClick={demarrer}>
              Démarrer
            </button>
            <button type="button" className="bouton" onClick={onAnnuler}>
              Annuler
            </button>
          </div>
          {total === 0 && <p className="note">Aucune question officielle disponible avec les réglages actuels.</p>}
        </section>
      </>
    );
  }

  // Étape 2 : épreuve chronométrée
  const question = questionCourante(session);
  const reponse = reponseCourante(session);

  const abstenir = () => {
    const avecAbstention = repondre(session, ABSTENTION);
    setSession(estDerniere(session) ? avecAbstention : suivante(avecAbstention));
  };

  return (
    <>
      <div className="barre-examen">
        <span>
          Question {session.index + 1} / {total}
        </span>
        <span className="discret">
          {nombreDeReponses(session)} traitée{nombreDeReponses(session) > 1 ? 's' : ''}
        </span>
        <span className={`chrono${restant <= 300 ? ' chrono-urgent' : ''}`} aria-label="Temps restant">
          {formaterDuree(restant)}
        </span>
      </div>

      <QuestionCarte
        question={question}
        reponse={reponse}
        onChoisir={(numero) => setSession(repondre(session, numero))}
      />

      <div className="rangee">
        <button
          type="button"
          className={`bouton${reponse === ABSTENTION ? ' bouton-actif' : ''}`}
          aria-pressed={reponse === ABSTENTION}
          onClick={abstenir}
        >
          Je m'abstiens
        </button>
      </div>

      <div className="rangee rangee-navigation">
        <button
          type="button"
          className="bouton"
          disabled={estPremiere(session)}
          onClick={() => setSession(precedente(session))}
        >
          Précédente
        </button>
        <button
          type="button"
          className="bouton"
          disabled={estDerniere(session)}
          onClick={() => setSession(suivante(session))}
        >
          Suivante
        </button>
      </div>

      <div className="rangee">
        {confirmation ? (
          <>
            <span>
              Terminer maintenant ? {total - nombreDeReponses(session)} question
              {total - nombreDeReponses(session) > 1 ? 's' : ''} sans réponse.
            </span>
            <button type="button" className="bouton bouton-principal" onClick={terminer}>
              Oui, terminer
            </button>
            <button type="button" className="bouton" onClick={() => setConfirmation(false)}>
              Continuer l'examen
            </button>
          </>
        ) : (
          <button type="button" className="bouton" onClick={() => setConfirmation(true)}>
            Terminer l'examen
          </button>
        )}
      </div>
    </>
  );
}
