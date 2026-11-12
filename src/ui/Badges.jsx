import { LIBELLES_ORIGINES, LIBELLES_STATUTS, LIBELLES_THEMES } from '../core/constants.js';

export default function Badges({ question }) {
  return (
    <div className="badges">
      <span className={`badge badge-${question.origine}`}>{LIBELLES_ORIGINES[question.origine]}</span>
      <span className={`badge badge-${question.statut}`}>{LIBELLES_STATUTS[question.statut]}</span>
      <span className="badge badge-theme">{LIBELLES_THEMES[question.theme]}</span>
    </div>
  );
}
