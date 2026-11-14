// 2D outlines of sketch shapes, in sketch-local millimetres. Used for drawing, hit testing and snapping.
// `n` resolves a number-or-expression field to a number.

const rad = (d) => (d * Math.PI) / 180;

function arc(cx, cy, r, a0, a1, out, segs = 16) {
  for (let i = 0; i <= segs; i++) {
    const a = a0 + ((a1 - a0) * i) / segs;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
}

// Points along a circular arc from p0 to p1 with the given bulge (sagitta / half chord).
export function bulgePoints(p0, p1, bulge, segs = 14) {
  if (!bulge) return [p1];
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const chord = Math.hypot(dx, dy);
  if (chord < 1e-9) return [p1];
  const theta = 4 * Math.atan(bulge);
  const radius = chord / (2 * Math.sin(theta / 2));
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2;
  const h = radius * Math.cos(theta / 2);
  const cx = mx - (dy / chord) * h;
  const cy = my + (dx / chord) * h;
  const a0 = Math.atan2(p0[1] - cy, p0[0] - cx);
  const out = [];
  for (let i = 1; i <= segs; i++) {
    const a = a0 + (theta * i) / segs;
    out.push([cx + Math.abs(radius) * Math.cos(a), cy + Math.abs(radius) * Math.sin(a)]);
  }
  out[out.length - 1] = p1;
  return out;
}

export function pathPoints(s, n) {
  return (s.pts || []).map((p) => (Array.isArray(p) ? [n(p[0]), n(p[1]), p[2] ? n(p[2]) : 0] : [n(p.x), n(p.y), p.bulge ? n(p.bulge) : 0]));
}

// Returns the closed outline of a shape as an array of [x, y].
export function outline(s, n) {
  const x = n(s.x ?? 0);
  const y = n(s.y ?? 0);
  const rot = rad(n(s.rot ?? 0));
  let pts = [];
  switch (s.kind) {
    case 'rect': {
      const w = n(s.w) / 2;
      const h = n(s.h) / 2;
      const r = Math.max(0, Math.min(n(s.r ?? 0), w, h));
      if (r > 1e-6) {
        arc(w - r, h - r, r, 0, Math.PI / 2, pts, 8);
        arc(-w + r, h - r, r, Math.PI / 2, Math.PI, pts, 8);
        arc(-w + r, -h + r, r, Math.PI, 1.5 * Math.PI, pts, 8);
        arc(w - r, -h + r, r, 1.5 * Math.PI, 2 * Math.PI, pts, 8);
      } else {
        pts = [
          [w, h],
          [-w, h],
          [-w, -h],
          [w, -h],
        ];
      }
      break;
    }
    case 'circle':
      arc(0, 0, n(s.d) / 2, 0, 2 * Math.PI, pts, 64);
      pts.pop();
      break;
    case 'ellipse': {
      const a = n(s.w) / 2;
      const b = n(s.h) / 2;
      for (let i = 0; i < 64; i++) pts.push([a * Math.cos((i / 64) * 2 * Math.PI), b * Math.sin((i / 64) * 2 * Math.PI)]);
      break;
    }
    case 'polygon': {
      const k = Math.max(3, Math.round(n(s.sides ?? 6)));
      const r = n(s.d) / 2;
      for (let i = 0; i < k; i++) pts.push([r * Math.cos((i / k) * 2 * Math.PI), r * Math.sin((i / k) * 2 * Math.PI)]);
      break;
    }
    case 'slot': {
      const w = n(s.w) / 2;
      const a = Math.max(0, n(s.l) / 2 - w);
      arc(a, 0, w, -Math.PI / 2, Math.PI / 2, pts, 16);
      arc(-a, 0, w, Math.PI / 2, 1.5 * Math.PI, pts, 16);
      break;
    }
    case 'path': {
      const pp = pathPoints(s, n);
      for (let i = 0; i < pp.length; i++) {
        const prev = pp[(i + pp.length - 1) % pp.length];
        if (i === 0) pts.push([pp[0][0], pp[0][1]]);
        else pts.push(...bulgePoints(prev, pp[i], pp[i][2]));
      }
      if (pp.length && pp[0][2]) {
        const closing = bulgePoints(pp[pp.length - 1], pp[0], pp[0][2]);
        closing.pop();
        pts.push(...closing);
      }
      return pts; // paths are stored in absolute sketch coordinates
    }
    case 'text': {
      const size = n(s.size ?? 10);
      const w = Math.max(size * 0.68 * String(s.text ?? '').length, size * 0.6);
      pts = [
        [0, 0],
        [w, 0],
        [w, size * 0.73],
        [0, size * 0.73],
      ];
      break;
    }
    default:
      return [];
  }
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  return pts.map(([px, py]) => [x + px * c - py * sn, y + px * sn + py * c]);
}

export function pointInPolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distToPolyline(p, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return best;
}

export function bounds(poly) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// Points worth snapping to: centres and corners.
export function snapPoints(s, n) {
  if (s.kind === 'path') return pathPoints(s, n).map((p) => [p[0], p[1]]);
  const pts = [[n(s.x ?? 0), n(s.y ?? 0)]];
  if (s.kind === 'rect' || s.kind === 'polygon') pts.push(...outline({ ...s, r: 0 }, n));
  return pts;
}
