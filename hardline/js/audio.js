// HARDLINE audio: everything is synthesised with WebAudio, so there are no asset files.
//
// Mix principle (from the design handoff): sound carries information.
//   correct / wrong / "time is running low" each have their own distinct cue, and
//   the score thins out and ducks so two people can hear each other over it.
//
// Voice chat is external (Discord), so the game cannot hear the partner. As an
// opt-in, the microphone is analysed locally (never recorded or sent) so the score
// ducks while *you* are talking.

const ROOM_ROOTS = [73.42, 82.41, 65.41, 87.31, 61.74, 77.78, 69.3, 92.5, 55.0, 98.0, 58.27]; // one per room: D2 E2 C2 F2 B1 D#2 C#2 F#2 A1 G2 A#1
const STORE_KEY = 'hardline.audio.v1';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.settings = { master: 0.8, music: 0.5, sfx: 0.9, muted: false, micDuck: false };
    try {
      Object.assign(this.settings, JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
    } catch {}
    this.tension = 0;
    this.score = null;
    this.beat = { next: 0, tickNext: 0, warned30: false, warned10: false };
    this.mic = null;
  }

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
    } catch {}
  }

  // ------------------------------------------------------------------ setup

  unlock() {
    if (!this.ctx) this._build();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.settings.micDuck && !this.mic) this.enableMicDuck(true);
  }

  _build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.duckGain = ctx.createGain();
    this.musicBus.connect(this.duckGain).connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);

    // cheap synthetic reverb: decaying noise impulse
    const len = Math.floor(ctx.sampleRate * 1.8);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.verb = ctx.createConvolver();
    this.verb.buffer = ir;
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.35;
    this.verbSend.connect(this.verb).connect(this.master);

    // one second of white noise, reused everywhere
    const nl = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;

    this.curve = (() => {
      const n = 256;
      const c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * 4);
      }
      return c;
    })();
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(s.music, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.05);
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    this.applyVolumes();
  }

  // -------------------------------------------------------------- primitives

  _gain(v = 0, dest = this.sfxBus) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    g.connect(dest);
    return g;
  }

  /** One oscillator with an attack/decay envelope. Returns nothing; self-cleaning. */
  _tone({ type = 'sine', f0 = 440, f1 = null, t = 0, dur = 0.15, gain = 0.2, attack = 0.005, dest = this.sfxBus, verb = 0, filter = null, detune = 0 }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + t;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    if (f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type;
      f.frequency.value = filter.f;
      f.Q.value = filter.q ?? 1;
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(dest);
    if (verb) {
      const v = ctx.createGain();
      v.gain.value = verb;
      g.connect(v).connect(this.verbSend);
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise({ t = 0, dur = 0.2, gain = 0.2, type = 'bandpass', f0 = 1000, f1 = null, q = 1, dest = this.sfxBus, attack = 0.003, verb = 0 }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + t;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    if (f1 != null) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(dest);
    if (verb) {
      const v = ctx.createGain();
      v.gain.value = verb;
      g.connect(v).connect(this.verbSend);
    }
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  _ok() {
    return this.ctx && this.ctx.state === 'running' && !this.settings.muted;
  }

  // ------------------------------------------------------------ interface sfx

  /** Short code-flicker when a hotspot is highlighted. */
  hover() {
    if (!this._ok()) return;
    for (let i = 0; i < 3; i++) {
      this._tone({ type: 'square', f0: 900 + Math.random() * 2200, t: i * 0.022, dur: 0.02, gain: 0.025, filter: { type: 'highpass', f: 700 } });
    }
  }

  click() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 620, f1: 280, dur: 0.07, gain: 0.16 });
    this._noise({ dur: 0.03, gain: 0.07, type: 'highpass', f0: 3000 });
  }

  key(pitch = 0) {
    if (!this._ok()) return;
    this._tone({ type: 'triangle', f0: 760 + pitch * 38, dur: 0.06, gain: 0.14 });
  }

  type() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 1500 + Math.random() * 400, dur: 0.012, gain: 0.018 });
  }

  pageFlip() {
    if (!this._ok()) return;
    this._noise({ dur: 0.16, gain: 0.16, type: 'bandpass', f0: 2600, f1: 900, q: 0.7, attack: 0.02 });
    this._noise({ t: 0.09, dur: 0.1, gain: 0.07, type: 'bandpass', f0: 4200, f1: 1800, q: 0.9 });
    this._tone({ type: 'sine', f0: 210, f1: 330, dur: 0.18, gain: 0.03, attack: 0.05 });
  }

  boot(n = 0) {
    if (!this._ok()) return;
    this._tone({ type: 'square', f0: 520 + n * 70, dur: 0.05, gain: 0.04, filter: { type: 'lowpass', f: 2400 } });
  }

  ready() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 880, dur: 0.18, gain: 0.1, verb: 0.4 });
  }

  // --------------------------------------------------------- feedback sfx
  // Three unmistakable cues so players get feedback mid-conversation.

  correct() {
    if (!this._ok()) return;
    this._tone({ type: 'triangle', f0: 523.25, dur: 0.22, gain: 0.18, verb: 0.5 });
    this._tone({ type: 'triangle', f0: 783.99, t: 0.09, dur: 0.4, gain: 0.2, verb: 0.6 });
    this._tone({ type: 'sine', f0: 1567.98, t: 0.09, dur: 0.5, gain: 0.05, verb: 0.8 });
  }

  wrong() {
    if (!this._ok()) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(52, t0 + 0.42);
    const sh = ctx.createWaveShaper();
    sh.curve = this.curve;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o.connect(sh).connect(lp).connect(g).connect(this.sfxBus);
    o.start(t0);
    o.stop(t0 + 0.5);
    this._noise({ dur: 0.18, gain: 0.12, type: 'lowpass', f0: 900 });
  }

  stage() {
    if (!this._ok()) return;
    [392, 523.25, 659.25, 783.99].forEach((f, i) => this._tone({ type: 'triangle', f0: f, t: i * 0.08, dur: 0.35, gain: 0.15, verb: 0.6 }));
  }

  solved() {
    if (!this._ok()) return;
    [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone({ type: 'triangle', f0: f, t: i * 0.09, dur: 1.2, gain: 0.13, attack: 0.01, verb: 0.9 }));
    this._tone({ type: 'sine', f0: 130.81, dur: 2.2, gain: 0.18, attack: 0.3, verb: 0.5 });
  }

  /** Agent-patrol warning: stab of noise and a dissonant cluster. */
  stinger() {
    if (!this._ok()) return;
    const root = 220;
    this._noise({ dur: 0.7, gain: 0.22, type: 'bandpass', f0: 3200, f1: 180, q: 1.2, verb: 0.4 });
    [1, 1.0595, 1.4142, 2].forEach((m) => this._tone({ type: 'sawtooth', f0: root * m, f1: root * m * 0.97, dur: 1.1, gain: 0.08, attack: 0.02, filter: { type: 'lowpass', f: 1400 }, verb: 0.5 }));
    this._tone({ type: 'sine', f0: 55, f1: 38, dur: 0.9, gain: 0.3 });
  }

  fail() {
    if (!this._ok()) return;
    this._tone({ type: 'sawtooth', f0: 520, f1: 34, dur: 1.4, gain: 0.2, filter: { type: 'lowpass', f: 1500 }, verb: 0.3 });
    for (let i = 0; i < 6; i++) this._noise({ t: i * 0.11 + Math.random() * 0.05, dur: 0.07, gain: 0.14, type: 'highpass', f0: 1500 + Math.random() * 2000 });
    this._tone({ type: 'sine', f0: 60, f1: 30, dur: 1.2, gain: 0.35 });
  }

  glitch() {
    if (!this._ok()) return;
    for (let i = 0; i < 5; i++) {
      this._tone({ type: 'square', f0: 200 + Math.random() * 1800, t: i * 0.035, dur: 0.03, gain: 0.05 });
      this._noise({ t: i * 0.035, dur: 0.03, gain: 0.05, type: 'highpass', f0: 2000 });
    }
  }

  whoosh(up = true) {
    if (!this._ok()) return;
    this._noise({ dur: 0.7, gain: 0.2, type: 'bandpass', f0: up ? 300 : 3000, f1: up ? 3200 : 260, q: 0.8, attack: 0.2 });
  }

  thaw() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 70, f1: 28, dur: 0.9, gain: 0.5 });
    this._noise({ dur: 0.8, gain: 0.3, type: 'bandpass', f0: 4000, f1: 200, q: 0.7, attack: 0.02 });
    for (let i = 0; i < 6; i++) this._noise({ t: 0.05 + i * 0.045, dur: 0.05, gain: 0.12, type: 'highpass', f0: 2500 });
  }

  freeze() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 900, f1: 90, dur: 0.9, gain: 0.12, verb: 0.9 });
    this._noise({ dur: 0.6, gain: 0.09, type: 'highpass', f0: 5000, f1: 800, attack: 0.15, verb: 0.5 });
  }

  door() {
    if (!this._ok()) return;
    this._noise({ dur: 0.9, gain: 0.25, type: 'lowpass', f0: 500, f1: 120, attack: 0.1 });
    this._tone({ type: 'sine', f0: 62, f1: 38, dur: 0.7, gain: 0.45 });
    this._tone({ type: 'square', f0: 190, f1: 140, t: 0.02, dur: 0.1, gain: 0.07, filter: { type: 'lowpass', f: 900 } });
    this._tone({ type: 'sawtooth', f0: 90, f1: 150, t: 0.1, dur: 0.6, gain: 0.05, filter: { type: 'lowpass', f: 500 } });
  }

  slam() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 90, f1: 30, dur: 0.5, gain: 0.55 });
    this._noise({ dur: 0.25, gain: 0.3, type: 'lowpass', f0: 1800, f1: 200 });
  }

  spark() {
    if (!this._ok()) return;
    for (let i = 0; i < 8; i++) this._noise({ t: Math.random() * 0.18, dur: 0.03, gain: 0.12, type: 'highpass', f0: 3000 + Math.random() * 3000 });
    this._tone({ type: 'sawtooth', f0: 1800, f1: 120, dur: 0.2, gain: 0.05, filter: { type: 'bandpass', f: 1400, q: 3 } });
  }

  plug() {
    if (!this._ok()) return;
    this._noise({ dur: 0.04, gain: 0.2, type: 'lowpass', f0: 1200 });
    this._tone({ type: 'sine', f0: 1320, dur: 0.35, gain: 0.07, verb: 0.5 });
    this._tone({ type: 'triangle', f0: 180, f1: 120, dur: 0.1, gain: 0.2 });
  }

  step() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 110, f1: 60, dur: 0.12, gain: 0.25 });
    this._noise({ dur: 0.07, gain: 0.07, type: 'lowpass', f0: 700 });
  }

  bump() {
    if (!this._ok()) return;
    this._tone({ type: 'triangle', f0: 90, f1: 55, dur: 0.14, gain: 0.3 });
  }

  /** One ring of the hardline phone. */
  phoneRing() {
    if (!this._ok()) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    for (const f of [440, 480]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const am = ctx.createOscillator();
      am.frequency.value = 20;
      const amg = ctx.createGain();
      amg.gain.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.setValueAtTime(0.12, t0 + 0.85);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 0.9);
      am.connect(amg).connect(g.gain);
      o.connect(g).connect(this.sfxBus);
      o.start(t0);
      am.start(t0);
      o.stop(t0 + 0.95);
      am.stop(t0 + 0.95);
    }
  }

  pickup() {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: 300, f1: 90, dur: 0.2, gain: 0.2 });
    this._noise({ dur: 0.08, gain: 0.1, type: 'lowpass', f0: 1400 });
  }

  // ----------------------------------------------------- deep-loop room cues

  /** A pure tone at a given pitch: the Echo Chamber gives each pylon its own note. */
  note(freq, dur = 0.45, gain = 0.2) {
    if (!this._ok()) return;
    this._tone({ type: 'triangle', f0: freq, dur, gain, verb: 0.55, attack: 0.01 });
    this._tone({ type: 'sine', f0: freq * 2, dur: dur * 0.8, gain: gain * 0.25, verb: 0.7 });
  }

  /** A heavy mechanical lever or switch. */
  lever() {
    if (!this._ok()) return;
    this._tone({ type: 'square', f0: 140, f1: 70, dur: 0.09, gain: 0.12, filter: { type: 'lowpass', f: 700 } });
    this._tone({ type: 'sine', f0: 80, f1: 45, dur: 0.18, gain: 0.3 });
    this._noise({ dur: 0.06, gain: 0.12, type: 'bandpass', f0: 1500, q: 1.5 });
  }

  /** A small detent as a dial or tile clicks over. */
  tick() {
    if (!this._ok()) return;
    this._tone({ type: 'square', f0: 1800, dur: 0.012, gain: 0.05, filter: { type: 'highpass', f: 900 } });
    this._tone({ type: 'sine', f0: 240, f1: 160, dur: 0.05, gain: 0.1 });
  }

  /** Power surging up as a circuit is engaged. */
  engage() {
    if (!this._ok()) return;
    this._tone({ type: 'sawtooth', f0: 60, f1: 340, dur: 0.7, gain: 0.12, attack: 0.1, filter: { type: 'lowpass', f: 1200 }, verb: 0.3 });
    this._noise({ dur: 0.6, gain: 0.08, type: 'bandpass', f0: 400, f1: 3000, q: 0.8, attack: 0.2 });
  }

  /** A short confirming blip for a single tile or switch. */
  blip(up = true) {
    if (!this._ok()) return;
    this._tone({ type: 'sine', f0: up ? 660 : 440, f1: up ? 880 : 330, dur: 0.07, gain: 0.1 });
  }

  // ------------------------------------------------------------ score + tension

  /** Dark industrial drone, sparse brass swells; silence is a feature. */
  startScore(roomIndex = 0) {
    if (!this.ctx) return;
    this.stopScore();
    const ctx = this.ctx;
    const root = ROOM_ROOTS[roomIndex % ROOM_ROOTS.length];
    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
    out.connect(this.musicBus);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 2;
    const drone = ctx.createGain();
    drone.gain.value = 0.09;
    lp.connect(drone).connect(out);

    const oscs = [];
    const mk = (type, f, dest, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(dest);
      o.start();
      oscs.push(o);
      return o;
    };
    mk('sawtooth', root, lp);
    mk('sawtooth', root, lp, 9);
    mk('sawtooth', root * 2, lp, -7);
    const sub = ctx.createGain();
    sub.gain.value = 0.2;
    sub.connect(out);
    mk('sine', root / 2, sub);

    // string pad: a minor sixth over the root, breathing slowly
    const padLp = ctx.createBiquadFilter();
    padLp.type = 'lowpass';
    padLp.frequency.value = 700;
    const pad = ctx.createGain();
    pad.gain.value = 0.0001;
    padLp.connect(pad).connect(out);
    mk('triangle', root * 3, padLp, 4);
    mk('triangle', root * 3 * 1.5874, padLp, -5); // minor sixth
    mk('triangle', root * 4.76, padLp, 3);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(pad.gain);
    lfo.start();
    oscs.push(lfo);

    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.09;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 70;
    lfo2.connect(lfo2Gain).connect(lp.frequency);
    lfo2.start();
    oscs.push(lfo2);

    // system hum: rises as the timer runs low
    const humLp = ctx.createBiquadFilter();
    humLp.type = 'lowpass';
    humLp.frequency.value = 160;
    const hum = ctx.createGain();
    hum.gain.value = 0.0001;
    humLp.connect(hum).connect(out);
    mk('sawtooth', 50, humLp);
    mk('sine', 100.4, humLp);

    this.score = { out, lp, drone, pad, hum, oscs, root, swellTimer: null };
    this.setTension(this.tension);
    this._scheduleSwell(6000 + Math.random() * 6000);
  }

  _scheduleSwell(ms) {
    const s = this.score;
    if (!s) return;
    s.swellTimer = setTimeout(() => {
      this._swell();
      const gap = (14 + Math.random() * 16) * (1 - 0.65 * this.tension);
      this._scheduleSwell(gap * 1000);
    }, ms);
  }

  _swell() {
    const s = this.score;
    if (!s || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = 3.2 + Math.random() * 1.6;
    const peak = 0.05 + 0.06 * this.tension;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(260, t0);
    lp.frequency.linearRampToValueAtTime(1500 + 900 * this.tension, t0 + dur * 0.55);
    lp.frequency.linearRampToValueAtTime(240, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + dur * 0.55);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    lp.connect(g).connect(s.out);
    const v = ctx.createGain();
    v.gain.value = 0.5;
    g.connect(v).connect(this.verbSend);
    const base = s.root * 4;
    for (const m of [1, 1.0595, 1.4142, 1.5874]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = base * m;
      o.detune.value = (Math.random() - 0.5) * 14;
      o.connect(lp);
      o.start(t0);
      o.stop(t0 + dur + 0.1);
    }
  }

  setTension(t) {
    this.tension = Math.max(0, Math.min(1, t));
    const s = this.score;
    if (!s || !this.ctx) return;
    const now = this.ctx.currentTime;
    s.lp.frequency.setTargetAtTime(210 + 700 * this.tension, now, 0.6);
    s.drone.gain.setTargetAtTime(0.07 + 0.1 * this.tension, now, 0.6);
    s.pad.gain.setTargetAtTime(0.0001, now, 0.6);
    s.hum.gain.setTargetAtTime(0.005 + 0.2 * Math.pow(this.tension, 1.6), now, 0.8);
  }

  stopScore() {
    const s = this.score;
    if (!s) return;
    clearTimeout(s.swellTimer);
    const now = this.ctx.currentTime;
    s.out.gain.cancelScheduledValues(now);
    s.out.gain.setTargetAtTime(0.0001, now, 0.35);
    for (const o of s.oscs) {
      try {
        o.stop(now + 1.6);
      } catch {}
    }
    this.score = null;
  }

  /**
   * Called ~10x/second while a room is running. Ticks and heartbeats are
   * scheduled on the audio clock so they don't jitter.
   */
  drive(remainingMs, totalMs, running) {
    if (!this.ctx || !this._ok()) return;
    const frac = remainingMs / totalMs;
    this.setTension(frac > 0.5 ? 0 : (0.5 - frac) / 0.5);
    if (!running) return;
    const now = this.ctx.currentTime;

    if (remainingMs <= 30000 && !this.beat.warned30) {
      this.beat.warned30 = true;
      this.stinger();
    }
    if (remainingMs <= 10000 && !this.beat.warned10) {
      this.beat.warned10 = true;
      this.stinger();
    }

    if (remainingMs <= 20000) {
      // heartbeat that speeds up as time runs out
      const rate = 1.1 + 1.3 * (1 - remainingMs / 20000);
      if (this.beat.next < now) this.beat.next = now + 0.05;
      while (this.beat.next < now + 0.18) {
        this._thump(this.beat.next - now, 0.6);
        this._thump(this.beat.next - now + 0.16, 0.38);
        this.beat.next += 1 / rate;
      }
    } else if (remainingMs <= 60000) {
      if (this.beat.tickNext < now) this.beat.tickNext = now + 0.05;
      while (this.beat.tickNext < now + 0.18) {
        this._noise({ t: this.beat.tickNext - now, dur: 0.025, gain: 0.07, type: 'bandpass', f0: 2200, q: 4 });
        this.beat.tickNext += 1;
      }
    }
  }

  _thump(t, gain) {
    this._tone({ type: 'sine', f0: 62, f1: 38, t, dur: 0.14, gain: gain * 0.6, attack: 0.008 });
  }

  resetBeat() {
    this.beat = { next: 0, tickNext: 0, warned30: false, warned10: false };
  }

  // --------------------------------------------------------------- voice duck

  duck(on) {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(on ? 0.28 : 1, this.ctx.currentTime, on ? 0.06 : 0.5);
  }

  async enableMicDuck(on) {
    if (!on) {
      if (this.mic) {
        clearInterval(this.mic.timer);
        this.mic.stream.getTracks().forEach((t) => t.stop());
        this.mic = null;
        this.duck(false);
      }
      return true;
    }
    if (this.mic || !this.ctx) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      const src = this.ctx.createMediaStreamSource(stream);
      const an = this.ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an); // analysed only — never routed to the speakers or the network
      const buf = new Float32Array(an.fftSize);
      let hold = 0;
      const timer = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        if (rms > 0.02) hold = 8;
        else if (hold > 0) hold--;
        this.duck(hold > 0);
      }, 80);
      this.mic = { stream, timer };
      return true;
    } catch {
      this.settings.micDuck = false;
      this.save();
      return false;
    }
  }
}

export const audio = new AudioEngine();
