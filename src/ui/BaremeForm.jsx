import { useState } from 'react';

const CHAMPS = [
  { cle: 'bonne', libelle: 'Bonne réponse' },
  { cle: 'fausse', libelle: 'Réponse fausse' },
  { cle: 'abstention', libelle: 'Abstention' },
];

const versTexte = (n) => String(n).replace('.', ',');
const versNombre = (texte) => {
  const propre = texte.trim().replace(',', '.').replace('−', '-');
  if (propre === '') return null;
  const n = Number(propre);
  return Number.isFinite(n) ? n : null;
};

/** Trois champs de saisie du barème. Accepte la virgule décimale. */
export default function BaremeForm({ bareme, onChange }) {
  const [saisies, setSaisies] = useState({
    bonne: versTexte(bareme.bonne),
    fausse: versTexte(bareme.fausse),
    abstention: versTexte(bareme.abstention),
  });

  const modifier = (cle, texte) => {
    setSaisies({ ...saisies, [cle]: texte });
    const n = versNombre(texte);
    if (n !== null) onChange({ ...bareme, [cle]: n });
  };

  return (
    <div className="bareme">
      {CHAMPS.map(({ cle, libelle }) => (
        <label className="champ" key={cle}>
          <span>{libelle}</span>
          <input
            type="text"
            inputMode="text"
            value={saisies[cle]}
            onChange={(e) => modifier(cle, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
