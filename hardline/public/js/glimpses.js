// Seven animated "glimpses" seen through each door's porthole. They differ in motion
// and texture, not just colour, so they stay describable out loud.

import { LiveCanvas, CodeScreen } from './textures.js';

const S = 128;

function fire(lc, t) {
  const { ctx } = lc;
  ctx.fillStyle = '#1a0500';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 12 + Math.sin(t * 5 + i * 1.7) * 6;
    const h = 40 + 50 * (0.5 + 0.5 * Math.sin(t * 7 + i * 2.3));
    const g = ctx.createRadialGradient(x, S, 2, x, S - h * 0.4, h);
    g.addColorStop(0, 'rgba(255,230,120,0.95)');
    g.addColorStop(0.4, 'rgba(255,120,20,0.7)');
    g.addColorStop(1, 'rgba(120,10,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  lc.touch();
}

function water(lc, t) {
  const { ctx } = lc;
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#0a3a7a');
  g.addColorStop(1, '#03163a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(140,210,255,0.6)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 6; r++) {
    const rad = ((t * 22 + r * 24) % 120) + 4;
    ctx.globalAlpha = 1 - rad / 124;
    ctx.beginPath();
    ctx.ellipse(S / 2 + Math.sin(r * 3) * 14, S / 2 + 10, rad, rad * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  lc.touch();
}

function alarm(lc, t) {
  const { ctx } = lc;
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  ctx.fillStyle = `rgb(${40 + pulse * 60},0,4)`;
  ctx.fillRect(0, 0, S, S);
  const a = t * 5;
  const g = ctx.createRadialGradient(S / 2 + Math.cos(a) * 30, S / 2 + Math.sin(a) * 18, 2, S / 2, S / 2, 90);
  g.addColorStop(0, 'rgba(255,60,60,0.95)');
  g.addColorStop(1, 'rgba(120,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  lc.touch();
}

function noise(lc) {
  const { ctx } = lc;
  const img = ctx.createImageData(32, 32);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 60 + Math.random() * 190;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  const tmp = noise.tmp ?? (noise.tmp = document.createElement('canvas'));
  tmp.width = tmp.height = 32;
  tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, S, S);
  lc.touch();
}

function voidScreen(lc, t) {
  const { ctx } = lc;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 7; i++) {
    const x = (i * 53 + t * 6 * (1 + (i % 3))) % S;
    const y = (i * 37 + Math.sin(t + i) * 8 + 40) % S;
    ctx.fillStyle = `rgba(150,170,160,${0.25 + 0.25 * Math.sin(t * 2 + i)})`;
    ctx.fillRect(x, y, 2, 2);
  }
  lc.touch();
}

function glare(lc, t) {
  const { ctx } = lc;
  const k = 0.82 + 0.18 * Math.sin(t * 2.4);
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, 86);
  g.addColorStop(0, `rgba(255,255,255,${k})`);
  g.addColorStop(0.5, `rgba(230,245,255,${0.7 * k})`);
  g.addColorStop(1, 'rgba(190,210,230,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  lc.touch();
}

export const GLIMPSE_DRAW = { fire, water, alarm, static: noise, void: voidScreen, glare };

/** One live texture per glimpse type; `update(dt)` advances all of them. */
export class GlimpseSet {
  constructor() {
    this.items = new Map();
    this.t = 0;
    this.acc = 0;
  }
  get(id) {
    if (!this.items.has(id)) {
      if (id === 'code') this.items.set(id, { lc: new CodeScreen(S, S, { cols: 14 }), code: true });
      else this.items.set(id, { lc: new LiveCanvas(S, S), draw: GLIMPSE_DRAW[id] });
    }
    return this.items.get(id).lc.texture;
  }
  update(dt) {
    this.t += dt;
    this.acc += dt;
    if (this.acc < 1 / 24) return;
    const step = this.acc;
    this.acc = 0;
    for (const it of this.items.values()) {
      if (it.code) it.lc.update(step);
      else it.draw(it.lc, this.t);
    }
  }
}
