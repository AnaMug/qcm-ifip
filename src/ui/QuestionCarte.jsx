import { IMAGE_A_FOURNIR } from '../core/constants.js';
import Badges from './Badges.jsx';
import Figure from './Figure.jsx';
import CubeFigure from './CubeFigure.jsx';

// Composant de dessin selon le type de description.
const dessinPour = (figure) => (['patron', 'cube'].includes(figure.kind) ? CubeFigure : Figure);

/**
 * Affiche une question et ses 4 choix. Un choix est un texte ou, pour une question à figure,
 * une description dessinée par Figure.jsx.
 * - `onChoisir` absent ou `corrige` vrai : les choix ne sont plus cliquables.
 * - `corrige` vrai : la bonne réponse (si elle est établie) et l'erreur éventuelle sont marquées.
 */
export default function QuestionCarte({ question, etiquette, reponse, onChoisir, corrige = false }) {
  const verrouille = corrige || !onChoisir;
  const DessinEnonce = question.figure ? dessinPour(question.figure) : null;
  const choixDessines = typeof question.choix[0] !== 'string';

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

      {question.figure && (
        <div className="figure-enonce">
          <DessinEnonce figure={question.figure} className={`figure figure-${question.figure.kind}`} />
        </div>
      )}

      <ol className={`choix${choixDessines ? ' choix-figures' : ''}`}>
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
                {typeof texte === 'string' ? (
                  <span className="choix-texte">{texte}</span>
                ) : (
                  <span className="choix-dessin">
                    {(() => {
                      const Dessin = dessinPour(texte);
                      return <Dessin figure={texte} className={`figure figure-choix figure-choix-${texte.kind ?? 'case'}`} />;
                    })()}
                  </span>
                )}
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
