// Mentor — THE HARDLINE: the full map. You can see everything except where the
// Operator is standing. They can see only the 3x3 patch around them.

import { GLYPHS } from '../../shared/glyphs.js';
import { h } from './shell.js';

const CELL = 92;
const M = 40; // margin for labels
const LETTERS = 'ABCDEFGHIJ';

export function create({ shell, view }) {
  const page = h('div');
  const blank = h('div');
  const marks = new Map(); // "x,y" -> 1 (candidate) | 2 (ruled out)

  function render() {
    const N = view.size;
    const S = N * CELL + M * 2;
    const cx = (x) => M + x * CELL;
    const cy = (y) => M + y * CELL;

    let cellsSvg = '';
    let wallsSvg = '';
    let marksSvg = '';
    for (const c of view.cells) {
      const x0 = cx(c.x);
      const y0 = cy(c.y);
      if (c.trap) cellsSvg += `<rect x="${x0 + 2}" y="${y0 + 2}" width="${CELL - 4}" height="${CELL - 4}" fill="url(#hatch)"/>`;
      if (c.exit) {
        cellsSvg += `<rect x="${x0 + 3}" y="${y0 + 3}" width="${CELL - 6}" height="${CELL - 6}" fill="rgba(20,104,58,.22)" stroke="#14683a" stroke-width="3"/>`;
        cellsSvg += `<g transform="translate(${x0 + CELL / 2},${y0 + CELL / 2})" fill="none" stroke="#14683a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M-22 -8 Q-22 -26 0 -26 Q22 -26 22 -8"/><path d="M-26 -2 L-14 -2 L-14 12 L-26 12 Z"/><path d="M26 -2 L14 -2 L14 12 L26 12 Z"/><path d="M-14 4 L14 4"/>
            <path d="M-22 -8 L-22 -2"/><path d="M22 -8 L22 -2"/></g>
          <text x="${x0 + CELL / 2}" y="${y0 + CELL - 8}" text-anchor="middle" style="font-size:10px;fill:#14683a;letter-spacing:.12em;font-weight:800">HARDLINE</text>`;
      } else {
        const paths = GLYPHS[c.g].map((p) => `<path d="${p}"/>`).join('');
        cellsSvg += `<g transform="translate(${x0 + CELL / 2 - 26},${y0 + CELL / 2 - 26}) scale(0.52)" fill="none" stroke="${c.trap ? '#8f1d1d' : '#251d0e'}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
      }
      const [n, e, s, w] = c.w.split('').map((b) => b === '1');
      const line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if (n) wallsSvg += line(x0, y0, x0 + CELL, y0);
      if (s) wallsSvg += line(x0, y0 + CELL, x0 + CELL, y0 + CELL);
      if (w) wallsSvg += line(x0, y0, x0, y0 + CELL);
      if (e) wallsSvg += line(x0 + CELL, y0, x0 + CELL, y0 + CELL);
      const mk = marks.get(`${c.x},${c.y}`);
      if (mk === 1) marksSvg += `<circle cx="${x0 + CELL - 16}" cy="${y0 + 16}" r="8" fill="#e8a020" stroke="#251d0e" stroke-width="2"/>`;
      if (mk === 2) marksSvg += `<path d="M${x0 + CELL - 25} ${y0 + 7} l18 18 m0 -18 l-18 18" stroke="#8f1d1d" stroke-width="4" stroke-linecap="round"/>`;
    }
    const hits = view.cells.map((c) => `<rect data-x="${c.x}" data-y="${c.y}" x="${cx(c.x)}" y="${cy(c.y)}" width="${CELL}" height="${CELL}" fill="transparent" style="cursor:pointer"/>`).join('');
    const labels =
      Array.from({ length: N }, (_, i) => `<text x="${cx(i) + CELL / 2}" y="${M - 14}" text-anchor="middle">${LETTERS[i]}</text><text x="${M - 16}" y="${cy(i) + CELL / 2 + 5}" text-anchor="middle">${i + 1}</text>`).join('');

    page.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.58</span></div>
      <h2>The Hardline — Full Map</h2>
      <p style="margin:6px 0">The Operator is on this map — <b>you don't know where</b>. They see only the <b>3×3 patch</b> around them. Ask what's underfoot, narrow it down with pencil marks, then guide them to the <b>ringing phone</b>.</p>
      <div class="mazewrap">
        <svg class="mazemap" viewBox="0 0 ${S} ${S}" role="img" aria-label="Maze map">
          <defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(143,29,29,.14)"/><line x1="0" y1="0" x2="0" y2="10" stroke="#8f1d1d" stroke-width="4"/></pattern></defs>
          <g style="font-family:var(--type);font-size:15px;font-weight:800;fill:#251d0e;opacity:.6">${labels}</g>
          ${cellsSvg}
          <g stroke="#251d0e" stroke-width="7" stroke-linecap="square">${wallsSvg}</g>
          ${marksSvg}
          <g style="font-family:var(--type);fill:#251d0e"><text x="${S - 16}" y="20" text-anchor="end" style="font-size:12px;font-weight:800;letter-spacing:.1em">N ↑</text></g>
          ${hits}
        </svg>
        <div class="legend">
          <h3 style="margin-top:0">Reading the map</h3>
          <div><i style="background:repeating-linear-gradient(45deg,rgba(143,29,29,.3) 0 3px,rgba(143,29,29,.7) 3px 5px)"></i>Red hatch — <b>watched</b>. Stepping here throws the Operator back to the start (−15s).</div>
          <div><i style="background:rgba(20,104,58,.3);border-color:#14683a"></i>The hardline phone.</div>
          <div><b>Thick lines</b> are walls. North is up the page; the Operator's view has north away from them too.</div>
          <div style="margin-top:10px"><b>Pencil marks</b> — tap a cell: <span style="color:#b87810">●</span> maybe here, <span style="color:#8f1d1d">✕</span> not here, tap again to clear.</div>
          <p class="hand" style="margin-top:14px">Ask them what's under their feet <u>and</u> which ways are open. One glyph isn't enough.</p>
        </div>
      </div>`;

    page.querySelectorAll('rect[data-x]').forEach((r) => {
      r.addEventListener('click', () => {
        const key = `${r.dataset.x},${r.dataset.y}`;
        const next = ((marks.get(key) ?? 0) + 1) % 3;
        if (next === 0) marks.delete(key);
        else marks.set(key, next);
        render();
      });
    });
  }

  blank.innerHTML = `
    <div class="folio"><span>RED PILL PROTOCOL</span><span>p.59</span></div>
    <h2 style="border-bottom-style:dashed">(blank)</h2>
    <p class="hand" style="font-size:30px;margin-top:80px">Add your page.</p>
    <p style="opacity:.7;margin-top:30px">The last leaf of the Protocol is empty. Whoever gets out writes what they learned.</p>`;

  render();
  shell.setPages([
    { id: 'map', title: 'p.58  THE MAP', el: page },
    { id: 'blank', title: 'p.59', el: blank },
  ]);

  return {
    onFx() {},
    dispose() {},
  };
}
