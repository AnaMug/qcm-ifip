import { tracerFigure } from '../core/figures/trace.js';
import { decrireFigure } from '../core/figures/description.js';
import Primitive, { Hachures } from './Primitive.jsx';

// Dessin d'une figure (matrice, suite, grille ou case) à partir de sa description (donnée).
// Toute la géométrie est calculée par src/core/figures/trace.js ; ce composant ne fait que
// traduire des primitives en éléments SVG, sans librairie, sans style CSS, sans transformation.
//
// Portage react-native-svg : remplacer svg par Svg et aria-label par accessibilityLabel ;
// voir aussi Primitive.jsx.

/** @param {{ figure: object, className?: string }} props */
export default function Figure({ figure, className }) {
  const { largeur, hauteur, primitives } = tracerFigure(figure);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${largeur} ${hauteur}`}
      width={largeur}
      height={hauteur}
      role="img"
      aria-label={decrireFigure(figure)}
    >
      <Hachures />
      {primitives.map((p, i) => (
        <Primitive key={i} p={p} />
      ))}
    </svg>
  );
}
