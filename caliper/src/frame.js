// Sketch plane frames, shared by the kernel (worker) and the viewport.
// A frame is { origin, x, y, normal, dir }: `normal` = x × y (the side the camera looks from),
// `dir` = the direction a positive extrusion travels.

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
};

export const BASE_PLANES = {
  XY: { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], normal: [0, 0, 1], dir: [0, 0, 1] },
  XZ: { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 0, 1], normal: [0, -1, 0], dir: [0, 1, 0] },
  YZ: { origin: [0, 0, 0], x: [0, 1, 0], y: [0, 0, 1], normal: [1, 0, 0], dir: [1, 0, 0] },
};

const snapUnit = (n) => n.map((c) => (Math.abs(c) < 1e-9 ? 0 : Math.abs(Math.abs(c) - 1) < 1e-9 ? Math.sign(c) : c));

// Frame for a planar face: sketch "up" is world Z where possible, origin is the world origin
// dropped onto the face plane, so sketch coordinates line up with world coordinates.
export function frameFromFace(normalIn, pointOnPlane) {
  const n = snapUnit(v3.norm(normalIn));
  let x;
  let y;
  if (Math.abs(n[2]) > 0.999) {
    x = [1, 0, 0];
    y = n[2] > 0 ? [0, 1, 0] : [0, -1, 0];
  } else {
    y = v3.norm(v3.sub([0, 0, 1], v3.mul(n, n[2])));
    x = v3.norm(v3.cross(y, n));
  }
  const origin = v3.mul(n, v3.dot(n, pointOnPlane));
  return { origin: snapUnit0(origin), x: snapUnit(x), y: snapUnit(y), normal: n, dir: n };
}
const snapUnit0 = (p) => p.map((c) => (Math.abs(c) < 1e-9 ? 0 : c));

export function offsetFrame(f, d) {
  return d ? { ...f, origin: v3.add(f.origin, v3.mul(f.dir, d)) } : f;
}

export const toWorld = (f, p) => v3.add(f.origin, v3.add(v3.mul(f.x, p[0]), v3.mul(f.y, p[1])));
export const toLocal = (f, w) => {
  const d = v3.sub(w, f.origin);
  return [v3.dot(d, f.x), v3.dot(d, f.y)];
};

export const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
export function axisVec(a, fallback = [0, 0, 1]) {
  if (Array.isArray(a) && a.length === 3) return v3.norm(a.map(Number));
  if (typeof a === 'string') {
    const s = a.trim().toLowerCase();
    const neg = s.startsWith('-');
    const base = AXES[s.replace(/^[+-]/, '')];
    if (base) return neg ? v3.mul(base, -1) : base;
  }
  return fallback;
}
