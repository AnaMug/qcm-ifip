import { URL_DEPOT } from '../config.js';
import { LIBELLES_THEMES } from '../core/constants.js';
import { statsParTheme, questionsARevoir } from '../core/stats.js';
import { urlSignalement } from '../core/signalement.js';
import Badges from './Badges.jsx';

const pourcentage = (taux) =>
  taux === null ? '—' : taux.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 0 });

export default function Statistiques({ questions, progression, onRevoir }) {
  const stats = statsParTheme(questions, progression);
  const aRevoir = questionsARevoir(questions, progression);

  return (
    <>
      <h1>Statistiques</h1>

      <section className="carte">
        <h2>Par thème</h2>
        <ul className="stats">
          {stats.map((s) => (
            <li key={s.theme}>
              <div className="stats-tete">
                <strong>{LIBELLES_THEMES[s.theme]}</strong>
                <span className="stats-taux">{pourcentage(s.taux)}</span>
              </div>
              <div className="discret">
                {s.vues} / {s.nbQuestions} question{s.nbQuestions > 1 ? 's' : ''} vue{s.vues > 1 ? 's' : ''} ·{' '}
                {s.bonnes} bonne{s.bonnes > 1 ? 's' : ''} · {s.fausses} fausse{s.fausses > 1 ? 's' : ''} ·{' '}
                {s.abstentions} abstention{s.abstentions > 1 ? 's' : ''}
                {s.reponsesGenerees > 0 &&
                  ` · dont ${s.reponsesGenerees} réponse${s.reponsesGenerees > 1 ? 's' : ''} à des questions générées`}
              </div>
            </li>
          ))}
        </ul>
        <p className="discret">
          Le pourcentage est la part de bonnes réponses sur l'ensemble des réponses données (abstentions
          comprises), tous modes confondus.
        </p>
      </section>

      <section className="carte">
        <h2>Questions ratées à revoir ({aRevoir.length})</h2>
        {aRevoir.length === 0 ? (
          <p>Aucune question à revoir pour le moment.</p>
        ) : (
          <>
            <p className="discret">
              Questions dont la dernière réponse était fausse. Elles quittent la liste dès qu'elles sont réussies.
            </p>
            <button
              type="button"
              className="bouton bouton-principal"
              onClick={() => onRevoir(aRevoir.map((q) => q.id))}
            >
              Revoir ces questions
            </button>
            <ul className="a-revoir">
              {aRevoir.map((q) => (
                <li key={q.id}>
                  <Badges question={q} />
                  <p>{q.enonce}</p>
                  <a href={urlSignalement(URL_DEPOT, q)} target="_blank" rel="noopener noreferrer">
                    Signaler une erreur
                  </a>{' '}
                  <span className="discret">(question {q.id})</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
