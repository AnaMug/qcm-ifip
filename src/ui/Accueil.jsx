import epreuve from '../data/epreuve.json';
import {
  THEMES,
  LIBELLES_THEMES,
  STATUTS,
  LIBELLES_STATUTS,
  MENTION_BAREME,
} from '../core/constants.js';
import { compterParStatut, selectionExamen } from '../core/questions.js';

export default function Accueil({
  toutesLesQuestions,
  questionsVisibles,
  erreursDeSchema,
  reglages,
  onNaviguer,
}) {
  const parStatut = compterParStatut(toutesLesQuestions);
  const nbExamen = selectionExamen(questionsVisibles).length;
  const nonRenseigne = <em>non renseigné dans l'application</em>;

  return (
    <>
      <h1>Entraînement au QCM</h1>
      <p className="chapeau">{epreuve.intitule}</p>

      <section className="carte">
        <h2>Choisir un mode</h2>
        <div className="modes">
          <button type="button" className="bouton bouton-principal" onClick={() => onNaviguer('entrainement')}>
            Entraînement
            <small>Par thème, ordre aléatoire, correction immédiate</small>
          </button>
          <button type="button" className="bouton bouton-principal" onClick={() => onNaviguer('examen')}>
            Examen blanc
            <small>
              {nbExamen} question{nbExamen > 1 ? 's' : ''} officielle{nbExamen > 1 ? 's' : ''}, chronomètre,
              correction à la fin
            </small>
          </button>
        </div>
        <div className="rangee">
          <button type="button" className="bouton" onClick={() => onNaviguer('statistiques')}>
            Statistiques et questions à revoir
          </button>
          <button type="button" className="bouton" onClick={() => onNaviguer('reglages')}>
            Réglages
          </button>
        </div>
        {reglages.verifieesSeulement && (
          <p className="note">
            Réglage actif : seules les questions au statut « Vérifié » sont proposées (
            {questionsVisibles.length} sur {toutesLesQuestions.length}).
          </p>
        )}
      </section>

      <section className="carte">
        <h2>Rappel du format de l'épreuve</h2>
        <dl className="fiche">
          <dt>Épreuve</dt>
          <dd>{epreuve.format}</dd>
          <dt>Thèmes du QCM</dt>
          <dd>{THEMES.map((t) => LIBELLES_THEMES[t]).join(', ')}</dd>
          <dt>Réponses</dt>
          <dd>4 choix proposés par question</dd>
          <dt>Durée officielle</dt>
          <dd>
            {epreuve.duree_officielle_minutes === null
              ? nonRenseigne
              : `${epreuve.duree_officielle_minutes} min`}
          </dd>
          <dt>Nombre de questions</dt>
          <dd>
            {epreuve.nombre_questions_officiel === null ? nonRenseigne : epreuve.nombre_questions_officiel}
          </dd>
          <dt>Chronomètre de l'examen blanc</dt>
          <dd>{reglages.dureeExamenMin} min (réglable)</dd>
          <dt>Barème</dt>
          <dd>{MENTION_BAREME}</dd>
        </dl>
        <p className="discret">La partie QRC de l'épreuve n'est pas couverte par cette application.</p>
      </section>

      <section className="carte">
        <h2>Questions par statut</h2>
        <ul className="compteurs">
          {STATUTS.map((s) => (
            <li key={s}>
              <span className={`badge badge-${s}`}>{LIBELLES_STATUTS[s]}</span>
              <strong>{parStatut[s]}</strong>
            </li>
          ))}
          <li>
            <span>Total</span>
            <strong>{toutesLesQuestions.length}</strong>
          </li>
        </ul>
      </section>

      {erreursDeSchema.length > 0 && (
        <section className="carte carte-alerte">
          <h2>Questions écartées (schéma non respecté)</h2>
          <ul>
            {erreursDeSchema.map((e) => (
              <li key={e.position}>
                Entrée n° {e.position}
                {e.id ? ` (${e.id})` : ''} : {e.messages.join(' ; ')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
