// Mentor — THE LOBBY: four cipher tables (one per sconce colour) and the clock rule.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export function create({ shell, view }) {
  const p1 = h('div');
  const p2 = h('div');

  function render(v) {
    const tables = v.tables
      .map(
        (t) => `
      <section class="tbl">
        <header><span class="swatch ${t.lamp}"></span>${t.lamp.toUpperCase()} SCONCE</header>
        <div class="cells5">
          ${t.glyphs.map((g, digit) => `<div class="cellg">${glyphSVG(g, { size: 42, stroke: 7 })}<b>${digit}</b></div>`).join('')}
        </div>
      </section>`
      )
      .join('');
    p1.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.1</span></div>
      <h2>Cipher Tables</h2>
      <p>The lobby doors speak in glyphs. The display above the door shows a row of them. Each glyph stands for one <b>digit</b> — but <b>which</b> digit depends on the colour of the wall sconce beside the door.</p>
      <p>Ask what colour the sconce is. Find its table. Look up each glyph the Operator describes and read the digits back in order.</p>
      <p><span class="stamp">DOOR ${ROMAN[v.stage]} OF ${ROMAN[v.stageCount - 1]}</span></p>
      <div class="tables">${tables}</div>
      <p class="hand">"Don't say 'the squiggly one'. Say what it's made of." — A.K.</p>`;

    p2.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.2</span></div>
      <h2>The Clock Rule</h2>
      <p><b>Door I</b> has no clock. Digits are entered in the order the glyphs appear: <b>left to right</b>.</p>
      <div class="rule"><b>Doors II and III</b> have a digital wall clock beside the keypad. Look <u>only at the minutes</u> (the two digits after the colon).<br><br>
      • <b>EVEN</b> minutes → enter the digits <b>left to right</b>.<br>
      • <b>ODD</b> minutes → enter the digits <b>right to left</b>.</div>
      <h3>Worked example</h3>
      <p>Clock reads <b>07:42</b>. Minutes are 42 — even. The display shows three glyphs that look up to <b>4, 1, 9</b>. Enter <b>4 1 9</b>.</p>
      <p>Same glyphs, clock reads <b>07:43</b>. Odd. Enter <b>9 1 4</b>.</p>
      <p class="hand">The Protocol knows the language. It has no eyes. Ask what the clock says — don't assume.</p>`;
  }

  render(view);
  shell.setPages([
    { id: 'tables', title: 'p.1  CIPHER TABLES', el: p1 },
    { id: 'clock', title: 'p.2  CLOCK RULE', el: p2 },
  ]);

  return {
    onFx(m) {
      if (m.view) render(m.view);
    },
    dispose() {},
  };
}
