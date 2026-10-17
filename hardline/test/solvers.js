// Oracle solvers. Each one plays a puzzle using ONLY the two role views — the same
// information two humans would have after talking to each other. If these can
// solve every seed, the rooms are solvable; if they needed anything else, the
// information split would be broken.

import { VECTORS } from '../engine/puzzles/bullets.js';

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

// ============================================================================ Deep Loop rooms

import { holds } from '../engine/puzzles/vault.js';
import { evaluate } from '../engine/puzzles/logic.js';
import { lineSolve } from '../engine/puzzles/mosaic.js';
import { compassBearing, fromReading } from '../engine/puzzles/triangulate.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** ECHO: the presses for the current sequence, given how many mistakes have been made so far. */
export function echoPresses({ operator, mentor, strikes = 0 }) {
  const level = Math.min(2, strikes);
  return operator.flashes.map((f) => {
    let p = mentor.table.find((r) => r.color === f.color).press[level];
    if (mentor.inverting.includes(f.glyph)) p = mentor.swap[p];
    return p;
  });
}

/** VAULT: every code (as glyphs) consistent with the clues and with what failed tries revealed. */
export function vaultCandidates({ operator, mentor, history = [] }) {
  const letters = LETTERS.slice(0, mentor.legend.length);
  const out = [];
  const rec = (acc, rest) => {
    if (acc.length === mentor.dials) return out.push(acc);
    rest.forEach((x, i) => rec([...acc, x], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], letters);
  const glyphOf = Object.fromEntries(mentor.legend.map((l) => [l.letter, l.glyph]));
  return out
    .filter((code) => mentor.clues.every((c) => holds(c, code)))
    .filter((code) => history.every((h) => code.filter((l, i) => glyphOf[l] === h.code[i]).length === h.bulls))
    .map((code) => code.map((l) => glyphOf[l]));
}

/** GRID: the operator-row lever indices to pull so that every node ends up safe. */
export function gridLevers({ operator, mentor }) {
  const n = mentor.levers.length;
  const litNodes = new Set(operator.nodes.filter((nd) => nd.lit).map((nd) => nd.glyph));
  for (let mask = 0; mask < 1 << n; mask++) {
    const lit = new Set(litNodes);
    mentor.levers.forEach((lv, i) => {
      if (mask & (1 << i)) for (const g of lv.flips) lit.has(g) ? lit.delete(g) : lit.add(g);
    });
    if (!lit.size) {
      const glyphs = mentor.levers.filter((_, i) => mask & (1 << i)).map((lv) => lv.glyph);
      return operator.levers.map((lv, i) => (glyphs.includes(lv.glyph) ? i : -1)).filter((i) => i >= 0);
    }
  }
  throw new Error('grid: no solution found');
}

/** TRIANGULATE: the map square that best explains the readings that are not flickering. */
export function triangulateCell({ operator, mentor }) {
  const pos = Object.fromEntries(mentor.beacons.map((b) => [b.glyph, b]));
  const real = operator.readings.filter((r) => !r.flicker);
  const scores = [];
  for (let y = 0; y < mentor.size; y++) {
    for (let x = 0; x < mentor.size; x++) {
      let err = 0;
      for (const r of real) {
        const b = pos[r.glyph];
        if (b.x === x && b.y === y) {
          err += 90;
          continue;
        }
        const want = compassBearing(b, { x, y });
        const got = fromReading(r.bearing, r.mode);
        err += Math.abs(((want - got + 540) % 360) - 180);
      }
      scores.push({ x, y, err });
    }
  }
  scores.sort((a, b) => a.err - b.err);
  return { best: scores[0], second: scores[1] };
}

/** LOGIC: a switch assignment that lights the lamp. */
export function logicSwitches({ operator, mentor }) {
  const typeOf = Object.fromEntries(mentor.table.map((t) => [t.glyph, t.type]));
  const circuit = { gates: operator.gates, output: operator.output };
  for (let m = 0; m < 1 << operator.switches; m++) {
    const sw = Array.from({ length: operator.switches }, (_, i) => !!(m & (1 << i)));
    if (evaluate(circuit, sw, (g) => typeOf[g.glyph])) return sw;
  }
  throw new Error('logic: no satisfying assignment');
}

/** MOSAIC: the grid, from the Operator's row clues and the Mentor's column clues together. */
export function mosaicGrid({ operator, mentor }) {
  const g = lineSolve(operator.rows, mentor.cols);
  if (!g) throw new Error('mosaic: not line-solvable');
  return g;
}

/**
 * The actions two players would send next in a Deep Loop room, using only their own views.
 * `strikes` is how many mistakes the room has seen (Echo's rules shift with it); `history` is the
 * feedback from failed Vault tries, [{ code, bulls }].
 */
export function deepActions(id, { operator, mentor }, { strikes = 0, history = [] } = {}) {
  switch (id) {
    case 'echo':
      return echoPresses({ operator, mentor, strikes }).map((pylon) => ({ type: 'press', pylon }));
    case 'vault':
      return [{ type: 'open', code: vaultCandidates({ operator, mentor, history })[0] }];
    case 'grid':
      return [{ type: 'engage', levers: gridLevers({ operator, mentor }) }];
    case 'triangulate': {
      const { best } = triangulateCell({ operator, mentor });
      return [{ type: 'locate', col: best.x, row: best.y }];
    }
    case 'logic':
      return [{ type: 'engage', switches: logicSwitches({ operator, mentor }) }];
    case 'mosaic':
      return [{ type: 'seal', grid: mosaicGrid({ operator, mentor }) }];
    default:
      throw new Error(`no stage solver for ${id}`);
  }
}

/**
 * Solve one whole stage of a Deep Loop room against the puzzle module. Returns the engine's reply
 * to the final (stage-clearing) action. Used by the seed stress test to walk every stage.
 */
export function solveDeepStage(id, puzzle, state, rng, views, strikes = 0) {
  const history = [];
  for (let tries = 0; tries < 6; tries++) {
    let res = null;
    let last = null;
    for (const action of deepActions(id, views, { strikes, history })) {
      last = action;
      res = puzzle.act(state, action, rng, { strikes });
    }
    if (res.result !== 'wrong') return res;
    history.push({ code: last.code, bulls: res.events.operator.bulls });
  }
  throw new Error(`${id}: not solved within six tries`);
}

export const DEEP_IDS = ['echo', 'vault', 'grid', 'triangulate', 'logic', 'mosaic'];
