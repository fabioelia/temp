// THE SIGNAL ROOM — find a point on a map from compass bearings.
//
// Operator: a console of beacon dials. Each dial shows a bearing in degrees and carries a
//           beacon glyph and a coloured rim. A terminal takes a map square (column letter + row
//           number).
// Mentor:   the map (10x10, columns A-J, rows 1-10, north up) with every beacon's position, and
//           the conventions: a GREEN rim reads degrees clockwise from NORTH; an AMBER rim reads
//           degrees counter-clockwise from EAST; a FLICKERING dial is a decoy, ignore it.
//
// Draw each real bearing as a line from its beacon. They cross on the square to enter.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

export const SIZE = 10;
const STAGES = [
  { beacons: 2, ccw: 0, decoy: 0 },
  { beacons: 3, ccw: 1, decoy: 0 },
  { beacons: 4, ccw: 1, decoy: 1 },
];
const deg = (r) => (r * 180) / Math.PI;
const norm = (d) => ((d % 360) + 360) % 360;

/** Compass bearing (clockwise from north, north = up = decreasing y) from a to b, degrees. */
export function compassBearing(a, b) {
  return norm(deg(Math.atan2(b.x - a.x, -(b.y - a.y))));
}
/** The same direction as measured counter-clockwise from east. */
export const ccwFromEast = (compass) => norm(90 - compass);
export const fromReading = (reading, mode) => (mode === 'ccw' ? ccwFromEast(reading) : reading); // the conversion is its own inverse
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

function buildStage(state, rng) {
  const cfg = STAGES[state.stage];
  for (let attempt = 0; attempt < 2000; attempt++) {
    const target = { x: rng.range(1, SIZE - 2), y: rng.range(1, SIZE - 2) };
    const realCount = cfg.beacons - cfg.decoy;
    const pool = state.beacons.filter((b) => Math.hypot(b.x - target.x, b.y - target.y) >= 2.5);
    if (pool.length < cfg.beacons) continue;
    const chosen = rng.sample(pool, cfg.beacons);
    const real = chosen.slice(0, realCount);
    const decoys = chosen.slice(realCount);
    // the real lines must cross at a healthy angle, or the crossing square is ambiguous
    let wide = true;
    for (let i = 0; i < real.length && wide; i++) {
      for (let j = i + 1; j < real.length; j++) {
        const d = angDiff(compassBearing(real[i], target), compassBearing(real[j], target));
        if (d < 28 || d > 152) wide = false;
      }
    }
    if (!wide) continue;

    const ccwIdx = cfg.ccw ? rng.int(real.length) : -1;
    const readings = real.map((b, i) => {
      const compass = Math.round(compassBearing(b, target));
      const mode = i === ccwIdx ? 'ccw' : 'cw';
      return { glyph: b.glyph, bearing: mode === 'ccw' ? Math.round(ccwFromEast(compass)) : compass % 360, mode, flicker: false };
    });
    for (const b of decoys) {
      const truth = compassBearing(b, target);
      const off = (rng.chance(0.5) ? 1 : -1) * rng.range(50, 130);
      readings.push({ glyph: b.glyph, bearing: Math.round(norm(truth + off)), mode: rng.chance(0.5) ? 'cw' : 'ccw', flicker: true });
    }
    // decoys use their own convention; convert so a decoy that reads "ccw" still shows a plain number
    for (const r of readings) if (r.flicker && r.mode === 'ccw') r.bearing = Math.round(ccwFromEast(r.bearing));
    state.target = target;
    return {
      stage: state.stage,
      stageCount: STAGES.length,
      size: SIZE,
      readings: rng.shuffle(readings),
    };
  }
  throw new Error('triangulate: could not generate a stage');
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: STAGES.length,
    size: SIZE,
    beacons: state.beacons.map((b) => ({ glyph: b.glyph, x: b.x, y: b.y })),
  };
}

export default {
  id: 'triangulate',
  create(rng) {
    // six beacons, well spread over the map and never on top of each other
    let beacons = [];
    const glyphs = rng.sample(GLYPH_IDS, 6);
    for (let attempt = 0; attempt < 500 && beacons.length < 6; attempt++) {
      const c = { x: rng.int(SIZE), y: rng.int(SIZE), glyph: glyphs[beacons.length] };
      if (beacons.every((b) => Math.max(Math.abs(b.x - c.x), Math.abs(b.y - c.y)) >= 3)) beacons.push(c);
      if (attempt === 499 && beacons.length < 6) {
        beacons = [];
        attempt = -1;
      }
    }
    const state = { stage: 0, beacons };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'locate') return null;
    const { col, row } = action;
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || col >= SIZE || row < 0 || row >= SIZE) return null;
    if (col !== state.target.x || row !== state.target.y) {
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { col, row } } };
    }
    state.stage += 1;
    if (state.stage >= STAGES.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
