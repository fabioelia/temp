// Operator — THE LOGIC WALL. Switches on the left, gate chips in the middle, one lamp on the right.
// Every chip carries a letter, a glyph, and tags saying what feeds it. The wires never light up:
// pressing ENGAGE tests the switches, and a failed test costs a strike. Describe each chip to the
// Mentor — only the Protocol knows what the glyphs mean.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, textTexture, radialTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';

const W = 36;
const H = 11;
const D = 22;
const WALL_Z = -6;

const keyOf = (s) => (s.s !== undefined ? `s${s.s}` : `g${s.g}`);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Place every switch and gate on the wall. Columns by depth in the circuit, rows pulled towards their inputs. */
function layout(v) {
  const n = v.switches;
  const pos = new Map();
  for (let i = 0; i < n; i++) pos.set(`s${i}`, { x: -8.1, y: 7.9 - i * (5.9 / (n - 1)), half: 1.15 });
  const layer = new Map();
  for (const g of v.gates) layer.set(g.id, 1 + Math.max(...g.in.map((s) => (s.s !== undefined ? 0 : layer.get(s.g)))));
  const L = Math.max(...layer.values());
  const step = Math.min(4.5, 8.8 / Math.max(1, L - 1));
  const colX = (k) => -4.2 + (k - 1) * step;
  for (let k = 1; k <= L; k++) {
    const items = v.gates.filter((g) => layer.get(g.id) === k).map((g) => ({ g, y: mean(g.in.map((s) => pos.get(keyOf(s)).y)) }));
    items.sort((a, b) => a.y - b.y);
    const GAP = 1.95;
    items.forEach((it, i) => (it.y = i === 0 ? Math.max(it.y, 2.0) : Math.max(it.y, items[i - 1].y + GAP)));
    for (let i = items.length - 1; i >= 0; i--) items[i].y = Math.min(items[i].y, i === items.length - 1 ? 8.2 : items[i + 1].y - GAP);
    items.forEach((it) => pos.set(`g${it.g.id}`, { x: colX(k), y: it.y, half: 1.2, layer: k }));
  }
  return { pos, layer };
}

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x030d09, 0.02);
  stage.baseFov = 56;
  stage.camera.fov = 56;
  const CAM = new THREE.Vector3(0, 5.4, 5.6);
  const LOOK = new THREE.Vector3(0, 5.3, WALL_Z);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.4, y: 0.14, look: 0.04 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 7 });
  wetFloor(stage, root, { w: W, d: D, repeat: 10, base: 'plate', roughness: 0.4, tint: 0x3d6a52, opacity: 0.9 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 180 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.4));
  const key = new THREE.SpotLight(0xcfffe0, 380, 40, 0.8, 0.9, 1.5);
  key.position.set(0, H - 0.6, 5);
  key.target.position.set(0, 5.2, WALL_Z);
  root.add(key, key.target);
  for (const x of [-9, -3, 3, 9]) strip(root, { w: 0.14, d: 4, color: 0xcfffe0, intensity: 1.4, x, y: H - 0.05, z: -3, light: 18, lightDist: 9 });
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  const steel = tiled(M.metal, 2, 1);
  steel.color.set(0x6f8a79);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x07130e, roughness: 0.55, metalness: 0.55 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x102019, roughness: 0.45, metalness: 0.6 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x040a07, roughness: 0.5, metalness: 0.5 });
  const wireMat = glow(0x3fd183, 1.0);
  const frameMat = glow(0x1fff6a, 1.0);
  const sockMat = glow(0xb6ffd0, 1.6);

  // the slab the circuit is mounted on
  box(20.4, 9.4, 0.5, slabMat, { y: 5.3, z: WALL_Z - 0.28, cast: false });
  for (const y of [0.55, 10.05]) box(20.8, 0.18, 0.7, steel, { y, z: WALL_Z - 0.2, cast: false });
  for (const x of [-10.3, 10.3]) box(0.18, 9.6, 0.7, steel, { x, y: 5.3, z: WALL_Z - 0.2, cast: false });

  // text planes (cached per string)
  const texCache = new Map();
  const label = (text, w, h, { color = '#b6ffd0', px = 72, tw = 256, th = 128 } = {}) => {
    const k = `${text}|${color}|${px}|${tw}|${th}`;
    if (!texCache.has(k)) texCache.set(k, textTexture(text, { w: tw, h: th, color, font: `bold ${px}px ui-monospace, Menlo, monospace`, glowPx: 10 }));
    return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texCache.get(k), transparent: true, toneMapped: false, depthWrite: false }), { cast: false, receive: false });
  };
  const placed = (m, parent, x, y, z) => (m.position.set(x, y, z), parent.add(m), m);
  const glyphTex = new Map();
  const gtex = (g) => {
    if (!glyphTex.has(g)) glyphTex.set(g, glyphTexture(g, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 12 }));
    return glyphTex.get(g);
  };
  const haloTex = radialTexture('rgb(255,255,255)');

  const hot = {};
  let scenery = null;
  let sws = [];
  let lamp = null;
  let engageParts = null;
  let pending = false;
  let done = false;

  function build(v) {
    if (scenery) {
      scenery.hs.forEach((h) => h.remove());
      scenery.group.traverse((o) => {
        o.geometry?.dispose?.();
        const mt = o.material;
        if (mt && !scenery.shared.has(mt)) mt.dispose?.();
      });
      root.remove(scenery.group);
      for (const k of Object.keys(hot)) delete hot[k];
    }
    const group = new THREE.Group();
    group.position.z = WALL_Z;
    root.add(group);
    const hs = [];
    const shared = new Set([steel, slabMat, chipMat, plateMat, wireMat, frameMat, sockMat]);
    sws = [];
    pending = false;
    done = false;

    const { pos, layer } = layout(v);
    const src = (s) => pos.get(keyOf(s));
    const tag = (s) => (s.s !== undefined ? String(s.s + 1) : s.g);

    // ------------------------------------------------------------- headings
    placed(label(`CIRCUIT ${v.stage + 1} / ${v.stageCount}`, 4.6, 0.62, { px: 64, tw: 512, th: 96, color: '#7dff9c' }), group, 0, 9.4, 0.06);
    placed(label('SWITCHES', 2.6, 0.4, { px: 54, tw: 384, th: 80, color: '#ffd27a' }), group, -8.1, 8.85, 0.06);

    // --------------------------------------------------------------- wires
    const T = 0.06;
    const seg = (x1, y1, x2, y2) => box(Math.abs(x2 - x1) + T, Math.abs(y2 - y1) + T, 0.03, wireMat, { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: 0.03, parent: group, cast: false, receive: false });
    const chan = new Map();
    const outPort = (s) => {
      const p = src(s);
      return { x: p.x + p.half, y: p.y };
    };
    const lampP = { x: 8.4, y: 6.1 };
    for (const g of v.gates) {
      const gp = pos.get(`g${g.id}`);
      const ins = g.in.slice().sort((a, b) => src(b).y - src(a).y); // upper source → upper port
      ins.forEach((s, i) => {
        const o = outPort(s);
        const py = gp.y + (i === 0 ? 0.38 : -0.38);
        const k = layer.get(g.id);
        const c = chan.get(k) ?? 0;
        chan.set(k, c + 1);
        const cx = gp.x - 1.2 - 0.2 - c * 0.11;
        seg(o.x, o.y, cx, o.y);
        seg(cx, o.y, cx, py);
        seg(cx, py, gp.x - 1.2, py);
      });
    }
    {
      const o = outPort(v.output);
      const cx = lampP.x - 1.7;
      seg(o.x, o.y, cx, o.y);
      seg(cx, o.y, cx, lampP.y);
      seg(cx, lampP.y, lampP.x - 0.95, lampP.y);
    }

    // --------------------------------------------------------------- gates
    for (const g of v.gates) {
      const p = pos.get(`g${g.id}`);
      const cg = new THREE.Group();
      cg.position.set(p.x, p.y, 0);
      group.add(cg);
      box(2.4, 1.5, 0.2, chipMat, { z: 0.12, parent: cg, cast: false });
      for (const [bw, bh, bx, by] of [[2.4, 0.04, 0, 0.75], [2.4, 0.04, 0, -0.75], [0.04, 1.5, -1.2, 0], [0.04, 1.5, 1.2, 0]]) box(bw, bh, 0.02, frameMat, { x: bx, y: by, z: 0.235, parent: cg, cast: false, receive: false });
      mesh(new THREE.PlaneGeometry(0.98, 0.98), new THREE.MeshBasicMaterial({ map: gtex(g.glyph), transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.7, 1.5), depthWrite: false }), { x: -0.12, z: 0.25, parent: cg, cast: false, receive: false });
      placed(label(g.id, 0.74, 0.74, { px: 96, tw: 128, th: 128, color: '#ffffff' }), cg, 0.84, 0, 0.25);
      const ins = g.in.slice().sort((a, b) => src(b).y - src(a).y);
      ins.forEach((s, i) => {
        const py = i === 0 ? 0.38 : -0.38;
        placed(label(tag(s), 0.5, 0.5, { px: 80, tw: 128, th: 128, color: s.s !== undefined ? '#ffd27a' : '#9fe8ff' }), cg, -0.9, py, 0.25);
        mesh(new THREE.SphereGeometry(0.1, 10, 8), sockMat, { x: -1.2, y: py, z: 0.1, parent: cg, cast: false, receive: false });
      });
      mesh(new THREE.SphereGeometry(0.1, 10, 8), sockMat, { x: 1.2, z: 0.1, parent: cg, cast: false, receive: false });
    }

    // ------------------------------------------------------------ switches
    for (let i = 0; i < v.switches; i++) {
      const p = pos.get(`s${i}`);
      const sg = new THREE.Group();
      sg.position.set(p.x, p.y, 0);
      group.add(sg);
      box(2.3, 0.95, 0.16, chipMat, { z: 0.1, parent: sg, cast: false });
      for (const [bw, bh, bx, by] of [[2.3, 0.035, 0, 0.475], [2.3, 0.035, 0, -0.475], [0.035, 0.95, -1.15, 0], [0.035, 0.95, 1.15, 0]]) box(bw, bh, 0.02, glow(0xd9a63a, 0.9), { x: bx, y: by, z: 0.185, parent: sg, cast: false, receive: false });
      placed(label(String(i + 1), 0.62, 0.62, { px: 96, tw: 128, th: 128, color: '#ffd27a' }), sg, -0.8, 0, 0.2);
      box(1.0, 0.1, 0.05, plateMat, { x: 0.35, z: 0.2, parent: sg, cast: false });
      const knobMat = new THREE.MeshStandardMaterial({ color: 0x3a403c, roughness: 0.4, metalness: 0.6, emissive: 0x000000 });
      const knob = box(0.4, 0.58, 0.22, knobMat, { x: -0.02, z: 0.3, parent: sg });
      const word = label('OFF', 0.9, 0.22, { px: 52, tw: 256, th: 64, color: '#5f7d6b' });
      placed(word, sg, 0.35, -0.33, 0.2);
      const onWord = label('ON', 0.9, 0.22, { px: 52, tw: 256, th: 64, color: '#ffd27a' });
      onWord.visible = false;
      placed(onWord, sg, 0.35, -0.33, 0.2);
      mesh(new THREE.SphereGeometry(0.1, 10, 8), sockMat, { x: 1.15, z: 0.1, parent: sg, cast: false, receive: false });
      const hit = hitbox(2.3, 1.0, 0.7, { z: 0.25, parent: sg });
      const sw = { i, knob, knobMat, word, onWord, on: false };
      hs.push(stage.addHotspot(hit, { outline: [knob], onClick: () => toggle(sw) }));
      hot[`switch:${i}`] = hit;
      sws.push(sw);
    }

    // ----------------------------------------------------------- the lamp
    const lg = new THREE.Group();
    lg.position.set(lampP.x, lampP.y, 0);
    group.add(lg);
    cyl(1.05, 1.15, 0.3, steel, { z: 0.15, rx: Math.PI / 2, parent: lg }, 40);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0x0c1410, emissive: new THREE.Color(0.05, 0.12, 0.08), emissiveIntensity: 1, roughness: 0.15, metalness: 0.1 });
    const bulb = mesh(new THREE.SphereGeometry(0.82, 32, 20), bulbMat, { z: 0.3, parent: lg, cast: false });
    bulb.scale.z = 0.7;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(0.3, 2, 0.7), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0 }));
    halo.scale.set(5.6, 5.6, 1);
    halo.position.z = 0.8;
    lg.add(halo);
    const lampLight = new THREE.PointLight(0x4dff9a, 0, 12, 2);
    lampLight.position.z = 2;
    lg.add(lampLight);
    mesh(new THREE.SphereGeometry(0.1, 10, 8), sockMat, { x: -0.95, z: 0.1, parent: lg, cast: false, receive: false });
    placed(label('LAMP', 1.6, 0.42, { px: 60, tw: 256, th: 80, color: '#7dff9c' }), lg, 0, 1.6, 0.06);
    lamp = { bulbMat, halo, light: lampLight };

    // ------------------------------------------------------------- ENGAGE
    const eg = new THREE.Group();
    eg.position.set(8.4, 2.9, 0);
    group.add(eg);
    cyl(0.78, 0.86, 0.2, steel, { z: 0.1, rx: Math.PI / 2, parent: eg }, 36);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x701710, emissive: 0x4a0a05, emissiveIntensity: 1.4, roughness: 0.3 });
    const btn = cyl(0.58, 0.58, 0.26, btnMat, { z: 0.3, rx: Math.PI / 2, parent: eg }, 36);
    mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 40), glow(0xff4030, 1.4), { z: 0.22, parent: eg, cast: false, receive: false });
    placed(label('ENGAGE', 2.3, 0.44, { px: 60, tw: 320, th: 80, color: '#ff7a5c' }), eg, 0, 1.3, 0.06);
    const bhit = hitbox(1.9, 1.9, 0.9, { z: 0.3, parent: eg });
    hs.push(stage.addHotspot(bhit, { outline: [btn], onClick: () => engage() }));
    hot.engage = bhit;
    engageParts = { btn, mat: btnMat };

    scenery = { group, hs, shared };
  }

  // ------------------------------------------------------------ interaction
  function paintSwitch(sw, anim = true) {
    const x = sw.on ? 0.72 : -0.02;
    const from = sw.knob.position.x;
    if (anim) stage.tween(180, (k) => (sw.knob.position.x = from + (x - from) * k), ease.out);
    else sw.knob.position.x = x;
    sw.knobMat.color.setHex(sw.on ? 0xd9a63a : 0x3a403c);
    sw.knobMat.emissive.setHex(sw.on ? 0x6a4a08 : 0x000000);
    sw.word.visible = !sw.on;
    sw.onWord.visible = sw.on;
  }

  function toggle(sw) {
    if (pending || done) return;
    sw.on = !sw.on;
    audio.lever();
    paintSwitch(sw);
  }

  function engage() {
    if (pending || done) return;
    pending = true;
    audio.engage();
    stage.tween(260, (k) => (engageParts.btn.position.z = 0.3 - 0.14 * Math.sin(k * Math.PI)), ease.linear);
    send({ type: 'engage', switches: sws.map((s) => s.on) });
  }

  async function wrong() {
    // the lamp coughs red and goes dark; nothing says which gate was the problem
    stage.flash(0xff4020, 0.3, 450);
    stage.shake(0.12, 400);
    stage.pulseGlitch(0.8, 400);
    audio.spark();
    for (let i = 0; i < 2; i++) {
      lamp.bulbMat.emissive.setRGB(3, 0.25, 0.12);
      lamp.halo.material.color.setRGB(2, 0.2, 0.1);
      lamp.halo.material.opacity = 0.55;
      await stage.wait(130);
      lamp.bulbMat.emissive.setRGB(0.05, 0.12, 0.08);
      lamp.halo.material.opacity = 0;
      await stage.wait(110);
    }
    await stage.wait(250);
    pending = false;
  }

  async function lampOn() {
    done = true;
    lamp.bulbMat.emissive.setRGB(0.3, 3, 0.9);
    lamp.halo.material.color.setRGB(0.3, 2, 0.7);
    lamp.halo.material.opacity = 0.85;
    lamp.light.intensity = 90;
    audio.blip(true);
    stage.flash(0x9dffbf, 0.4, 500);
    await stage.wait(1000);
  }

  async function safe(nextView) {
    await lampOn();
    if (nextView) {
      stage.pulseGlitch(0.7, 400);
      build(nextView);
    }
  }

  build(view);

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    engageParts && (engageParts.mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.3);
  });

  return {
    hot,
    get idle() {
      return !pending && !done;
    },
    get switches() {
      return sws.map((s) => s.on);
    },
    onFx(m) {
      if (m.result === 'wrong') wrong();
      else if (m.result === 'stage') safe(m.view);
      else if (m.result === 'solved') safe(null);
    },
    dispose() {},
  };
}
