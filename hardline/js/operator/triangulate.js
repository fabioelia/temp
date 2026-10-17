// Operator — THE SIGNAL ROOM. A bank of beacon dials, each reading a bearing. Green rims and
// amber rims are read in different conventions; a dial that FLICKERS is lying. Read every dial to
// the Mentor (glyph, number, rim colour, flicker). They'll find the map square where the honest
// bearings cross, and you key it into the terminal.

import * as THREE from 'three';
import { materials, tiled, glow, glyphTexture, textTexture, LiveCanvas } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, dust, glitchEdges, strip } from '../kit.js';
import { ease } from '../stage.js';

const W = 26;
const H = 10;
const D = 20;
const LETTERS = 'ABCDEFGHIJ';
const RIM = { cw: new THREE.Color(0.2, 2.4, 0.9), ccw: new THREE.Color(2.6, 1.5, 0.15) };

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020d08, 0.02);
  stage.baseFov = 54;
  stage.camera.fov = 54;
  const CAM = new THREE.Vector3(0, 4.4, 9.8);
  const LOOK = new THREE.Vector3(0, 2.8, -3);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.45, y: 0.16, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 5 });
  wetFloor(stage, root, { w: W, d: D, repeat: 8, tint: 0x4a7a62, roughness: 0.32 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 200 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.3));
  const key = new THREE.SpotLight(0xcfffe0, 280, 30, 0.7, 0.8, 1.6);
  key.position.set(0, H - 0.4, 5);
  key.target.position.set(0, 3, -4);
  root.add(key, key.target);
  for (const x of [-9, 9]) strip(root, { w: 0.14, d: 5, color: 0xcfffe0, intensity: 1.6, x, y: H - 0.05, z: -3, light: 20, lightDist: 9 });
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  const steel = tiled(M.metal, 2, 1);
  steel.color.set(0x6f8a79);
  const dark = new THREE.MeshStandardMaterial({ color: 0x050b08, roughness: 0.45, metalness: 0.7 });

  // the instrument wall
  box(20, 6.4, 0.3, dark, { y: 5.2, z: -8.6, parent: root });
  box(20.4, 0.2, 0.45, steel, { y: 8.5, z: -8.45, parent: root });
  box(20.4, 0.2, 0.45, steel, { y: 2.0, z: -8.45, parent: root });

  const glyphTex = new Map();
  const tex = (g) => {
    if (!glyphTex.has(g)) glyphTex.set(g, glyphTexture(g, { size: 256, color: '#b6ffd0', lineWidth: 9, glowPx: 12 }));
    return glyphTex.get(g);
  };

  // ----------------------------------------------------------- dial faces
  function drawFace(ctx, reading, mode, alive = true) {
    const S = 512;
    const c = S / 2;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#020804';
    ctx.beginPath();
    ctx.arc(c, c, c - 4, 0, Math.PI * 2);
    ctx.fill();
    const base = mode === 'ccw' ? '#ffb02e' : '#4dff94';
    ctx.strokeStyle = base;
    ctx.fillStyle = base;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // tick marks every 10 degrees, numbers every 30
    for (let d = 0; d < 360; d += 10) {
      // green: 0 at the top, increasing clockwise. amber: 0 at the right, increasing counter-clockwise.
      const a = mode === 'ccw' ? (-d * Math.PI) / 180 : ((d - 90) * Math.PI) / 180;
      const major = d % 30 === 0;
      const r1 = c - (major ? 44 : 30);
      ctx.lineWidth = major ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      ctx.lineTo(c + Math.cos(a) * (c - 18), c + Math.sin(a) * (c - 18));
      ctx.stroke();
      if (major) {
        ctx.font = 'bold 26px ui-monospace, Menlo, monospace';
        ctx.fillText(String(d), c + Math.cos(a) * (c - 74), c + Math.sin(a) * (c - 74));
      }
    }
    // the needle
    const na = mode === 'ccw' ? (-reading * Math.PI) / 180 : ((reading - 90) * Math.PI) / 180;
    ctx.save();
    ctx.shadowColor = base;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c - Math.cos(na) * 28, c - Math.sin(na) * 28);
    ctx.lineTo(c + Math.cos(na) * (c - 96), c + Math.sin(na) * (c - 96));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // digital read-out
    ctx.fillStyle = '#010503';
    ctx.fillRect(c - 96, c + 70, 192, 80);
    ctx.strokeStyle = base;
    ctx.lineWidth = 3;
    ctx.strokeRect(c - 96, c + 70, 192, 80);
    ctx.fillStyle = base;
    ctx.font = 'bold 64px ui-monospace, Menlo, monospace';
    ctx.shadowColor = base;
    ctx.shadowBlur = 12;
    ctx.fillText(`${reading}°`, c, c + 112);
    ctx.shadowBlur = 0;
    if (!alive) {
      // static: the decoy's face is noisy
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(200,255,220,${Math.random() * 0.35})`;
        ctx.fillRect(Math.random() * S, Math.random() * S, Math.random() * 120 + 20, 2 + Math.random() * 4);
      }
    }
  }

  // ------------------------------------------------------ dials (per stage)
  const hot = {};
  let scenery = null;
  let dials = [];
  let locked = false;
  let selCol = null;
  let selRow = null;
  let flashMsg = null;

  const lcDisplay = new LiveCanvas(256, 96);
  function drawDisplay() {
    const { ctx } = lcDisplay;
    ctx.fillStyle = '#020c06';
    ctx.fillRect(0, 0, 256, 96);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 56px ui-monospace, Menlo, monospace';
    if (flashMsg) {
      ctx.shadowColor = flashMsg.color;
      ctx.fillStyle = flashMsg.color;
      ctx.fillText(flashMsg.text, 128, 50);
    } else {
      ctx.shadowColor = '#37ff7e';
      ctx.fillStyle = '#b6ffd0';
      ctx.fillText(`${selCol === null ? '_' : LETTERS[selCol]} – ${selRow === null ? '_' : selRow}`, 128, 50);
    }
    lcDisplay.touch();
  }

  function build(v) {
    if (scenery) {
      scenery.hs.forEach((h) => h.remove());
      scenery.group.traverse((o) => {
        o.geometry?.dispose?.();
        const mt = o.material;
        if (mt && mt !== dark && mt !== steel) mt.dispose?.();
      });
      scenery.live.forEach((l) => l.dispose()); // per-dial / per-button canvases (glyph textures are cached)
      root.remove(scenery.group);
    }
    const group = new THREE.Group();
    root.add(group);
    const hs = [];
    const live = [];
    dials = [];
    const n = v.readings.length;
    const spacing = Math.min(4.6, 18 / n);
    v.readings.forEach((r, i) => {
      const x = (i - (n - 1) / 2) * spacing;
      const g = new THREE.Group();
      g.position.set(x, 4.8, -8.3);
      group.add(g);
      const lc = new LiveCanvas(512, 512);
      live.push(lc);
      drawFace(lc.ctx, r.bearing, r.mode, true);
      lc.touch();
      const faceMat = new THREE.MeshBasicMaterial({ map: lc.texture, transparent: true, toneMapped: false, color: new THREE.Color(1.2, 1.2, 1.2) });
      const face = mesh(new THREE.CircleGeometry(1.7, 64), faceMat, { z: 0.2, parent: g, cast: false, receive: false });
      const rimMat = new THREE.MeshBasicMaterial({ color: RIM[r.mode].clone(), toneMapped: false });
      const rim = mesh(new THREE.TorusGeometry(1.78, 0.1, 16, 80), rimMat, { z: 0.22, parent: g, cast: false, receive: false });
      cyl(1.95, 1.95, 0.22, steel, { rx: Math.PI / 2, z: 0.05, parent: g }, 64);
      // the beacon glyph plate
      box(1.5, 1.2, 0.1, new THREE.MeshStandardMaterial({ color: 0x030a06, roughness: 0.5, metalness: 0.4 }), { y: 2.55, z: 0.1, parent: g, cast: false });
      mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: tex(r.glyph), transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.8, 1.6), depthWrite: false }), { y: 2.55, z: 0.17, parent: g, cast: false, receive: false });
      dials.push({ lc, faceMat, rimMat, rim, reading: r, flicker: r.flicker, phase: Math.random() * 10, g });
    });

    // --------------------------------------------------- the terminal
    // a console body with a sloped key panel, so the keys face the camera and can be read
    const desk = new THREE.Group();
    desk.position.set(0, 0, -0.6);
    group.add(desk);
    box(13.4, 0.7, 3.0, steel, { y: 0.35, parent: desk });
    const pad = new THREE.Group();
    pad.position.set(0, 1.75, -0.45);
    pad.rotation.x = -0.72;
    desk.add(pad);
    box(13.0, 2.7, 0.14, dark, { y: 0.3, z: -0.02, parent: pad, cast: false });
    // readout
    mesh(new THREE.PlaneGeometry(2.7, 1.0), new THREE.MeshBasicMaterial({ map: lcDisplay.texture, toneMapped: false, color: new THREE.Color(1.3, 1.5, 1.3) }), { x: -2.6, y: 1.0, z: 0.07, parent: pad, cast: false, receive: false });

    const makeBtn = (label, x, y, w, h, onClick, key, color = '#b6ffd0') => {
      const base = box(w, h, 0.18, new THREE.MeshStandardMaterial({ color: 0x0b1a13, roughness: 0.4, metalness: 0.6 }), { x, y, z: 0.1, parent: pad });
      const lcb = new LiveCanvas(128, 96);
      live.push(lcb);
      lcb.ctx.fillStyle = '#04120a';
      lcb.ctx.fillRect(0, 0, 128, 96);
      lcb.ctx.font = `bold ${label.length > 2 ? 34 : 66}px ui-monospace, Menlo, monospace`;
      lcb.ctx.textAlign = 'center';
      lcb.ctx.textBaseline = 'middle';
      lcb.ctx.shadowColor = color;
      lcb.ctx.shadowBlur = 8;
      lcb.ctx.fillStyle = color;
      lcb.ctx.fillText(label, 64, 50);
      lcb.touch();
      const lm = new THREE.MeshBasicMaterial({ map: lcb.texture, toneMapped: false, color: new THREE.Color(1.2, 1.2, 1.2) });
      mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.85), lm, { x, y, z: 0.195, parent: pad, cast: false, receive: false });
      const hit = hitbox(w + 0.04, h + 0.04, 0.5, { x, y, z: 0.2, parent: pad });
      hs.push(stage.addHotspot(hit, { outline: [base], onClick }));
      hot[key] = hit;
      return { base, lm };
    };
    const bw = 1.18;
    const btns = { col: [], row: [] };
    for (let i = 0; i < 10; i++) btns.col.push(makeBtn(LETTERS[i], (i - 4.5) * bw, 0.25, 1.02, 0.78, () => pickCol(i), `col:${i}`));
    for (let i = 0; i < 10; i++) btns.row.push(makeBtn(String(i + 1), (i - 4.5) * bw, -0.7, 1.02, 0.78, () => pickRow(i + 1), `row:${i + 1}`, '#9dd9ff'));
    makeBtn('ENTER', 4.2, 1.0, 2.6, 0.9, () => enter(), 'enter', '#7dffb0');
    scenery = { group, hs, btns, live };
    paint();
  }

  function paint() {
    scenery?.btns.col.forEach((b, i) => b.lm.color.setScalar(selCol === i ? 3.2 : 1.1));
    scenery?.btns.row.forEach((b, i) => b.lm.color.setScalar(selRow === i + 1 ? 3.2 : 1.1));
    drawDisplay();
  }

  function pickCol(i) {
    if (locked) return;
    selCol = i;
    audio.key(i);
    paint();
  }
  function pickRow(r) {
    if (locked) return;
    selRow = r;
    audio.key(r);
    paint();
  }
  function enter() {
    if (locked || selCol === null || selRow === null) return;
    locked = true;
    audio.key(9);
    flashMsg = { text: 'LOCATING', color: '#ffd27a' };
    drawDisplay();
    send({ type: 'locate', col: selCol, row: selRow - 1 });
  }

  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && LETTERS.includes(k)) pickCol(LETTERS.indexOf(k));
    else if (/^[0-9]$/.test(e.key)) pickRow(e.key === '0' ? 10 : Number(e.key));
    else if (e.key === 'Enter') enter();
  };
  window.addEventListener('keydown', onKey);

  build(view);

  async function wrong() {
    flashMsg = { text: 'NO FIX', color: '#ff4050' };
    stage.pulseGlitch(0.7, 400);
    drawDisplay();
    await stage.wait(1000);
    flashMsg = null;
    selCol = selRow = null;
    paint();
    locked = false;
  }

  async function cleared(nextView) {
    flashMsg = { text: 'FIX ✔', color: '#7dffb0' };
    drawDisplay();
    for (const d of dials) if (!d.flicker) d.rimMat.color.setRGB(0.4, 3.4, 1.2);
    stage.flash(0x9dffbf, 0.35, 500);
    await stage.wait(1500);
    if (nextView) {
      flashMsg = null;
      selCol = selRow = null;
      stage.pulseGlitch(0.8, 420);
      build(nextView);
      locked = false;
    }
  }

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    for (const d of dials) {
      if (d.flicker) {
        // the decoy: its light strobes, its face crackles with static
        const on = Math.sin(t * 23 + d.phase) > -0.1 || Math.random() > 0.8;
        d.rimMat.color.copy(RIM[d.reading.mode]).multiplyScalar(on ? 1 : 0.12);
        d.faceMat.color.setScalar(on ? 1.2 : 0.25);
        if (Math.random() < 0.3) {
          drawFace(d.lc.ctx, d.reading.bearing, d.reading.mode, false);
          d.lc.touch();
        }
      }
    }
  });

  return {
    hot,
    get idle() {
      return !locked;
    },
    get readings() {
      return dials.map((d) => d.reading);
    },
    onFx(m) {
      if (m.result === 'wrong') wrong();
      else if (m.result === 'stage') cleared(m.view);
      else if (m.result === 'solved') cleared(null);
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
    },
  };
}
