import { MENTION_BAREME, MENTION_REPONSE_NON_ETABLIE } from '../core/constants.js';
import { calculerBilan } from '../core/score.js';
import BaremeForm from './BaremeForm.jsx';
import QuestionCarte from './QuestionCarte.jsx';
import Correction from './Correction.jsx';

const nombre = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

export default function Resultat({
  mode,
  questions,
  reponses,
  reglages,
  onReglages,
  onAccueil,
  onStatistiques,
}) {
  const bilan = calculerBilan(questions, reponses, reglages.bareme);

  return (
    <>
      <h1>Résultat {mode === 'examen' ? "de l'examen blanc" : "de l'entraînement"}</h1>

      <section className="carte">
        <ul className="tuiles">
          <li className="tuile tuile-bonne">
            <strong>{bilan.bonnes}</strong>
            <span>bonne{bilan.bonnes > 1 ? 's' : ''}</span>
          </li>
          <li className="tuile tuile-fausse">
            <strong>{bilan.fausses}</strong>
            <span>fausse{bilan.fausses > 1 ? 's' : ''}</span>
          </li>
          <li className="tuile">
            <strong>{bilan.abstentions}</strong>
            <span>abstention{bilan.abstentions > 1 ? 's' : ''}</span>
          </li>
        </ul>
        <p className="discret">
          Sur {bilan.total} question{bilan.total > 1 ? 's' : ''}.
          {bilan.nonEtablies > 0 &&
            ` ${bilan.nonEtablies} réponse${bilan.nonEtablies > 1 ? 's' : ''} non comptée${
              bilan.nonEtablies > 1 ? 's' : ''
            } (${MENTION_REPONSE_NON_ETABLIE.toLowerCase()}).`}
        </p>
      </section>

      <section className="carte">
        <h2>Score indicatif</h2>
        <p className="score">
          {nombre(bilan.score)} <span className="score-max">/ {nombre(bilan.scoreMax)}</span>
        </p>
        <p className="note">{MENTION_BAREME}</p>
        <h3>Barème (points par question)</h3>
        <BaremeForm bareme={reglages.bareme} onChange={(bareme) => onReglages({ bareme })} />
      </section>

      <div className="rangee">
        <button type="button" className="bouton bouton-principal" onClick={onAccueil}>
          Retour à l'accueil
        </button>
        <button type="button" className="bouton" onClick={onStatistiques}>
          Statistiques
        </button>
      </div>

      <h2>Correction détaillée</h2>
      {bilan.details.map(({ question, reponse }, i) => (
        <div className="bloc-correction" key={question.id}>
          <QuestionCarte
            question={question}
            etiquette={`Question ${i + 1} / ${bilan.total}`}
            reponse={reponse}
            corrige
          />
          <Correction question={question} reponse={reponse} />
        </div>
      ))}
    </>
  );
}
