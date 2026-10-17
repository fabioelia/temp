// Operator — THE SWITCHBOARD. Coloured cables hang on the left; jacks stamped with
// glyphs wait on the right, in an order that means nothing. Pick up a cable, plug
// it in. The Protocol knows where every cable goes — you only know what you see.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, dust, glitchEdges, strip, COLORS } from '../kit.js';
import { ease } from '../stage.js';

const W = 20;
const H = 7;
const D = 17;
const BOARD_Z = -3.2;

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x030d09, 0.026);
  stage.baseFov = 52;
  stage.camera.fov = 52;
  const CAM = new THREE.Vector3(0, 2.2, 5.0);
  const LOOK = new THREE.Vector3(0, 2.15, BOARD_Z);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.4, y: 0.16, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 5 });
  wetFloor(stage, root, { w: W, d: D, repeat: 8, base: 'plate', roughness: 0.38, tint: 0x3d6a52, opacity: 0.9 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 240 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.32));
  const key = new THREE.SpotLight(0xcfffe0, 230, 26, 0.55, 0.8, 1.6);
  key.position.set(-1.5, H - 0.3, 3.2);
  key.target.position.set(0, 2.1, BOARD_Z);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);

  // ----------------------------------------------------- racks full of lights
  const ledGeo = new THREE.BoxGeometry(0.07, 0.035, 0.02);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const rackMat = tiled(M.metal, 1, 2);
  rackMat.color.set(0x5b7466);
  const racks = [];
  const LEDS_PER = 14 * 7;
  const palette = [new THREE.Color(0.1, 2.2, 0.6), new THREE.Color(0.1, 1.2, 0.35), new THREE.Color(2.4, 1.4, 0.1), new THREE.Color(0.02, 0.1, 0.05), new THREE.Color(2.6, 0.2, 0.2)];
  function rack(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(1.5, 5.6, 1.1, rackMat, { y: 2.8, parent: g });
    box(1.38, 5.4, 0.04, new THREE.MeshStandardMaterial({ color: 0x050a07, roughness: 0.6, metalness: 0.6 }), { y: 2.8, z: 0.56, parent: g, cast: false });
    const im = new THREE.InstancedMesh(ledGeo, ledMat, LEDS_PER * 3);
    const d = new THREE.Object3D();
    let n = 0;
    for (let unit = 0; unit < 3; unit++) {
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 7; c++) {
          d.position.set(-0.5 + c * 0.16 + (unit % 2) * 0.03, 0.55 + unit * 1.75 + r * 0.095, 0.585);
          d.updateMatrix();
          im.setMatrixAt(n, d.matrix);
          im.setColorAt(n, palette[Math.random() < 0.55 ? 1 : Math.floor(Math.random() * 5)]);
          n++;
        }
      }
      box(1.3, 0.05, 0.05, rackMat, { y: 0.4 + unit * 1.75, z: 0.58, parent: g, cast: false });
    }
    im.count = n;
    g.add(im);
    racks.push(im);
    root.add(g);
  }
  for (const z of [-6.8, -3.4, 0.2, 3.6]) {
    rack(-8.6, z, Math.PI / 2);
    rack(8.6, z, -Math.PI / 2);
  }
  for (const x of [-5, 0, 5]) rack(x, -7.7, 0);

  // overhead cable trays + strip lights
  for (const x of [-6, -2, 2, 6]) {
    box(0.9, 0.16, D - 1, rackMat, { x, y: H - 0.9, cast: false, parent: root });
    strip(root, { w: 0.08, d: 4, color: 0xcfffe0, intensity: 1.6, x: x + 1.4, y: H - 0.1, z: -2, light: 20, lightDist: 8 });
  }
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  // ------------------------------------------------------------- the board
  const board = new THREE.Group();
  board.position.set(0, 2.15, BOARD_Z);
  root.add(board);
  const plate = tiled(M.panel, 3, 2);
  plate.color.set(0x7d9a88);
  box(9.2, 5.0, 0.28, plate, { parent: board });
  const bezel = tiled(M.metal, 2, 1);
  box(9.5, 0.24, 0.4, bezel, { y: 2.55, z: 0.05, parent: board });
  box(9.5, 0.24, 0.4, bezel, { y: -2.55, z: 0.05, parent: board });
  box(0.24, 5.3, 0.4, bezel, { x: -4.7, z: 0.05, parent: board });
  box(0.24, 5.3, 0.4, bezel, { x: 4.7, z: 0.05, parent: board });
  for (const sx of [-4.45, 4.45]) for (const sy of [-2.3, 2.3]) cyl(0.07, 0.07, 0.06, bezel, { x: sx, y: sy, z: 0.24, rx: Math.PI / 2, parent: board }, 8);
  // conduit the cables run out of
  cyl(0.16, 0.16, 3.0, bezel, { x: -2.9, y: 2.75, z: 0.35, rz: Math.PI / 2, parent: board }, 16);
  // divider and heading strip between the two halves
  box(0.04, 4.3, 0.04, glow(0x1fff6a, 1.1), { x: 0.55, z: 0.16, parent: board, cast: false, receive: false });

  const cables = [];
  const jacks = [];
  let selected = null;
  let pending = false;
  let cur = view;
  const plugged = {};

  const clock = { t: 0 };

  function makeCable(color, i, n) {
    const hex = COLORS[color];
    const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, metalness: 0.1, emissive: hex, emissiveIntensity: 0.12 });
    const g = new THREE.Group();
    const anchor = new THREE.Vector3(-3.8 + (i / Math.max(1, n - 1)) * 1.8, 2.72, 0.5);
    const rest = new THREE.Vector3(-3.35 + (i % 2) * 0.5 + i * 0.08, 1.5 - i * (2.7 / Math.max(3, n - 1)), 0.75 + (i % 3) * 0.08);
    const c = { color, mat, g, anchor, rest, end: rest.clone(), dir: new THREE.Vector3(0, -1, 0), tube: null, plug: null, plugged: false };
    c.tube = mesh(new THREE.TubeGeometry(new THREE.LineCurve3(anchor, rest), 2, 0.06, 6), mat, { parent: g, cast: true });
    c.plug = new THREE.Group();
    const boot = cyl(0.1, 0.085, 0.3, mat, { y: -0.05, parent: c.plug, cast: true }, 14);
    const tip = cyl(0.05, 0.05, 0.22, tiled(M.metal, 1, 1), { y: -0.28, parent: c.plug, cast: true }, 12);
    c.hit = hitbox(0.42, 0.7, 0.42, { y: -0.15, parent: c.plug });
    g.add(c.plug);
    // a short collar where the cable leaves the conduit
    cyl(0.085, 0.085, 0.12, tiled(M.metal, 1, 1), { x: anchor.x, y: anchor.y - 0.02, z: anchor.z - 0.12, parent: g, cast: false }, 10);
    board.add(g);
    updateCable(c);
    c.hs = stage.addHotspot(c.hit, { outline: [c.tube, boot], onClick: () => pickCable(c) });
    return c;
  }

  const tmpCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  function updateCable(c) {
    const S = c.anchor;
    const E = c.end;
    const sag = c.plugged ? 0.9 : 1.1;
    tmpCurve.v0.copy(S);
    tmpCurve.v1.set(S.x + (E.x - S.x) * 0.1, S.y - sag, S.z + 0.5);
    tmpCurve.v2.set(E.x - (E.x - S.x) * 0.45, E.y + (c.plugged ? 0.35 : 1.0), E.z + 0.45);
    tmpCurve.v3.copy(E);
    const geo = new THREE.TubeGeometry(tmpCurve, 56, 0.07, 8, false);
    c.tube.geometry.dispose();
    c.tube.geometry = geo;
    // orient the plug along the end tangent (pointing into the board when plugged)
    const tan = c.plugged ? new THREE.Vector3(0, 0, -1) : tmpCurve.getTangentAt(1).normalize();
    c.plug.position.copy(E);
    c.plug.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tan);
  }

  function moveEnd(c, to, ms, easing = ease.inOut) {
    const from = c.end.clone();
    return stage.tween(ms, (k) => {
      c.end.lerpVectors(from, to, k);
      if (!c.plugged) c.end.y += Math.sin(k * Math.PI) * 0.35; // a small arc as it travels
      updateCable(c);
    }, easing);
  }

  const HOLD = new THREE.Vector3(-0.9, 0.2, 1.1);

  function pickCable(c) {
    if (pending || c.plugged) return;
    audio.click();
    if (selected === c) {
      selected = null;
      moveEnd(c, c.rest, 380);
      return;
    }
    if (selected) moveEnd(selected, selected.rest, 320);
    selected = c;
    moveEnd(c, HOLD, 420, ease.out);
    audio.pickup();
  }

  function jackPos(j) {
    return new THREE.Vector3(2.9, j.y, 0.22);
  }

  function makeJack(glyph, i, n) {
    const spacing = Math.min(0.86, 3.9 / Math.max(1, n - 1));
    const y = ((n - 1) / 2 - i) * spacing;
    const g = new THREE.Group();
    g.position.set(0, y, 0);
    board.add(g);
    const ring = cyl(0.26, 0.26, 0.16, tiled(M.metal, 1, 1), { x: 2.9, z: 0.2, rx: Math.PI / 2, parent: g }, 24);
    cyl(0.17, 0.17, 0.2, new THREE.MeshStandardMaterial({ color: 0x020403, roughness: 0.9 }), { x: 2.9, z: 0.22, rx: Math.PI / 2, parent: g, cast: false }, 18);
    const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.8, 0.1), toneMapped: false });
    const led = mesh(new THREE.SphereGeometry(0.055, 12, 8), ledMat, { x: 3.55, z: 0.26, parent: g, cast: false });
    // glyph label plate
    box(1.1, 0.7, 0.05, new THREE.MeshStandardMaterial({ color: 0x050c08, roughness: 0.5, metalness: 0.5 }), { x: 1.7, z: 0.17, parent: g, cast: false });
    const gl = mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: glyphTexture(glyph, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 12 }), transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.7, 1.5), depthWrite: false }), { x: 1.7, z: 0.2, parent: g, cast: false, receive: false });
    box(0.55, 0.03, 0.02, glow(0x1fff6a, 0.9), { x: 2.35, z: 0.18, parent: g, cast: false, receive: false });
    const hit = hitbox(2.1, 0.78, 0.5, { x: 2.5, z: 0.25, parent: g });
    const j = { i, glyph, y, g, ring, ledMat, led, used: false };
    j.hs = stage.addHotspot(hit, { outline: [ring, gl], onClick: () => plugInto(j) });
    return j;
  }

  function plugInto(j) {
    if (pending || !selected || j.used) return;
    pending = true;
    send({ type: 'plug', cable: selected.color, jack: j.i });
  }

  function build(v) {
    stage.clearHotspots();
    for (const c of cables) {
      board.remove(c.g);
      c.tube.geometry.dispose();
    }
    for (const j of jacks) board.remove(j.g);
    cables.length = 0;
    jacks.length = 0;
    selected = null;
    pending = false;
    for (const k of Object.keys(plugged)) delete plugged[k];
    v.cables.forEach((color, i) => cables.push(makeCable(color, i, v.cables.length)));
    v.jacks.forEach((glyph, i) => jacks.push(makeJack(glyph, i, v.jacks.length)));
    // restore anything already plugged (after a reconnect)
    for (const [color, ji] of Object.entries(v.plugged ?? {})) {
      const c = cables.find((x) => x.color === color);
      if (c && jacks[ji]) seat(c, jacks[ji], true);
    }
    hotRefresh();
  }

  function seat(c, j, instant = false) {
    c.plugged = true;
    c.hs.opts.enabled = false;
    j.used = true;
    j.hs.opts.enabled = false;
    j.ledMat.color.setRGB(0.2, 3, 0.8);
    const end = new THREE.Vector3(2.9, j.y, 0.28);
    if (instant) {
      c.end.copy(end);
      updateCable(c);
      return Promise.resolve();
    }
    return moveEnd(c, end, 520, ease.inOut);
  }

  const hot = {};
  function hotRefresh() {
    cables.forEach((c) => (hot[`cable:${c.color}`] = c.hit));
    jacks.forEach((j, i) => (hot[`jack:${i}`] = j.g.children.at(-1)));
  }

  async function onPlug(e, result, nextView) {
    const c = cables.find((x) => x.color === e.cable);
    const j = jacks[e.jack];
    if (!c || !j) return;
    if (result === 'wrong') {
      await moveEnd(c, new THREE.Vector3(2.9, j.y, 0.5), 380, ease.in);
      audio.spark();
      j.ledMat.color.setRGB(3.4, 0.15, 0.15);
      stage.shake(0.1, 300);
      stage.pulseGlitch(0.5, 300);
      const sp = new THREE.PointLight(0xffa060, 90, 5, 2);
      sp.position.copy(j.g.position).add(new THREE.Vector3(2.9, 0, 0.9));
      board.add(sp);
      await stage.wait(260);
      board.remove(sp);
      await moveEnd(c, HOLD, 360, ease.out);
      j.ledMat.color.setRGB(1.6, 0.8, 0.1);
      pending = false;
      return;
    }
    selected = null;
    await seat(c, j);
    audio.plug();
    pending = false;
    if (result === 'stage' && nextView) {
      await stage.wait(650);
      audio.stage();
      stage.flash(0x9dffbf, 0.5, 500);
      stage.pulseGlitch(0.7, 400);
      await stage.wait(260);
      cur = nextView;
      build(nextView);
    }
  }

  build(view);

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    clock.t += dt;
    if (clock.t > 0.18) {
      clock.t = 0;
      for (const im of racks) {
        for (let k = 0; k < 14; k++) {
          const idx = Math.floor(Math.random() * im.count);
          im.setColorAt(idx, palette[Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 5)]);
        }
        im.instanceColor.needsUpdate = true;
      }
    }
    // loose cables sway a touch; the selected one hovers
    for (const c of cables) {
      if (c.plugged || c === selected || c.end.distanceTo(c.rest) > 0.02) continue;
      c.end.x = c.rest.x + Math.sin(t * 1.3 + c.anchor.x) * 0.015;
      updateCable(c);
    }
    for (const j of jacks) if (!j.used) j.led.scale.setScalar(1 + Math.sin(t * 5 + j.i) * 0.12);
  });

  return {
    hot,
    get idle() {
      return !pending && !stage.tweens.length;
    },
    onFx(m) {
      if (m.event && m.event.cable !== undefined) onPlug(m.event, m.result, m.view);
    },
    dispose() {},
  };
}
