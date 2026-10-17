// Procedural PBR textures. No image assets: everything is generated on a canvas
// once and reused across rooms.

import * as THREE from 'three';
import { makeRng } from '../shared/rng.js';
import { drawGlyph } from '../shared/glyphs.js';
import { KANA } from './rain.js';

const smooth = (t) => t * t * (3 - 2 * t);

/** Tileable value noise in [0,1]. */
function latticeNoise(w, h, cells, rng) {
  const grid = new Float32Array(cells * cells);
  for (let i = 0; i < grid.length; i++) grid[i] = rng.next();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = (y / h) * cells;
    const y0 = Math.floor(fy);
    const ty = smooth(fy - y0);
    const ya = (y0 % cells) * cells;
    const yb = ((y0 + 1) % cells) * cells;
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * cells;
      const x0 = Math.floor(fx);
      const tx = smooth(fx - x0);
      const xa = x0 % cells;
      const xb = (x0 + 1) % cells;
      const top = grid[ya + xa] * (1 - tx) + grid[ya + xb] * tx;
      const bot = grid[yb + xa] * (1 - tx) + grid[yb + xb] * tx;
      out[y * w + x] = top * (1 - ty) + bot * ty;
    }
  }
  return out;
}

export function fbm(w, h, { cells = 4, octaves = 4, persistence = 0.5, seed = 1 } = {}) {
  const rng = makeRng(seed);
  const out = new Float32Array(w * h);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = latticeNoise(w, h, cells * 2 ** o, rng);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= persistence;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function grayToCanvas(data, w, h, map = (v) => [v * 255, v * 255, v * 255]) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < data.length; i++) {
    const [r, g, b] = map(data[i], i);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Height field -> tangent-space normal map canvas. */
function normalFromHeight(height, w, h, strength = 2) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const at = (x, y) => height[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function tex(canvasEl, { srgb = false, repeat = true, aniso = 8, shared = false } = {}) {
  const t = new THREE.CanvasTexture(canvasEl);
  if (shared) t.userData.shared = true;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

// -------------------------------------------------------------- material set

let cache = null;

/** Shared base materials. Use `tiled()` to get a copy with a different UV repeat. */
export function materials() {
  if (cache) return cache;
  const S = 256;

  // concrete: mottled, slightly green-tinted, with pitting in the normal map
  const cn = fbm(S, S, { cells: 4, octaves: 5, seed: 11 });
  const fine = fbm(S, S, { cells: 32, octaves: 2, seed: 12 });
  const concreteHeight = cn.map((v, i) => v * 0.7 + fine[i] * 0.3);
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex(grayToCanvas(concreteHeight, S, S, (v) => [28 + v * 44, 40 + v * 56, 34 + v * 46]), { srgb: true, shared: true }),
    normalMap: tex(normalFromHeight(concreteHeight, S, S, 3.2), { shared: true }),
    roughness: 0.92,
    metalness: 0.04,
  });

  // wall panels: concrete with recessed seams every half-tile
  const panelH = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const sx = Math.min(x % 128, 128 - (x % 128));
    const sy = Math.min(y % 128, 128 - (y % 128));
    const seam = Math.min(sx, sy);
    panelH[y * S + x] = seam < 3 ? 0 : 0.5 + concreteHeight[y * S + x] * 0.25;
  }
  const panel = new THREE.MeshStandardMaterial({
    map: tex(grayToCanvas(panelH, S, S, (v) => [10 + v * 55, 22 + v * 78, 15 + v * 58]), { srgb: true, shared: true }),
    normalMap: tex(normalFromHeight(panelH, S, S, 5), { shared: true }),
    roughness: 0.7,
    metalness: 0.35,
  });

  // polished tile: near-black stone with fine veining, grout lines, glossy
  const vein = fbm(S, S, { cells: 3, octaves: 5, persistence: 0.6, seed: 21 });
  const tileH = new Float32Array(S * S);
  const tileC = canvas(S, S);
  const tctx = tileC.getContext('2d');
  const timg = tctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const sx = Math.min(x % 128, 128 - (x % 128));
    const sy = Math.min(y % 128, 128 - (y % 128));
    const grout = Math.min(sx, sy) < 2;
    const v = vein[y * S + x];
    const line = Math.abs(Math.sin(v * 22)) < 0.06 ? 1 : 0;
    const i = (y * S + x) * 4;
    tileH[y * S + x] = grout ? 0 : 0.6;
    timg.data[i] = grout ? 4 : 7 + v * 14 + line * 20;
    timg.data[i + 1] = grout ? 8 : 15 + v * 24 + line * 34;
    timg.data[i + 2] = grout ? 6 : 11 + v * 18 + line * 24;
    timg.data[i + 3] = 255;
  }
  tctx.putImageData(timg, 0, 0);
  const tile = new THREE.MeshStandardMaterial({
    map: tex(tileC, { srgb: true, shared: true }),
    normalMap: tex(normalFromHeight(tileH, S, S, 4), { shared: true }),
    roughness: 0.14,
    metalness: 0.2,
  });

  // brushed steel: noise stretched along x
  const bx = fbm(S, S, { cells: 2, octaves: 3, seed: 31 });
  const brushed = new Float32Array(S * S);
  const streak = fbm(S, S, { cells: 64, octaves: 1, seed: 32 });
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let acc = 0;
    for (let k = 0; k < 6; k++) acc += streak[y * S + ((x + k * 11) % S)];
    brushed[y * S + x] = acc / 6 * 0.6 + bx[y * S + x] * 0.4;
  }
  const metal = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex(grayToCanvas(brushed, S, S, (v) => [20 + v * 55, 28 + v * 66, 24 + v * 58]), { srgb: true, shared: true }),
    normalMap: tex(normalFromHeight(brushed, S, S, 0.9), { shared: true }),
    roughness: 0.38,
    metalness: 0.92,
  });

  // diamond plate floor for the server room
  const plateH = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = ((x % 32) / 32) * 2 - 1;
    const v = ((y % 32) / 32) * 2 - 1;
    const d = Math.abs(u) + Math.abs(v) * 1.4;
    const alt = ((Math.floor(x / 32) + Math.floor(y / 32)) % 2) ? 1 : -1;
    const ang = alt * (u - v * 0.1);
    plateH[y * S + x] = Math.max(0, 1 - Math.abs(ang * 1.2)) * (d < 1.6 ? 1 : 0) * 0.8 + concreteHeight[y * S + x] * 0.15;
  }
  const plate = new THREE.MeshStandardMaterial({
    map: tex(grayToCanvas(plateH, S, S, (v) => [14 + v * 40, 24 + v * 60, 18 + v * 44]), { srgb: true, shared: true }),
    normalMap: tex(normalFromHeight(plateH, S, S, 4.5), { shared: true }),
    roughness: 0.46,
    metalness: 0.8,
  });

  cache = { concrete, panel, tile, metal, plate };
  return cache;
}

