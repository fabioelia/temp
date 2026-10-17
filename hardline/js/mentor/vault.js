// Mentor — THE VAULT: the legend (glyph <-> letter) and the clues about the code.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III'];

export function create({ shell, view }) {
  const legendPage = h('div');
  const cluesPage = h('div');
  let cur = view;
  const struck = new Set();

  function render() {
    const cells = cur.legend
      .map((l) => `<div class="cellg letter">${glyphSVG(l.glyph, { size: 58, stroke: 7 })}<b>${l.letter}</b></div>`)
      .join('');
    legendPage.innerHTML = `
      <div class="folio"><span>APPENDIX A — DEEP LOOP</span><span>A.4</span></div>
      <h2>The Vault — the legend</h2>
      <p>The vault's dials show <b>glyphs</b>, but every clue is written in <b>letters</b>. This table turns one into the other. The Operator has the same ${cur.legend.length} glyphs printed on the keypad ring, <u>in a different order</u>: describe the pictures to find which is which.</p>
      <p><span class="stamp">VAULT ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span> &nbsp; <b>${cur.dials} dials · ${cur.legend.length} symbols · no symbol is used twice</b></p>
      <div class="cells${cur.legend.length > 5 ? '6' : '5'}">${cells}</div>
      <div class="rule"><b>How a try works</b><br>The Operator sets every dial and pulls the lever. If it's wrong, the vault shows <b>how many dials were in the right place</b> — and it costs a strike. The clues leave only a few possible codes; the feedback finishes the job.</div>
      <p class="hand">Narrow it down BEFORE anyone touches the lever. Every try costs 15 seconds.</p>`;

    const items = cur.clues
      .map((c, i) => `<li class="clue ${struck.has(i) ? 'done' : ''}" data-i="${i}"><span class="n">${i + 1}</span><span class="t">${c.text}</span></li>`)
      .join('');
    cluesPage.innerHTML = `
      <div class="folio"><span>APPENDIX A — DEEP LOOP</span><span>A.5</span></div>
      <h2>Clues about the code</h2>
      <p>All of these are <b>true</b>. Tap a clue to cross it off once you've used it. Dials are numbered <b>left to right</b>; letters run A, B, C… (so "earlier in the alphabet" means closer to A).</p>
      <ol class="clues">${items}</ol>
      <p class="hand">Write down the codes that survive, and tell the Operator the best one first. If it's wrong, the number of dials they got right will cut your list further. — A.K.</p>`;
    cluesPage.querySelectorAll('.clue').forEach((el) => {
      el.onclick = () => {
        const i = Number(el.dataset.i);
        struck.has(i) ? struck.delete(i) : struck.add(i);
        el.classList.toggle('done');
      };
    });
  }

  render();
  shell.setPages([
    { id: 'legend', title: 'A.4  LEGEND', el: legendPage },
    { id: 'clues', title: 'A.5  CLUES', el: cluesPage },
  ]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        struck.clear();
        render();
      }
    },
    dispose() {},
  };
}
