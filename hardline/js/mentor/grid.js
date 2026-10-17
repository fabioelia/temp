// Mentor — THE SUBSTATION: the wiring schematic, with a what-if tool.
//
// Tap the nodes the Operator says are OVERLOADED. Then tap levers to build a plan and watch what
// it would do to those nodes. The tool never picks levers for you.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III'];

export function create({ shell, view }) {
  const page = h('div');
  let cur = view;
  let reported = new Set(); // node glyphs the Operator says are lit
  let plan = new Set(); // lever glyphs in the what-if plan

  function litAfterPlan() {
    const lit = new Set(reported);
    for (const lv of cur.levers) if (plan.has(lv.glyph)) for (const g of lv.flips) lit.has(g) ? lit.delete(g) : lit.add(g);
    return lit;
  }

  function render() {
    const lit = litAfterPlan();
    const safe = reported.size > 0 && lit.size === 0;
    const nodeChips = cur.nodes
      .map((g) => `<button class="nchip ${reported.has(g) ? 'rep' : ''} ${lit.has(g) ? 'lit' : ''}" data-node="${g}" aria-label="node" title="Tap if the Operator says this node is overloaded"><span class="ring">${glyphSVG(g, { size: 40, stroke: 8 })}</span></button>`)
      .join('');
    const levers = cur.levers
      .map(
        (lv) => `<div class="lrow ${plan.has(lv.glyph) ? 'on' : ''}" data-lever="${lv.glyph}">
          <span class="lbox">${glyphSVG(lv.glyph, { size: 38, stroke: 8 })}</span>
          <span class="arrow">flips ➜</span>
          <span class="flips">${lv.flips.map((g) => `<span class="ring sm">${glyphSVG(g, { size: 28, stroke: 9 })}</span>`).join('')}</span>
          <span class="pull">${plan.has(lv.glyph) ? 'PULL' : ''}</span>
        </div>`
      )
      .join('');
    page.innerHTML = `
      <div class="folio"><span>APPENDIX B — DEEP LOOP</span><span>B.2</span></div>
      <h2>The Substation — wiring schematic</h2>
      <p>Every lever flips <b>several</b> nodes at once (a lit node goes safe, a safe node overloads). The Operator can't see what a lever does — only you can. Find a set of levers that leaves <b>every node safe</b>, then tell them which to pull.</p>
      <p><span class="stamp">GRID ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span> &nbsp; <b>Hint:</b> start with a node that only one lever can reach.</p>
      <h3>1 · Overloaded nodes <small>(tap what the Operator reports)</small></h3>
      <div class="nodes">${nodeChips}</div>
      <h3>2 · Levers <small>(tap to add to your what-if plan)</small></h3>
      <div class="lrows">${levers}</div>
      <div class="verdict ${safe ? 'ok' : ''}">${reported.size === 0 ? 'Mark the overloaded nodes first.' : safe ? '✔ ALL NODES SAFE with this plan — read the highlighted levers to the Operator.' : `${lit.size} node${lit.size === 1 ? '' : 's'} still overloaded under this plan.`}</div>
      <p class="hand">Red ring = overloaded now. The plan resets when the board changes. — A.K.</p>`;
    page.querySelectorAll('[data-node]').forEach((el) => (el.onclick = () => toggle(reported, el.dataset.node)));
    page.querySelectorAll('[data-lever]').forEach((el) => (el.onclick = () => toggle(plan, el.dataset.lever)));
  }
  function toggle(set, v) {
    set.has(v) ? set.delete(v) : set.add(v);
    render();
  }

  render();
  shell.setPages([{ id: 'schematic', title: 'B.2  SCHEMATIC', el: page }]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        reported = new Set();
        plan = new Set();
        render();
      }
    },
    dispose() {},
  };
}
