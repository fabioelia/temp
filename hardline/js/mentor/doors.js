// Mentor — THE CORRIDOR: the location log and the glass watch.

import { glyphSVG } from '../../shared/glyphs.js';
import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const GLIMPSE_TEXT = {
  code: ['CODE', 'Green characters falling like rain'],
  fire: ['FIRE', 'Orange flames, flickering upward'],
  water: ['WATER', 'Blue water; rings rippling outward'],
  alarm: ['ALARM', 'Red light, pulsing and sweeping'],
  static: ['STATIC', 'Grey snow, like a dead television'],
  void: ['VOID', 'Pure black with a few faint specks'],
  glare: ['GLARE', 'Blinding white glow'],
};

export function create({ shell, view }) {
  const p1 = h('div');
  const p2 = h('div');

  function render(v) {
    const rows = v.verdicts
      .map((r) => `<div class="verdict-row">${glyphSVG(r.glyph, { size: 38, stroke: 7 })}<span class="vtag ${r.verdict}">${r.verdict}</span></div>`)
      .join('');
    p1.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.14</span></div>
      <h2>Location Log — The Corridor</h2>
      <p>Every door in the corridor looks the same. Each has a <b>glyph</b> etched faintly above it and a <b>porthole</b> showing what lies beyond.</p>
      <div class="rule"><b>A door is safe only if BOTH are true:</b><br>
      1. its glyph is marked <b>EXIT</b> in this log, and<br>
      2. its porthole glimpse is <b>CLEAR</b> (see the Glass Watch, next page).<br>
      Exactly one door in each row passes. Two doors may have an EXIT glyph — the glass tells them apart.</div>
      <p><span class="stamp">ROW ${ROMAN[v.stage]} OF ${ROMAN[v.stageCount - 1]}</span></p>
      <div class="logs">
        <div>
          <h3>Glyph verdicts</h3>
          <div class="vgrid">${rows}</div>
        </div>
        <div>
          <h3>What the verdicts mean</h3>
          <p><b>EXIT</b> — leads onward.</p>
          <p><b>TRAP</b> — the floor goes. Costs time.</p>
          <p><b>LOOP</b> — you wake at the start of the corridor. Costs time.</p>
          <p class="hand">If the Operator can't tell you the shape, ask for a part of it: "Is there a dot? A line? Is it closed?" — A.K.</p>
        </div>
      </div>`;

    const gl = v.glimpses
      .map((g) => {
        const [name, desc] = GLIMPSE_TEXT[g.id];
        return `<div class="glimpse-row"><b>${name}</b><span>${desc}</span><span class="flag ${g.flagged ? 'held' : 'clear'}">${g.flagged ? 'AGENT-HELD' : 'CLEAR'}</span></div>`;
      })
      .join('');
    p2.innerHTML = `
      <div class="folio"><span>RED PILL PROTOCOL</span><span>p.15</span></div>
      <h2>The Glass Watch</h2>
      <p>The Agents hold certain rooms and leave the rest alone. A porthole showing an <b>AGENT-HELD</b> glimpse means the door is watched — <u>even if its glyph says EXIT</u>. Never open it.</p>
      <div style="margin-top:12px">${gl}</div>
      <p class="hand">The glass doesn't lie. The paint on the door might.</p>`;
  }

  render(view);
  shell.setPages([
    { id: 'log', title: 'p.14  LOCATION LOG', el: p1 },
    { id: 'glass', title: 'p.15  GLASS WATCH', el: p2 },
  ]);

  return {
    onFx(m) {
      if (m.view) render(m.view);
    },
    dispose() {},
  };
}
