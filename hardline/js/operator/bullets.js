// Operator — THE ATRIUM. Time has stopped mid-volley. Bullets hang in a 3x3 field.
//
// Built for reading, not just looking at:
//  • every bullet wears a big flat badge facing you — its SHAPE and COLOUR both say what kind
//    of tracer it is (red triangle, cyan circle, yellow square, magenta star, white hexagon);
//  • one pip or two under the badge says how many steps it will drift;
//  • the nine cells are numbered like a phone keypad so you can say "cell 7";
//  • heights, angles and the glowing brass are decoration — ignore them.
// When you commit to a cell, time thaws and every bullet drifts the way its badge says.

import * as THREE from 'three';
import { materials, tiled, glow, radialTexture, textTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, dust, glitchEdges, strip, COLORS } from '../kit.js';
import { ease } from '../stage.js';
import { BULLET_LOOK, shapePoints } from '../../shared/bulletlook.js';

const W = 28;
const H = 13;
const D = 34;
const CELL = 1.55;
const CX = 0;
const CY = 2.35;
const CZ = 0;

const cellPos = (col, row) => new THREE.Vector3(CX + (col - 1) * CELL, CY + (1 - row) * CELL, CZ);
const keypadNumber = (col, row) => row * 3 + col + 1;

function shapeOf(name, r) {
  const pts = shapePoints(BULLET_LOOK[name].shape, r);
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return { shape: s, pts };
}

