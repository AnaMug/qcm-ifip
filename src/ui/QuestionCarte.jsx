import { IMAGE_A_FOURNIR } from '../core/constants.js';
import Badges from './Badges.jsx';

/**
 * Affiche une question et ses 4 choix.
 * - `onChoisir` absent ou `corrige` vrai : les choix ne sont plus cliquables.
 * - `corrige` vrai : la bonne réponse (si elle est établie) et l'erreur éventuelle sont marquées.
 */
export default function QuestionCarte({ question, etiquette, reponse, onChoisir, corrige = false }) {
  const verrouille = corrige || !onChoisir;

  return (
    <article className="question">
      <div className="question-tete">
        {etiquette && <span className="question-numero">{etiquette}</span>}
        <Badges question={question} />
      </div>

      <p className="enonce">{question.enonce}</p>

      {question.image === IMAGE_A_FOURNIR && (
        <p className="image-manquante">Image à fournir : cette question comporte une illustration non encore disponible.</p>
      )}
      {question.image !== null && question.image !== IMAGE_A_FOURNIR && (
        <img
          className="illustration"
          src={`${import.meta.env.BASE_URL}${question.image.replace(/^\/+/, '')}`}
          alt={`Illustration de la question ${question.id}`}
        />
      )}

      <ol className="choix">
        {question.choix.map((texte, i) => {
          const numero = i + 1;
          const choisi = reponse === numero;
          const estBonne = corrige && question.bonne_reponse === numero;
          const estErreur = corrige && choisi && question.bonne_reponse !== null && !estBonne;
          const classes = ['choix-bouton'];
          if (choisi) classes.push('choisi');
          if (estBonne) classes.push('bon');
          if (estErreur) classes.push('faux');

          return (
            <li key={numero}>
              <button
                type="button"
                className={classes.join(' ')}
                disabled={verrouille}
                aria-pressed={choisi}
                onClick={() => onChoisir(numero)}
              >
                <span className="choix-numero">{numero}</span>
                <span className="choix-texte">{texte}</span>
                {corrige && (estBonne || choisi) && (
                  <span className="choix-marque">
                    {estBonne && '✓ Bonne réponse'}
                    {estBonne && choisi && ' · '}
                    {choisi && 'Votre réponse'}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
