import { useState } from 'react';
import { GENERATEURS, NIVEAUX } from '../core/generators/index.js';
import { CubeControle } from './CubeFigure.jsx';
import QuestionCarte from './QuestionCarte.jsx';
import Correction from './Correction.jsx';

const PAR_TYPE = 20;

// 20 questions par type : graines 1 à 20, niveaux 1, 2, 3 en alternance.
function fabriquer(generateur) {
  return Array.from({ length: PAR_TYPE }, (_, i) => {
    const niveau = NIVEAUX[i % NIVEAUX.length];
    try {
      const question = generateur.generate(i + 1, niveau);
      return { question, controle: generateur.verify(question), niveau, graine: i + 1 };
    } catch (e) {
      return { question: null, controle: { ok: false, erreurs: [e.message] }, niveau, graine: i + 1 };
    }
  });
}

/** Bouton « Vue de contrôle » : affiche le cube plié en 3D, pour comparer avec les choix. */
function VueDeControle({ figure }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <div className="rangee">
      <button type="button" className="bouton" aria-expanded={ouverte} onClick={() => setOuverte(!ouverte)}>
        {ouverte ? 'Masquer la vue de contrôle' : 'Vue de contrôle'}
      </button>
      {ouverte && <CubeControle figure={figure} />}
    </div>
  );
}

/** Page de relecture humaine des générateurs, accessible par #apercu. */
export default function Apercu() {
  return (
    <>
      <h1>Aperçu des générateurs</h1>
      <p className="chapeau">
        {PAR_TYPE} questions par type, avec la réponse calculée et l'explication, pour relecture. Les mêmes
        graines donnent toujours les mêmes questions.
      </p>
      {Object.values(GENERATEURS).map((generateur) => (
        <section key={generateur.type}>
          <h2>
            {generateur.libelle} <span className="discret">({generateur.type}, version {generateur.version})</span>
          </h2>
          {fabriquer(generateur).map(({ question, controle, niveau, graine }) => (
            <div className="bloc-correction" key={`${graine}-${niveau}`}>
              <p className="apercu-meta">
                Graine demandée {graine} · niveau {niveau}
                {question && ` · id ${question.id}`} ·{' '}
                {controle.ok ? (
                  <span className="apercu-ok">verify : conforme</span>
                ) : (
                  <span className="apercu-echec">verify : {controle.erreurs.join(' ; ')}</span>
                )}
              </p>
              {question && (
                <>
                  <QuestionCarte question={question} reponse={question.bonne_reponse} corrige />
                  {question.figure?.kind === 'patron' && <VueDeControle figure={question.figure} />}
                  <Correction question={question} reponse={question.bonne_reponse} />
                </>
              )}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