/** A copy of a material whose maps repeat (rx, ry) times. */
export function tiled(mat, rx, ry) {
  const m = mat.clone();
  for (const k of ['map', 'normalMap', 'roughnessMap']) {
    if (m[k]) {
      m[k] = m[k].clone();
      m[k].repeat.set(rx, ry);
      m[k].needsUpdate = true;
    }
  }
  return m;
}

// --------------------------------------------------------------- glow + text

/** An HDR-looking emissive material (values >1 feed the bloom pass). */
export function glow(color, intensity = 2.2) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
}

export function glyphTexture(id, { size = 256, color = '#7dff9c', bg = null, lineWidth = 7, glowPx = 14 } = {}) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.shadowColor = color;
  ctx.shadowBlur = glowPx * (size / 256);
  drawGlyph(ctx, id, size / 2, size / 2, size * 0.74, { color, lineWidth });
  return tex(c, { srgb: true, repeat: false });
}

export function textTexture(text, { w = 512, h = 128, font = 'bold 72px ui-monospace, Menlo, monospace', color = '#7dff9c', bg = null, align = 'center', glowPx = 12 } = {}) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowPx;
  ctx.fillStyle = color;
  ctx.fillText(text, align === 'center' ? w / 2 : align === 'left' ? 16 : w - 16, h / 2 + 4);
  return tex(c, { srgb: true, repeat: false });
}

/** A canvas-backed texture that can be redrawn (clocks, readouts, LED panels). */
export class LiveCanvas {
  constructor(w, h) {
    this.canvas = canvas(w, h);
    this.ctx = this.canvas.getContext('2d');
    this.texture = tex(this.canvas, { srgb: true, repeat: false });
    this.w = w;
    this.h = h;
  }
  touch() {
    this.texture.needsUpdate = true;
  }
  dispose() {
    this.texture.dispose();
  }
}

/** Falling code rendered to a texture, for monitors and windows into the construct. */
export class CodeScreen extends LiveCanvas {
  constructor(w = 256, h = 256, { cols = 16, color = '#2dff7a', head = '#d9ffe6', tintBg = '#000a04' } = {}) {
    super(w, h);
    this.cols = cols;
    this.cell = w / cols;
    this.color = color;
    this.head = head;
    this.bg = tintBg;
    this.drops = Array.from({ length: cols }, () => Math.random() * (h / this.cell));
    this.acc = 0;
    this.ctx.fillStyle = tintBg;
    this.ctx.fillRect(0, 0, w, h);
  }
  update(dt) {
    this.acc += dt;
    if (this.acc < 0.06) return;
    this.acc = 0;
    const { ctx, cell } = this;
    ctx.fillStyle = 'rgba(0,10,4,0.12)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.font = `${cell}px monospace`;
    ctx.textBaseline = 'top';
    for (let i = 0; i < this.cols; i++) {
      const y = this.drops[i];
      ctx.fillStyle = this.color;
      ctx.fillText(KANA[Math.floor(Math.random() * KANA.length)], i * cell, y * cell);
      ctx.fillStyle = this.head;
      ctx.fillText(KANA[Math.floor(Math.random() * KANA.length)], i * cell, (y + 1) * cell);
      this.drops[i] = y + 1 > this.h / cell && Math.random() > 0.94 ? 0 : y + 1;
    }
    this.touch();
  }
}

/** A soft radial sprite texture for light shafts and halos. */
export function radialTexture(color = '#ffffff') {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color.replace(')', ',0.35)').replace('rgb(', 'rgba('));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return tex(c, { srgb: true, repeat: false });
}

/** Vertical fade texture (opaque at one end) for tracer trails and light cones. */
export function fadeTexture(horizontal = false) {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  const g = horizontal ? ctx.createLinearGradient(0, 0, 64, 0) : ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return tex(c, { srgb: false, repeat: false });
}
