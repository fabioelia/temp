// Operator — THE SUBSTATION. A row of transformer towers, some OVERLOADED (glowing red). In front,
// a bank of levers. Nothing shows what a lever does: the grid only recalculates when you press
// ENGAGE, and a wrong engage costs a strike without telling you why. Describe the towers
// that are overloaded — the Protocol knows how the levers are wired.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, radialTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, lightCone, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';

const W = 30;
const H = 10;
const D = 22;

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x030d09, 0.022);
  stage.baseFov = 56;
  stage.camera.fov = 56;
  const CAM = new THREE.Vector3(0, 3.9, 10.6);
  const LOOK = new THREE.Vector3(0, 2.4, -2);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.45, y: 0.16, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 6 });
  wetFloor(stage, root, { w: W, d: D, repeat: 9, base: 'plate', roughness: 0.4, tint: 0x3d6a52, opacity: 0.9 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 200 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.32));
  const key = new THREE.SpotLight(0xcfffe0, 320, 34, 0.7, 0.8, 1.6);
  key.position.set(0, H - 0.4, 6);
  key.target.position.set(0, 1.8, -3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);
  for (const x of [-10, -3, 3, 10]) strip(root, { w: 0.14, d: 5, color: 0xcfffe0, intensity: 1.6, x, y: H - 0.05, z: -3, light: 22, lightDist: 9 });
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  // overhead busbars for atmosphere
  const steel = tiled(M.metal, 2, 1);
  steel.color.set(0x6f8a79);
  for (const y of [7.6, 8.2]) cyl(0.1, 0.1, W - 2, steel, { y, z: -8.6, rz: Math.PI / 2 }, 12);

  const glyphTex = new Map();
  const tex = (g) => {
    if (!glyphTex.has(g)) glyphTex.set(g, glyphTexture(g, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 12 }));
    return glyphTex.get(g);
  };
  const haloTex = radialTexture('rgb(255,255,255)');

  const hot = {};
  const towerBody = new THREE.MeshStandardMaterial({ color: 0x1a2a22, roughness: 0.45, metalness: 0.8 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x040a07, roughness: 0.5, metalness: 0.5 });
  let scenery = null; // everything that depends on the current view, so a new stage can rebuild it
  let towers = [];
  let levers = [];
  let pending = false;
  let engaged = false;
  const engageParts = {};

  function build(v) {
    if (scenery) {
      scenery.hs.forEach((h) => h.remove());
      scenery.group.traverse((o) => {
        o.geometry?.dispose?.();
        const mt = o.material;
        if (mt && mt !== towerBody && mt !== plateMat && mt !== steel) mt.dispose?.(); // (glyph textures are cached and reused)
      });
      root.remove(scenery.group);
      for (const k of Object.keys(hot)) delete hot[k];
    }
    const group = new THREE.Group();
    root.add(group);
    const hs = [];
    towers = [];
    levers = [];
    pending = false;
    engaged = false;

    const n = v.nodes.length;
    const spacing = Math.min(3.1, 22 / n);
    // ------------------------------------------------------- the towers
    v.nodes.forEach((node, i) => {
      const x = (i - (n - 1) / 2) * spacing;
      const g = new THREE.Group();
      g.position.set(x, 0, -5.2);
      group.add(g);
      cyl(0.95, 1.1, 0.35, steel, { y: 0.17, parent: g }, 24);
      box(1.5, 2.6, 1.2, towerBody, { y: 1.65, parent: g });
      for (let f = 0; f < 6; f++) box(1.7, 0.06, 1.0, steel, { y: 0.7 + f * 0.36, parent: g, cast: false });
      for (const ix of [-0.45, 0, 0.45]) cyl(0.09, 0.12, 0.7, steel, { x: ix, y: 3.3, parent: g }, 10);
      // the lamp: red and angry when overloaded, a calm green otherwise
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(0.1, 0.8, 0.3), emissiveIntensity: 1.2, roughness: 0.2 });
      const lamp = mesh(new THREE.SphereGeometry(0.46, 28, 20), lampMat, { y: 4.0, parent: g, cast: false });
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(2, 0.2, 0.15), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0 }));
      halo.scale.set(3.4, 3.4, 1);
      halo.position.y = 4.0;
      g.add(halo);
      const light = new THREE.PointLight(0xff2a1a, 0, 9, 2);
      light.position.set(0, 4.2, 0.6);
      g.add(light);
      // the round glyph plate on the tower's face
      cyl(0.52, 0.52, 0.08, plateMat, { y: 1.75, z: 0.64, rx: Math.PI / 2, parent: g, cast: false }, 32);
      mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({ map: tex(node.glyph), transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.7, 1.5), depthWrite: false }), { y: 1.75, z: 0.7, parent: g, cast: false, receive: false });
      mesh(new THREE.TorusGeometry(0.54, 0.03, 8, 40), glow(0x1fff6a, 1.2), { y: 1.75, z: 0.69, parent: g, cast: false, receive: false });
      towers.push({ g, lamp, lampMat, halo, light, lit: node.lit });
    });
    // cables sagging between towers
    for (let i = 0; i < n - 1; i++) {
      const a = new THREE.Vector3((i - (n - 1) / 2) * spacing, 3.4, -5.2);
      const b = new THREE.Vector3((i + 1 - (n - 1) / 2) * spacing, 3.4, -5.2);
      const m = new THREE.Vector3().lerpVectors(a, b, 0.5);
      m.y -= 0.7;
      const curve = new THREE.QuadraticBezierCurve3(a, m, b);
      mesh(new THREE.TubeGeometry(curve, 24, 0.045, 6), new THREE.MeshStandardMaterial({ color: 0x0b1410, roughness: 0.6, metalness: 0.4 }), { parent: group, cast: false });
    }

    // --------------------------------------------------------- the levers
    const m = v.levers.length;
    const deskW = m * 1.55 + 3.2;
    const desk = new THREE.Group();
    desk.position.set(0, 0, 3.6);
    group.add(desk);
    box(deskW, 0.95, 1.9, steel, { y: 0.475, parent: desk });
    box(deskW + 0.2, 0.08, 2.05, plateMat, { y: 0.97, parent: desk, cast: false });
    v.levers.forEach((lv, i) => {
      const x = (i - (m - 1) / 2) * 1.55 - 0.9;
      const base = new THREE.Group();
      base.position.set(x, 1.0, 0.1);
      desk.add(base);
      box(1.0, 1.0, 0.12, plateMat, { y: 0.55, z: -0.35, parent: base, cast: false });
      mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: tex(lv.glyph), transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.7, 1.5), depthWrite: false }), { y: 0.6, z: -0.27, parent: base, cast: false, receive: false });
      mesh(new THREE.RingGeometry(0.4, 0.46, 4, 1, Math.PI / 4), glow(0x1fff6a, 1.1), { y: 0.6, z: -0.26, parent: base, cast: false, receive: false });
      cyl(0.2, 0.26, 0.2, steel, { y: 0.1, parent: base }, 16);
      const arm = new THREE.Group();
      arm.position.y = 0.2;
      base.add(arm);
      cyl(0.055, 0.055, 1.2, new THREE.MeshStandardMaterial({ color: 0xb8c4bc, roughness: 0.3, metalness: 0.9 }), { y: 0.6, parent: arm }, 10);
      const knobMat = new THREE.MeshStandardMaterial({ color: 0x6a1c14, roughness: 0.35, metalness: 0.2, emissive: 0x2a0602 });
      const knob = mesh(new THREE.SphereGeometry(0.17, 18, 14), knobMat, { y: 1.2, parent: arm });
      const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.18, 0.1), toneMapped: false });
      mesh(new THREE.SphereGeometry(0.06, 12, 8), ledMat, { x: 0.38, y: 0.1, z: 0.05, parent: base, cast: false });
      arm.rotation.z = 0.5; // resting: leaning left (not pulled)
      const hit = hitbox(1.2, 2.0, 1.0, { y: 0.9, parent: base });
      const lever = { i, arm, knobMat, ledMat, on: false };
      hs.push(stage.addHotspot(hit, { outline: [knob], onClick: () => toggle(lever) }));
      hot[`lever:${i}`] = hit;
      levers.push(lever);
    });

    // the big ENGAGE button at the right-hand end of the desk
    const bx = deskW / 2 - 1.1;
    const btnBase = cyl(0.62, 0.7, 0.2, steel, { x: bx, y: 1.1, z: 0.3, parent: desk }, 32);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x701710, emissive: 0x4a0a05, emissiveIntensity: 1.4, roughness: 0.3 });
    const btn = cyl(0.48, 0.48, 0.25, btnMat, { x: bx, y: 1.3, z: 0.3, parent: desk }, 32);
    const btnHit = hitbox(1.5, 1.2, 1.5, { x: bx, y: 1.3, z: 0.3, parent: desk });
    hs.push(stage.addHotspot(btnHit, { outline: [btn], onClick: () => engage() }));
    hot.engage = btnHit;
    engageParts.btn = btn;
    engageParts.mat = btnMat;
    mesh(new THREE.TorusGeometry(0.66, 0.04, 8, 40), glow(0xff4030, 1.4), { x: bx, y: 1.24, z: 0.3, rx: Math.PI / 2, parent: desk, cast: false, receive: false });

    scenery = { group, hs };
    paintLamps();
  }

  function paintLamps() {
    for (const t of towers) {
      if (t.lit) {
        t.lampMat.emissive.setRGB(3, 0.2, 0.1);
        t.lampMat.emissiveIntensity = 1.4;
        t.halo.material.opacity = 0.75;
        t.light.intensity = 40;
      } else {
        t.lampMat.emissive.setRGB(0.1, 0.8, 0.3);
        t.lampMat.emissiveIntensity = 1.0;
        t.halo.material.opacity = 0;
        t.light.intensity = 0;
      }
    }
  }

  // ------------------------------------------------------------ interaction
  function toggle(lv) {
    if (pending || engaged) return;
    lv.on = !lv.on;
    audio.lever();
    stage.tween(220, (k) => (lv.arm.rotation.z = lv.on ? 0.5 - 1.0 * k : -0.5 + 1.0 * k), ease.out);
    lv.ledMat.color.setRGB(...(lv.on ? [3, 1.8, 0.2] : [0.06, 0.18, 0.1]));
  }

  function resetLevers() {
    for (const lv of levers) {
      if (lv.on) {
        lv.on = false;
        stage.tween(260, (k) => (lv.arm.rotation.z = -0.5 + 1.0 * k), ease.inOut);
        lv.ledMat.color.setRGB(0.06, 0.18, 0.1);
      }
    }
  }

  function engage() {
    if (pending || engaged) return;
    pending = true;
    audio.engage();
    stage.tween(260, (k) => (engageParts.btn.position.y = 1.3 - 0.12 * Math.sin(k * Math.PI)), ease.linear);
    send({ type: 'engage', levers: levers.filter((l) => l.on).map((l) => l.i) });
  }

  async function wrong() {
    // the grid arcs and refuses; nothing is revealed about what went wrong
    stage.flash(0xff4020, 0.3, 450);
    stage.shake(0.14, 450);
    stage.pulseGlitch(0.9, 450);
    audio.spark();
    for (const t of towers) t.light.intensity = t.lit ? 90 : 25;
    await stage.wait(450);
    paintLamps();
    resetLevers();
    await stage.wait(350);
    pending = false;
  }

  async function safe(nextView) {
    engaged = true;
    // the overload drains out of the grid one tower at a time
    for (const t of towers) {
      t.lit = false;
      t.lampMat.emissive.setRGB(0.2, 3, 0.8);
      t.lampMat.emissiveIntensity = 1.6;
      t.halo.material.opacity = 0;
      t.light.intensity = 0;
      audio.blip(true);
      await stage.wait(160);
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
    for (const tw of towers) {
      if (tw.lit) tw.light.intensity = 36 + Math.sin(t * 7 + tw.g.position.x) * 8;
    }
    engageParts.mat && (engageParts.mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.3);
  });

  return {
    hot,
    get idle() {
      return !pending;
    },
    get lit() {
      return towers.map((t) => t.lit);
    },
    onFx(m) {
      if (m.result === 'wrong') wrong();
      else if (m.result === 'stage') safe(m.view);
      else if (m.result === 'solved') safe(null);
    },
    dispose() {},
  };
}
