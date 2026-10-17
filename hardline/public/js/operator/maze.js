// Operator — THE HARDLINE. The construct stops pretending: bare wireframe, low
// walls, floor glyphs. You only ever see the 3x3 patch around you. Somewhere in
// the dark a phone is ringing. Red floor is watched — stepping on it throws you
// back to the start. North is up the screen.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, radialTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, dust, COLORS } from '../kit.js';
import { ease } from '../stage.js';

const CELL = 2.4;
const WALL_H = 0.95;
const DIRS = {
  n: { dx: 0, dy: -1, bit: 0 },
  e: { dx: 1, dy: 0, bit: 1 },
  s: { dx: 0, dy: 1, bit: 2 },
  w: { dx: -1, dy: 0, bit: 3 },
};

const cw = (x, y) => new THREE.Vector3(x * CELL, 0, y * CELL);

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  // test/debug handles to the hotspots. Declared first: applyPatch() runs during the first
  // paint and registers the phone here when it is already in the starting 3x3 patch.
  const hot = {};
  scene.background = new THREE.Color(0x000201);
  scene.fog = new THREE.FogExp2(0x000402, 0.05);
  scene.environmentIntensity = 0.03;
  stage.baseFov = 50;
  stage.camera.fov = 50;
  stage.fxu.tint.value = 0.9;

  const camFor = (p) => ({ pos: new THREE.Vector3(p.x, 8.4, p.z + 6.6), look: new THREE.Vector3(p.x, 0, p.z - 0.2) });
  stage.setRig(new THREE.Vector3(0, 8.4, 6.6), new THREE.Vector3(0, 0, -0.2), { parallax: { x: 0.35, y: 0.1, look: 0.02 } });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.22));
  const lamp = new THREE.SpotLight(0xd8ffe8, 420, 18, 0.62, 1, 1.5);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.bias = -0.0006;
  root.add(lamp, lamp.target);
  const halo = new THREE.PointLight(0x4dff94, 18, 7, 2);
  root.add(halo);
  const motes = dust(root, { w: 18, h: 5, d: 18, count: 200, center: [0, 0, 0], size: 0.04 });

  // ---------------------------------------------------------- shared assets
  const tileMat = new THREE.MeshStandardMaterial({ color: 0x0b1510, roughness: 0.55, metalness: 0.7 });
  const tileEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL - 0.08, 0.16, CELL - 0.08));
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c1a13, roughness: 0.5, metalness: 0.6 });
  const wallEdgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.2, 2.0, 0.7), toneMapped: false });
  const wallGeoH = new THREE.BoxGeometry(CELL + 0.2, WALL_H, 0.2);
  const wallGeoV = new THREE.BoxGeometry(0.2, WALL_H, CELL + 0.2);
  const wallEdgesH = new THREE.EdgesGeometry(wallGeoH);
  const wallEdgesV = new THREE.EdgesGeometry(wallGeoV);
  const capMatBase = glow(0x1fff6a, 1.5);

  const glyphCache = new Map();
  const glyphTex = (g) => {
    if (!glyphCache.has(g)) glyphCache.set(g, glyphTexture(g, { size: 256, color: '#b6ffd0', lineWidth: 8, glowPx: 12 }));
    return glyphCache.get(g);
  };
  const redGlyph = new Map();
  const glyphTexRed = (g) => {
    if (!redGlyph.has(g)) redGlyph.set(g, glyphTexture(g, { size: 256, color: '#ff9a9a', lineWidth: 8, glowPx: 12 }));
    return redGlyph.get(g);
  };

  // --------------------------------------------------------- cells + walls
  const cells = new Map(); // "x,y" -> { g, glyphMat, data }
  const walls = new Map(); // "h:x:y" | "v:x:y" -> { g, cells:Set }
  let exitBooth = null;

  function ensureWall(key, x, y, horizontal) {
    if (walls.has(key)) return walls.get(key);
    const g = new THREE.Group();
    const m = mesh(horizontal ? wallGeoH : wallGeoV, wallMat, { parent: g, y: WALL_H / 2 });
    const e = new THREE.LineSegments(horizontal ? wallEdgesH : wallEdgesV, wallEdgeMat);
    e.position.y = WALL_H / 2;
    g.add(e);
    mesh(new THREE.BoxGeometry(horizontal ? CELL + 0.2 : 0.08, 0.04, horizontal ? 0.08 : CELL + 0.2), capMatBase, { parent: g, y: WALL_H + 0.01, cast: false, receive: false });
    g.position.set(horizontal ? x * CELL : (x - 0.5) * CELL, 0, horizontal ? (y - 0.5) * CELL : y * CELL);
    root.add(g);
    const w = { g, owners: new Set() };
    walls.set(key, w);
    return w;
  }

  function ensureCell(c) {
    const key = `${c.x},${c.y}`;
    let e = cells.get(key);
    if (e) {
      e.data = c;
      return e;
    }
    const g = new THREE.Group();
    g.position.copy(cw(c.x, c.y));
    root.add(g);
    mesh(new THREE.BoxGeometry(CELL - 0.08, 0.16, CELL - 0.08), tileMat.clone(), { y: -0.08, parent: g, cast: false });
    const edge = new THREE.LineSegments(tileEdgeGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0.1, 1.2, 0.4), toneMapped: false, transparent: true, opacity: 0.5 }));
    edge.position.y = -0.08;
    g.add(edge);
    const glyphMat = new THREE.MeshBasicMaterial({ map: c.trap ? glyphTexRed(c.g) : glyphTex(c.g), transparent: true, toneMapped: false, depthWrite: false, color: new THREE.Color(1.2, 1.4, 1.2) });
    mesh(new THREE.PlaneGeometry(1.35, 1.35), glyphMat, { rx: -Math.PI / 2, y: 0.012, parent: g, cast: false, receive: false });
    let trapMat = null;
    if (c.trap) {
      trapMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.12, 0.14), transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });
      mesh(new THREE.PlaneGeometry(CELL - 0.2, CELL - 0.2), trapMat, { rx: -Math.PI / 2, y: 0.008, parent: g, cast: false, receive: false });
      const l = new THREE.PointLight(0xff2a2a, 12, 4.5, 2);
      l.position.y = 0.8;
      g.add(l);
      e = { l };
    }
    e = { g, glyphMat, trapMat, edge, data: c, light: e?.l ?? null, x: c.x, y: c.y, key };
    cells.set(key, e);
    if (c.exit) buildBooth(e);
    return e;
  }

  function buildBooth(e) {
    const g = new THREE.Group();
    g.position.set(0, 0, -0.55);
    e.g.add(g);
    const frame = tiled(M.metal, 1, 1);
    frame.color.set(0x6a8a78);
    for (const [x, z] of [[-0.42, -0.4], [0.42, -0.4], [-0.42, 0.4], [0.42, 0.4]]) box(0.08, 2.3, 0.08, frame, { x, y: 1.15, z, parent: g });
    box(1.0, 0.12, 0.96, frame, { y: 2.32, parent: g });
    const pane = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.6, 0.8), transparent: true, opacity: 0.16, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
    for (const [x, z, ry] of [[-0.42, 0, Math.PI / 2], [0.42, 0, Math.PI / 2], [0, -0.4, 0]]) mesh(new THREE.PlaneGeometry(0.8, 2.1), pane, { x, y: 1.15, z, ry, parent: g, cast: false, receive: false });
    box(0.56, 0.7, 0.1, new THREE.MeshStandardMaterial({ color: 0x0c1411, roughness: 0.4, metalness: 0.8 }), { y: 1.35, z: -0.34, parent: g });
    // the receiver
    const rec = new THREE.Group();
    rec.position.set(-0.2, 1.46, -0.27);
    g.add(rec);
    const black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.3, metalness: 0.5 });
    box(0.36, 0.08, 0.08, black, { parent: rec });
    box(0.1, 0.12, 0.1, black, { x: -0.18, y: -0.04, parent: rec });
    box(0.1, 0.12, 0.1, black, { x: 0.18, y: -0.04, parent: rec });
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.8, 1.4), transparent: true, opacity: 0.0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
    const ring = mesh(new THREE.TorusGeometry(0.9, 0.025, 8, 48), ringMat, { rx: Math.PI / 2, y: 0.06, parent: e.g, cast: false, receive: false });
    const lamp2 = new THREE.PointLight(0x7dffc0, 40, 8, 2);
    lamp2.position.set(0, 2.1, -0.2);
    e.g.add(lamp2);
    const hit = hitbox(1.1, 2.4, 1.1, { y: 1.2, z: -0.4, parent: g });
    const hs = stage.addHotspot(hit, { outline: [rec.children[0]], onClick: () => answer(), enabled: false });
    exitBooth = { g, rec, ring, ringMat, lamp2, hs, hit, cell: e };
  }

  function applyPatch(v) {
    const inPatch = new Set(v.cells.map((c) => `${c.x},${c.y}`));
    for (const c of v.cells) {
      const e = ensureCell(c);
      const centre = c.x === v.pos.x && c.y === v.pos.y;
      const d = Math.max(Math.abs(c.x - v.pos.x), Math.abs(c.y - v.pos.y));
      const k = centre ? 1 : 0.55;
      e.g.visible = true;
      e.glyphMat.color.setRGB(1.3 * k, 1.5 * k, 1.3 * k);
      e.edge.material.opacity = centre ? 0.9 : 0.35;
      // wall bits n e s w
      for (const dir of ['n', 'e', 's', 'w']) {
        if (c.w[DIRS[dir].bit] !== '1') continue;
        const horizontal = dir === 'n' || dir === 's';
        const wx = dir === 'e' ? c.x + 1 : c.x;
        const wy = dir === 's' ? c.y + 1 : c.y;
        const key = `${horizontal ? 'h' : 'v'}:${wx}:${wy}`;
        const w = ensureWall(key, wx, wy, horizontal);
        w.owners.add(`${c.x},${c.y}`);
        w.g.visible = true;
      }
    }
    for (const [key, e] of cells) e.g.visible = inPatch.has(key);
    for (const w of walls.values()) w.g.visible = [...w.owners].some((o) => inPatch.has(o));
    // arrows follow the player and only point down open passages
    const here = v.cells.find((c) => c.x === v.pos.x && c.y === v.pos.y);
    for (const dir of ['n', 'e', 's', 'w']) {
      const a = arrows[dir];
      const open = here && here.w[DIRS[dir].bit] === '0';
      a.group.visible = !!open;
      a.hs.opts.enabled = !!open && !moving;
    }
    atExit = !!v.atExit;
    if (exitBooth) {
      const visible = inPatch.has(exitBooth.cell.key);
      exitBooth.hs.opts.enabled = atExit;
      exitBooth.lamp2.visible = visible;
      hot.phone = exitBooth.hit;
    }
  }

  // ----------------------------------------------------------- the avatar
  const avatar = new THREE.Group();
  root.add(avatar);
  const coat = new THREE.MeshStandardMaterial({ color: 0x050806, roughness: 0.35, metalness: 0.3 });
  mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 14), coat, { y: 0.62, parent: avatar });
  mesh(new THREE.SphereGeometry(0.17, 18, 14), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 }), { y: 1.28, parent: avatar });
  box(0.26, 0.05, 0.04, new THREE.MeshBasicMaterial({ color: 0x000000 }), { y: 1.3, z: 0.16, parent: avatar, cast: false });
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.6, 0.9), side: THREE.BackSide, transparent: true, opacity: 0.8, toneMapped: false });
  mesh(new THREE.CapsuleGeometry(0.235, 0.57, 6, 14), rimMat, { y: 0.62, parent: avatar, cast: false, receive: false });
  mesh(new THREE.SphereGeometry(0.2, 18, 14), rimMat, { y: 1.28, parent: avatar, cast: false, receive: false });
  const ringTex = radialTexture('rgb(120,255,170)');
  const pool = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: new THREE.Color(0.5, 1.6, 0.9), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.8 }));
  pool.scale.set(1.8, 1.8, 1);
  pool.position.y = 0.05;
  avatar.add(pool);

  // ----------------------------------------------------------- move arrows
  const arrows = {};
  const arrowGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.3);
    s.lineTo(0.28, -0.1);
    s.lineTo(0.1, -0.1);
    s.lineTo(0.1, -0.3);
    s.lineTo(-0.1, -0.3);
    s.lineTo(-0.1, -0.1);
    s.lineTo(-0.28, -0.1);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  })();
  const arrowMatBase = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.0, 0.8), transparent: true, opacity: 0.55, toneMapped: false, side: THREE.DoubleSide, depthWrite: false });
  const rotFor = { n: 0, e: -Math.PI / 2, s: Math.PI, w: Math.PI / 2 };
  for (const dir of ['n', 'e', 's', 'w']) {
    const group = new THREE.Group();
    const d = DIRS[dir];
    group.position.set(d.dx * 0.95, 0.03, d.dy * 0.95);
    const m = new THREE.Mesh(arrowGeo, arrowMatBase.clone());
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rotFor[dir];
    group.add(m);
    const hit = hitbox(1.0, 0.6, 1.0, { y: 0.2, parent: group });
    avatar.add(group);
    const hs = stage.addHotspot(hit, {
      outline: [m],
      onHover: (on) => (m.material.opacity = on ? 1 : 0.55),
      onClick: () => go(dir),
    });
    arrows[dir] = { group, m, hs, hit };
  }

  // --------------------------------------------------------------- state
  let pos = { ...view.pos };
  let moving = false;
  let atExit = false;
  let busy = false;
  let ringT = 0;

  function place(p, snap = true) {
    const w = cw(p.x, p.y);
    avatar.position.copy(w);
    lamp.position.set(w.x - 1.2, 8.5, w.z + 2.5);
    lamp.target.position.copy(w);
    halo.position.set(w.x, 1.4, w.z);
    const c = camFor(w);
    stage.setRig(c.pos, c.look, { snap });
  }

  function go(dir) {
    if (moving || busy) return;
    send({ type: 'move', dir });
  }

  function answer() {
    if (!atExit || busy) return;
    send({ type: 'answer' });
  }

  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const map = { ArrowUp: 'n', w: 'n', W: 'n', ArrowRight: 'e', d: 'e', D: 'e', ArrowDown: 's', s: 's', S: 's', ArrowLeft: 'w', a: 'w', A: 'w' };
    if (map[e.key]) {
      e.preventDefault();
      go(map[e.key]);
    } else if ((e.key === 'Enter' || e.key === ' ') && atExit) {
      e.preventDefault();
      answer();
    }
  };
  window.addEventListener('keydown', onKey);

  function slideTo(p, ms = 420) {
    const a = avatar.position.clone();
    const b = cw(p.x, p.y);
    const camA = { pos: stage.rig.pos.clone(), look: stage.rig.look.clone() };
    const c = camFor(b);
    const la = lamp.position.clone();
    const lb = new THREE.Vector3(b.x - 1.2, 8.5, b.z + 2.5);
    return stage.tween(ms, (k) => {
      avatar.position.lerpVectors(a, b, k);
      avatar.position.y = Math.sin(k * Math.PI) * 0.12;
      stage.rig.pos.lerpVectors(camA.pos, c.pos, k);
      stage.rig.look.lerpVectors(camA.look, c.look, k);
      lamp.position.lerpVectors(la, lb, k);
      lamp.target.position.copy(avatar.position);
      halo.position.set(avatar.position.x, 1.4, avatar.position.z);
    }, ease.inOut);
  }

  // first paint
  applyPatch(view);
  place(view.pos);
  audio.freeze();

  for (const d of ['n', 'e', 's', 'w']) hot[`move:${d}`] = arrows[d].hit;
  if (exitBooth) hot.phone = exitBooth.hit;

  async function onMove(m) {
    const e = m.event;
    if (m.result === 'info') {
      audio.bump();
      stage.shake(0.04, 160);
      return;
    }
    moving = true;
    for (const a of Object.values(arrows)) a.hs.opts.enabled = false;
    if (m.result === 'wrong' && e?.trap) {
      // step onto the watched cell, get caught, get thrown back
      busy = true;
      audio.step();
      await slideTo(e.via, 320);
      stage.flash(0xff2030, 0.7, 400);
      stage.shake(0.25, 420);
      stage.pulseGlitch(1, 600);
      audio.stinger();
      await stage.wait(420);
      pos = { ...m.view.pos };
      applyPatch(m.view);
      place(pos, true);
      audio.glitch();
      busy = false;
      moving = false;
      applyPatch(m.view);
      return;
    }
    audio.step();
    pos = { ...m.view.pos };
    applyPatch(m.view);
    await slideTo(pos);
    moving = false;
    applyPatch(m.view);
  }

  async function onPickup() {
    busy = true;
    audio.pickup();
    const rec = exitBooth?.rec;
    if (rec) await stage.tween(500, (k) => (rec.position.y = 1.46 + 0.25 * k, rec.rotation.z = -0.6 * k));
    stage.flash(0xe8fff0, 1, 1400);
    await stage.moveRig(stage.rig.pos.clone().add(new THREE.Vector3(0, -3.4, -2.2)), avatar.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 1400, ease.in);
  }

  stage.onTick((dt, t) => {
    motes.update(dt);
    pool.material.opacity = 0.7 + Math.sin(t * 3) * 0.12;
    for (const e of cells.values()) {
      if (e.trapMat) e.trapMat.opacity = 0.38 + 0.2 * Math.sin(t * 4 + e.x * 1.3);
      if (e.light) e.light.intensity = 10 + 3 * Math.sin(t * 4 + e.y);
    }
    if (exitBooth && exitBooth.cell.g.visible) {
      ringT += dt;
      const k = (ringT % 2.4) / 2.4;
      exitBooth.ring.scale.setScalar(0.6 + k * 1.2);
      exitBooth.ringMat.opacity = (1 - k) * 0.7;
      exitBooth.lamp2.intensity = 30 + 14 * Math.sin(t * 16) * (k < 0.35 ? 1 : 0.1);
      exitBooth.rec.rotation.z = k < 0.35 ? Math.sin(t * 60) * 0.03 : 0;
      if (ringT > 2.4) {
        ringT = 0;
        audio.phoneRing();
      }
    } else if (exitBooth) ringT = 2.35;
  });

  return {
    hot,
    get idle() {
      return !moving && !busy;
    },
    onFx(m) {
      if (m.event?.pickup) return onPickup();
      if (m.result === 'info' || m.result === 'move' || m.result === 'wrong') return onMove(m);
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
