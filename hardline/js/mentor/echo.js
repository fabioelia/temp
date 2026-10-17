// Mentor — THE ECHO CHAMBER: the Chamber's grammar, which shifts as the room's mistakes climb.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const NAME = { red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW' };
const ROMAN = ['I', 'II', 'III'];
const sw = (c) => `<span class="swatch ${c}"></span>`;

export function create({ shell, view }) {
  const p1 = h('div');
  const p2 = h('div');
  let cur = view;
  let strikes = window.__hl?.app?.strikes ?? 0;

  function render() {
    const col = Math.min(2, strikes);
    const rows = cur.table
      .map(
        (r) => `<tr><td class="flash">${sw(r.color)} <b>${NAME[r.color]}</b></td>${r.press
          .map((p, i) => `<td class="cell ${i === col ? 'cur' : ''}">${sw(p)} ${NAME[p]}</td>`)
          .join('')}</tr>`
      )
      .join('');
    const example = cur.table[0];
    const exPress = example.press[col];
    const exSwap = cur.swap[exPress];
    p1.innerHTML = `
      <div class="folio"><span>APPENDIX A — DEEP LOOP</span><span>A.1</span></div>
      <h2>The Echo Chamber — the grammar</h2>
      <p>The monitor flashes a sequence. Each flash has a <b>colour</b> and a <b>glyph</b>. The Operator must press the pylons in the order the <i>grammar</i> says — not the order of the colours they saw.</p>
      <p><span class="stamp">SEQUENCE ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span> &nbsp; <b>Mistakes so far: ${strikes}</b></p>
      <div class="rule"><b>How to read a flash</b><br>
      1. Take the flash's <b>colour</b>. Find its row below.<br>
      2. Read across to the column for the room's <b>current mistake count</b> (highlighted). That's the pylon to press.<br>
      3. Check the flash's <b>glyph</b> on the next page. If it's an <b>inverting glyph</b>, swap the pylon for its partner.<br>
      <b>If the Operator slips, the column changes. Re-read the whole sequence from the new column.</b></div>
      <table class="gtable"><thead><tr><th>FLASH COLOUR</th><th class="${col === 0 ? 'cur' : ''}">0 MISTAKES</th><th class="${col === 1 ? 'cur' : ''}">1 MISTAKE</th><th class="${col === 2 ? 'cur' : ''}">2 OR MORE</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="hand">Say the pylons out loud in order, then wait for them to finish before you read the next. — A.K.</p>`;

    p2.innerHTML = `
      <div class="folio"><span>APPENDIX A — DEEP LOOP</span><span>A.2</span></div>
      <h2>Inverting glyphs</h2>
      <p>These three glyphs <b>invert</b> a flash. When one appears (anywhere on the monitor), swap the pylon you'd have pressed for its partner:</p>
      <div class="rule"><b>${sw('red')} RED ⇄ ${sw('blue')} BLUE &nbsp;&nbsp;&nbsp; ${sw('green')} GREEN ⇄ ${sw('yellow')} YELLOW</b></div>
      <div class="glyphrow">${cur.inverting.map((g) => `<div class="cellg">${glyphSVG(g, { size: 70, stroke: 7 })}</div>`).join('')}</div>
      <p>Any other glyph is plain — press whatever the table says.</p>
      <h3>Worked example (with the current mistake count)</h3>
      <p>A <b>${NAME[example.color]}</b> flash with a plain glyph → press <b>${NAME[exPress]}</b>. The same flash with an inverting glyph → press <b>${NAME[exSwap]}</b>.</p>
      <p class="hand">The glyph is easy to miss in the flash. Ask the Operator to replay it and describe each one.</p>`;
  }

  render();
  shell.setPages([
    { id: 'grammar', title: 'A.1  THE GRAMMAR', el: p1 },
    { id: 'invert', title: 'A.2  INVERTING GLYPHS', el: p2 },
  ]);

  return {
    onGo(m) {
      strikes = m.strikes ?? 0;
      render();
    },
    onFx(m) {
      if (m.strikes !== undefined) strikes = m.strikes;
      if (m.view) cur = m.view;
      render();
    },
    dispose() {},
  };
}
