// THE SUBSTATION — a hidden wiring matrix.
//
// Operator: a row of transformer nodes (each stamped with a glyph), some of them OVERLOADED
//           (lit). Below them, a bank of levers (each stamped with a different glyph). Nothing
//           shows what a lever does: the grid only recalculates when you press ENGAGE, and a
//           wrong engage costs a strike without telling you anything.
// Mentor:   the wiring schematic: for each lever, which nodes it flips.
//
// Pull a set of levers so every node ends up safe. The wiring is triangular under the hood
// (there's always a node only one lever can reach) so it can be worked out by hand.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

const SIZES = [5, 6, 7];

function buildStage(state, rng) {
  const n = SIZES[state.stage];
  const glyphs = rng.sample(GLYPH_IDS, n * 2);
  const nodeGlyph = glyphs.slice(0, n);
  const leverGlyph = glyphs.slice(n);

  // lever i flips node i, plus one or two nodes further along: upper-triangular, so invertible
  const flips = Array.from({ length: n }, (_, i) => {
    const later = [];
    for (let j = i + 1; j < n; j++) later.push(j);
    const extra = later.length ? rng.sample(later, Math.min(later.length, rng.chance(0.5) ? 1 : 2)) : [];
    return [i, ...extra].sort((a, b) => a - b);
  });

  // choose the levers that need pulling, and light exactly the nodes they would flip
  for (let attempt = 0; attempt < 200; attempt++) {
    const pull = flips.map(() => rng.chance(0.55));
    const lit = Array(n).fill(false);
    pull.forEach((p, i) => p && flips[i].forEach((j) => (lit[j] = !lit[j])));
    const count = lit.filter(Boolean).length;
    if (count < 3 || count > n - 1) continue;

    // how the Operator sees it: nodes and levers laid out in unrelated random orders
    const nodeOrder = rng.shuffle([...Array(n).keys()]);
    const leverOrder = rng.shuffle([...Array(n).keys()]);
    state.flips = flips;
    state.lit = lit;
    state.pull = pull;
    state.leverOrder = leverOrder;
    state.nodeOrder = nodeOrder;
    state.leverGlyph = leverGlyph;
    state.nodeGlyph = nodeGlyph;
    return {
      stage: state.stage,
      stageCount: SIZES.length,
      nodes: nodeOrder.map((j) => ({ glyph: nodeGlyph[j], lit: lit[j] })),
      levers: leverOrder.map((i) => ({ glyph: leverGlyph[i] })),
    };
  }
  throw new Error('grid: could not generate a stage');
}

function mentorView(state) {
  const n = state.flips.length;
  // list levers in a third order, so neither the Operator's layout nor the wiring order leaks
  const order = state.leverOrder.slice().reverse();
  return {
    stage: state.stage,
    stageCount: SIZES.length,
    levers: order.map((i) => ({ glyph: state.leverGlyph[i], flips: state.flips[i].map((j) => state.nodeGlyph[j]) })),
    nodes: state.nodeOrder.slice().reverse().map((j) => state.nodeGlyph[j]),
    size: n,
  };
}

export default {
  id: 'grid',
  create(rng) {
    const state = { stage: 0 };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'engage' || !Array.isArray(action.levers)) return null;
    const n = state.flips.length;
    const picked = new Set(action.levers.filter((i) => Number.isInteger(i) && i >= 0 && i < n));
    const lit = state.lit.slice();
    // `picked` indexes the Operator's lever row; map back to wiring order
    for (const pos of picked) state.flips[state.leverOrder[pos]].forEach((j) => (lit[j] = !lit[j]));
    if (lit.some(Boolean)) return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: {} } };
    state.stage += 1;
    if (state.stage >= SIZES.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
