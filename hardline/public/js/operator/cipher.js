// Operator — THE LOBBY. A marble lobby, a sealed security door, a keypad with no key.
// What the Operator can see: the glyph display, the sconce colour, the wall clock.
// What they cannot do: read any of it.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, LiveCanvas, CodeScreen } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, lightCone, dust, glitchEdges, strip, COLORS } from '../kit.js';
import { ease } from '../stage.js';

const W = 16;
const H = 5.6;
const D = 14;
const BACK = -D / 2;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020d07, 0.021);
  scene.background = new THREE.Color(0x010503);

  stage.baseFov = 56;
  stage.camera.fov = 56;
  stage.setRig(new THREE.Vector3(1.5, 1.7, 3.3), new THREE.Vector3(1.8, 2.2, BACK), { parallax: { x: 0.4, y: 0.16, look: 0.05 } });

  // ------------------------------------------------------------------ shell
  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 4 });
  wetFloor(stage, root, { w: W, d: D, repeat: 7 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });

  // baseboard glow and a guide line on the floor that leads to the door
  strip(root, { w: W - 0.4, d: 0.06, color: 0x1fff6a, intensity: 1.6, x: 0, y: 0.1, z: BACK + 0.06 });
  strip(root, { w: 0.07, d: D - 1.5, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.012, z: BACK / 2 + 0.6 }).rotation.y = 0;

  // ------------------------------------------------------------------ lights
  root.add(new THREE.AmbientLight(0x0e3a20, 0.32));
  const key = new THREE.SpotLight(0xc4ffd8, 330, 26, 0.5, 0.85, 1.7);
  key.position.set(0.5, H - 0.2, 1.5);
  key.target.position.set(0.3, 1.8, BACK);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);
  lightCone(root, { color: 0x9dffbf, radius: 2.6, height: 7.2, opacity: 0.022, x: 0.4, y: H - 3.5, z: -1.6 }).rotation.x = 0.28;

  for (const x of [-4.5, 4.5]) {
    for (const z of [-2.6, 2.4]) {
      strip(root, { w: 2.4, d: 0.14, color: 0xcfffe0, intensity: 2.0, x, y: H - 0.04, z, light: 38, lightDist: 8 });
    }
  }

  // ------------------------------------------------------------------- door
  const door = new THREE.Group();
  door.position.set(0, 0, BACK + 0.04);
  root.add(door);
  const frameMat = tiled(M.metal, 1, 1);
  frameMat.color.set(0x8aa896);
  box(0.3, 3.9, 0.5, frameMat, { x: -2.05, y: 1.95, z: 0.1, parent: door });
  box(0.3, 3.9, 0.5, frameMat, { x: 2.05, y: 1.95, z: 0.1, parent: door });
  box(4.4, 0.3, 0.5, frameMat, { x: 0, y: 3.9, z: 0.1, parent: door });
  box(4.4, 0.12, 0.5, frameMat, { x: 0, y: 0.06, z: 0.1, parent: door });
  const seamMat = glow(0x1fff6a, 1.8);
  const statusStrip = mesh(new THREE.BoxGeometry(3.6, 0.05, 0.04), seamMat, { y: 3.72, z: 0.32, parent: door, cast: false });

  const leafMat = tiled(M.metal, 2, 2);
  leafMat.color.set(0x6f8a79);
  const leaves = [];
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.x = side * 0.9;
    box(1.78, 3.62, 0.22, leafMat, { y: 1.81, parent: leaf });
    for (const yy of [0.7, 1.4, 2.1, 2.8]) box(1.5, 0.05, 0.03, leafMat, { y: yy, z: 0.12, parent: leaf, cast: false });
    for (const yy of [0.3, 3.3]) for (const xx of [-0.7, 0.7]) cyl(0.05, 0.05, 0.05, frameMat, { x: xx, y: yy, z: 0.13, rx: Math.PI / 2, parent: leaf, cast: false }, 10);
    mesh(new THREE.BoxGeometry(0.03, 3.4, 0.03), seamMat, { x: -side * 0.88, y: 1.81, z: 0.12, parent: leaf, cast: false });
    leaves.push({ g: leaf, side });
    door.add(leaf);
  }
  // the light behind the door
  const behindMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 3.2, 1.2), toneMapped: false });
  const behind = mesh(new THREE.PlaneGeometry(3.7, 3.7), behindMat, { y: 1.85, z: -0.25, parent: door, cast: false });
  behind.visible = false;

  // ---------------------------------------------------------------- display
  const display = new THREE.Group();
  display.position.set(0, 4.62, BACK + 0.07);
  root.add(display);
  box(7.2, 1.5, 0.14, tiled(M.metal, 2, 1), { z: 0, parent: display });
  const rainScreen = new CodeScreen(256, 64, { cols: 48, color: '#0d7f3a', head: '#5dff9a' });
  const rainMat = new THREE.MeshBasicMaterial({ map: rainScreen.texture, toneMapped: false, color: new THREE.Color(1.1, 1.3, 1.1) });
  mesh(new THREE.PlaneGeometry(6.9, 1.2), rainMat, { z: 0.08, parent: display, cast: false, receive: false });
  const glyphGroup = new THREE.Group();
  glyphGroup.position.z = 0.1;
  display.add(glyphGroup);
  const displayLight = new THREE.PointLight(0x38ff7a, 16, 9, 2);
  displayLight.position.set(0, 0, 1.2);
  display.add(displayLight);

  function setGlyphs(ids) {
    glyphGroup.children.slice().forEach((c) => {
      glyphGroup.remove(c);
      c.material.map?.dispose();
      c.material.dispose();
      c.geometry.dispose();
    });
    const gap = 1.28;
    ids.forEach((id, i) => {
      const mat = new THREE.MeshBasicMaterial({ map: glyphTexture(id, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 18 }), transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.7, 1.5), depthWrite: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), mat);
      m.position.x = (i - (ids.length - 1) / 2) * gap;
      glyphGroup.add(m);
    });
  }

  // ----------------------------------------------------------------- sconces
  const lampMats = [];
  const lampLights = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(side * 3.15, 2.75, BACK + 0.08);
    root.add(g);
    cyl(0.28, 0.3, 0.12, frameMat, { rx: Math.PI / 2, parent: g }, 24);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xff3030, emissiveIntensity: 4.5, roughness: 0.25, metalness: 0 });
    const lens = mesh(new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), lensMat, { z: 0.06, rx: Math.PI / 2, parent: g, cast: false });
    lampMats.push(lensMat);
    const pl = new THREE.PointLight(0xff3030, 30, 8, 2);
    pl.position.set(0, 0, 0.9);
    g.add(pl);
    lampLights.push(pl);
  }

  // ----------------------------------------------------------------- keypad
  const pad = new THREE.Group();
  pad.position.set(4.9, 1.72, BACK + 0.1);
  root.add(pad);
  box(1.7, 2.7, 0.2, tiled(M.metal, 1, 1), { parent: pad });
  box(1.5, 2.5, 0.05, tiled(M.panel, 1, 1), { z: 0.11, parent: pad, cast: false });

  const padScreen = new LiveCanvas(256, 96);
  const padScreenMat = new THREE.MeshBasicMaterial({ map: padScreen.texture, toneMapped: false, color: new THREE.Color(1.3, 1.5, 1.3) });
  mesh(new THREE.PlaneGeometry(1.34, 0.5), padScreenMat, { y: 0.95, z: 0.14, parent: pad, cast: false, receive: false });

  const keyMeshes = new Map();
  KEYS.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = (col - 1) * 0.44;
    const ky = 0.3 - row * 0.38;
    const kg = new THREE.Group();
    kg.position.set(kx, ky, 0.14);
    pad.add(kg);
    const cap = box(0.37, 0.3, 0.1, tiled(M.metal, 1, 1), { z: 0.04, parent: kg });
    const lc = new LiveCanvas(96, 80);
    const ctx = lc.ctx;
    ctx.fillStyle = '#04120a';
    ctx.fillRect(0, 0, 96, 80);
    ctx.font = 'bold 52px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#37ff7e';
    ctx.shadowBlur = 10;
    ctx.fillStyle = k === 'C' ? '#ffb02e' : k === 'OK' ? '#7dffb0' : '#b6ffd0';
    ctx.fillText(k === 'C' ? '✕' : k === 'OK' ? '✓' : k, 48, 42);
    lc.touch();
    const label = mesh(new THREE.PlaneGeometry(0.31, 0.24), new THREE.MeshBasicMaterial({ map: lc.texture, toneMapped: false, color: new THREE.Color(1.2, 1.4, 1.2) }), { z: 0.095, parent: kg, cast: false, receive: false });
    const hit = hitbox(0.42, 0.34, 0.25, { z: 0.08, parent: kg });
    keyMeshes.set(k, { kg, cap, hit });
    stage.addHotspot(hit, { outline: [cap], onClick: () => press(k) });
  });

  // ------------------------------------------------------------------ clock
  const clockPlate = new THREE.Group();
  clockPlate.position.set(4.9, 3.62, BACK + 0.08);
  root.add(clockPlate);
  box(1.7, 0.72, 0.12, tiled(M.metal, 1, 1), { parent: clockPlate });
  const clockCanvas = new LiveCanvas(256, 96);
  mesh(new THREE.PlaneGeometry(1.5, 0.55), new THREE.MeshBasicMaterial({ map: clockCanvas.texture, toneMapped: false, color: new THREE.Color(1.3, 1.4, 1.3) }), { z: 0.07, parent: clockPlate, cast: false, receive: false });
  const clockLight = new THREE.PointLight(0xffb02e, 10, 5, 2);
  clockLight.position.set(0, 0, 0.8);
  clockPlate.add(clockLight);

  // ------------------------------------------------------------ set dressing
  // monitor wall (left)
  const wall = new THREE.Group();
  wall.position.set(-W / 2 + 0.12, 0, -1.8);
  wall.rotation.y = Math.PI / 2;
  root.add(wall);
  const screens = [new CodeScreen(128, 96, { cols: 16 }), new CodeScreen(128, 96, { cols: 24, color: '#17b858' }), new CodeScreen(128, 96, { cols: 12, color: '#0b9a44' })];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const mx = (c - 1.5) * 1.35;
      const my = 1.45 + r * 1.1;
      box(1.22, 0.92, 0.3, tiled(M.metal, 1, 1), { x: mx, y: my, parent: wall });
      mesh(new THREE.PlaneGeometry(1.08, 0.78), new THREE.MeshBasicMaterial({ map: screens[(r * 4 + c) % 3].texture, toneMapped: false, color: new THREE.Color(1, 1.25, 1) }), { x: mx, y: my, z: 0.16, parent: wall, cast: false, receive: false });
    }
  }
  const consoleDesk = box(5.8, 0.9, 0.9, tiled(M.metal, 2, 1), { y: 0.45, z: 0.6, parent: wall });
  box(5.9, 0.06, 1, tiled(M.tile, 1, 1), { y: 0.92, z: 0.6, parent: wall });

  // bookshelf (right)
  const shelf = new THREE.Group();
  shelf.position.set(W / 2 - 0.35, 0, -1.4);
  shelf.rotation.y = -Math.PI / 2;
  root.add(shelf);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x1c140c, roughness: 0.75, metalness: 0.1 });
  box(4.4, 3.4, 0.5, woodMat, { y: 1.7, z: -0.05, parent: shelf });
  const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05, color: 0xffffff });
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bookMat, 130);
  books.castShadow = false;
  const dummy = new THREE.Object3D();
  let bi = 0;
  const palette = [0x2a1a12, 0x14281c, 0x1a1c30, 0x30141a, 0x2a2410, 0x0e2a2a, 0x3a3a3a, 0x7a1f1f, 0x1f3f7a];
  for (let s = 0; s < 4; s++) {
    let x = -2.0;
    while (x < 2.0 && bi < 130) {
      const bw = 0.07 + Math.random() * 0.1;
      const bh = 0.5 + Math.random() * 0.3;
      dummy.position.set(x + bw / 2, 0.45 + s * 0.8 + bh / 2, 0.22);
      dummy.scale.set(bw, bh, 0.34);
      dummy.updateMatrix();
      books.setMatrixAt(bi, dummy.matrix);
      books.setColorAt(bi, new THREE.Color(palette[Math.floor(Math.random() * palette.length)]));
      bi++;
      x += bw + 0.012;
    }
    box(4.2, 0.05, 0.5, woodMat, { y: 0.4 + s * 0.8, z: 0.0, parent: shelf, cast: false });
  }
  books.count = bi;
  shelf.add(books);

  // columns
  const colMat = tiled(M.concrete, 1, 2);
  for (const [x, z] of [[-5.2, -3], [5.2, -3], [-5.2, 2.6], [5.2, 2.6]]) {
    cyl(0.4, 0.4, H, colMat, { x, y: H / 2, z }, 20);
    box(1.0, 0.25, 1.0, tiled(M.metal, 1, 1), { x, y: 0.12, z });
    box(1.0, 0.25, 1.0, tiled(M.metal, 1, 1), { x, y: H - 0.12, z });
    strip(root, { w: 0.05, d: 0.05, color: 0x1fff6a, intensity: 1.8, x: x + 0.41, y: 0.8, z }).scale.y = 1;
  }

  // a security desk and bench for scale
  box(3.2, 1.05, 0.9, tiled(M.metal, 2, 1), { x: -3.1, y: 0.52, z: 1.1, parent: root });
  box(3.3, 0.06, 1.0, tiled(M.tile, 1, 1), { x: -3.1, y: 1.07, z: 1.1, parent: root });
  box(0.9, 0.6, 0.06, tiled(M.metal, 1, 1), { x: -3.1, y: 1.4, z: 0.95, rx: -0.2, parent: root });
  mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: screens[0].texture, toneMapped: false, color: new THREE.Color(1, 1.3, 1) }), { x: -3.1, y: 1.4, z: 0.985, rx: -0.2, parent: root, cast: false, receive: false });

  const motes = dust(root, { w: W - 1, h: H, d: D - 1, count: 300, center: [0, 0, 0] });

  // ------------------------------------------------------------------ state
  let cur = view;
  let entered = '';
  let locked = false;
  let flashMsg = null;
  let blink = 0;

  function setLamp(name) {
    const c = new THREE.Color(COLORS[name] ?? 0xffffff);
    for (const m of lampMats) m.emissive.copy(c);
    for (const l of lampLights) l.color.copy(c);
  }

  function drawPad(t = 0) {
    const { ctx } = padScreen;
    ctx.fillStyle = '#020c06';
    ctx.fillRect(0, 0, 256, 96);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 12;
    if (flashMsg) {
      ctx.shadowColor = flashMsg.color;
      ctx.fillStyle = flashMsg.color;
      ctx.font = 'bold 40px ui-monospace, Menlo, monospace';
      ctx.fillText(flashMsg.text, 128, 50);
    } else {
      const n = Math.max(cur.len, entered.length);
      const gap = Math.min(52, 236 / n);
      ctx.font = 'bold 54px ui-monospace, Menlo, monospace';
      ctx.shadowColor = '#37ff7e';
      for (let i = 0; i < n; i++) {
        const x = 128 + (i - (n - 1) / 2) * gap;
        if (i < entered.length) {
          ctx.fillStyle = '#b6ffd0';
          ctx.fillText(entered[i], x, 52);
        } else {
          ctx.fillStyle = '#0f6f37';
          ctx.fillText(Math.floor(t * 2) % 2 && i === entered.length ? '▮' : '_', x, 54);
        }
      }
    }
    padScreen.touch();
  }

  function drawClock(t = 0) {
    const { ctx } = clockCanvas;
    ctx.fillStyle = '#0a0702';
    ctx.fillRect(0, 0, 256, 96);
    ctx.font = 'bold 66px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 14;
    if (cur.clock) {
      const txt = Math.floor(t) % 2 ? cur.clock.replace(':', ' ') : cur.clock;
      ctx.shadowColor = '#ffb02e';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText(txt, 128, 52);
    } else {
      ctx.shadowColor = '#3a2a08';
      ctx.fillStyle = '#4a3a14';
      ctx.fillText('--:--', 128, 52);
    }
    clockCanvas.touch();
  }

  function applyView(v) {
    cur = v;
    entered = '';
    setLamp(v.lamp);
    setGlyphs(v.glyphs);
    drawPad();
    drawClock(0);
  }

  function pressAnim(k) {
    const e = keyMeshes.get(k);
    if (!e) return;
    const z0 = 0.14;
    stage.tween(110, (p) => (e.kg.position.z = z0 - 0.045 * Math.sin(p * Math.PI)), ease.linear);
  }

  function press(k) {
    if (locked) return;
    pressAnim(k);
    if (k === 'C') {
      entered = '';
      audio.key(-4);
    } else if (k === 'OK') {
      audio.key(5);
      if (!entered.length) return;
      locked = true;
      flashMsg = { text: 'CHECKING', color: '#ffd27a' };
      send({ type: 'submit', code: entered });
    } else if (entered.length < cur.len + 2) {
      entered += k;
      audio.key(Number(k));
    }
    drawPad(stage.time);
  }

  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') press('C');
    else if (e.key === 'Enter') press('OK');
  };
  window.addEventListener('keydown', onKey);

  async function openDoorAndWalkThrough() {
    behind.visible = true;
    statusStrip.material.color.setRGB(0.4, 3, 1);
    audio.door();
    stage.shake(0.05, 600);
    await stage.tween(1400, (k) => {
      for (const l of leaves) l.g.position.x = l.side * (0.9 + k * 1.5);
    }, ease.inOut);
    audio.whoosh(true);
    const p0 = stage.rig.pos.clone();
    await stage.moveRig(new THREE.Vector3(0, 1.7, BACK + 0.8), new THREE.Vector3(0, 1.8, BACK - 3), 1500, ease.in);
    stage.flash(0xd8ffe4, 1, 700);
    await stage.wait(420);
    return p0;
  }

  async function nextDoor(v) {
    await openDoorAndWalkThrough();
    // we're hidden behind the flash: reset the scene for the next lock
    behind.visible = false;
    for (const l of leaves) l.g.position.x = l.side * 0.9;
    statusStrip.material.color.setRGB(0.12, 1.8, 0.4);
    stage.setRig(new THREE.Vector3(1.5, 1.7, 3.3), new THREE.Vector3(1.8, 2.2, BACK), { snap: true });
    stage.pulseGlitch(0.9, 500);
    flashMsg = null;
    applyView(v);
    locked = false;
  }

  applyView(view);

  stage.onTick((dt, t) => {
    rainScreen.update(dt);
    for (const s of screens) s.update(dt);
    motes.update(dt);
    edges.update(dt, t);
    blink += dt;
    if (blink > 0.4) {
      blink = 0;
      drawPad(t);
      drawClock(t);
    }
    displayLight.intensity = 16 + Math.sin(t * 9) * 1.2 + (Math.random() < 0.02 ? 8 : 0);
    for (const l of lampLights) l.intensity = 30 + Math.sin(t * 2.2) * 4;
  });

  const hot = {};
  for (const [k, e] of keyMeshes) hot[`key:${k}`] = e.hit;

  return {
    hot,
    get idle() {
      return !locked;
    },
    get entered() {
      return entered;
    },
    onFx(m) {
      if (m.result === 'wrong') {
        flashMsg = { text: 'DENIED', color: '#ff3d4d' };
        entered = '';
        statusStrip.material.color.setRGB(3, 0.2, 0.2);
        drawPad(stage.time);
        setTimeout(() => {
          flashMsg = null;
          locked = false;
          statusStrip.material.color.setRGB(0.12, 1.8, 0.4);
          drawPad(stage.time);
        }, 900);
      } else if (m.result === 'stage') {
        flashMsg = { text: 'ACCESS', color: '#7dffb0' };
        drawPad(stage.time);
        nextDoor(m.view);
      } else if (m.result === 'solved') {
        flashMsg = { text: 'ACCESS', color: '#7dffb0' };
        drawPad(stage.time);
        openDoorAndWalkThrough();
      }
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
