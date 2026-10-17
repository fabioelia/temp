// THE SWITCHBOARD — re-route the signal.
//
// Operator: a patch panel. Coloured cables hang on the left; jacks stamped with
//           glyphs sit on the right in an order that means nothing.
// Mentor:   the wiring schematic: coloured terminals on one side, glyph terminals
//           on the other, with tangled traces between them.
//
// Rule: every cable goes to the jack its trace ends at.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

export const CABLE_COLORS = ['red', 'blue', 'green', 'yellow', 'white', 'violet'];
const CABLE_COUNTS = [4, 5, 6];

function buildRound(state, rng) {
  const k = CABLE_COUNTS[state.round];
  const colors = rng.sample(CABLE_COLORS, k);
  const glyphs = rng.sample(GLYPH_IDS, k);
  const mapping = {};
  colors.forEach((c, i) => (mapping[c] = glyphs[i]));
  state.mapping = mapping;
  state.plugged = {};
  state.jackUsed = new Set();

  const cables = rng.shuffle(colors);
  const jacks = rng.shuffle(glyphs);
  state.jacks = jacks;

  // Schematic orders deliberately differ from the physical panel.
  let left = rng.shuffle(colors);
  let right = rng.shuffle(glyphs);
  const links = left.map((c, li) => [li, right.indexOf(mapping[c])]);
  state.schematic = {
    round: state.round,
    rounds: CABLE_COUNTS.length,
    left,
    right,
    links,
    wobble: Array.from({ length: k }, () => Number((rng.next() * 2 - 1).toFixed(3))),
  };
  return { round: state.round, rounds: CABLE_COUNTS.length, cables, jacks };
}

export default {
  id: 'switchboard',
  create(rng) {
    const state = { round: 0 };
    const operator = buildRound(state, rng);
    return { state, views: { operator, mentor: state.schematic } };
  },

  resync(state) {
    // plugged: cable colour -> jack index
    return {
      operator: { plugged: { ...state.plugged } },
      mentor: { pluggedColors: Object.keys(state.plugged) },
    };
  },

  act(state, action, rng) {
    if (action?.type !== 'plug') return null;
    const { cable, jack } = action;
    if (!(cable in state.mapping) || cable in state.plugged) return null;
    if (!Number.isInteger(jack) || jack < 0 || jack >= state.jacks.length || state.jackUsed.has(jack)) return null;

    if (state.mapping[cable] !== state.jacks[jack]) {
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { cable, jack } } };
    }
    state.plugged[cable] = jack;
    state.jackUsed.add(jack);
    const ev = { operator: { cable, jack }, mentor: { plugged: cable } };
    if (Object.keys(state.plugged).length < state.jacks.length) return { result: 'correct', events: ev };

    state.round += 1;
    if (state.round >= CABLE_COUNTS.length) return { result: 'solved', events: ev };
    const operator = buildRound(state, rng);
    return { result: 'stage', events: ev, views: { operator, mentor: state.schematic } };
  },
};
