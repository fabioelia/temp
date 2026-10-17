// Mentor — THE SIGNAL ROOM: the map, the dial conventions, and a protractor.
//
// Pick a beacon, enter the bearing the Operator reads you, choose the dial's rim colour, and draw.
// Real bearings cross on the target square. A flickering dial is a decoy: don't draw it.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III'];
const LETTERS = 'ABCDEFGHIJ';
const CELL = 52;
const M = 36;
const COLORS = ['#b0281f', '#1f5fb0', '#14683a', '#8a44d6'];

export function create({ shell, view }) {
  const mapPage = h('div');
  const convPage = h('div');
  let cur = view;
  let lines = []; // { glyph, bearing, mode, compass, color }
  let pick = null;
  let mode = 'cw';
  let bearingText = '';

  const px = (v) => M + v * CELL + CELL / 2;
  const compassOf = (bearing, m) => (m === 'ccw' ? (((90 - bearing) % 360) + 360) % 360 : bearing);

  function intersections() {
    const out = [];
    const ray = (l) => {
      const b = cur.beacons.find((q) => q.glyph === l.glyph);
      const a = (l.compass * Math.PI) / 180;
      return { x: b.x, y: b.y, dx: Math.sin(a), dy: -Math.cos(a) };
    };
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const p = ray(lines[i]);
        const q = ray(lines[j]);
        const det = p.dx * -q.dy - p.dy * -q.dx;
        if (Math.abs(det) < 1e-6) continue;
        const t = ((q.x - p.x) * -q.dy - (q.y - p.y) * -q.dx) / det;
        const u = ((q.x - p.x) * -p.dy - (q.y - p.y) * -p.dx) / det;
        // the lines are drawn as rays (forward only) — a real bearing points AT the target
        if (t < 0 || u < 0) continue;
        out.push({ x: p.x + p.dx * t, y: p.y + p.dy * t });
      }
    }
    return out;
  }

  function render() {
    const N = cur.size;
    const S = N * CELL + M * 2;
    const grid = [];
    for (let i = 0; i <= N; i++) {
      grid.push(`<line x1="${M}" y1="${M + i * CELL}" x2="${M + N * CELL}" y2="${M + i * CELL}"/><line x1="${M + i * CELL}" y1="${M}" x2="${M + i * CELL}" y2="${M + N * CELL}"/>`);
    }
    const labels = Array.from({ length: N }, (_, i) => `<text x="${px(i)}" y="${M - 10}" text-anchor="middle">${LETTERS[i]}</text><text x="${M - 12}" y="${px(i) + 5}" text-anchor="middle">${i + 1}</text>`).join('');
    const beacons = cur.beacons
      .map((b) => {
        const paths = glyphSVG(b.glyph, { size: 1 }).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
        return `<g transform="translate(${px(b.x) - 17},${px(b.y) - 17}) scale(0.34)" fill="none" stroke="#251d0e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${paths}</g><circle cx="${px(b.x)}" cy="${px(b.y)}" r="21" fill="none" stroke="#251d0e" stroke-width="2.5" stroke-dasharray="3 3"/>`;
      })
      .join('');
    const rays = lines
      .map((l, i) => {
        const b = cur.beacons.find((q) => q.glyph === l.glyph);
        const a = (l.compass * Math.PI) / 180;
        const len = N * 1.6;
        const x2 = px(b.x) + Math.sin(a) * len * CELL;
        const y2 = px(b.y) - Math.cos(a) * len * CELL;
        return `<line x1="${px(b.x)}" y1="${px(b.y)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${l.color}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`;
      })
      .join('');
    const hits = intersections();
    const hitMarks = hits.map((p) => `<circle cx="${px(p.x - 0.0)}" cy="${px(p.y - 0.0)}" r="7" fill="none" stroke="#14683a" stroke-width="3"/>`).join('');
    const cells = [...new Set(hits.filter((p) => p.x > -0.5 && p.y > -0.5 && p.x < N - 0.5 && p.y < N - 0.5).map((p) => `${LETTERS[Math.round(p.x)]}${Math.round(p.y) + 1}`))];

    const beaconButtons = cur.beacons
      .map((b) => `<button class="bpick ${pick === b.glyph ? 'on' : ''}" data-b="${b.glyph}" aria-label="beacon">${glyphSVG(b.glyph, { size: 34, stroke: 8 })}</button>`)
      .join('');
    const lineList = lines
      .map((l, i) => `<li><span class="dot" style="background:${l.color}"></span>${glyphSVG(l.glyph, { size: 22, stroke: 9 })} <b>${l.bearing}°</b> ${l.mode === 'ccw' ? 'AMBER' : 'GREEN'}<button class="rm" data-rm="${i}" title="remove">✕</button></li>`)
      .join('');

    mapPage.innerHTML = `
      <div class="folio"><span>APPENDIX B — DEEP LOOP</span><span>B.7</span></div>
      <h2>The Signal Room — the map</h2>
      <p style="margin:6px 0"><span class="stamp">FIX ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span> &nbsp; The Operator reads you each dial: <b>glyph, number, rim colour, and whether it flickers</b>. Draw every <u>steady</u> one. The lines cross on the square to enter.</p>
      <div class="mazewrap">
        <svg class="mazemap" viewBox="0 0 ${S} ${S}" role="img" aria-label="Signal map">
          <g stroke="#251d0e" stroke-width="1.2" opacity=".35">${grid.join('')}</g>
          <g style="font-family:var(--type);font-size:15px;font-weight:800;fill:#251d0e;opacity:.7">${labels}</g>
          <text x="${S - 14}" y="22" text-anchor="end" style="font-family:var(--type);font-size:13px;font-weight:800;fill:#251d0e">N ↑</text>
          ${rays}${beacons}${hitMarks}
        </svg>
        <div class="legend" style="min-width:230px">
          <h3 style="margin-top:0">Protractor</h3>
          <div class="bpicks">${beaconButtons}</div>
          <label class="fld">Bearing <input id="tri-b" type="number" min="0" max="359" value="${bearingText}" placeholder="0–359"></label>
          <div class="seg2"><button data-mode="cw" class="${mode === 'cw' ? 'on' : ''}">GREEN rim</button><button data-mode="ccw" class="${mode === 'ccw' ? 'on' : ''}">AMBER rim</button></div>
          <button class="draw" id="tri-draw">DRAW LINE</button>
          <ul class="linelist">${lineList || '<li class="none">No lines yet.</li>'}</ul>
          <div class="verdict ${cells.length ? 'ok' : ''}" style="margin-top:8px">${cells.length ? `Lines cross near: <b>${cells.join(', ')}</b>` : 'Draw two or more steady bearings.'}</div>
        </div>
      </div>`;

    mapPage.querySelectorAll('[data-b]').forEach((el) => (el.onclick = () => ((pick = el.dataset.b), render())));
    mapPage.querySelectorAll('[data-mode]').forEach((el) => (el.onclick = () => ((mode = el.dataset.mode), render())));
    mapPage.querySelectorAll('[data-rm]').forEach((el) => (el.onclick = () => (lines.splice(Number(el.dataset.rm), 1), render())));
    const input = mapPage.querySelector('#tri-b');
    input.oninput = () => (bearingText = input.value);
    input.onkeydown = (e) => e.key === 'Enter' && draw();
    mapPage.querySelector('#tri-draw').onclick = draw;
  }

  function draw() {
    const bearing = Number(bearingText);
    if (!pick || bearingText === '' || !Number.isFinite(bearing) || bearing < 0 || bearing > 359) return;
    lines.push({ glyph: pick, bearing, mode, compass: compassOf(bearing, mode), color: COLORS[lines.length % COLORS.length] });
    bearingText = '';
    render();
  }

  convPage.innerHTML = `
    <div class="folio"><span>APPENDIX B — DEEP LOOP</span><span>B.8</span></div>
    <h2>Dial conventions</h2>
    <p>Each beacon dial reads a bearing in degrees, but <b>the rim colour says how to read it</b>.</p>
    <div class="rule">
      <b style="color:#14683a">GREEN rim — compass bearing.</b><br>
      Degrees <b>clockwise from NORTH</b> (up the map). 0° = north, 90° = east, 180° = south, 270° = west.
    </div>
    <div class="rule">
      <b style="color:#9a6200">AMBER rim — maths angle.</b><br>
      Degrees <b>counter-clockwise from EAST</b> (right on the map). 0° = east, 90° = north, 180° = west, 270° = south.<br>
      <i>The protractor converts this for you if you tell it the rim colour.</i>
    </div>
    <div class="rule">
      <b style="color:#8f1d1d">A FLICKERING dial is a DECOY.</b> Its number means nothing. Ask the Operator which dials flicker — and leave them out.
    </div>
    <h3>Entering the answer</h3>
    <p>The Operator's terminal takes a <b>column letter</b> (A–J, left to right) and a <b>row number</b> (1–10, top to bottom). Say it like "D, seven".</p>
    <p class="hand">Three honest lines should cross in one square. If they don't, one of them is a liar. — A.K.</p>`;

  render();
  shell.setPages([
    { id: 'map', title: 'B.7  THE MAP', el: mapPage },
    { id: 'conv', title: 'B.8  CONVENTIONS', el: convPage },
  ]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        lines = [];
        pick = null;
        bearingText = '';
        render();
      }
    },
    dispose() {},
  };
}
