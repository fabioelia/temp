// Mentor — THE SWITCHBOARD: the wiring schematic. Tap a terminal (or a trace) to
// follow it; the Operator will tell you which cable they're holding.

import { GLYPHS } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const FILL = { red: '#e0302b', blue: '#2a63e0', green: '#1fa64a', yellow: '#f0d21c', white: '#f4f4f0', violet: '#8a44d6' };

export function create({ shell, view }) {
  const page = h('div');
  let cur = view;
  let selected = null;
  let done = new Set(view.pluggedColors ?? []);

  function render() {
    const v = cur;
    const n = v.left.length;
    const rowH = 78;
    const top = 50;
    const H = top + n * rowH;
    const yL = (i) => top + i * rowH + rowH / 2 - 10;
    const yR = (i) => top + i * rowH + rowH / 2 - 10;
    const anyHl = selected !== null;

    const wires = v.links
      .map(([li, ri], k) => {
        const y1 = yL(li);
        const y2 = yR(ri);
        const w = v.wobble[k] ?? 0;
        const d = `M178,${y1} C 320,${y1 + w * 90} 420,${y2 - w * 90} 560,${y2}`;
        const isHl = selected === li;
        const isDone = done.has(v.left[li]);
        return `<g data-l="${li}" class="wirewrap">
          <path class="wire ${isHl ? 'hl' : ''} ${anyHl && !isHl ? 'dim' : ''} ${isDone ? 'done' : ''}" d="${d}"/>
          <path d="${d}" fill="none" stroke="transparent" stroke-width="20" style="cursor:pointer"/></g>`;
      })
      .join('');

    const left = v.left
      .map((c, i) => {
        const y = yL(i);
        const isDone = done.has(c);
        return `<g class="term" data-l="${i}">
          <text x="112" y="${y + 5}" text-anchor="end">${c.toUpperCase()}</text>
          <circle cx="150" cy="${y}" r="21" fill="${FILL[c]}" stroke="#251d0e" stroke-width="3"/>
          ${isDone ? `<text x="150" y="${y + 6}" text-anchor="middle" style="fill:#14683a;font-size:20px">✓</text>` : ''}
          <circle cx="178" cy="${y}" r="5" fill="#251d0e"/>
        </g>`;
      })
      .join('');

    const right = v.right
      .map((g, i) => {
        const y = yR(i);
        const paths = GLYPHS[g].map((p) => `<path d="${p}"/>`).join('');
        return `<g class="term" data-r="${i}">
          <circle cx="560" cy="${y}" r="5" fill="#251d0e"/>
          <rect x="582" y="${y - 29}" width="64" height="58" fill="rgba(255,255,255,.2)" stroke="#251d0e" stroke-width="2"/>
          <g transform="translate(588,${y - 26}) scale(0.52)" fill="none" stroke="#251d0e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
        </g>`;
      })
      .join('');

    page.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.41</span></div>
      <h2>Wiring Schematic — The Switchboard</h2>
      <p>The old switchboard reroutes the signal. Each <b>coloured cable</b> must go into the <b>jack stamped with its glyph</b>. The traces below show which glyph each colour belongs to — but the traces cross, and the jacks on the Operator's panel are in <u>a different order</u> to this page.</p>
      <p><span class="stamp">BOARD ${ROMAN[v.round]} OF ${ROMAN[v.rounds - 1]}</span> &nbsp; <span style="font-size:12.5px">Tap a colour or a trace to follow it.</span></p>
      <svg class="schematic" viewBox="0 0 700 ${H}" role="img" aria-label="Wiring schematic">${wires}${left}${right}</svg>
      <p class="hand">Follow the wire, not the colour. The colour is only a name. — A.K.</p>`;

    page.querySelectorAll('[data-l]').forEach((el) => {
      el.addEventListener('click', () => {
        const li = Number(el.dataset.l);
        selected = selected === li ? null : li;
        render();
      });
    });
    page.querySelectorAll('[data-r]').forEach((el) => {
      el.addEventListener('click', () => {
        const ri = Number(el.dataset.r);
        const link = cur.links.find(([, r]) => r === ri);
        selected = link && selected !== link[0] ? link[0] : null;
        render();
      });
    });
  }

  render();
  shell.setPages([{ id: 'schematic', title: 'p.41  WIRING SCHEMATIC', el: page }]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        selected = null;
        done = new Set();
        render();
      }
      if (m.event?.plugged) {
        done.add(m.event.plugged);
        if (!m.view) render();
      }
    },
    dispose() {},
  };
}
