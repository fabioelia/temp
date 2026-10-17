// The Operator's window into the construct: renderer + post-processing + camera
// rig + hotspots + tweens. Rooms build their scene into `stage.scene` and register
// clickable, deliberately unlabeled hotspots.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const ease = {
  linear: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in: (t) => t * t * t,
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

// Scanlines, chromatic aberration, green grade, glitch bands, grain, vignette.
const MatrixFX = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    res: { value: new THREE.Vector2(1280, 720) },
    glitch: { value: 0 },
    tint: { value: 0.7 },
    drain: { value: 0 },
    vignette: { value: 0.85 },
    aberr: { value: 0.0016 },
    grain: { value: 0.045 },
    flash: { value: new THREE.Vector4(0, 0, 0, 0) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time, glitch, tint, drain, vignette, aberr, grain;
    uniform vec2 res;
    uniform vec4 flash;
    varying vec2 vUv;
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float band = floor(uv.y * 30.0);
      float tick = floor(time * 16.0);
      float rnd = hash(band * 7.13 + tick);
      float hit = step(1.0 - 0.45 * glitch, rnd) * step(0.001, glitch);
      uv.x += hit * (hash(band + tick * 1.7) - 0.5) * 0.14 * glitch;
      vec2 dir = uv - 0.5;
      float ab = aberr + hit * 0.014 * glitch;
      float r = texture2D(tDiffuse, uv + dir * ab).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - dir * ab).b;
      vec3 col = vec3(r, g, b);
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.8, 1.05, 0.86), 0.65 * tint);
      col = mix(col, vec3(lum * 0.18, lum * 1.1, lum * 0.32), drain);
      float sl = sin(vUv.y * res.y * 1.15) * 0.5 + 0.5;
      col *= 1.0 - 0.055 * sl;
      col += (hash2(vUv * res + fract(time)) - 0.5) * grain;
      float v = smoothstep(0.95, 0.22, length(dir * vec2(1.0, 0.82)));
      col *= mix(1.0, v, vignette);
      col = mix(col, flash.rgb, flash.a);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class Stage {
  /**
   * gfx: 'auto' (adapts to the frame rate), 'high', or 'low' (no reflections, no MSAA,
   * capped resolution). URL overrides for development/tests: ?gfx=low&scale=0.5&maxdt=3
   */
  constructor(container, { audio = null, gfx = 'auto' } = {}) {
    const params = new URLSearchParams(location.search);
    gfx = params.get('gfx') || gfx;
    const low = gfx === 'low';
    this.gfx = gfx;
    this.maxDt = Number(params.get('maxdt')) || 0.25;
    this.container = container;
    this.audio = audio;
    this.disposed = false;
    this.tweens = [];
    this.ticks = [];
    this.hotspots = [];
    this.pickMeshes = [];
    this.hovered = null;
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerSmooth = new THREE.Vector2(0, 0);
    this.pointerInside = false;
    this.down = null;
    this.time = 0;
    this.shakeAmp = 0;
    this.frameEma = 16;
    this.frames = 0;
    this.quality = { reflections: !low, pixelRatio: Math.min(window.devicePixelRatio || 1, low ? 1 : 2) * (Number(params.get('scale')) || 1), msaa: low ? 0 : 4 };
    this.lowQualityListeners = [];
    this.baseFov = 58;

    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(this.quality.pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', 'The construct, as seen by the Operator');
    container.appendChild(renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010503);
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 16 / 9, 0.05, 220);

    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.1;
    pmrem.dispose();

    this.rig = {
      pos: new THREE.Vector3(0, 1.6, 6),
      look: new THREE.Vector3(0, 1.5, 0),
      cur: new THREE.Vector3(0, 1.6, 6),
      curLook: new THREE.Vector3(0, 1.5, 0),
      par: { x: 0.35, y: 0.16, look: 0.06 },
      follow: 6,
    };

    this.raycaster = new THREE.Raycaster();
    this._buildComposer();
    this._bind();
    this.resize();

    this.clock = new THREE.Clock();
    this._frame = this._frame.bind(this);
    this.active = true;
    this._raf = requestAnimationFrame(this._frame);
  }

  /** Stop/start rendering (used while the player is on the Mentor side of a swap). */
  setActive(on) {
    if (this.disposed || on === this.active) return;
    this.active = on;
    if (on) {
      this.clock.getDelta();
      this._raf = requestAnimationFrame(this._frame);
    } else cancelAnimationFrame(this._raf);
  }

  /** Throw away the current room and start a fresh scene on the same renderer. */
  resetScene() {
    this.clearHotspots();
    this.tweens = [];
    this.ticks = [];
    this.lowQualityListeners = [];
    this.onResize = null;
    this.outline.selectedObjects = [];
    this._disposeScene(this.scene);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010503);
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.1;
    this.composer.passes[0].scene = this.scene;
    this.outline.renderScene = this.scene;
    this.glitchBase = this.glitchPulse = 0;
    this.shakeAmp = 0;
    this.flashState.a = 0;
    this.fxu.drain.value = 0;
    this.fxu.tint.value = 0.7;
    this.camera.fov = this.baseFov;
    this.baseFov = 58;
    this.rig.par = { x: 0.35, y: 0.16, look: 0.06 };
    this.rig.follow = 6;
    this.resize();
  }

  _disposeScene(scene) {
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const k of Object.keys(m)) if (m[k]?.isTexture && !m[k].userData?.shared) m[k].dispose();
        m.dispose();
      }
      if (o.isReflector || o.isRenderTarget) o.getRenderTarget?.().dispose();
      o.dispose?.();
    });
  }

  // ------------------------------------------------------------ composition

  _buildComposer() {
    const size = new THREE.Vector2(this.container.clientWidth || 1280, this.container.clientHeight || 720);
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.quality.msaa });
    const composer = (this.composer = new EffectComposer(this.renderer, rt));
    composer.addPass(new RenderPass(this.scene, this.camera));

    this.outline = new OutlinePass(size, this.scene, this.camera);
    this.outline.edgeStrength = 4;
    this.outline.edgeGlow = 0.8;
    this.outline.edgeThickness = 1.6;
    this.outline.visibleEdgeColor.set(0x9dffbf);
    this.outline.hiddenEdgeColor.set(0x0a5c2a);
    composer.addPass(this.outline);

    this.bloom = new UnrealBloomPass(size, 0.5, 0.55, 0.92);
    composer.addPass(this.bloom);
    composer.addPass(new OutputPass());
    this.fx = new ShaderPass(MatrixFX);
    composer.addPass(this.fx);
    this.fxu = this.fx.uniforms;
    this.glitchBase = 0;
    this.glitchPulse = 0;
    this.flashState = { a: 0, color: new THREE.Color(0xffffff) };
  }

  resize() {
    const w = Math.max(2, this.container.clientWidth);
    const h = Math.max(2, this.container.clientHeight);
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.composer.setPixelRatio(this.quality.pixelRatio);
    this.composer.setSize(w, h);
    this.fxu.res.value.set(w * this.quality.pixelRatio, h * this.quality.pixelRatio);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // keep the framing readable on tall/narrow screens
    this.camera.fov = Math.min(92, this.baseFov * (aspect >= 1.5 ? 1 : 1 + (1.5 - aspect) * 0.55));
    this.camera.updateProjectionMatrix();
    this.aspect = aspect;
    this.onResize?.(w, h);
  }

  // ---------------------------------------------------------------- input

  _bind() {
    const el = this.renderer.domElement;
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this.container);
    this._move = (e) => {
      const r = el.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      this.pointerInside = true;
      this.pointerType = e.pointerType;
    };
    this._leave = () => (this.pointerInside = false);
    this._down = (e) => {
      this._move(e);
      this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.audio?.unlock();
      if (e.pointerType !== 'mouse') this._hover(this._pick());
    };
    this._up = (e) => {
      const d = this.down;
      this.down = null;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 900) return;
      this._move(e);
      const hit = this._pick();
      if (hit?.opts.enabled !== false && hit?.opts.onClick) {
        this.audio?.click();
        hit.opts.onClick(hit);
      }
    };
    el.addEventListener('pointermove', this._move);
    el.addEventListener('pointerleave', this._leave);
    el.addEventListener('pointerdown', this._down);
    window.addEventListener('pointerup', this._up);
  }

  /**
   * Register a clickable thing. `target` is an Object3D whose meshes can be picked.
   * opts: { onClick, onHover(bool), outline: Object3D[] | false, enabled }
   */
  addHotspot(target, opts = {}) {
    const hs = { target, opts: { enabled: true, ...opts }, meshes: [] };
    target.traverse((o) => {
      if (o.isMesh) {
        o.userData.hotspot = hs;
        hs.meshes.push(o);
        this.pickMeshes.push(o);
      }
    });
    this.hotspots.push(hs);
    hs.remove = () => {
      this.hotspots = this.hotspots.filter((h) => h !== hs);
      this.pickMeshes = this.pickMeshes.filter((m) => !hs.meshes.includes(m));
      if (this.hovered === hs) this._hover(null);
    };
    return hs;
  }

  clearHotspots() {
    this._hover(null);
    this.hotspots = [];
    this.pickMeshes = [];
  }

  _pick() {
    if (!this.pickMeshes.length) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickMeshes, false);
    // disabled hotspots are transparent to the pointer: a tall, not-yet-active hit box
    // (e.g. the phone booth) must never swallow a click meant for something behind it
    for (const h of hits) {
      const hs = h.object.userData.hotspot;
      if (hs && hs.opts.enabled !== false) return hs;
    }
    return null;
  }

  _hover(hs) {
    if (hs === this.hovered) return;
    if (this.hovered) this.hovered.opts.onHover?.(false, this.hovered);
    this.hovered = hs;
    if (hs) {
      hs.opts.onHover?.(true, hs);
      this.audio?.hover();
      this.outline.selectedObjects = hs.opts.outline === false ? [] : hs.opts.outline ?? [hs.target];
    } else {
      this.outline.selectedObjects = [];
    }
    this.container.classList.toggle('pointer', !!hs);
  }

  // --------------------------------------------------------- camera + fx

  setRig(pos, look, { snap = true, parallax } = {}) {
    this.rig.pos.copy(pos);
    this.rig.look.copy(look);
    if (parallax) Object.assign(this.rig.par, parallax);
    if (snap) {
      this.rig.cur.copy(pos);
      this.rig.curLook.copy(look);
    }
  }

  /** Smoothly dolly the camera. Resolves when it has arrived. */
  moveRig(pos, look, ms = 1200, easing = ease.inOut) {
    const p0 = this.rig.pos.clone();
    const l0 = this.rig.look.clone();
    return this.tween(ms, (k) => {
      this.rig.pos.lerpVectors(p0, pos, k);
      this.rig.look.lerpVectors(l0, look, k);
    }, easing);
  }

  /** Pixel position (client coords) of an object's centre — used by tests and debugging. */
  screenPos(obj) {
    const v = obj.position.clone();
    obj.getWorldPosition(v);
    v.project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height, visible: v.z < 1 };
  }

  setGlitch(v) {
    this.glitchBase = v;
  }

  pulseGlitch(amount = 1, ms = 350) {
    this.glitchPulse = Math.max(this.glitchPulse, amount);
    this.glitchDecay = amount / (ms / 1000);
  }

  flash(color = 0xffffff, alpha = 0.6, ms = 380) {
    this.flashState.color.set(color);
    this.flashState.a = alpha;
    this.flashState.decay = alpha / (ms / 1000);
  }

  shake(amp = 0.1, ms = 400) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeDecay = amp / (ms / 1000);
  }

  setDrain(v) {
    this.fxu.drain.value = v;
  }

  tween(ms, update, easing = ease.out) {
    return new Promise((resolve) => {
      this.tweens.push({ t: 0, ms, update, easing, resolve });
    });
  }

  wait(ms) {
    return this.tween(ms, () => {}, ease.linear);
  }

  onTick(fn) {
    this.ticks.push(fn);
    return () => (this.ticks = this.ticks.filter((f) => f !== fn));
  }

  onLowQuality(fn) {
    this.lowQualityListeners.push(fn);
  }

  // ----------------------------------------------------------------- loop

  _frame() {
    if (this.disposed || !this.active) return;
    this._raf = requestAnimationFrame(this._frame);
    const dt = Math.min(this.maxDt, this.clock.getDelta());
    this.time += dt;
    this._autoQuality(dt);

    for (const tw of this.tweens.slice()) {
      tw.t += dt * 1000;
      const k = Math.min(1, tw.t / tw.ms);
      tw.update(tw.easing(k), k);
      if (k >= 1) {
        this.tweens.splice(this.tweens.indexOf(tw), 1);
        tw.resolve();
      }
    }
    for (const fn of this.ticks) fn(dt, this.time);

    // camera: ease toward the rig, then add pointer parallax
    const rig = this.rig;
    const f = 1 - Math.exp(-rig.follow * dt);
    rig.cur.lerp(rig.pos, f);
    rig.curLook.lerp(rig.look, f);
    // the view drifts with the pointer, but freezes while a hotspot is hovered so targets never slide out from under the cursor
    if (!this.hovered) this.pointerSmooth.lerp(this.pointerInside ? this.pointer : new THREE.Vector2(0, 0), 1 - Math.exp(-3 * dt));
    const fwd = new THREE.Vector3().subVectors(rig.curLook, rig.cur).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const mx = this.pointerSmooth.x;
    const my = this.pointerSmooth.y;
    this.camera.position.copy(rig.cur).addScaledVector(right, mx * rig.par.x).addScaledVector(up, my * rig.par.y);
    const dist = rig.cur.distanceTo(rig.curLook);
    const target = rig.curLook.clone().addScaledVector(right, mx * rig.par.look * dist).addScaledVector(up, my * rig.par.look * dist * 0.6);
    if (this.shakeAmp > 0.0005) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmp;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmp;
      this.shakeAmp = Math.max(0, this.shakeAmp - (this.shakeDecay ?? 1) * dt);
    }
    this.camera.lookAt(target);

    this._hover(this.pointerInside ? this._pick() : null);

    // post fx uniforms
    this.glitchPulse = Math.max(0, this.glitchPulse - (this.glitchDecay ?? 3) * dt);
    this.fxu.time.value = this.time;
    this.fxu.glitch.value = Math.min(1, this.glitchBase + this.glitchPulse);
    const fl = this.flashState;
    if (fl.a > 0.001) fl.a = Math.max(0, fl.a - (fl.decay ?? 2) * dt);
    this.fxu.flash.value.set(fl.color.r, fl.color.g, fl.color.b, fl.a);

    this.composer.render(dt);
  }

  _autoQuality(dt) {
    this.frames++;
    if (this.gfx !== 'auto') return;
    if (this.frames < 60) return;
    this.frameEma += (dt * 1000 - this.frameEma) * 0.04;
    if (this.frames % 90 !== 0 || this.frameEma < 38) return;
    if (this.quality.pixelRatio > 1) {
      this.quality.pixelRatio = 1;
      this.resize();
    } else if (this.quality.reflections) {
      this.quality.reflections = false;
      this.bloom.strength = 0.4;
      this.lowQualityListeners.forEach((fn) => fn());
    }
    this.frameEma = 16;
  }

  // -------------------------------------------------------------- teardown

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this._move);
    el.removeEventListener('pointerleave', this._leave);
    el.removeEventListener('pointerdown', this._down);
    window.removeEventListener('pointerup', this._up);
    this._disposeScene(this.scene);
    this.envMap?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    el.remove();
  }
}
