// THE CORRIDOR — door-hopping.
//
// Operator: a row of near-identical doors. Each has a faint glyph etched above it
//           and a porthole with a glimpse of what's beyond.
// Mentor:   the location log: a verdict for every glyph (EXIT / TRAP / LOOP) and a
//           list of glimpses the Agents are holding.
//
// Rule: the safe door has an EXIT glyph *and* a glimpse that is not flagged.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

export const GLIMPSES = ['code', 'fire', 'water', 'alarm', 'static', 'void', 'glare'];
const DOOR_COUNTS = [4, 5, 6];

function buildStage(state, rng) {
  const n = DOOR_COUNTS[state.stage];
  const decoys = n >= 5 ? 2 : 1;
  const exits = rng.shuffle(state.exitGlyphs);
  const others = rng.shuffle(state.otherGlyphs);
  const clear = GLIMPSES.filter((g) => !state.flagged.includes(g));

  const doors = [];
  doors.push({ glyph: exits[0], glimpse: rng.pick(clear), safe: true });
  for (let i = 0; i < decoys; i++) doors.push({ glyph: exits[1 + i], glimpse: rng.pick(state.flagged) });
  for (let i = 0; doors.length < n; i++) doors.push({ glyph: others[i], glimpse: rng.pick(GLIMPSES) });

  const shuffled = rng.shuffle(doors);
  state.doors = shuffled;
  state.safe = shuffled.findIndex((d) => d.safe);
  state.dead = [];
  return {
    stage: state.stage,
    stageCount: DOOR_COUNTS.length,
    doors: shuffled.map((d) => ({ glyph: d.glyph, glimpse: d.glimpse })),
  };
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: DOOR_COUNTS.length,
    verdicts: state.verdicts,
    glimpses: GLIMPSES.map((id) => ({ id, flagged: state.flagged.includes(id) })),
  };
}

export default {
  id: 'doors',
  create(rng) {
    const set = rng.sample(GLYPH_IDS, 10);
    const exitGlyphs = set.slice(0, 3);
    const traps = set.slice(3, 7);
    const loops = set.slice(7, 10);
    const verdicts = rng.shuffle([
      ...exitGlyphs.map((glyph) => ({ glyph, verdict: 'EXIT' })),
      ...traps.map((glyph) => ({ glyph, verdict: 'TRAP' })),
      ...loops.map((glyph) => ({ glyph, verdict: 'LOOP' })),
    ]);
    const state = {
      stage: 0,
      exitGlyphs,
      otherGlyphs: [...traps, ...loops],
      verdicts,
      flagged: rng.sample(GLIMPSES, 3),
    };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  resync(state) {
    return { operator: { dead: state.dead.slice() } };
  },

  act(state, action, rng) {
    if (action?.type !== 'open') return null;
    const i = action.door;
    if (!Number.isInteger(i) || i < 0 || i >= state.doors.length || state.dead.includes(i)) return null;

    if (i === state.safe) {
      state.stage += 1;
      if (state.stage >= DOOR_COUNTS.length) return { result: 'solved', events: { operator: { door: i } } };
      const operator = buildStage(state, rng);
      return { result: 'stage', events: { operator: { door: i } }, views: { operator, mentor: mentorView(state) } };
    }

    state.dead.push(i);
    const d = state.doors[i];
    const verdict = state.exitGlyphs.includes(d.glyph) ? 'AGENT' : state.verdicts.find((v) => v.glyph === d.glyph).verdict;
    return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { door: i, verdict } } };
  },
};
