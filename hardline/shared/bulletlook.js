// How a bullet's tracer type looks, shared by the Operator's 3D scene and the Mentor's manual
// so both sides describe the same thing. Colour AND shape encode the type (so it still reads for
// colour-blind players and can be described in words: "the cyan circle").

export const BULLET_LOOK = {
  red: { shape: 'triangle', word: 'TRIANGLE' },
  cyan: { shape: 'circle', word: 'CIRCLE' },
  yellow: { shape: 'square', word: 'SQUARE' },
  magenta: { shape: 'star', word: 'STAR' },
  white: { shape: 'hexagon', word: 'HEXAGON' },
};

/** Polygon points [x, y] (y up) of a shape inscribed in a circle of radius r. */
export function shapePoints(shape, r = 1) {
  const pts = [];
  const regular = (n, rot) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  };
  switch (shape) {
    case 'triangle':
      regular(3, Math.PI / 2);
      break;
    case 'square':
      regular(4, Math.PI / 4);
      break;
    case 'hexagon':
      regular(6, 0);
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.45;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      break;
    case 'circle':
    default:
      regular(48, 0);
  }
  return pts;
}
