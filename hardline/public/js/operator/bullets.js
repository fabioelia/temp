// Operator — THE ATRIUM. Time has stopped mid-volley. Bullets hang in a 3x3 field,
// each trailing a coloured tracer. Heights and angles are decoration. When you
// commit to a cell, time thaws and every bullet drifts the way its tracer says.

import * as THREE from 'three';
import { materials, tiled, glow, radialTexture, fadeTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, dust, glitchEdges, strip, COLORS } from '../kit.js';
import { ease } from '../stage.js';

const W = 28;
const H = 13;
const D = 34;
const CELL = 1.55;
const CX = 0;
const CY = 2.35;
const CZ = 0;
const SHORT = 0.95;
const LONG = 2.35;

const cellPos = (col, row) => new THREE.Vector3(CX + (col - 1) * CELL, CY + (1 - row) * CELL, CZ);

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020c08, 0.017);
  stage.baseFov = 52;
  stage.camera.fov = 52;
  const CAM = new THREE.Vector3(0, 2.4, 6.9);
  const LOOK = new THREE.Vector3(0, 2.3, 0);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.45, y: 0.18, look: 0.05 } });
  stage.rig.follow = 9;

  // -------------------------------------------------------------- the atrium
  const shell = roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 6 });
  shell.ceiling.visible = false;
  wetFloor(stage, root, { w: W, d: D, repeat: 10, tint: 0x2c4a3a, roughness: 0.5, opacity: 0.9 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });

  // glass roof: a lattice with a frozen storm behind it
  const roofMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.09, 0.06), toneMapped: false, side: THREE.DoubleSide });
  mesh(new THREE.PlaneGeometry(W, D), roofMat, { rx: Math.PI / 2, y: H, cast: false, receive: false, parent: root });
  const ribMat = tiled(M.metal, 1, 1);
  for (let i = -6; i <= 6; i++) box(0.14, 0.24, D, ribMat, { x: i * 2.2, y: H - 0.1, cast: false, parent: root });
  for (let i = -7; i <= 7; i++) box(W, 0.2, 0.14, ribMat, { y: H - 0.1, z: i * 2.2, cast: false, parent: root });
  const moon = new THREE.PointLight(0x7dffb0, 70, 40, 2);
  moon.position.set(0, H - 1.2, -2);
  root.add(moon);

  // columns down both sides
  const colMat = tiled(M.concrete, 1, 3);
  for (const x of [-9.5, 9.5]) {
    for (let z = -14; z <= 6; z += 5) {
      cyl(0.62, 0.7, H, colMat, { x, y: H / 2, z }, 24);
      box(1.5, 0.35, 1.5, tiled(M.metal, 1, 1), { x, y: 0.17, z });
      box(1.5, 0.35, 1.5, tiled(M.metal, 1, 1), { x, y: H - 0.17, z });
      strip(root, { w: 0.06, d: 0.06, color: 0x1fff6a, intensity: 1.6, x: x + (x < 0 ? 0.72 : -0.72), y: 0.6, z });
    }
  }

  root.add(new THREE.AmbientLight(0x0c3a22, 0.35));
  const key = new THREE.SpotLight(0xd2ffe2, 150, 34, 0.38, 1, 1.6);
  key.position.set(2, H - 1.5, 7);
  key.target.position.set(0, 2.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);

  // ----------------------------------------------------- the agents, far back
  function agent(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    const suit = new THREE.MeshStandardMaterial({ color: 0x050706, roughness: 0.35, metalness: 0.25 });
    box(0.5, 0.95, 0.3, suit, { y: 0.48, x: -0.14, parent: g });
    box(0.5, 0.95, 0.3, suit, { y: 0.48, x: 0.14, parent: g });
    box(0.78, 0.95, 0.38, suit, { y: 1.42, parent: g });
    mesh(new THREE.SphereGeometry(0.19, 16, 12), new THREE.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.6 }), { y: 2.1, parent: g });
    box(0.3, 0.06, 0.04, new THREE.MeshBasicMaterial({ color: 0x000000 }), { y: 2.12, z: 0.18, parent: g, cast: false });
    for (const s of [-1, 1]) {
      box(0.16, 0.16, 0.9, suit, { x: s * 0.52, y: 1.52, z: 0.45, parent: g });
      box(0.07, 0.14, 0.3, new THREE.MeshStandardMaterial({ color: 0x111, metalness: 1, roughness: 0.3 }), { x: s * 0.52, y: 1.52, z: 1.0, parent: g });
      mesh(new THREE.SphereGeometry(0.1, 8, 8), glow(0xd8ffe4, 3.5), { x: s * 0.52, y: 1.56, z: 1.2, parent: g, cast: false });
    }
    root.add(g);
    return g;
  }
  agent(-3.2, -10.5, 0.12);
  agent(0.4, -12, 0);
  agent(3.6, -10.2, -0.14);
  const rim = new THREE.SpotLight(0x4dff94, 700, 30, 0.7, 0.7, 1.6);
  rim.position.set(0, 7, -17);
  rim.target.position.set(0, 1.5, -10);
  root.add(rim, rim.target);

  // ----------------------------------------------------- frozen storm + glass
  const rainGeo = new THREE.BufferGeometry();
  const rp = [];
  for (let i = 0; i < 900; i++) {
    const x = (Math.random() - 0.5) * 24;
    const y = Math.random() * H;
    const z = -16 + Math.random() * 26;
    rp.push(x, y, z, x + 0.02, y - 0.5 - Math.random() * 0.4, z);
  }
  rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x7dffc0, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  root.add(rain);

  const shardGeo = new THREE.TetrahedronGeometry(0.06, 0);
  const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xaaffdd, roughness: 0.05, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.55, emissive: 0x1fff6a, emissiveIntensity: 0.18 });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, 70);
  const sd = new THREE.Object3D();
  const shardSpin = [];
  for (let i = 0; i < 70; i++) {
    // keep the field itself clear so the tracers read; debris hangs around the edges
    let x = (Math.random() - 0.5) * 11;
    if (Math.abs(x) < 3.2) x += Math.sign(x || 1) * 3.2;
    sd.position.set(x, Math.random() * 5.5, -6 + Math.random() * 10);
    sd.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const s = 0.4 + Math.random() * 1.2;
    sd.scale.set(s, s, s);
    sd.updateMatrix();
    shards.setMatrixAt(i, sd.matrix);
    shardSpin.push([Math.random() - 0.5, Math.random() - 0.5]);
  }
  root.add(shards);
  const motes = dust(root, { w: 18, h: 6, d: 14, count: 220, center: [0, 0, 0], size: 0.025 });

  // -------------------------------------------------------- the 3x3 field
  const frames = [];
  const frameBase = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1.2, 0.4), transparent: true, opacity: 0.35, toneMapped: false });
  const cellHot = {};
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const c = cellPos(col, row);
      const fg = new THREE.Group();
      fg.position.copy(c);
      const m = frameBase.clone();
      const parts = [];
      for (const [w, h, x, y] of [[CELL - 0.1, 0.025, 0, (CELL - 0.1) / 2], [CELL - 0.1, 0.025, 0, -(CELL - 0.1) / 2], [0.025, CELL - 0.1, (CELL - 0.1) / 2, 0], [0.025, CELL - 0.1, -(CELL - 0.1) / 2, 0]]) {
        parts.push(mesh(new THREE.BoxGeometry(w, h, 0.025), m, { x, y, parent: fg, cast: false, receive: false }));
      }
      const fill = mesh(new THREE.PlaneGeometry(CELL - 0.12, CELL - 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1, 0.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), { parent: fg, cast: false, receive: false });
      root.add(fg);
      const entry = { col, row, fg, mat: m, fill, tried: false };
      const hit = hitbox(CELL, CELL, 0.8, { parent: fg });
      entry.hs = stage.addHotspot(hit, {
        outline: parts,
        onHover: (on) => (fill.material.opacity = on && !busy && !entry.tried ? 0.12 : 0),
        onClick: () => dodge(entry),
      });
      cellHot[`cell:${col},${row}`] = hit;
      frames.push(entry);
    }
  }

  // ------------------------------------------------------------ the bullets
  const glowTex = radialTexture('rgb(255,255,255)');
  const fade = fadeTexture();
  let bullets = [];
  const bulletGroup = new THREE.Group();
  root.add(bulletGroup);
  const brass = new THREE.MeshStandardMaterial({ color: 0xd8b66a, metalness: 1, roughness: 0.22 });
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
      const start = cellPos(b.col, b.row).add(new THREE.Vector3((Math.random() - 0.5) * 0.28, (Math.random() - 0.5) * 0.28, (Math.random() - 0.5) * 0.7));
      const g = new THREE.Group();
      g.position.copy(start);
      const tilt = new THREE.Group();
      tilt.scale.setScalar(1.4);
      tilt.rotation.set((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 1.5);
      g.add(tilt);
      // body (axis along +z, tip toward the viewer)
      const body = mesh(new THREE.CapsuleGeometry(0.058, 0.26, 6, 14), jacket, { rx: Math.PI / 2, parent: tilt, cast: false });
      const tip = mesh(new THREE.SphereGeometry(0.058, 14, 10), brass, { z: 0.2, parent: tilt, cast: false });
      tip.scale.set(1, 1, 1.35);
      // tracer: glowing base + a long additive trail fading away behind it
      const L = b.len === 2 ? LONG : SHORT;
      const trailMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.7), transparent: true, opacity: 0.95, alphaMap: fade, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      const trail = mesh(new THREE.CylinderGeometry(0.012, 0.062, L, 14, 1, true), trailMat, { z: -0.15 - L / 2, rx: Math.PI / 2, parent: tilt, cast: false, receive: false });
      const core = mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.2), toneMapped: false }), { z: -0.13, parent: tilt, cast: false });
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().multiplyScalar(1.5), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.8 }));
      halo.scale.set(0.9, 0.9, 1);
      halo.position.z = -0.13;
      tilt.add(halo);
      // frozen compression rings around the tip
      for (const [dz, r, op] of [[0.32, 0.2, 0.55], [0.55, 0.34, 0.25]]) {
        const ring = mesh(new THREE.TorusGeometry(r, 0.006, 6, 48), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.8), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), { z: dz, parent: tilt, cast: false, receive: false });
        ring.rotation.x += (Math.random() - 0.5) * 0.15;
      }
      const light = new THREE.PointLight(col, 4, 2.2, 2);
      light.position.set(0, 0, -0.2);
      tilt.add(light);
      bulletGroup.add(g);
      bullets.push({ g, tilt, start, trailMat, L, light, index: i, seed: Math.random() * 10 });
    });
  }

  // ----------------------------------------------------------------- state
  let cur = view;
  let busy = false;
  const tried = new Set((view.tried ?? []).map((t) => `${t.col},${t.row}`));
  const markTried = (col, row) => {
    const f = frames.find((e) => e.col === col && e.row === row);
    if (!f) return;
    f.tried = true;
    f.hs.opts.enabled = false;
    f.mat.color.setRGB(2.6, 0.2, 0.2);
    f.mat.opacity = 0.7;
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
    // slide into the chosen cell while time unlocks
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
        b.trailMat.opacity = 0.95;
        b.g.scale.z = 1 + k * 2;
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
        b.g.scale.z = 1;
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
        f.mat.color.setRGB(0.1, 1.2, 0.4);
        f.mat.opacity = 0.35;
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
    rain.position.y -= dt * 0.03; // time isn't quite stopped: it's thick as glue
    if (rain.position.y < -1) rain.position.y = 0;
    shards.rotation.y += dt * 0.01;
    if (!busy) {
      for (const b of bullets) {
        b.g.position.y = b.start.y + Math.sin(t * 0.7 + b.seed) * 0.012;
        b.light.intensity = 3.5 + Math.sin(t * 3 + b.seed) * 0.6;
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
      if (m.event && m.event.reveal) {
        thaw(m.event, m.result, m.view);
      }
    },
    dispose() {},
  };
}
