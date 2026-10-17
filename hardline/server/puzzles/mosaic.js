// THE MOSAIC — a picture, with its clues split between the two of you.
//
// Operator: a wall of blank tiles and the ROW clues (the runs of filled tiles in each row).
// Mentor:   the COLUMN clues, and a scratch grid.
//
// Neither half can be solved alone. Read your numbers aloud, work out the picture together, and
// fill it in. Every picture is solvable by pure line logic (no guessing), so there is always a
// next certain move.

import { PENALTY_MS } from '../../shared/rooms.js';

const SIZES = [5, 6, 7];

/** Run-length clue for a line of 0/1. */
export function clueOf(line) {
  const out = [];
  let run = 0;
  for (const c of line) {
    if (c) run++;
    else if (run) (out.push(run), (run = 0));
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}

/** Every 0/1 line of length n matching a clue and consistent with the known cells (1, -1, or 0 = unknown). */
function arrangements(clue, n, known) {
  const runs = clue[0] === 0 ? [] : clue;
  const res = [];
  const line = Array(n).fill(0);
  const place = (ri, pos) => {
    if (ri === runs.length) {
      for (let i = pos; i < n; i++) line[i] = 0;
      if (known.every((k, i) => k === 0 || (k === 1) === !!line[i])) res.push(line.slice());
      return;
    }
    const rest = runs.slice(ri + 1).reduce((a, b) => a + b + 1, 0);
    for (let start = pos; start + runs[ri] + rest <= n; start++) {
      for (let i = pos; i < start; i++) line[i] = 0;
      for (let i = start; i < start + runs[ri]; i++) line[i] = 1;
      let next = start + runs[ri];
      if (ri < runs.length - 1) line[next++] = 0;
      place(ri + 1, next);
    }
  };
  place(0, 0);
  return res;
}

/** Solve by line logic alone. Returns the grid if it is fully determined, else null. */
export function lineSolve(rows, cols) {
  const n = rows.length;
  const g = Array.from({ length: n }, () => Array(n).fill(0));
  for (let pass = 0; pass < 60; pass++) {
    let changed = false;
    const refine = (clue, getKnown, set) => {
      const arr = arrangements(clue, n, getKnown());
      if (!arr.length) return false;
      for (let i = 0; i < n; i++) {
        const v = arr[0][i];
        if (arr.every((a) => a[i] === v)) {
          const cur = getKnown()[i];
          if (cur === 0) {
            set(i, v ? 1 : -1);
            changed = true;
          }
        }
      }
      return true;
    };
    for (let r = 0; r < n; r++) if (!refine(rows[r], () => g[r].slice(), (i, v) => (g[r][i] = v))) return null;
    for (let c = 0; c < n; c++) if (!refine(cols[c], () => g.map((row) => row[c]), (i, v) => (g[i][c] = v))) return null;
    if (!changed) break;
  }
  return g.every((row) => row.every((v) => v !== 0)) ? g.map((row) => row.map((v) => (v === 1 ? 1 : 0))) : null;
}

function buildStage(state, rng) {
  const n = SIZES[state.stage];
  for (let attempt = 0; attempt < 4000; attempt++) {
    const density = 0.5 + rng.next() * 0.12;
    const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng.next() < density ? 1 : 0)));
    const rows = grid.map(clueOf);
    const cols = Array.from({ length: n }, (_, c) => clueOf(grid.map((row) => row[c])));
    // no empty lines, and a picture with a bit of structure
    if (rows.some((r) => r[0] === 0) || cols.some((c) => c[0] === 0)) continue;
    if (grid.flat().filter(Boolean).length < Math.floor(n * n * 0.42)) continue;
    const solved = lineSolve(rows, cols);
    if (!solved) continue;
    if (JSON.stringify(solved) !== JSON.stringify(grid)) continue; // (line-solvable means unique, so this holds)
    state.grid = grid;
    state.n = n;
    return { stage: state.stage, stageCount: SIZES.length, size: n, rows, cols, rowsOnly: rows };
  }
  throw new Error('mosaic: could not build a stage');
}

function views(state, full) {
  return {
    operator: { stage: state.stage, stageCount: SIZES.length, size: state.n, rows: full.rows },
    mentor: { stage: state.stage, stageCount: SIZES.length, size: state.n, cols: full.cols },
  };
}

export default {
  id: 'mosaic',
  create(rng) {
    const state = { stage: 0 };
    const full = buildStage(state, rng);
    const v = views(state, full);
    return { state, views: v };
  },

  act(state, action, rng) {
    if (action?.type !== 'seal' || !Array.isArray(action.grid) || action.grid.length !== state.n) return null;
    if (!action.grid.every((row) => Array.isArray(row) && row.length === state.n)) return null;
    const ok = action.grid.every((row, r) => row.every((v, c) => (v ? 1 : 0) === state.grid[r][c]));
    if (!ok) return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: {} } };
    state.stage += 1;
    if (state.stage >= SIZES.length) return { result: 'solved' };
    const full = buildStage(state, rng);
    const v = views(state, full);
    return { result: 'stage', views: v };
  },
};
