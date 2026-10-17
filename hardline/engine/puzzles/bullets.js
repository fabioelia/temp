// THE ATRIUM — bullet time.
//
// Operator: a frozen 3x3 field of bullets. Each bullet has a tracer colour and a
//           tracer length (short / long). Heights and angles are decoration.
// Mentor:   the physics rulebook: what each tracer colour does when time thaws.
//
// Rule: when the room thaws every bullet drifts in its colour's direction, one
// step for a short tracer, two for a long one. Anything leaving the field is
// harmless. The operator must dodge into a cell nothing lands in.

import { PENALTY_MS } from '../../shared/rooms.js';

export const COLORS = ['red', 'cyan', 'yellow', 'magenta', 'white'];
export const VECTORS = [
  { id: 'left', dx: -1, dy: 0 },
  { id: 'right', dx: 1, dy: 0 },
  { id: 'up', dx: 0, dy: -1 },
  { id: 'down', dx: 0, dy: 1 },
  { id: 'upleft', dx: -1, dy: -1 },
  { id: 'upright', dx: 1, dy: -1 },
  { id: 'downleft', dx: -1, dy: 1 },
  { id: 'downright', dx: 1, dy: 1 },
  { id: 'stay', dx: 0, dy: 0 },
];
const FREE_COUNTS = [3, 2, 1];
const DECOYS = [1, 1, 1];
const ROUNDS = FREE_COUNTS.length;

function landing(state, b) {
  const v = state.chart[b.color];
  return { col: b.col + v.dx * b.len, row: b.row + v.dy * b.len };
}

function inField(p) {
  return p.col >= 0 && p.col <= 2 && p.row >= 0 && p.row <= 2;
}

function safeCells(state) {
  const hit = new Set(state.landing.filter(inField).map((p) => `${p.col},${p.row}`));
  const out = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) if (!hit.has(`${col},${row}`)) out.push({ col, row });
  return out;
}

// Rounds are built backwards: choose the free cell(s), then place a bullet whose
// landing covers every other cell, then add decoys that fly off the field or pile
// onto an already-covered cell. That makes the number of safe cells exact.
function buildRound(state, rng) {
  const freeCount = FREE_COUNTS[state.round];
  const cellIds = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let attempt = 0; attempt < 500; attempt++) {
    const free = rng.sample(cellIds, freeCount);
    const targets = rng.shuffle(cellIds.filter((c) => !free.includes(c)));
    const used = new Set();
    const bullets = [];

    const place = (i) => {
      if (i === targets.length) return true;
      const tc = targets[i] % 3;
      const tr = Math.floor(targets[i] / 3);
      const options = rng.shuffle(COLORS.flatMap((color) => [1, 2].map((len) => ({ color, len }))));
      for (const o of options) {
        const v = state.chart[o.color];
        const col = tc - v.dx * o.len;
        const row = tr - v.dy * o.len;
        if (col < 0 || col > 2 || row < 0 || row > 2 || used.has(row * 3 + col)) continue;
        used.add(row * 3 + col);
        bullets.push({ col, row, color: o.color, len: o.len });
        if (place(i + 1)) return true;
        used.delete(row * 3 + col);
        bullets.pop();
      }
      return false;
    };
    if (!place(0)) continue;

    for (let d = 0; d < DECOYS[state.round]; d++) {
      const spare = rng.shuffle(cellIds.filter((c) => !used.has(c)));
      for (const s of spare) {
        const options = rng.shuffle(COLORS.flatMap((color) => [1, 2].map((len) => ({ color, len }))));
        const o = options.find((opt) => {
          const b = { col: s % 3, row: Math.floor(s / 3), ...opt };
          const p = landing(state, b);
          return !inField(p) || !free.includes(p.row * 3 + p.col);
        });
        if (o) {
          used.add(s);
          bullets.push({ col: s % 3, row: Math.floor(s / 3), ...o });
          break;
        }
      }
    }
    if (new Set(bullets.map((b) => b.color)).size < 3) continue;

    state.bullets = rng.shuffle(bullets);
    state.landing = state.bullets.map((b) => landing(state, b));
    if (safeCells(state).length !== freeCount) continue;
    state.tried = [];
    return { round: state.round, rounds: ROUNDS, bullets: state.bullets.map((b) => ({ ...b })) };
  }
  throw new Error('bullets: could not generate round');
}

function mentorView(state) {
  return {
    round: state.round,
    rounds: ROUNDS,
    chart: COLORS.map((color) => ({ color, vector: state.chart[color].id })),
  };
}

export default {
  id: 'bullets',
  create(rng) {
    const vecs = rng.sample(VECTORS, COLORS.length);
    const chart = {};
    COLORS.forEach((c, i) => (chart[c] = vecs[i]));
    const state = { round: 0, chart, bullets: [], landing: [], tried: [] };
    const operator = buildRound(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  resync(state) {
    return { operator: { tried: state.tried.map((t) => ({ ...t })) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'dodge') return null;
    const { col, row } = action;
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || col > 2 || row < 0 || row > 2) return null;
    if (state.tried.some((t) => t.col === col && t.row === row)) return null;

    const reveal = state.landing.map((p, i) => ({ i, col: p.col, row: p.row, inField: inField(p) }));
    const safe = safeCells(state).some((c) => c.col === col && c.row === row);

    if (!safe) {
      state.tried.push({ col, row });
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { col, row, reveal, hit: true } } };
    }
    state.round += 1;
    if (state.round >= ROUNDS) {
      return { result: 'solved', events: { operator: { col, row, reveal, hit: false } } };
    }
    const operator = buildRound(state, rng);
    return {
      result: 'stage',
      events: { operator: { col, row, reveal, hit: false } },
      views: { operator, mentor: mentorView(state) },
    };
  },
};
