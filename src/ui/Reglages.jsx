import { useState } from 'react';
import { MENTION_BAREME } from '../core/constants.js';
import { normaliserDureeMinutes } from '../core/chrono.js';
import BaremeForm from './BaremeForm.jsx';

export default function Reglages({ reglages, onReglages }) {
  const [saisieDuree, setSaisieDuree] = useState(String(reglages.dureeExamenMin));

  const modifierDuree = (texte) => {
    setSaisieDuree(texte);
    const minutes = normaliserDureeMinutes(texte, null);
    if (minutes !== null) onReglages({ dureeExamenMin: minutes });
  };

  return (
    <>
      <h1>Réglages</h1>

      <section className="carte">
        <h2>Questions</h2>
        <label className="case">
          <input
            type="checkbox"
            checked={reglages.verifieesSeulement}
            onChange={(e) => onReglages({ verifieesSeulement: e.target.checked })}
          />
          <span>N'afficher que les questions vérifiées</span>
        </label>
        <label className="case">
          <input
            type="checkbox"
            checked={reglages.inclureGenerees}
            onChange={(e) => onReglages({ inclureGenerees: e.target.checked })}
          />
          <span>Inclure des questions générées (entraînement, thème Logique)</span>
        </label>
        <p className="discret">
          Les questions générées sont calculées par l'application et ne sont pas « vérifiées » : le premier
          réglage les écarte. L'examen blanc ne contient que les questions officielles.
        </p>
      </section>

      <section className="carte">
        <h2>Examen blanc</h2>
        <label className="champ">
          <span>Durée du chronomètre (minutes)</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="600"
            value={saisieDuree}
            onChange={(e) => modifierDuree(e.target.value)}
          />
        </label>
      </section>

      <section className="carte">
        <h2>Barème (points par question)</h2>
        <BaremeForm bareme={reglages.bareme} onChange={(bareme) => onReglages({ bareme })} />
        <p className="note">{MENTION_BAREME}</p>
      </section>

      <p className="discret">Les réglages sont enregistrés automatiquement sur cet appareil.</p>
    </>
  );
}
