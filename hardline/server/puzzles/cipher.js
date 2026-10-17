// THE LOBBY — keypad cipher door.
//
// Operator: sees the door's glyph display, the colour of the wall sconce, and
//           (from Door II) a digital wall clock. Has a keypad but no key.
// Mentor:   has four cipher tables (one per sconce colour) mapping glyph -> digit,
//           plus the clock rule.
//
// Rule: enter the digits for the glyphs left-to-right, using the table for the
// sconce colour. If the clock's minutes are odd, enter them right-to-left.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

const LAMPS = ['red', 'blue', 'green', 'amber'];
const LENGTHS = [3, 4, 5];

function buildStage(state, rng) {
  const lamp = rng.pick(LAMPS);
  const len = LENGTHS[state.stage];
  const glyphs = rng.sample(state.set, len);
  let clock = null;
  if (state.stage > 0) {
    const hh = String(rng.range(1, 12)).padStart(2, '0');
    const mm = String(rng.range(0, 59)).padStart(2, '0');
    clock = `${hh}:${mm}`;
  }
  let digits = glyphs.map((g) => state.tables[lamp].indexOf(g));
  if (clock && Number(clock.slice(3)) % 2 === 1) digits = digits.reverse();
  state.expected = digits.join('');
  return { stage: state.stage, stageCount: LENGTHS.length, lamp, glyphs, clock, len };
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: LENGTHS.length,
    tables: LAMPS.map((lamp) => ({ lamp, glyphs: state.tables[lamp] })),
  };
}

export default {
  id: 'cipher',
  create(rng) {
    const set = rng.sample(GLYPH_IDS, 10);
    const tables = {};
    for (const lamp of LAMPS) tables[lamp] = rng.shuffle(set);
    const state = { stage: 0, set, tables, expected: '' };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'submit' || typeof action.code !== 'string') return null;
    const code = action.code.replace(/[^0-9]/g, '').slice(0, 8);
    if (!code) return null;
    if (code !== state.expected) {
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { code } } };
    }
    state.stage += 1;
    if (state.stage >= LENGTHS.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
