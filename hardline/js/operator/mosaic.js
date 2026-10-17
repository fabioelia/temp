// Operator — THE MOSAIC. A wall of blank tiles with the ROW clues down the left. The clue for each
// row lists the runs of lit tiles it must end up with (3 1 = three lit, a gap, one lit); a row's
// clue turns green once your tiles satisfy it. The COLUMN clues are in the Mentor's manual — read
// your numbers out, work out the picture together, then pull SEAL. A wrong picture costs a strike.

import * as THREE from 'three';
import { materials, tiled, glow, textTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';

const W = 34;
const H = 11;
const D = 22;
const WALL_Z = -6;
const PITCH = 1.2;

const runsOf = (cells) => {
  const out = [];
  let run = 0;
  for (const c of cells) {
    if (c) run++;
    else if (run) (out.push(run), (run = 0));
  }
  if (run) out.push(run);
  return out.length ? out : [0];
};
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x030d09, 0.02);
  stage.baseFov = 56;
  stage.camera.fov = 56;
  const CAM = new THREE.Vector3(0, 5.3, 4.9);
  const LOOK = new THREE.Vector3(0, 5.2, WALL_Z);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.4, y: 0.14, look: 0.04 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 7 });
  wetFloor(stage, root, { w: W, d: D, repeat: 10, base: 'plate', roughness: 0.4, tint: 0x3d6a52, opacity: 0.9 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 180 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.4));
  const key = new THREE.SpotLight(0xcfffe0, 380, 40, 0.8, 0.9, 1.5);
  key.position.set(0, H - 0.6, 4);
  key.target.position.set(0, 5.2, WALL_Z);
  root.add(key, key.target);
  for (const x of [-9, -3, 3, 9]) strip(root, { w: 0.14, d: 4, color: 0xcfffe0, intensity: 1.4, x, y: H - 0.05, z: -3, light: 18, lightDist: 9 });
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  const steel = tiled(M.metal, 2, 1);
  steel.color.set(0x6f8a79);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x07130e, roughness: 0.55, metalness: 0.55 });
  const frameMat = glow(0x1fff6a, 0.9);
  const SLAB_W = 20.6;
  box(SLAB_W, 9.6, 0.5, slabMat, { y: 5.3, z: WALL_Z - 0.28, cast: false });
  for (const y of [0.45, 10.15]) box(SLAB_W + 0.4, 0.18, 0.7, steel, { y, z: WALL_Z - 0.2, cast: false });
  for (const x of [-SLAB_W / 2 - 0.1, SLAB_W / 2 + 0.1]) box(0.18, 9.8, 0.7, steel, { x, y: 5.3, z: WALL_Z - 0.2, cast: false });

  const texCache = new Map();
  const label = (text, w, h, { color = '#b6ffd0', px = 72, tw = 256, th = 128, align = 'center' } = {}) => {
    const k = `${text}|${color}|${px}|${tw}|${th}|${align}`;
    if (!texCache.has(k)) texCache.set(k, textTexture(text, { w: tw, h: th, color, align, font: `bold ${px}px ui-monospace, Menlo, monospace`, glowPx: 10 }));
    return new THREE.MeshBasicMaterial({ map: texCache.get(k), transparent: true, toneMapped: false, depthWrite: false });
  };
  const plane = (mat, w, h, parent, x, y, z) => mesh(new THREE.PlaneGeometry(w, h), mat, { x, y, z, parent, cast: false, receive: false });

  const hot = {};
  let scenery = null;
  let cells = []; // cells[r][c] = { on, mat, tile, base }
  let rowClues = []; // { mesh, clue, ok }
  let pending = false;
  let sealed = false;
  let view_ = view;
  const sealParts = {};

  const OFF_RGB = [0.045, 0.12, 0.085];
  const ON_RGB = [0.12, 1.25, 0.45];
  const border = glow(0x1d4a36, 0.8);

  function build(v) {
    if (scenery) {
      scenery.hs.forEach((h) => h.remove());
      scenery.group.traverse((o) => {
        o.geometry?.dispose?.();
        const mt = o.material;
        if (mt && mt !== steel && mt !== slabMat && mt !== frameMat && mt !== sealParts.shared) mt.dispose?.();
      });
      root.remove(scenery.group);
      for (const k of Object.keys(hot)) delete hot[k];
    }
    view_ = v;
    const group = new THREE.Group();
    group.position.z = WALL_Z;
    root.add(group);
    const hs = [];
    pending = false;
    sealed = false;
    cells = [];
    rowClues = [];

    const n = v.size;
    const span = n * PITCH;
    const gx = 1.4; // the grid sits slightly right of centre to leave room for the row clues
    const gy = 5.2;
    const x0 = gx - span / 2 + PITCH / 2;
    const yTop = gy + span / 2 - PITCH / 2;

    plane(label(`MOSAIC ${v.stage + 1} / ${v.stageCount}`, 4.6, 0.62, { px: 64, tw: 512, th: 96, color: '#7dff9c' }), 4.6, 0.62, group, gx, 9.55, 0.06);
    plane(label('ROW CLUES', 2.6, 0.4, { px: 54, tw: 384, th: 80, color: '#ffd27a' }), 2.6, 0.4, group, x0 - PITCH / 2 - 2.1, yTop + PITCH / 2 + 0.45, 0.06);

    // the frame around the tile field
    const fw = span + 0.35;
    for (const [bw, bh, bx, by] of [[fw, 0.05, gx, gy + fw / 2], [fw, 0.05, gx, gy - fw / 2], [0.05, fw, gx - fw / 2, gy], [0.05, fw, gx + fw / 2, gy]]) box(bw, bh, 0.02, frameMat, { x: bx, y: by, z: 0.04, parent: group, cast: false, receive: false });

    for (let r = 0; r < n; r++) {
      const y = yTop - r * PITCH;
      const rowCells = [];
      for (let c = 0; c < n; c++) {
        const x = x0 + c * PITCH;
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...OFF_RGB), toneMapped: false });
        box(PITCH - 0.08, PITCH - 0.08, 0.04, border, { x, y, z: 0.05, parent: group, cast: false, receive: false });
        const tile = box(PITCH - 0.18, PITCH - 0.18, 0.2, mat, { x, y, z: 0.1, parent: group, cast: false, receive: false });
        const hit = hitbox(PITCH - 0.04, PITCH - 0.04, 0.6, { x, y, z: 0.2, parent: group });
        const cell = { r, c, on: false, mat, tile };
        hs.push(stage.addHotspot(hit, { outline: [tile], onClick: () => toggle(cell) }));
        hot[`tile:${r},${c}`] = hit;
        rowCells.push(cell);
      }
      cells.push(rowCells);
      // the row's clue, to the left of its tiles
      const rc = { clue: v.rows[r], y, mesh: null, ok: null };
      rc.mesh = plane(label(v.rows[r].join('  '), 4.2, 0.9, { px: 70, tw: 512, th: 110, align: 'right' }), 4.2, 0.9, group, x0 - PITCH / 2 - 2.5, y, 0.06);
      rowClues.push(rc);
    }

    // ------------------------------------------------------------- SEAL
    const sg = new THREE.Group();
    sg.position.set(gx + span / 2 + 2.0, 3.6, 0);
    group.add(sg);
    cyl(0.78, 0.86, 0.2, steel, { z: 0.1, rx: Math.PI / 2, parent: sg }, 36);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x14506a, emissive: 0x0a3a5a, emissiveIntensity: 1.4, roughness: 0.3 });
    const btn = cyl(0.58, 0.58, 0.26, btnMat, { z: 0.3, rx: Math.PI / 2, parent: sg }, 36);
    mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 40), glow(0x40b0ff, 1.4), { z: 0.22, parent: sg, cast: false, receive: false });
    plane(label('SEAL', 1.8, 0.5, { px: 64, tw: 256, th: 90, color: '#7cc8ff' }), 1.8, 0.5, sg, 0, 1.3, 0.06);
    const bhit = hitbox(1.9, 1.9, 0.9, { z: 0.3, parent: sg });
    hs.push(stage.addHotspot(bhit, { outline: [btn], onClick: () => seal() }));
    hot.seal = bhit;
    sealParts.btn = btn;
    sealParts.mat = btnMat;
    sealParts.shared = null;

    scenery = { group, hs };
    paintClues();
  }

  // ------------------------------------------------------------ interaction
  function paintCell(cell, anim = true) {
    const to = cell.on ? 0.0 : 0.1;
    const from = cell.tile.position.z;
    if (anim) stage.tween(140, (k) => (cell.tile.position.z = from + (to - from) * k), ease.out);
    else cell.tile.position.z = to;
    cell.mat.color.setRGB(...(cell.on ? ON_RGB : OFF_RGB));
  }

  function paintClues() {
    cells.forEach((row, r) => {
      const rc = rowClues[r];
      const ok = same(runsOf(row.map((c) => (c.on ? 1 : 0))), rc.clue);
      if (rc.ok === ok) return;
      rc.ok = ok;
      rc.mesh.material = label(rc.clue.join('  '), 4.2, 0.9, { px: 70, tw: 512, th: 110, align: 'right', color: ok ? '#5dff9a' : '#b6ffd0' });
    });
  }

  function toggle(cell) {
    if (pending || sealed) return;
    cell.on = !cell.on;
    audio.tick();
    paintCell(cell);
    paintClues();
  }

  function seal() {
    if (pending || sealed) return;
    pending = true;
    audio.engage();
    stage.tween(260, (k) => (sealParts.btn.position.z = 0.3 - 0.14 * Math.sin(k * Math.PI)), ease.linear);
    send({ type: 'seal', grid: cells.map((row) => row.map((c) => (c.on ? 1 : 0))) });
  }

  async function wrong() {
    // the whole wall flickers red; the picture stays so it can be corrected
    stage.flash(0xff4020, 0.3, 450);
    stage.shake(0.12, 400);
    stage.pulseGlitch(0.8, 400);
    audio.spark();
    cells.flat().forEach((c) => c.mat.color.setRGB(...(c.on ? [2.6, 0.3, 0.15] : [0.35, 0.05, 0.04])));
    await stage.wait(420);
    cells.flat().forEach((c) => c.mat.color.setRGB(...(c.on ? ON_RGB : OFF_RGB)));
    await stage.wait(260);
    pending = false;
  }

  async function safe(nextView) {
    sealed = true;
    // the picture locks in, row by row
    for (const row of cells) {
      for (const c of row) {
        if (c.on) c.mat.color.setRGB(0.3, 2.0, 0.9);
      }
      audio.blip(true);
      await stage.wait(110);
    }
    stage.flash(0x9dffbf, 0.4, 500);
    await stage.wait(900);
    if (nextView) {
      stage.pulseGlitch(0.7, 400);
      build(nextView);
    }
  }

  build(view);

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    sealParts.mat && (sealParts.mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.3);
  });

  return {
    hot,
    get idle() {
      return !pending && !sealed;
    },
    get grid() {
      return cells.map((row) => row.map((c) => (c.on ? 1 : 0)));
    },
    get size() {
      return view_.size;
    },
    onFx(m) {
      if (m.result === 'wrong') wrong();
      else if (m.result === 'stage') safe(m.view);
      else if (m.result === 'solved') safe(null);
    },
    dispose() {},
  };
}
