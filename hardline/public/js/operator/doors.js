// Operator — THE CORRIDOR. A hall of identical doors. Each has a faint glyph etched
// above it and a porthole with a glimpse of what lies beyond.
// Nothing is labelled. Describe what you see.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, LiveCanvas } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, lightCone, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';
import { GlimpseSet } from '../glimpses.js';

const W = 22;
const H = 5.4;
const D = 15;
const BACK = -D / 2;
const DOOR_W = 1.55;
const DOOR_H = 3.15;

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x03100b, 0.024);

  stage.baseFov = 54;
  stage.camera.fov = 54;
  const CAM = new THREE.Vector3(0, 1.8, 4.3);
  const LOOK = new THREE.Vector3(0, 1.85, BACK);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.5, y: 0.15, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 5 });
  wetFloor(stage, root, { w: W, d: D, repeat: 8 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 260 });

  root.add(new THREE.AmbientLight(0x0b3a1f, 0.28));
  const fill = new THREE.SpotLight(0xbfffd5, 340, 28, 0.95, 0.8, 1.6);
  fill.position.set(0, H - 0.1, 3);
  fill.target.position.set(0, 1.5, BACK);
  fill.castShadow = true;
  fill.shadow.mapSize.set(1024, 1024);
  fill.shadow.bias = -0.0005;
  root.add(fill, fill.target);

  // ceiling light bars with an unreliable one that stutters
  const bars = [];
  for (const x of [-7, -3.5, 0, 3.5, 7]) {
    const s = strip(root, { w: 0.14, d: 5, color: 0xcfffe0, intensity: 1.8, x, y: H - 0.05, z: -2, light: 22, lightDist: 8 });
    bars.push(s);
  }
  // floor guide strips
  for (const x of [-9.6, 9.6]) strip(root, { w: 0.06, d: D - 1, color: 0x1fff6a, intensity: 1.4, x, y: 0.012, z: 0 });
  strip(root, { w: W - 0.6, d: 0.06, color: 0x1fff6a, intensity: 1.5, x: 0, y: 0.1, z: BACK + 0.06 });

  // side pipes for scale
  for (const sx of [-1, 1]) {
    for (const y of [3.7, 4.1, 4.5]) cyl(0.07, 0.07, D - 0.5, tiled(M.metal, 1, 4), { x: sx * (W / 2 - 0.25), y, z: 0, rx: Math.PI / 2 }, 12);
  }

  const glimpses = new GlimpseSet();
  const doorMat = tiled(M.metal, 1, 2);
  doorMat.color.set(0x8fae9b);
  const frameMat = tiled(M.metal, 1, 1);
  frameMat.color.set(0x90a898);

  let doorsGroup = new THREE.Group();
  root.add(doorsGroup);
  let doors = []; // { g, slab, hinge, win, led, glyphMesh, hs, dead, index }
  let cur = view;
  let busy = false;

  function buildDoors(v) {
    doorsGroup.traverse((o) => o.geometry?.dispose?.());
    root.remove(doorsGroup);
    stage.clearHotspots();
    doorsGroup = new THREE.Group();
    root.add(doorsGroup);
    doors = [];
    const n = v.doors.length;
    const span = Math.min(W - 2.5, 3.1 * n);
    const gap = span / n;
    v.doors.forEach((d, i) => {
      const x = (i - (n - 1) / 2) * gap;
      const g = new THREE.Group();
      g.position.set(x, 0, BACK + 0.04);
      doorsGroup.add(g);

      // frame + pilaster
      box(0.2, DOOR_H + 0.25, 0.4, frameMat, { x: -DOOR_W / 2 - 0.1, y: (DOOR_H + 0.25) / 2, z: 0.12, parent: g });
      box(0.2, DOOR_H + 0.25, 0.4, frameMat, { x: DOOR_W / 2 + 0.1, y: (DOOR_H + 0.25) / 2, z: 0.12, parent: g });
      box(DOOR_W + 0.4, 0.25, 0.4, frameMat, { y: DOOR_H + 0.12, z: 0.12, parent: g });
      // dark recess behind the slab, lit when it opens
      const behindMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.01, 0.02, 0.015), toneMapped: false });
      const behind = mesh(new THREE.PlaneGeometry(DOOR_W, DOOR_H), behindMat, { y: DOOR_H / 2, z: -0.08, parent: g, cast: false });

      // the slab pivots on its left edge
      const hinge = new THREE.Group();
      hinge.position.set(-DOOR_W / 2, 0, 0.1);
      g.add(hinge);
      const slab = new THREE.Group();
      slab.position.x = DOOR_W / 2;
      hinge.add(slab);
      const slabMesh = box(DOOR_W - 0.03, DOOR_H - 0.03, 0.16, doorMat, { y: DOOR_H / 2, parent: slab });
      for (const yy of [0.55, 2.6]) box(DOOR_W - 0.3, 0.04, 0.03, frameMat, { y: yy, z: 0.09, parent: slab, cast: false });
      cyl(0.045, 0.045, 0.16, frameMat, { x: DOOR_W / 2 - 0.2, y: 1.15, z: 0.1, rx: Math.PI / 2, parent: slab }, 12);

      // porthole with the glimpse
      const ring = mesh(new THREE.TorusGeometry(0.4, 0.05, 12, 32), frameMat, { y: 1.95, z: 0.1, parent: slab });
      const winMat = new THREE.MeshBasicMaterial({ map: glimpses.get(d.glimpse), toneMapped: false, color: new THREE.Color(1.15, 1.15, 1.15) });
      const win = mesh(new THREE.CircleGeometry(0.38, 32), winMat, { y: 1.95, z: 0.12, parent: slab, cast: false, receive: false });
      const winLight = new THREE.PointLight(0xffffff, 0, 5, 2);
      winLight.position.set(0, 1.95, 0.9);
      slab.add(winLight);

      // the faint etched glyph above the door
      const glyphTex = glyphTexture(d.glyph, { size: 256, color: '#7dffa6', lineWidth: 8, glowPx: 4 });
      const gMat = new THREE.MeshBasicMaterial({ map: glyphTex, transparent: true, opacity: 0.8, toneMapped: false, color: new THREE.Color(0.8, 1.1, 0.88), depthWrite: false });
      const glyphMesh = mesh(new THREE.PlaneGeometry(0.95, 0.95), gMat, { y: DOOR_H + 0.62, z: 0.06, parent: g, cast: false, receive: false });

      // status light (dark until the door is spent)
      const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.1, 0.04), toneMapped: false });
      const led = mesh(new THREE.SphereGeometry(0.05, 12, 8), ledMat, { x: DOOR_W / 2 - 0.2, y: DOOR_H - 0.25, z: 0.2, parent: g, cast: false });

      const hit = hitbox(DOOR_W + 0.2, DOOR_H + 0.1, 0.5, { y: DOOR_H / 2, z: 0.2, parent: g });
      const entry = { index: i, g, hinge, slab, slabMesh, win, winMat, winLight, behind, behindMat, led, ledMat, glyphMesh, gMat, dead: false, data: d };
      entry.hs = stage.addHotspot(hit, { outline: [slabMesh, ring], onClick: () => choose(i) });
      doors.push(entry);
    });
    for (const i of v.dead ?? []) markDead(doors[i], true);
  }

  function markDead(d, instant = false) {
    if (!d) return;
    d.dead = true;
    d.hs.opts.enabled = false;
    d.ledMat.color.setRGB(3, 0.1, 0.1);
    d.winMat.color.setRGB(0.06, 0.02, 0.02);
    d.gMat.opacity = 0.15;
    d.slabMesh.material = tiled(M.metal, 1, 2);
    d.slabMesh.material.color.set(0x2a2f2c);
    if (!instant) d.ledMat.color.setRGB(4, 0.1, 0.1);
  }

  function choose(i) {
    if (busy || doors[i].dead) return;
    send({ type: 'open', door: i });
  }

  function swing(d, deg, ms) {
    const a0 = d.hinge.rotation.y;
    const a1 = -THREE.MathUtils.degToRad(deg);
    return stage.tween(ms, (k) => (d.hinge.rotation.y = a0 + (a1 - a0) * k), ease.out);
  }

  async function wrongDoor(e) {
    busy = true;
    const d = doors[e.door];
    const palette = { TRAP: [3.2, 0.25, 0.2], LOOP: [1.6, 0.5, 3.2], AGENT: [3.4, 3.4, 3.4] };
    const c = palette[e.verdict] ?? palette.TRAP;
    d.behindMat.color.setRGB(...c);
    d.winLight.color.setRGB(c[0] / 3.4, c[1] / 3.4, c[2] / 3.4);
    d.winLight.intensity = 60;
    audio.slam();
    await swing(d, 70, 260);
    if (e.verdict === 'LOOP') {
      stage.pulseGlitch(1, 600);
      audio.glitch();
    } else if (e.verdict === 'AGENT') {
      audio.stinger();
      stage.flash(0xffffff, 0.7, 260);
    } else {
      stage.shake(0.18, 500);
    }
    await stage.wait(520);
    await swing(d, 0, 320);
    d.winLight.intensity = 0;
    d.behindMat.color.setRGB(0.01, 0.02, 0.015);
    markDead(d);
    busy = false;
  }

  async function passDoor(e, next) {
    busy = true;
    const d = doors[e.door];
    d.behindMat.color.setRGB(0.8, 3.2, 1.3);
    d.winLight.color.setRGB(0.3, 1, 0.5);
    d.winLight.intensity = 70;
    d.ledMat.color.setRGB(0.3, 3.5, 1);
    audio.door();
    await swing(d, 105, 900);
    audio.whoosh(true);
    const wp = new THREE.Vector3();
    d.g.getWorldPosition(wp);
    await stage.moveRig(new THREE.Vector3(wp.x, 1.7, BACK + 0.9), new THREE.Vector3(wp.x, 1.8, BACK - 4), 1300, ease.in);
    stage.flash(0xd8ffe4, 1, 700);
    await stage.wait(420);
    if (next) {
      stage.pulseGlitch(0.9, 500);
      stage.setRig(CAM, LOOK, { snap: true });
      cur = next;
      buildDoors(next);
    }
    busy = false;
  }

  buildDoors(view);

  const hot = {};
  const refreshHot = () => doors.forEach((d, i) => (hot[`door:${i}`] = d.g.children.at(-1)));
  refreshHot();

  stage.onTick((dt, t) => {
    glimpses.update(dt);
    motes.update(dt);
    edges.update(dt, t);
    // one unreliable ceiling light
    bars[2].material.color.setScalar((Math.sin(t * 31) > 0.2 || Math.random() > 0.97 ? 1 : 0.15) * 2.0);
    for (const d of doors) {
      if (!d.dead && d.winLight.intensity === 0) d.winMat.color.setScalar(1.1 + 0.08 * Math.sin(t * 3 + d.index));
    }
  });

  return {
    hot,
    get idle() {
      return !busy;
    },
    get doors() {
      return doors.map((d) => d.data);
    },
    onFx(m) {
      if (m.result === 'wrong') wrongDoor(m.event);
      else if (m.result === 'stage') passDoor(m.event, m.view).then(refreshHot);
      else if (m.result === 'solved') passDoor(m.event, null);
    },
    onGo() {
      refreshHot();
    },
    dispose() {},
  };
}
