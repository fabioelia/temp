// Mentor — THE LOGIC WALL: which glyph is which gate.
//
// The Operator can see the wiring but not what the gate chips MEAN. You hold the key, and it is
// re-rolled every attempt. The tool at the bottom checks one gate at a time; it never solves the wall.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III'];

const RULE = {
  AND: 'both inputs ON',
  OR: 'at least one input ON',
  XOR: 'exactly one input ON (they differ)',
  NAND: 'anything except both ON',
  NOR: 'both inputs OFF',
  XNOR: 'both the same (both ON or both OFF)',
};
const FN = {
  AND: (a, b) => a && b,
  OR: (a, b) => a || b,
  XOR: (a, b) => a !== b,
  NAND: (a, b) => !(a && b),
  NOR: (a, b) => !(a || b),
  XNOR: (a, b) => a === b,
};
const bit = (v) => (v ? '1' : '0');

export function create({ shell, view }) {
  const page = h('div');
  let cur = view;
  let pick = cur.table[0].type;
  let a = false;
  let b = false;

  function render() {
    const rows = cur.table
      .map(
        (t) => `<tr data-type="${t.type}" class="${t.type === pick ? 'pickrow' : ''}">
          <td><span class="ring">${glyphSVG(t.glyph, { size: 40, stroke: 8 })}</span></td>
          <td><b>${t.type}</b></td>
          <td>${RULE[t.type]}</td>
          <td class="tt">${[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => `<span class="${FN[t.type](!!x, !!y) ? 'one' : ''}">${bit(FN[t.type](!!x, !!y))}</span>`).join('')}</td>
        </tr>`
      )
      .join('');
    const out = FN[pick](a, b);
    const chosen = cur.table.find((t) => t.type === pick);
    page.innerHTML = `
      <div class="folio"><span>APPENDIX B — DEEP LOOP</span><span>B.4</span></div>
      <h2>The Logic Wall — gate key</h2>
      <p>The Operator stands at a wall of switches, gate chips and wires that ends in a single lamp. Every chip has a <b>letter</b> and a <b>glyph</b>. The glyph says what the gate <i>does</i> — and the Protocol re-rolls that every attempt, so notes from last time are worthless.</p>
      <p><span class="stamp">WALL ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span></p>
      <h3>1 · This attempt's key</h3>
      <table class="gtable keytable">
        <thead><tr><th>GLYPH</th><th>GATE</th><th>OUTPUT IS ON WHEN…</th><th title="inputs 00, 01, 10, 11">00 01 10 11</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="hand">The four digits on the right are the gate's answer for inputs 00, 01, 10, 11. — A.K.</p>
      <h3>2 · How to crack a wall</h3>
      <ol class="steps">
        <li>Have the Operator read each chip: <b>its letter, its glyph, and what feeds it</b> (a switch number or another gate's letter).</li>
        <li>Write each gate down in your Notes as <i>"C = XOR of A and switch 4"</i>.</li>
        <li><b>Work backwards from the lamp.</b> The lamp must be ON, so ask what its last gate needs from its two inputs, then what <i>those</i> need, until you reach switches.</li>
        <li>Give the Operator a list of switches to throw: <i>"1 up, 2 down, 3 down, 4 up"</i>. They press ENGAGE. A wrong test is a strike — and tells them nothing.</li>
      </ol>
      <h3>3 · Check one gate</h3>
      <p>Pick a row above, then set its two inputs:</p>
      <div class="calc">
        <b>${pick}</b>
        <button class="tog ${a ? 'on' : ''}" data-in="a">A = ${bit(a)}</button>
        <button class="tog ${b ? 'on' : ''}" data-in="b">B = ${bit(b)}</button>
        <span class="arrow">➜</span>
        <span class="res ${out ? 'on' : ''}">${bit(out)}</span>
        <span class="ring sm">${glyphSVG(chosen.glyph, { size: 28, stroke: 9 })}</span>
      </div>`;
    page.querySelectorAll('tr[data-type]').forEach((el) => (el.onclick = () => ((pick = el.dataset.type), render())));
    page.querySelectorAll('[data-in]').forEach(
      (el) =>
        (el.onclick = () => {
          if (el.dataset.in === 'a') a = !a;
          else b = !b;
          render();
        })
    );
  }

  render();
  shell.setPages([{ id: 'key', title: 'B.4  GATE KEY', el: page }]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        render();
      }
    },
    dispose() {},
  };
}
