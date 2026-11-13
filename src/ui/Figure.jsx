import { tracerFigure } from '../core/figures/trace.js';
import { decrireFigure } from '../core/figures/description.js';

// Dessin d'une figure à partir de sa description (donnée). Toute la géométrie est calculée par
// src/core/figures/trace.js ; ce composant ne fait que traduire des primitives en éléments SVG.
//
// Portage react-native-svg : remplacer svg, defs, pattern, rect, polygon, circle, line, text par
// Svg, Defs, Pattern, Rect, Polygon, Circle, Line, Text (mêmes attributs), et aria-label par
// accessibilityLabel. Aucune autre balise, aucun style CSS, aucune transformation n'est utilisé.

const ENCRE = '#1c2230';
const FOND = '#ffffff';
const ID_HACHURES = 'figure-hachures';

// Les hachures sont définies dans le repère de la figure, pas dans celui de la forme :
// elles gardent la même direction quelle que soit la rotation de la forme.
function remplir(remplissage) {
  if (remplissage === 'plein') return ENCRE;
  if (remplissage === 'hachure') return `url(#${ID_HACHURES})`;
  return FOND;
}

function Primitive({ p }) {
  if (p.type === 'rect') {
    return <rect x={p.x} y={p.y} width={p.largeur} height={p.hauteur} fill="none" stroke={ENCRE} strokeWidth={p.epaisseur} />;
  }
  if (p.type === 'polygone') {
    return (
      <polygon
        points={p.points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill={remplir(p.remplissage)}
        stroke={ENCRE}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    );
  }
  if (p.type === 'cercle') {
    return <circle cx={p.cx} cy={p.cy} r={p.r} fill={remplir(p.remplissage)} stroke={ENCRE} strokeWidth={1.5} />;
  }
  return (
    <text x={p.x} y={p.y} fontSize={p.taille} fontWeight="bold" fill={ENCRE} textAnchor="middle" dominantBaseline="central">
      {p.texte}
    </text>
  );
}

/** @param {{ figure: object, className?: string }} props figure : matrice, suite, grille ou case */
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
      <defs>
        <pattern id={ID_HACHURES} width={5} height={5} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={5} height={5} fill={FOND} />
          <line x1={0} y1={5} x2={5} y2={0} stroke={ENCRE} strokeWidth={1.3} />
          <line x1={-1} y1={1} x2={1} y2={-1} stroke={ENCRE} strokeWidth={1.3} />
          <line x1={4} y1={6} x2={6} y2={4} stroke={ENCRE} strokeWidth={1.3} />
        </pattern>
      </defs>
      {primitives.map((p, i) => (
        <Primitive key={i} p={p} />
      ))}
    </svg>
  );
}
