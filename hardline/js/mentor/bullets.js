// Mentor — THE ATRIUM: the temporal physics rulebook, with a scratch grid.

import { h } from './shell.js';
import { BULLET_LOOK, shapePoints } from '../../shared/bulletlook.js';

const FILL = { red: '#e0302b', cyan: '#20c4e8', yellow: '#f0d21c', magenta: '#e0309a', white: '#f4f4f0' };

/** The badge the Operator sees, as a little SVG: same shape, same colour. */
function badgeSVG(color, size = 34) {
  const pts = shapePoints(BULLET_LOOK[color].shape, 1).map(([x, y]) => `${(x * 11 + 14).toFixed(2)},${(14 - y * 11).toFixed(2)}`).join(' ');
  return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true"><polygon points="${pts}" fill="${FILL[color]}" fill-opacity=".35" stroke="${FILL[color]}" stroke-width="3" stroke-linejoin="round"/><polygon points="${pts}" fill="none" stroke="#251d0e" stroke-width="1" stroke-linejoin="round"/></svg>`;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const ARROW = { left: '←', right: '→', up: '↑', down: '↓', upleft: '↖', upright: '↗', downleft: '↙', downright: '↘', stay: '●' };
const WORD = { left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', upleft: 'UP-LEFT', upright: 'UP-RIGHT', downleft: 'DOWN-LEFT', downright: 'DOWN-RIGHT', stay: 'HOLDS STILL' };
const NAME = { red: 'RED', cyan: 'CYAN', yellow: 'YELLOW', magenta: 'MAGENTA', white: 'WHITE' };

export function create({ shell, view }) {
  const page = h('div');
  let marks = Array(9).fill(false);

  function render(v) {
    const rows = v.chart
      .map(
        (c) => `<tr><td>${badgeSVG(c.color)} &nbsp;<b>${NAME[c.color]} ${BULLET_LOOK[c.color].word}</b></td><td class="arrow">${ARROW[c.vector]}</td><td>${WORD[c.vector]}</td></tr>`
      )
      .join('');
    const cells = marks
      .map((m, i) => `<button class="scell ${m ? 'x' : ''}" data-i="${i}" aria-label="Cell ${i + 1}"><i>${i + 1}</i>${m ? '✕' : ''}</button>`)
      .join('');
    page.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.27</span></div>
      <h2>Temporal Physics — The Atrium</h2>
      <p>Time is frozen mid-volley. When the Operator commits to a cell, it <b>thaws</b>. Every bullet then drifts the way its <b>badge</b> says (the badge's colour <i>and</i> shape together). The Operator must stand in a cell that <u>no bullet reaches</u>.</p>
      <p><span class="stamp">VOLLEY ${ROMAN[v.round]} OF ${ROMAN[v.rounds - 1]}</span></p>
      <div class="mazewrap">
        <div style="flex:1;min-width:300px">
          <h3>Drift chart</h3>
          <table class="chart"><thead><tr><th>Badge</th><th>Drift</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        </div>
        <div>
          <h3>Scratch grid</h3>
          <p style="font-size:12.5px;margin-top:0">Cells are numbered like a phone keypad. Tap a cell to strike it off when a bullet lands there.</p>
          <div class="scratch">${cells}</div>
          <button class="scratch-reset">clear</button>
        </div>
      </div>

      <div class="rule">
        <b>How to read a bullet</b><br>
        1. Note the <b>cell</b> it hangs in (numbered like a phone keypad) and its <b>badge</b>: colour and shape.<br>
        2. Count the <b>pips</b> under the badge: <b>● = 1 step</b>, <b>●● = 2 steps</b>.<br>
        3. Move it that many steps in its colour's direction (chart below).<br>
        4. Anything that leaves the 3×3 field is harmless. Any cell nothing lands in is <b>safe</b>.<br>
        <i>Ignore the little brass bullet, its height and its angle. Frozen time lies.</i>
      </div>
      <p class="hand">Call each bullet like a roll-call: "Cell 4: cyan circle, two pips." Fewer words, more time. — A.K.</p>`;
    page.querySelectorAll('.scell').forEach((b) => {
      b.onclick = () => {
        marks[+b.dataset.i] = !marks[+b.dataset.i];
        render(cur);
      };
    });
    page.querySelector('.scratch-reset').onclick = () => {
      marks = Array(9).fill(false);
      render(cur);
    };
  }

  let cur = view;
  render(view);
  shell.setPages([{ id: 'physics', title: 'p.27  TEMPORAL PHYSICS', el: page }]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        marks = Array(9).fill(false);
        render(cur);
      }
    },
    dispose() {},
  };
}
