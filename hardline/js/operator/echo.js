// Operator — THE ECHO CHAMBER. A monitor flashes a sequence of coloured glyphs. Four pylons
// stand on the dais. You repeat the Chamber back to itself — in its own grammar, which you
// can't read. Each colour has its own note, so the sequence is audible as well as visible.
// Click the monitor (or press R) to hear and see it again; it's free.

import * as THREE from 'three';
import { materials, tiled, glow, LiveCanvas, CodeScreen, radialTexture } from '../textures.js';
import { mesh, box, cyl, hitbox, roomShell, wetFloor, lightCone, dust, glitchEdges, strip, COLORS } from '../kit.js';
import { ease } from '../stage.js';
import { drawGlyph } from '../../shared/glyphs.js';

const W = 24;
const H = 9.5;
const D = 22;
const PYLONS = ['green', 'red', 'yellow', 'blue']; // left to right
const NOTE = { red: 261.63, blue: 329.63, green: 392.0, yellow: 493.88 };
const HEX = { red: '#ff3030', blue: '#3a6bff', green: '#30ff70', yellow: '#ffe033' };

export async function create({ stage, view, send, audio }) {
  const { scene } = stage;
  const M = materials();
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.FogExp2(0x020d08, 0.02);
  stage.baseFov = 54;
  stage.camera.fov = 54;
  const CAM = new THREE.Vector3(0, 3.4, 9.4);
  const LOOK = new THREE.Vector3(0, 2.9, -3);
  stage.setRig(CAM, LOOK, { parallax: { x: 0.45, y: 0.16, look: 0.05 } });

  roomShell(root, { w: W, h: H, d: D, wall: 'panel', floor: null, ceil: 'concrete', wallRepeat: 5 });
  wetFloor(stage, root, { w: W, d: D, repeat: 8, tint: 0x4a7a62, roughness: 0.28 });
  const edges = glitchEdges(root, { w: W, h: H, d: D });
  const motes = dust(root, { w: W, h: H, d: D, count: 220 });

  root.add(new THREE.AmbientLight(0x0c3a22, 0.34));
  const key = new THREE.SpotLight(0xcfffe0, 260, 30, 0.55, 0.8, 1.6);
  key.position.set(0, H - 0.4, 4);
  key.target.position.set(0, 1.5, -2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  root.add(key, key.target);
  for (const x of [-8, 8]) strip(root, { w: 0.14, d: 6, color: 0xcfffe0, intensity: 1.8, x, y: H - 0.05, z: -3, light: 26, lightDist: 9 });
  strip(root, { w: W - 1, d: 0.06, color: 0x1fff6a, intensity: 1.4, x: 0, y: 0.1, z: -D / 2 + 0.06 });

  // ------------------------------------------------------------- the monitor
  const mon = new THREE.Group();
  mon.position.set(0, 5.1, -9.6);
  root.add(mon);
  const frameMat = tiled(M.metal, 2, 1);
  frameMat.color.set(0x7d968a);
  const bezel = box(10.4, 5.9, 0.4, frameMat, { parent: mon });
  const screen = new LiveCanvas(512, 288);
  const rain = new CodeScreen(256, 144, { cols: 32, color: '#0d7f3a', head: '#5dff9a' });
  const screenMat = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false, color: new THREE.Color(1.15, 1.15, 1.15) });
  const screenMesh = mesh(new THREE.PlaneGeometry(9.8, 5.5), screenMat, { z: 0.22, parent: mon, cast: false, receive: false });
  const monLight = new THREE.PointLight(0x38ff7a, 18, 14, 2);
  monLight.position.set(0, 0, 2.5);
  mon.add(monLight);
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) box(0.5, 0.06, 0.06, new THREE.MeshBasicMaterial({ color: 0x07140d }), { x: sx * 5.5, y: 2 - i * 0.4, z: 0.1, parent: mon, cast: false });

  // progress pips under the monitor
  const pipsGroup = new THREE.Group();
  pipsGroup.position.set(0, 1.85, -9.1);
  root.add(pipsGroup);
  let pips = [];

  // ------------------------------------------------------------- the dais
  const dais = cyl(7.6, 7.9, 0.3, tiled(M.metal, 3, 1), { y: 0.15, z: -2.2 }, 64);
  mesh(new THREE.TorusGeometry(7.6, 0.05, 8, 96), glow(0x1fff6a, 1.6), { rx: Math.PI / 2, y: 0.32, z: -2.2, parent: root, cast: false, receive: false });
  const glowTex = radialTexture('rgb(255,255,255)');

  const pylons = {};
  const hot = {};
  PYLONS.forEach((color, i) => {
    const x = (i - 1.5) * 3.1;
    const g = new THREE.Group();
    g.position.set(x, 0.3, -2.2);
    root.add(g);
    const hex = COLORS[color];
    const col = new THREE.Color(hex);
    cyl(0.95, 1.1, 0.25, frameMat, { y: 0.12, parent: g }, 32);
    const body = cyl(0.55, 0.7, 2.3, tiled(M.metal, 1, 2), { y: 1.4, parent: g }, 32);
    cyl(0.62, 0.62, 0.16, frameMat, { y: 2.6, parent: g }, 32);
    // a ring of the pylon's colour around the body
    mesh(new THREE.TorusGeometry(0.72, 0.045, 10, 48), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2), toneMapped: false }), { rx: Math.PI / 2, y: 0.55, parent: g, cast: false, receive: false });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: 1.1, roughness: 0.2, metalness: 0 });
    const lens = mesh(new THREE.SphereGeometry(0.58, 32, 24), lensMat, { y: 3.15, parent: g, cast: false });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().multiplyScalar(1.4), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true, opacity: 0.0 }));
    halo.scale.set(3.6, 3.6, 1);
    halo.position.y = 3.15;
    g.add(halo);
    const light = new THREE.PointLight(col, 0, 12, 2);
    light.position.set(0, 3.4, 0.6);
    g.add(light);
    const hit = hitbox(1.9, 4.2, 1.9, { y: 2, parent: g });
    const ripple = mesh(new THREE.TorusGeometry(1, 0.03, 8, 48), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), { rx: Math.PI / 2, y: 0.34, parent: g, cast: false, receive: false });
    pylons[color] = { g, lens, lensMat, halo, light, ripple };
    hot[`pylon:${color}`] = hit;
    stage.addHotspot(hit, { outline: [body, lens], onClick: () => press(color) });
  });

  const monHit = hitbox(10.4, 5.9, 1, { z: 0.3, parent: mon });
  hot.replay = monHit;
  stage.addHotspot(monHit, { outline: [bezel], onClick: () => replay() });

  // ------------------------------------------------------------- the screen
  let showing = null; // null = idle, otherwise { color, glyph }
  let banner = null; // { text, color }
  let seq = view.flashes;
  let progress = view.progress ?? 0;

  function drawScreen() {
    const { ctx } = screen;
    const w = 512;
    const h = 288;
    if (showing) {
      const hex = HEX[showing.color];
      const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, hex);
      g.addColorStop(1, '#050505');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#04100a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 104, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawGlyph(ctx, showing.glyph, w / 2, h / 2, 170, { color: '#ffffff', lineWidth: 8 });
    } else if (banner) {
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 120px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = banner.color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = banner.color;
      ctx.fillText(banner.text, w / 2, h / 2 + 6);
      ctx.shadowBlur = 0;
    } else {
      ctx.drawImage(rain.canvas, 0, 0, w, h);
      ctx.fillStyle = 'rgba(0,10,4,0.55)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 56px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#37ff7e';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#9dffbf';
      ctx.fillText(playing ? '…' : 'ECHO', w / 2, h / 2 - 8);
      ctx.shadowBlur = 0;
      ctx.font = '22px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#4fbf7f';
      ctx.fillText('click to replay', w / 2, h / 2 + 52);
    }
    screen.touch();
  }

  function buildPips() {
    pipsGroup.clear();
    pips = seq.map((_, i) => {
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.25, 0.1), toneMapped: false });
      mesh(new THREE.SphereGeometry(0.16, 16, 12), m, { x: (i - (seq.length - 1) / 2) * 0.62, parent: pipsGroup, cast: false, receive: false });
      return m;
    });
    lightPips(progress);
  }
  function lightPips(n) {
    pips.forEach((m, i) => (i < n ? m.color.setRGB(0.3, 3, 1) : m.color.setRGB(0.05, 0.25, 0.1)));
  }

  // ------------------------------------------------------------- playback
  let playing = false;
  let autoPending = false; // the opening playback is scheduled but hasn't started
  let token = 0;

  async function play() {
    const t = ++token;
    autoPending = false;
    playing = true;
    banner = null;
    for (const f of seq) {
      if (t !== token) return;
      showing = f;
      drawScreen();
      audio.note(NOTE[f.color], 0.6, 0.22);
      await stage.wait(650);
      showing = null;
      drawScreen();
      await stage.wait(230);
    }
    if (t === token) playing = false;
    drawScreen();
  }
  function replay() {
    if (playing) return;
    play();
  }

  function flare(color) {
    const p = pylons[color];
    stage.tween(520, (k) => {
      const f = Math.sin(k * Math.PI);
      p.lensMat.emissiveIntensity = 1.1 + 5.5 * f;
      p.light.intensity = 55 * f;
      p.halo.material.opacity = 0.9 * f;
      p.ripple.scale.setScalar(1 + k * 4.2);
      p.ripple.material.opacity = (1 - k) * 0.9;
    }, ease.linear);
  }

  let locked = false;
  function press(color) {
    if (playing || locked) return;
    flare(color);
    audio.note(NOTE[color], 0.45, 0.2);
    send({ type: 'press', pylon: color });
  }

  const onKey = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'r' || e.key === 'R') replay();
  };
  window.addEventListener('keydown', onKey);

  // -------------------------------------------------------------- feedback
  async function wrong() {
    locked = true;
    token++;
    playing = false;
    showing = null;
    banner = { text: '✕', color: '#ff4050' };
    progress = 0;
    lightPips(0);
    drawScreen();
    stage.flash(0xff2030, 0.25, 400);
    await stage.wait(1000);
    banner = null;
    locked = false;
    play();
  }

  async function cleared(nextView) {
    locked = true;
    token++;
    playing = false;
    showing = null;
    lightPips(seq.length);
    banner = { text: '✔', color: '#7dffb0' };
    drawScreen();
    stage.flash(0x9dffbf, 0.35, 500);
    for (const c of PYLONS) flare(c);
    await stage.wait(1300);
    banner = null;
    if (nextView) {
      view = nextView;
      seq = nextView.flashes;
      progress = 0;
      buildPips();
      stage.pulseGlitch(0.6, 350);
      locked = false;
      autoPending = true; // the next sequence is about to play: not idle, and presses would be ignored
      await stage.wait(600);
      play();
    }
  }

  buildPips();
  drawScreen();

  stage.onTick((dt, t) => {
    motes.update(dt);
    edges.update(dt, t);
    rain.update(dt);
    if (!showing && !banner) drawScreen();
    monLight.intensity = (showing ? 55 : 14) + Math.sin(t * 9) * 1.2;
  });

  return {
    hot,
    get idle() {
      return !playing && !locked && !autoPending;
    },
    get flashes() {
      return seq;
    },
    onGo() {
      autoPending = true;
      setTimeout(() => play(), 700);
    },
    onFx(m) {
      if (m.result === 'correct') {
        progress = m.event?.progress ?? progress + 1;
        lightPips(progress);
        audio.blip(true);
      } else if (m.result === 'wrong') wrong();
      else if (m.result === 'stage') cleared(m.view);
      else if (m.result === 'solved') cleared(null);
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
      token++;
    },
  };
}
