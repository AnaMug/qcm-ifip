// Traduction d'une primitive géométrique (calculée dans src/core) en élément SVG.
// Partagé par Figure.jsx et CubeFigure.jsx.
//
// Portage react-native-svg : remplacer rect, polygon, circle, line, text, defs, pattern par
// Rect, Polygon, Circle, Line, Text, Defs, Pattern (mêmes attributs).

export const ENCRE = '#1c2230';
export const FOND = '#ffffff';
const ID_HACHURES = 'figure-hachures';

// Les hachures sont définies dans le repère de la figure, pas dans celui de la forme :
// elles gardent la même direction quelle que soit la rotation de la forme.
function remplir(remplissage) {
  if (remplissage === 'plein') return ENCRE;
  if (remplissage === 'hachure') return `url(#${ID_HACHURES})`;
  return FOND;
}

/** À placer une fois dans chaque <svg> qui peut contenir une forme hachurée. */
export function Hachures() {
  return (
    <defs>
      <pattern id={ID_HACHURES} width={5} height={5} patternUnits="userSpaceOnUse">
        <rect x={0} y={0} width={5} height={5} fill={FOND} />
        <line x1={0} y1={5} x2={5} y2={0} stroke={ENCRE} strokeWidth={1.3} />
        <line x1={-1} y1={1} x2={1} y2={-1} stroke={ENCRE} strokeWidth={1.3} />
        <line x1={4} y1={6} x2={6} y2={4} stroke={ENCRE} strokeWidth={1.3} />
      </pattern>
    </defs>
  );
}

export default function Primitive({ p }) {
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
    <text
      x={p.x}
      y={p.y}
      fontSize={p.taille}
      fontWeight="bold"
      fill={ENCRE}
      textAnchor="middle"
      dominantBaseline="central"
      transform={p.rotation ? `rotate(${p.rotation} ${p.x} ${p.y})` : undefined}
    >
      {p.texte}
    </text>
  );
}
