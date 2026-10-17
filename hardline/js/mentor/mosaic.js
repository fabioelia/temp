// Mentor — THE MOSAIC: the column clues, and a scratch grid.
//
// The Operator can see the wall of tiles and the ROW clues; you hold the COLUMN clues. Neither half
// can be solved alone. Type the row clues the Operator reads out, then fill your scratch grid until
// every row and column ticks green — and read the picture back to them.

import { h } from './shell.js';

const ROMAN = ['I', 'II', 'III'];
const SYMBOL = ['', '■', '×'];

/** Run-length clue of a line of cells (filled = 1). */
function runs(cells) {
  const out = [];
  let run = 0;
  for (const c of cells) {
    if (c === 1) run++;
    else if (run) (out.push(run), (run = 0));
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const parse = (text) => (String(text).match(/\d+/g) ?? []).map(Number);

export function create({ shell, view }) {
  const page = h('div');
  let cur = view;
  let grid = blank(cur.size);
  let rowText = Array(cur.size).fill('');

  function blank(n) {
    return Array.from({ length: n }, () => Array(n).fill(0));
  }

  function render() {
    const n = cur.size;
    const colOk = cur.cols.map((clue, c) => same(runs(grid.map((row) => row[c])), clue));
    const rowOk = grid.map((row, r) => {
      const typed = parse(rowText[r]);
      return typed.length > 0 && same(runs(row), typed);
    });
    const head = cur.cols
      .map((clue, c) => `<div class="mclue col ${colOk[c] ? 'ok' : ''}">${clue.map((x) => `<span>${x}</span>`).join('')}</div>`)
      .join('');
    const rows = grid
      .map(
        (row, r) => `<div class="mrow">
          <label class="mclue rowin ${rowOk[r] ? 'ok' : ''}"><input data-row="${r}" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="row ${r + 1}" value="${rowText[r]}" aria-label="Row ${r + 1} clue"></label>
          ${row.map((v, c) => `<button class="mcell s${v}" data-r="${r}" data-c="${c}" aria-label="Row ${r + 1}, column ${c + 1}">${SYMBOL[v]}</button>`).join('')}
        </div>`
      )
      .join('');
    const typedAll = rowText.every((t) => parse(t).length > 0);
    const done = typedAll && rowOk.every(Boolean) && colOk.every(Boolean);
    page.innerHTML = `
      <div class="folio"><span>APPENDIX B — DEEP LOOP</span><span>B.6</span></div>
      <h2>The Mosaic — column clues</h2>
      <p>The wall is a picture made of ${n}×${n} tiles. A clue lists the <b>runs of filled tiles</b> in its line, in order: <b>3 1</b> means a run of three, a gap, then a single one. You have the <b>columns</b>; the Operator has the <b>rows</b>. Always solvable by logic — there is never a coin flip.</p>
      <p><span class="stamp">WALL ${ROMAN[cur.stage]} OF ${ROMAN[cur.stageCount - 1]}</span></p>
      <h3>1 · Scratch grid <small>(tap a cell: ■ filled → × empty → blank)</small></h3>
      <div class="mosaic" style="--n:${n}">
        <div class="mrow headrow"><span class="corner">↓ cols · rows →</span>${head}</div>
        ${rows}
      </div>
      <div class="verdict ${done ? 'ok' : ''}">${done ? '✔ Every row and column matches. Read the filled tiles to the Operator, row by row.' : 'Type each row clue the Operator reads out. A line turns green when your grid agrees with its clue.'}</div>
      <h3>Tricks of the trade</h3>
      <ul class="tips">
        <li><b>Overlap.</b> A clue of <b>5</b> in a line of <b>6</b> can slide one place either way — so the middle <b>4</b> are <i>certainly</i> filled. The bigger the clue, the more it pins down.</li>
        <li><b>Full lines.</b> A clue whose runs plus the gaps between them exactly fill the line (like <b>2 1 2</b> in 7) has only one arrangement.</li>
        <li><b>Mark empties with ×.</b> Knowing a tile is empty is as useful as knowing it is filled — it stops runs growing.</li>
        <li>Swap what you've worked out with the Operator: <i>"column 3 definitely has rows 2 and 3 filled"</i>.</li>
      </ul>
      <p class="hand">The Operator's wall only checks one thing: does the picture match. — A.K.</p>`;
    page.querySelectorAll('.mcell').forEach(
      (el) =>
        (el.onclick = () => {
          const r = Number(el.dataset.r);
          const c = Number(el.dataset.c);
          grid[r][c] = (grid[r][c] + 1) % 3;
          render();
        })
    );
    page.querySelectorAll('input[data-row]').forEach((el) => {
      el.oninput = () => {
        rowText[Number(el.dataset.row)] = el.value;
        const pos = el.selectionStart;
        const idx = el.dataset.row;
        render();
        const next = page.querySelector(`input[data-row="${idx}"]`);
        next?.focus();
        next?.setSelectionRange(pos, pos);
      };
    });
  }

  render();
  shell.setPages([{ id: 'cols', title: 'B.6  COLUMN CLUES', el: page }]);

  return {
    onFx(m) {
      if (m.view) {
        cur = m.view;
        grid = blank(cur.size);
        rowText = Array(cur.size).fill('');
        render();
      }
    },
    dispose() {},
  };
}
