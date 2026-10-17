// Oracle solvers. Each one plays a puzzle using ONLY the two role views — the same
// information two humans would have after talking to each other. If these can
// solve every seed, the rooms are solvable; if they needed anything else, the
// information split would be broken.

import { VECTORS } from '../server/puzzles/bullets.js';

const vec = Object.fromEntries(VECTORS.map((v) => [v.id, v]));

export function bulletCells(operator, mentor) {
  const chart = Object.fromEntries(mentor.chart.map((c) => [c.color, vec[c.vector]]));
  const hit = new Set();
  for (const b of operator.bullets) {
    const v = chart[b.color];
    hit.add(`${b.col + v.dx * b.len},${b.row + v.dy * b.len}`);
  }
  const safe = [];
  const unsafe = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) (hit.has(`${col},${row}`) ? unsafe : safe).push({ col, row });
  return { safe, unsafe };
}

export const solvers = {
  cipher({ operator, mentor }) {
    const table = mentor.tables.find((t) => t.lamp === operator.lamp).glyphs;
    let digits = operator.glyphs.map((g) => table.indexOf(g));
    if (operator.clock && Number(operator.clock.slice(3)) % 2 === 1) digits = digits.reverse();
    return { type: 'submit', code: digits.join('') };
  },

  doors({ operator, mentor }) {
    const verdict = Object.fromEntries(mentor.verdicts.map((v) => [v.glyph, v.verdict]));
    const flagged = new Set(mentor.glimpses.filter((g) => g.flagged).map((g) => g.id));
    const door = operator.doors.findIndex((d) => verdict[d.glyph] === 'EXIT' && !flagged.has(d.glimpse));
    return { type: 'open', door };
  },

  bullets({ operator, mentor }) {
    const { safe } = bulletCells(operator, mentor);
    return { type: 'dodge', col: safe[0].col, row: safe[0].row };
  },

  switchboard({ operator, mentor }) {
    // pick the first cable we haven't plugged (tracked by caller through `done`)
    const done = operator.__done ?? new Set();
    const cable = operator.cables.find((c) => !done.has(c));
    const li = mentor.left.indexOf(cable);
    const glyph = mentor.right[mentor.links.find(([l]) => l === li)[1]];
    return { type: 'plug', cable, jack: operator.jacks.indexOf(glyph), __cable: cable };
  },
};

// --- maze: localise from the operator's patch, then route on the mentor's map ---

const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const dirIdx = { n: 0, e: 1, s: 2, w: 3 };

function matchCell(a, b) {
  return a && b && a.g === b.g && a.w === b.w && a.trap === b.trap && a.exit === b.exit;
}

export function localise(opView, mentor) {
  const at = (x, y) => mentor.cells.find((c) => c.x === x && c.y === y);
  const centre = opView.cells.find((c) => c.x === opView.pos.x && c.y === opView.pos.y);
  const out = [];
  for (const cand of mentor.cells) {
    let ok = true;
    for (const c of opView.cells) {
      const rel = { dx: c.x - opView.pos.x, dy: c.y - opView.pos.y };
      if (!matchCell(c, at(cand.x + rel.dx, cand.y + rel.dy))) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(cand);
  }
  return { centre, candidates: out };
}

export function mazeRoute(mentor, from) {
  const key = (x, y) => y * mentor.size + x;
  const at = (x, y) => mentor.cells[key(x, y)];
  const exit = mentor.cells.find((c) => c.exit);
  const prev = new Map([[key(from.x, from.y), null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur.x === exit.x && cur.y === exit.y) break;
    for (const [d, [dx, dy]] of Object.entries(DIRS)) {
      const c = at(cur.x, cur.y);
      if (c.w[dirIdx[d]] === '1') continue;
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= mentor.size || ny >= mentor.size) continue;
      if (prev.has(key(nx, ny)) || at(nx, ny).trap) continue;
      prev.set(key(nx, ny), { from: cur, dir: d });
      q.push({ x: nx, y: ny });
    }
  }
  const dirs = [];
  let cur = { x: exit.x, y: exit.y };
  while (prev.get(key(cur.x, cur.y))) {
    const p = prev.get(key(cur.x, cur.y));
    dirs.unshift(p.dir);
    cur = p.from;
  }
  return dirs;
}
