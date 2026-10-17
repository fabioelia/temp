// THE ECHO CHAMBER — a flashing sequence and a grammar that changes when you slip.
//
// Operator: a monitor flashes a sequence; each flash has a COLOUR and a GLYPH. Four pylons stand
//           on a dais. Pressing them is the answer — but they don't know the grammar.
// Mentor:   the Chamber's grammar: for each flash colour, which pylon to press, in three columns
//           (0 mistakes / 1 mistake / 2+ mistakes — the rules shift as the room's strike count
//           climbs), plus a short list of INVERTING glyphs: if a flash shows one, the pylon you'd
//           press is swapped with its partner (red<->blue, green<->yellow).
//
// A wrong press restarts the sequence — and costs a strike, which changes the column.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

export const PYLONS = ['red', 'blue', 'green', 'yellow'];
export const SWAP = { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' };
const LENGTHS = [3, 4, 5];
const level = (strikes) => Math.min(2, strikes);

/** The pylon that is correct for this flash given how many mistakes have been made. */
export function expectedPress(state, flash, strikes) {
  let p = state.table[flash.color][level(strikes)];
  if (state.inverting.includes(flash.glyph)) p = SWAP[p];
  return p;
}

function buildStage(state, rng) {
  const len = LENGTHS[state.stage];
  const flashes = [];
  for (let i = 0; i < len; i++) {
    const inv = rng.chance(0.4);
    flashes.push({ color: rng.pick(PYLONS), glyph: rng.pick(inv ? state.inverting : state.plain) });
  }
  // every stage past the first must exercise the inverting rule at least once
  if (state.stage > 0 && !flashes.some((f) => state.inverting.includes(f.glyph))) flashes[rng.int(len)].glyph = rng.pick(state.inverting);
  state.flashes = flashes;
  state.progress = 0;
  return { stage: state.stage, stageCount: LENGTHS.length, flashes: flashes.map((f) => ({ ...f })) };
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: LENGTHS.length,
    // table[flashColour] = [pylon @0 mistakes, @1, @2+]
    table: PYLONS.map((color) => ({ color, press: state.table[color].slice() })),
    inverting: state.inverting.slice(),
    swap: SWAP,
  };
}

export default {
  id: 'echo',
  create(rng) {
    const glyphs = rng.sample(GLYPH_IDS, 9);
    // each mistake-level column is a permutation, so every pylon is used exactly once per column
    const cols = [0, 1, 2].map(() => rng.shuffle(PYLONS));
    const table = {};
    PYLONS.forEach((c, i) => (table[c] = cols.map((col) => col[i])));
    const state = { stage: 0, table, inverting: glyphs.slice(0, 3), plain: glyphs.slice(3), flashes: [], progress: 0 };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  resync(state) {
    return { operator: { progress: state.progress } };
  },

  act(state, action, rng, ctx = {}) {
    if (action?.type !== 'press' || !PYLONS.includes(action.pylon)) return null;
    const want = expectedPress(state, state.flashes[state.progress], ctx.strikes ?? 0);
    if (action.pylon !== want) {
      state.progress = 0;
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { replay: true } } };
    }
    state.progress += 1;
    if (state.progress < state.flashes.length) return { result: 'correct', events: { operator: { progress: state.progress } } };
    state.stage += 1;
    if (state.stage >= LENGTHS.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
