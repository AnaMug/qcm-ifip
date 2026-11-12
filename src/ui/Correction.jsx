import { URL_DEPOT } from '../config.js';
import { RESULTATS, MENTION_REPONSE_NON_ETABLIE } from '../core/constants.js';
import { evaluerReponse } from '../core/score.js';
import { urlSignalement, urlSourceValide } from '../core/signalement.js';

export default function Correction({ question, reponse }) {
  const resultat = evaluerReponse(question, reponse);
  const nonEtablie = question.bonne_reponse === null;

  let verdict;
  if (nonEtablie) {
    verdict = MENTION_REPONSE_NON_ETABLIE;
  } else if (resultat === RESULTATS.BONNE) {
    verdict = 'Bonne réponse';
  } else if (resultat === RESULTATS.FAUSSE) {
    verdict = `Mauvaise réponse. La bonne réponse est le choix ${question.bonne_reponse}.`;
  } else {
    verdict = `Abstention. La bonne réponse est le choix ${question.bonne_reponse}.`;
  }
  const ton = nonEtablie ? 'neutre' : resultat;

  const { libelle, url } = question.source;

  return (
    <div className={`correction correction-${ton}`}>
      <p className="verdict">{verdict}</p>

      <p>{question.explication ?? <em>Explication non encore rédigée.</em>}</p>

      {question.extrait_source !== null && (
        <blockquote className="extrait">{question.extrait_source}</blockquote>
      )}

      <p className="source">
        Source :{' '}
        {urlSourceValide(url) ? (
          <a href={url.trim()} target="_blank" rel="noopener noreferrer">
            {libelle.trim() || url.trim()}
          </a>
        ) : (
          libelle.trim() || <em>non renseignée</em>
        )}
        {question.confiance !== null && <> · Confiance : {question.confiance}</>}
      </p>

      <p className="signaler">
        <a href={urlSignalement(URL_DEPOT, question)} target="_blank" rel="noopener noreferrer">
          Signaler une erreur
        </a>{' '}
        <span className="discret">(question {question.id})</span>
      </p>
    </div>
  );
}
