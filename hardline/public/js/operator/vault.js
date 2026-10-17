// Operator — THE VAULT. A great round door with a row of glyph dials. Set the dials, pull the
// lever. A wrong try lights up how many dials were in the right place — and costs a strike.
// The six glyphs a dial can show are printed on the panel at the left.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, radialTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, lightCone, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';

const W = 24;
const H = 9;
const D = 20;

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020d08, 0.022);
  stage.baseFov = 54;
  stage.camera.fov = 54;
  const CAM = new THREE.Vector3(0.4, 3.55, 5.4);
  const LOOK = new THREE.Vector3(0.2, 3.5, -8);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.45, y: 0.16, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 5 });
  wetFloor(stage, root, { w: W, d: D, repeat: 8, tint: 0x4a7a62, roughness: 0.3 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 200 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.3));
  const key = new THREE.SpotLight(0xcfffe0, 300, 30, 0.5, 0.85, 1.6);
  key.position.set(0, H - 0.3, 3);
  key.target.position.set(0, 3.2, -8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);
  lightCone(root, { color: 0x9dffbf, radius: 3.2, height: 8, opacity: 0.02, x: 0, y: H - 4, z: -2.5 }).rotation.x = 0.4;
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  const steel = tiled(M.metal, 2, 2);
  steel.color.set(0x7d968a);
  const darkSteel = tiled(M.metal, 2, 2);
  darkSteel.color.set(0x4a5e54);

  // ---------------------------------------------------------- the vault door
  const doorRoot = new THREE.Group();
  doorRoot.position.set(0, 3.9, -9.2);
  doorRoot.scale.setScalar(0.86);
  root.add(doorRoot);
  mesh(new THREE.TorusGeometry(4.15, 0.45, 20, 96), steel, { parent: doorRoot });
  const hinge = new THREE.Group();
  hinge.position.x = 4.0;
  doorRoot.add(hinge);
  const face = new THREE.Group();
  face.position.x = -4.0;
  hinge.add(face);
  cyl(3.8, 3.8, 0.55, darkSteel, { rx: Math.PI / 2, parent: face }, 96);
  cyl(3.5, 3.5, 0.2, steel, { rx: Math.PI / 2, z: 0.3, parent: face }, 96);
  const bolts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    bolts.push(cyl(0.16, 0.16, 0.5, steel, { x: Math.cos(a) * 3.65, y: Math.sin(a) * 3.65, z: 0.35, rx: Math.PI / 2, parent: face, cast: false }, 12));
  }
  // concentric inlay
  mesh(new THREE.TorusGeometry(3.1, 0.04, 8, 96), glow(0x1fff6a, 1.1), { z: 0.42, parent: face, cast: false, receive: false });

  // ----------------------------------------- the dials, LEDs and glyph panel
  // Everything that depends on the view (how many dials, which glyphs) lives in build(), so a new
  // stage can rebuild it without touching the door or the lever.
  const glyphTex = new Map();
  const tex = (g) => {
    if (!glyphTex.has(g)) glyphTex.set(g, glyphTexture(g, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 14 }));
    return glyphTex.get(g);
  };
  const arrowGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.2);
    s.lineTo(0.3, -0.16);
    s.lineTo(-0.3, -0.16);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  })();
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x070d0a, roughness: 0.4, metalness: 0.7 });

  const hot = {};
  let n = 0;
  let ring = [];
  let values = [];
  let dials = [];
  let leds = [];
  let dyn = null; // { group, hs[] } for the current build

  function build(v) {
    if (dyn) {
      dyn.hs.forEach((h) => h.remove());
      dyn.group.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material && o.material !== panelMat) o.material.dispose?.();
      });
      face.remove(dyn.group);
      root.remove(dyn.panel);
      for (const k of Object.keys(hot)) if (k.startsWith('dial:')) delete hot[k];
    }
    n = v.dials;
    ring = v.glyphs;
    values = Array(n).fill(0);
    dials = [];
    leds = [];
    const group = new THREE.Group();
    face.add(group);
    const hs = [];

    box(n * 1.5 + 0.7, 2.9, 0.2, panelMat, { z: 0.5, parent: group });
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 1.5;
      box(1.15, 1.45, 0.08, new THREE.MeshStandardMaterial({ color: 0x020503, roughness: 0.3, metalness: 0.5 }), { x, y: 0, z: 0.66, parent: group, cast: false });
      const glyphMat = new THREE.MeshBasicMaterial({ map: tex(ring[0]), transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.8, 1.6), depthWrite: false });
      mesh(new THREE.PlaneGeometry(1.05, 1.05), glyphMat, { x, y: 0, z: 0.72, parent: group, cast: false, receive: false });
      for (const dir of ['up', 'down']) {
        const am = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2, 0.8), transparent: true, opacity: 0.6, toneMapped: false, side: THREE.DoubleSide });
        const a = new THREE.Mesh(arrowGeo, am);
        a.position.set(x, dir === 'up' ? 1.06 : -1.06, 0.7);
        if (dir === 'down') a.rotation.z = Math.PI;
        group.add(a);
        const hit = hitbox(0.9, 0.62, 0.5, { x, y: dir === 'up' ? 1.06 : -1.06, z: 0.75, parent: group });
        hs.push(
          stage.addHotspot(hit, {
            outline: [a],
            onHover: (on) => (am.opacity = on ? 1 : 0.6),
            onClick: () => turn(i, dir === 'up' ? 1 : -1),
          })
        );
        hot[`dial:${i}:${dir}`] = hit;
      }
      dials.push({ glyphMat });
    }
    // feedback LEDs: how many dials were right on the last try
    const ledGroup = new THREE.Group();
    ledGroup.position.set(0, 1.95, 0.6);
    group.add(ledGroup);
    for (let i = 0; i < n; i++) {
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.18, 0.1), toneMapped: false });
      mesh(new THREE.SphereGeometry(0.12, 16, 12), m, { x: (i - (n - 1) / 2) * 0.46, parent: ledGroup, cast: false, receive: false });
      leds.push(m);
    }

    // the glyphs a dial can show, printed on a panel to the left of the door
    const panel = new THREE.Group();
    panel.position.set(-6.8, 3.1, -6.2);
    panel.rotation.y = 0.25;
    root.add(panel);
    box(3.4, 4.1, 0.2, panelMat, { parent: panel });
    box(3.5, 0.12, 0.28, steel, { y: 2.1, parent: panel });
    box(3.5, 0.12, 0.28, steel, { y: -2.1, parent: panel });
    ring.forEach((g, i) => {
      const cx = (i % 2) * 1.4 - 0.7;
      const cy = 1.15 - Math.floor(i / 2) * 1.25;
      box(1.15, 1.0, 0.06, new THREE.MeshStandardMaterial({ color: 0x03100a, roughness: 0.5, metalness: 0.4 }), { x: cx, y: cy, z: 0.12, parent: panel, cast: false });
      mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tex(g), transparent: true, toneMapped: false, color: new THREE.Color(1.4, 1.6, 1.4), depthWrite: false }), { x: cx, y: cy, z: 0.16, parent: panel, cast: false, receive: false });
    });
    dyn = { group, hs, panel };
  }

  // ------------------------------------------------------------- the lever
  const leverBase = new THREE.Group();
  leverBase.position.set(6.2, 2.6, -6.4);
  leverBase.rotation.y = -0.3;
  root.add(leverBase);
  box(1.3, 2.6, 0.3, new THREE.MeshStandardMaterial({ color: 0x070d0a, roughness: 0.4, metalness: 0.7 }), { parent: leverBase });
  box(0.22, 1.7, 0.1, new THREE.MeshBasicMaterial({ color: 0x010302 }), { z: 0.18, parent: leverBase, cast: false });
  const arm = new THREE.Group();
  arm.position.set(0, 0.8, 0.3);
  leverBase.add(arm);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xb8c4bc, roughness: 0.3, metalness: 0.9 });
  cyl(0.07, 0.07, 1.6, armMat, { y: -0.8, parent: arm }, 12);
  const knob = mesh(new THREE.SphereGeometry(0.22, 20, 14), new THREE.MeshStandardMaterial({ color: 0xa0261c, roughness: 0.3, metalness: 0.2, emissive: 0x3a0804 }), { y: 0.0, parent: arm });
  const leverHit = hitbox(1.6, 3, 1, { z: 0.4, parent: leverBase });
  hot.lever = leverHit;
  stage.addHotspot(leverHit, { outline: [knob], onClick: () => pull() });
  arm.rotation.x = -0.9; // resting up

  // ------------------------------------------------------------------ state
  let locked = false;
  build(view);

  function turn(i, dir) {
    if (locked) return;
    values[i] = (values[i] + dir + ring.length) % ring.length;
    dials[i].glyphMat.map = tex(ring[values[i]]);
    dials[i].glyphMat.needsUpdate = true;
    audio.tick();
  }

  async function pull() {
    if (locked) return;
    locked = true;
    audio.lever();
    stage.tween(260, (k) => (arm.rotation.x = -0.9 + 1.8 * k), ease.out);
    send({ type: 'open', code: values.map((v) => ring[v]) });
    for (const m of leds) m.color.setRGB(0.06, 0.18, 0.1);
  }
  const resetLever = () => stage.tween(320, (k) => (arm.rotation.x = 0.9 - 1.8 * k), ease.inOut);

  async function wrong(e) {
    resetLever();
    stage.shake(0.07, 300);
    const bulls = e?.bulls ?? 0;
    // the right-place count is the feedback: that many LEDs go green, the rest red
    leds.forEach((m, i) => (i < bulls ? m.color.setRGB(0.3, 3.2, 1) : m.color.setRGB(2.6, 0.2, 0.2)));
    await stage.wait(900);
    locked = false;
  }

  async function open(nextView) {
    leds.forEach((m) => m.color.setRGB(0.3, 3.2, 1));
    audio.door();
    stage.shake(0.05, 700);
    // bolts draw back, then the door swings open
    await stage.tween(500, (k) => bolts.forEach((b) => (b.position.z = 0.35 - 0.5 * k)), ease.inOut);
    await stage.tween(1500, (k) => (hinge.rotation.y = -k * 1.35), ease.inOut);
    stage.flash(0xd8ffe4, 0.8, 600);
    await stage.wait(500);
    if (nextView) {
      // behind the flash: a fresh vault door, and dials for the new glyph set
      hinge.rotation.y = 0;
      bolts.forEach((b) => (b.position.z = 0.35));
      arm.rotation.x = -0.9;
      stage.pulseGlitch(0.8, 450);
      build(nextView);
      locked = false;
    }
  }

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
  });

  return {
    hot,
    get idle() {
      return !locked;
    },
    get dials() {
      return values.slice();
    },
    onFx(m) {
      if (m.result === 'wrong') wrong(m.event);
      else if (m.result === 'stage') open(m.view);
      else if (m.result === 'solved') open(null);
    },
    dispose() {},
  };
}