/** A flat badge: a thick bright outline around a translucent fill, in the tracer's colour. */
function makeBadge(name, hex, r = 0.4) {
  const g = new THREE.Group();
  const col = new THREE.Color(hex);
  const outer = shapeOf(name, r);
  const innerPts = shapePoints(BULLET_LOOK[name].shape, r * 0.78);
  const ring = new THREE.Shape(outer.pts.map(([x, y]) => new THREE.Vector2(x, y)));
  ring.holes.push(new THREE.Path(innerPts.map(([x, y]) => new THREE.Vector2(x, y))));
  mesh(new THREE.ShapeGeometry(ring), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.9), toneMapped: false, side: THREE.DoubleSide }), { parent: g, cast: false, receive: false });
  const fill = new THREE.Shape(innerPts.map(([x, y]) => new THREE.Vector2(x, y)));
  mesh(new THREE.ShapeGeometry(fill), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.9), transparent: true, opacity: 0.32, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }), { z: -0.01, parent: g, cast: false, receive: false });
  return g;
}

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020c08, 0.016);
  stage.baseFov = 50;
  stage.camera.fov = 50;
  const CAM = new THREE.Vector3(0, 2.45, 6.4);
  const LOOK = new THREE.Vector3(0, 2.35, 0);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.4, y: 0.15, look: 0.04 } });
  stage.rig.follow = 9;

  // -------------------------------------------------------------- the atrium
  // (a plain matte floor: a glossy one throws glare across the bottom row)
  const shell = roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: 'tile', ceil: 'concrete', wallRepeat: 6 });
  shell.ceiling.visible = false;
  shell.floor.material.roughness = 0.72;
  shell.floor.material.metalness = 0.1;
  const edges = glitchEdges(root, { w: W, h: H, d: D });

  const roofMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.09, 0.06), toneMapped: false, side: THREE.DoubleSide });
  mesh(new THREE.PlaneGeometry(W, D), roofMat, { rx: Math.PI / 2, y: H, cast: false, receive: false, parent: root });
  const ribMat = tiled(M.metal, 1, 1);
  for (let i = -6; i <= 6; i++) box(0.14, 0.24, D, ribMat, { x: i * 2.2, y: H - 0.1, cast: false, parent: root });
  for (let i = -7; i <= 7; i++) box(W, 0.2, 0.14, ribMat, { y: H - 0.1, z: i * 2.2, cast: false, parent: root });

  const colMat = tiled(M.concrete, 1, 3);
  for (const x of [-9.5, 9.5]) {
    for (let z = -14; z <= 6; z += 5) {
      cyl(0.62, 0.7, H, colMat, { x, y: H / 2, z }, 24);
      box(1.5, 0.35, 1.5, tiled(M.metal, 1, 1), { x, y: 0.17, z });
      box(1.5, 0.35, 1.5, tiled(M.metal, 1, 1), { x, y: H - 0.17, z });
      strip(root, { w: 0.06, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: x + (x < 0 ? 0.72 : -0.72), y: 0.6, z });
    }
  }

  root.add(new THREE.AmbientLight(0x0c3a22, 0.42));
  const key = new THREE.SpotLight(0xd2ffe2, 150, 30, 0.45, 1, 1.7);
  key.position.set(2, H - 1.5, 7);
  key.target.position.set(0, 2.3, 0);
  root.add(key, key.target);

  // a few Agents, far back and dim — atmosphere only
  function agent(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    const suit = new THREE.MeshStandardMaterial({ color: 0x050706, roughness: 0.35, metalness: 0.25 });
    box(0.5, 0.95, 0.3, suit, { y: 0.48, x: -0.14, parent: g });
    box(0.5, 0.95, 0.3, suit, { y: 0.48, x: 0.14, parent: g });
    box(0.78, 0.95, 0.38, suit, { y: 1.42, parent: g });
    mesh(new THREE.SphereGeometry(0.19, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.6 }), { y: 2.1, parent: g });
    for (const s of [-1, 1]) box(0.16, 0.16, 0.9, suit, { x: s * 0.52, y: 1.52, z: 0.45, parent: g });
    root.add(g);
  }
  agent(-3.2, -11.5, 0.12);
  agent(0.4, -13, 0);
  agent(3.6, -11.2, -0.14);
  const rim = new THREE.SpotLight(0x4dff94, 380, 30, 0.7, 0.7, 1.6);
  rim.position.set(0, 7, -18);
  rim.target.position.set(0, 1.5, -11);
  root.add(rim, rim.target);

  // a quiet frozen storm, kept away from the field so it never competes with the badges
  const rainGeo = new THREE.BufferGeometry();
  const rp = [];
  for (let i = 0; i < 520; i++) {
    let x = (Math.random() - 0.5) * 24;
    if (Math.abs(x) < 4) x += Math.sign(x || 1) * 4;
    const y = Math.random() * H;
    const z = -16 + Math.random() * 20;
    rp.push(x, y, z, x + 0.02, y - 0.5 - Math.random() * 0.4, z);
  }
  rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x7dffc0, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  root.add(rain);
  const motes = dust(root, { w: 18, h: 6, d: 14, count: 90, center: [0, 0, -3], size: 0.02 });

  // ------------------------------------------------------ the 3x3 field
  // a dark backing panel isolates the data from everything behind it
  mesh(new THREE.PlaneGeometry(CELL * 3 + 0.5, CELL * 3 + 0.5), new THREE.MeshBasicMaterial({ color: 0x010604, transparent: true, opacity: 0.82, toneMapped: false, depthWrite: false }), { x: CX, y: CY, z: -1.2, parent: root, cast: false, receive: false });

  const frames = [];
  const frameBase = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1.6, 0.5), transparent: true, opacity: 0.55, toneMapped: false });
  const cellHot = {};
  let busy = false;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const c = cellPos(col, row);
      const fg = new THREE.Group();
      fg.position.copy(c);
      const m = frameBase.clone();
      const parts = [];
      const half = (CELL - 0.1) / 2;
      for (const [w, h, x, y] of [[CELL - 0.1, 0.03, 0, half], [CELL - 0.1, 0.03, 0, -half], [0.03, CELL - 0.1, half, 0], [0.03, CELL - 0.1, -half, 0]]) {
        parts.push(mesh(new THREE.BoxGeometry(w, h, 0.03), m, { x, y, parent: fg, cast: false, receive: false }));
      }
      const fill = mesh(new THREE.PlaneGeometry(CELL - 0.12, CELL - 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1, 0.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), { z: -0.02, parent: fg, cast: false, receive: false });
      // the keypad number, top-left of the cell
      const label = mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({ map: textTexture(String(keypadNumber(col, row)), { w: 128, h: 128, font: 'bold 96px ui-monospace, Menlo, monospace', color: '#9dffbf', glowPx: 8 }), transparent: true, toneMapped: false, depthWrite: false, color: new THREE.Color(1.3, 1.3, 1.3) }),
        { x: -half + 0.2, y: half - 0.2, z: 0.02, parent: fg, cast: false, receive: false }
      );
      root.add(fg);
      const entry = { col, row, fg, mat: m, fill, tried: false, label };
      const hit = hitbox(CELL, CELL, 0.8, { parent: fg });
      entry.hs = stage.addHotspot(hit, {
        outline: parts,
        onHover: (on) => (fill.material.opacity = on && !busy && !entry.tried ? 0.16 : 0),
        onClick: () => dodge(entry),
      });
      cellHot[`cell:${col},${row}`] = hit;
      frames.push(entry);
    }
  }

  // ------------------------------------------------------------ the bullets
  const glowTex = radialTexture('rgb(255,255,255)');
  let bullets = [];
  const bulletGroup = new THREE.Group();
  root.add(bulletGroup);
  const brass = new THREE.MeshStandardMaterial({ color: 0xd8b66a, metalness: 1, roughness: 0.25 });
  const jacket = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, metalness: 1, roughness: 0.35 });

  function buildBullets(v) {
    bulletGroup.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material && o.material !== brass && o.material !== jacket) o.material.dispose();
    });
    bulletGroup.clear();
    bullets = [];
    v.bullets.forEach((b, i) => {
      const hex = COLORS[b.color];
      const col = new THREE.Color(hex);
      const start = cellPos(b.col, b.row);
      const g = new THREE.Group();
      g.position.copy(start);

      // the badge is the thing to read
      const badge = makeBadge(b.color, hex, 0.4);
      g.add(badge);

      // pips: one = a single step, two = two steps
      const pips = new THREE.Group();
      const n = b.len === 2 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const pip = mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false }), { x: (k - (n - 1) / 2) * 0.24, y: -0.6, parent: pips, cast: false, receive: false });
        mesh(new THREE.RingGeometry(0.09, 0.115, 20), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2), toneMapped: false }), { x: pip.position.x, y: -0.6, z: 0.002, parent: pips, cast: false, receive: false });
      }
      g.add(pips);

      // decoration: a small brass round hanging at the badge's centre, every one the same way up
      const deco = new THREE.Group();
      deco.rotation.set(-0.5, 0.35, 0);
      deco.scale.setScalar(0.9);
      mesh(new THREE.CapsuleGeometry(0.052, 0.2, 6, 14), jacket, { rx: Math.PI / 2, parent: deco, cast: false });
      const tip = mesh(new THREE.SphereGeometry(0.052, 14, 10), brass, { z: 0.16, parent: deco, cast: false });
      tip.scale.set(1, 1, 1.3);
      g.add(deco);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.45 }));
      halo.scale.set(1.5, 1.5, 1);
      halo.position.z = -0.05;
      g.add(halo);

      bulletGroup.add(g);
      bullets.push({ g, deco, start, index: i, seed: Math.random() * 10 });
    });
  }

  // ----------------------------------------------------------------- state
  let cur = view;
  const tried = new Set((view.tried ?? []).map((t) => `${t.col},${t.row}`));
  const markTried = (col, row) => {
    const f = frames.find((e) => e.col === col && e.row === row);
    if (!f) return;
    f.tried = true;
    f.hs.opts.enabled = false;
    f.mat.color.setRGB(2.6, 0.2, 0.2);
    f.mat.opacity = 0.8;
    f.label.material.color.setRGB(2.2, 0.3, 0.3);
  };
  for (const key of tried) markTried(...key.split(',').map(Number));

  function dodge(entry) {
    if (busy || entry.tried) return;
    busy = true; // until the server answers
    send({ type: 'dodge', col: entry.col, row: entry.row });
  }

  buildBullets(view);
  audio.freeze();

  async function thaw(e, result, nextView) {
    busy = true;
    const target = cellPos(e.col, e.row);
    audio.thaw();
    stage.shake(0.04, 500);
    // slide toward the chosen cell while time unlocks
    const camTo = new THREE.Vector3(target.x * 0.85, target.y * 0.55 + 0.9, CAM.z);
    stage.moveRig(camTo, new THREE.Vector3(target.x * 0.5, target.y * 0.8 + 0.3, 0), 380, ease.out);
    await stage.wait(250);
    stage.pulseGlitch(0.5, 400);

    const ends = e.reveal.map((r) => {
      const p = cellPos(r.col, r.row);
      return new THREE.Vector3(p.x, p.y, 12.5);
    });
    let hitFired = false;
    await stage.tween(1050, (k) => {
      bullets.forEach((b, i) => {
        b.g.position.lerpVectors(b.start, ends[i], k);
        if (e.hit && !hitFired && k > 0.8 && e.reveal[i].col === e.col && e.reveal[i].row === e.row) {
          hitFired = true;
          stage.flash(0xff2030, 0.9, 500);
          stage.shake(0.35, 450);
          audio.slam();
        }
      });
    }, ease.in);
    for (const b of bullets) b.g.visible = false;

    if (e.hit) {
      // time rewinds: everything snaps back and the cell is struck off
      audio.glitch();
      stage.pulseGlitch(1, 600);
      markTried(e.col, e.row);
      await stage.wait(260);
      for (const b of bullets) {
        b.g.visible = true;
        b.g.position.copy(b.start);
      }
      audio.freeze();
      await stage.moveRig(CAM, LOOK, 700, ease.inOut);
      busy = false;
      return;
    }
    // dodged: breathe, then the next volley freezes into place
    stage.flash(0x9dffbf, 0.35, 500);
    await stage.wait(350);
    if (nextView) {
      cur = nextView;
      buildBullets(nextView);
      for (const f of frames) {
        f.tried = false;
        f.hs.opts.enabled = true;
        f.mat.color.setRGB(0.1, 1.6, 0.5);
        f.mat.opacity = 0.55;
        f.label.material.color.setRGB(1.3, 1.3, 1.3);
      }
      audio.freeze();
      stage.pulseGlitch(0.6, 350);
      await stage.moveRig(CAM, LOOK, 800, ease.inOut);
      busy = false;
    }
  }

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    rain.position.y -= dt * 0.03;
    if (rain.position.y < -1) rain.position.y = 0;
    if (!busy) {
      for (const b of bullets) {
        b.g.position.y = b.start.y + Math.sin(t * 0.7 + b.seed) * 0.01;
        b.deco.rotation.z = Math.sin(t * 0.5 + b.seed) * 0.06;
      }
    }
  });

  return {
    hot: cellHot,
    get idle() {
      return !busy;
    },
    get bullets() {
      return cur.bullets;
    },
    onFx(m) {
      if (m.event && m.event.reveal) thaw(m.event, m.result, m.view);
    },
    dispose() {},
  };
}
