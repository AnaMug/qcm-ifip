import { useState } from 'react';
import { decrireFigureCube, facesDuCubePlie, tracerContenu, tracerFigureCube } from '../core/cube/trace-cube.js';
import { FACES, NOMS_FACES } from '../core/cube/reperes.js';
import Primitive from './Primitive.jsx';

// Dessin d'un patron à plat ou d'un cube en perspective isométrique, à partir de sa description.
// La géométrie (pliage, projection, déformation des motifs) est calculée dans src/core/cube ;
// ce composant ne fait que traduire des primitives en éléments SVG.
//
// Portage react-native-svg : comme Figure.jsx. Seul CubeControle (3D CSS, réservé à la page
// d'aperçu) est propre au web et n'a pas à être porté.

/** @param {{ figure: object, className?: string }} props figure : patron ou cube */
export default function CubeFigure({ figure, className }) {
  const { largeur, hauteur, primitives } = tracerFigureCube(figure);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${largeur} ${hauteur}`}
      width={largeur}
      height={hauteur}
      role="img"
      aria-label={decrireFigureCube(figure)}
    >
      {primitives.map((p, i) => (
        <Primitive key={i} p={p} />
      ))}
    </svg>
  );
}

const COTE = 120;

// Placement des 6 faces d'un cube CSS : il coïncide avec les repères de src/core/cube/reperes.js.
const PLACEMENT = {
  avant: `translateZ(${COTE / 2}px)`,
  arriere: `rotateY(180deg) translateZ(${COTE / 2}px)`,
  droite: `rotateY(90deg) translateZ(${COTE / 2}px)`,
  gauche: `rotateY(-90deg) translateZ(${COTE / 2}px)`,
  haut: `rotateX(90deg) translateZ(${COTE / 2}px)`,
  bas: `rotateX(-90deg) translateZ(${COTE / 2}px)`,
};

/**
 * Vue de contrôle (page d'aperçu uniquement) : le cube obtenu en pliant le patron, en 3D CSS.
 * On le fait tourner en le faisant glisser à la souris ou au doigt.
 */
export function CubeControle({ figure }) {
  const faces = facesDuCubePlie(figure);
  const [angles, setAngles] = useState({ x: -28, y: -35 });
  const [prise, setPrise] = useState(null);

  const saisir = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPrise({ x: e.clientX, y: e.clientY, angles });
  };
  const glisser = (e) => {
    if (prise === null) return;
    setAngles({
      x: Math.max(-90, Math.min(90, prise.angles.x - (e.clientY - prise.y) * 0.6)),
      y: prise.angles.y + (e.clientX - prise.x) * 0.6,
    });
  };

  return (
    <div className="cube-controle">
      <div
        className="cube-scene"
        onPointerDown={saisir}
        onPointerMove={glisser}
        onPointerUp={() => setPrise(null)}
        onPointerCancel={() => setPrise(null)}
        role="img"
        aria-label={`Cube plié. ${FACES.map((f) => `${NOMS_FACES[f]} : ${faces[f].description}`).join(' ; ')}.`}
      >
        <div className="cube-3d" style={{ transform: `rotateX(${angles.x}deg) rotateY(${angles.y}deg)` }}>
          {FACES.map((nom) => (
            <div className="cube-face" key={nom} style={{ transform: PLACEMENT[nom] }}>
              <svg viewBox={`0 0 ${COTE} ${COTE}`} width={COTE} height={COTE}>
                {tracerContenu(faces[nom], COTE / 2, COTE / 2, COTE / 2).map((p, i) => (
                  <Primitive key={i} p={p} />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>
      <p className="discret">Faites glisser le cube pour le faire tourner.</p>
    </div>
  );
}
