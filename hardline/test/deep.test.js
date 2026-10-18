import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../engine/puzzles/index.js';
import { makeRng } from '../shared/rng.js';
import { PENALTY_MS, ROOM_DEFS } from '../shared/rooms.js';
import { echoPresses, vaultCandidates, gridLevers, triangulateCell, logicSwitches, mosaicGrid } from './solvers.js';
import { expectedPress, PYLONS } from '../engine/puzzles/echo.js';
import { evaluate } from '../engine/puzzles/logic.js';

// The Deep Loop rooms. As with the classic rooms: oracle solvers that use ONLY the two role views
// must be able to solve every seed, and neither view may carry the other's half.

const SEEDS = 120;
const fresh = (id, seed) => {
  const rng = makeRng(seed);
  const { state, views } = PUZZLES[id].create(rng);
  return { rng, state, op: views.operator, me: views.mentor };
};

test('echo: pressing what the grammar says clears all three sequences', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('echo', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 20; guard++) {
      let last;
      for (const pylon of echoPresses({ operator, mentor, strikes: 0 })) {
        last = PUZZLES.echo.act(state, { type: 'press', pylon }, rng, { strikes: 0 });
        assert.ok(last && last.result !== 'wrong', `echo seed ${seed}: oracle press rejected`);
      }
      if (last.result === 'stage') {
        stages++;
        operator = last.views.operator;
        mentor = last.views.mentor;
      } else {
        assert.equal(last.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('echo: the grammar SHIFTS with mistakes — a slip changes what is right, and the new column works', () => {
  let shifted = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('echo', seed);
    const want0 = echoPresses({ operator: op, mentor: me, strikes: 0 });
    const want1 = echoPresses({ operator: op, mentor: me, strikes: 1 });
    if (JSON.stringify(want0) !== JSON.stringify(want1)) shifted++;
    // make a deliberate mistake on the first press
    const wrong = PYLONS.find((p) => p !== want0[0]);
    const r = PUZZLES.echo.act(state, { type: 'press', pylon: wrong }, rng, { strikes: 0 });
    assert.equal(r.result, 'wrong');
    assert.equal(r.penaltyMs, PENALTY_MS);
    assert.equal(state.progress, 0, 'a wrong press restarts the sequence');
    // now one strike has been recorded: the column for 1 mistake applies
    let last;
    for (const pylon of want1) last = PUZZLES.echo.act(state, { type: 'press', pylon }, rng, { strikes: 1 });
    assert.ok(['stage', 'solved'].includes(last.result), `seed ${seed}: the one-mistake column should clear the stage (${last.result})`);
  }
  assert.ok(shifted > SEEDS * 0.8, `the answer should usually change with a mistake (${shifted}/${SEEDS})`);
});

test('echo: using last column\'s rules after a mistake is wrong (the room genuinely changes)', () => {
  let diff = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const { rng, state, op, me } = fresh('echo', seed);
    const stale = echoPresses({ operator: op, mentor: me, strikes: 0 });
    const real = op.flashes.map((f) => expectedPress(state, f, 1));
    if (stale[0] !== real[0]) diff++;
  }
  assert.ok(diff > 40, `stale rules should usually fail on the first press (${diff}/60)`);
});

test('vault: clues leave at most 3 codes, and feedback from failed tries always finishes it within 3 attempts', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('vault', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 30; guard++) {
      const history = [];
      let attempts = 0;
      let res;
      for (;;) {
        const cands = vaultCandidates({ operator, mentor, history });
        assert.ok(cands.length >= 1, `vault seed ${seed}: the true code must stay a candidate`);
        if (attempts === 0) assert.ok(cands.length <= 3, `vault seed ${seed}: clues left ${cands.length} codes`);
        const code = cands[0];
        res = PUZZLES.vault.act(state, { type: 'open', code }, rng);
        attempts++;
        assert.ok(attempts <= 3, `vault seed ${seed}: took ${attempts} attempts`);
        if (res.result !== 'wrong') break;
        assert.ok(res.events.operator.bulls < res.events.operator.of, 'feedback is a count of correct dials');
        history.push({ code, bulls: res.events.operator.bulls });
      }
      if (res.result === 'stage') {
        stages++;
        operator = res.views.operator;
        mentor = res.views.mentor;
      } else {
        assert.equal(res.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('vault: neither half alone identifies the code (clues alone leave several; the dials alone leave hundreds)', () => {
  let multi = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { op, me } = fresh('vault', seed);
    if (vaultCandidates({ operator: op, mentor: me }).length > 1) multi++;
  }
  assert.ok(multi > SEEDS * 0.6, `clues often leave more than one code (${multi}/${SEEDS})`);
});

test('grid: the lever set derived from the schematic and the lamps is unique and safe', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('grid', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 10; guard++) {
      const lit = operator.nodes.filter((n) => n.lit).length;
      assert.ok(lit >= 3, 'at least three overloaded nodes');
      const levers = gridLevers({ operator, mentor });
      const res = PUZZLES.grid.act(state, { type: 'engage', levers }, rng);
      assert.notEqual(res.result, 'wrong', `grid seed ${seed}: oracle levers failed`);
      if (res.result === 'stage') {
        stages++;
        operator = res.views.operator;
        mentor = res.views.mentor;
      } else {
        assert.equal(res.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('grid: pulling the wrong levers costs time and tells you nothing', () => {
  const { rng, state, op, me } = fresh('grid', 4);
  const right = new Set(gridLevers({ operator: op, mentor: me }));
  const wrong = op.levers.map((_, i) => i).filter((i) => !right.has(i)).slice(0, 2);
  const r = PUZZLES.grid.act(state, { type: 'engage', levers: wrong.length ? wrong : [0] }, rng);
  assert.equal(r.result, 'wrong');
  assert.equal(r.penaltyMs, PENALTY_MS);
  assert.deepEqual(r.events.operator, {}, 'a failed engage reveals nothing about the wiring');
});

test('triangulate: the true square is the unambiguous best fit (decoys ignored, conventions converted)', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('triangulate', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 10; guard++) {
      const { best, second } = triangulateCell({ operator, mentor });
      assert.ok(best.err < 4, `seed ${seed}: best fit error ${best.err.toFixed(1)}° should be tiny`);
      assert.ok(second.err > best.err + 3, `seed ${seed}: runner-up ${second.err.toFixed(1)}° must be clearly worse than ${best.err.toFixed(1)}°`);
      const res = PUZZLES.triangulate.act(state, { type: 'locate', col: best.x, row: best.y }, rng);
      assert.notEqual(res.result, 'wrong', `triangulate seed ${seed} stage ${stages}: best fit was not the target`);
      if (res.result === 'stage') {
        stages++;
        operator = res.views.operator;
        mentor = res.views.mentor;
      } else {
        assert.equal(res.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('triangulate: later stages really do include a counter-clockwise dial and a decoy', () => {
  let ccw = 0;
  let decoy = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const { rng, state, op, me } = fresh('triangulate', seed);
    let operator = op;
    let mentor = me;
    for (let s = 0; s < 3; s++) {
      if (s === 1 && operator.readings.some((r) => r.mode === 'ccw')) ccw++;
      if (s === 2 && operator.readings.some((r) => r.flicker)) decoy++;
      const { best } = triangulateCell({ operator, mentor });
      const res = PUZZLES.triangulate.act(state, { type: 'locate', col: best.x, row: best.y }, rng);
      if (res.views) ({ operator, mentor } = res.views);
    }
  }
  assert.equal(ccw, 40);
  assert.equal(decoy, 40);
});

test('logic: a satisfying assignment found from the circuit + glyph table lights the lamp', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('logic', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 10; guard++) {
      const switches = logicSwitches({ operator, mentor });
      const res = PUZZLES.logic.act(state, { type: 'engage', switches }, rng);
      assert.notEqual(res.result, 'wrong', `logic seed ${seed}: oracle assignment failed`);
      if (res.result === 'stage') {
        stages++;
        operator = res.views.operator;
        mentor = res.views.mentor;
      } else {
        assert.equal(res.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('logic: guessing is hopeless (few assignments work) and the gate meanings re-roll every attempt', () => {
  const tables = new Set();
  let worst = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const rng = makeRng(seed);
    const { state, views } = PUZZLES.logic.create(rng);
    tables.add(JSON.stringify(views.mentor.table));
    let operator = views.operator;
    for (let stage = 0; stage < 3; stage++) {
      const total = 1 << operator.switches;
      let sat = 0;
      for (let m = 0; m < total; m++) {
        const sw = Array.from({ length: operator.switches }, (_, i) => !!(m & (1 << i)));
        if (evaluate({ gates: operator.gates, output: operator.output }, sw, (g) => state.gateOfGlyph[g.glyph])) sat++;
      }
      worst = Math.max(worst, sat / total);
      assert.ok(sat >= 1, 'the lamp can be lit');
      assert.ok(sat <= Math.max(2, Math.floor(total / 4)), `${sat}/${total} assignments light the lamp`);
      const res = PUZZLES.logic.act(state, { type: 'engage', switches: logicSwitches({ operator, mentor: views.mentor }) }, rng);
      if (res.views) {
        operator = res.views.operator;
        views.mentor = res.views.mentor;
      }
    }
  }
  assert.ok(worst <= 0.25, `at most a quarter of random switch settings should work (worst ${worst})`);
  assert.ok(tables.size > 50, `gate meanings should differ between attempts (${tables.size} distinct of 60)`);
});

test('mosaic: the Operator\'s rows and the Mentor\'s columns together determine the picture by line logic', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { rng, state, op, me } = fresh('mosaic', seed);
    let operator = op;
    let mentor = me;
    let stages = 0;
    for (let guard = 0; guard < 10; guard++) {
      assert.equal(operator.rows.length, operator.size);
      assert.equal(mentor.cols.length, mentor.size);
      const grid = mosaicGrid({ operator, mentor });
      const res = PUZZLES.mosaic.act(state, { type: 'seal', grid }, rng);
      assert.notEqual(res.result, 'wrong', `mosaic seed ${seed}: solved grid rejected`);
      if (res.result === 'stage') {
        stages++;
        operator = res.views.operator;
        mentor = res.views.mentor;
      } else {
        assert.equal(res.result, 'solved');
        assert.equal(stages, 2);
        break;
      }
    }
  }
});

test('mosaic: one wrong tile is rejected', () => {
  const { rng, state, op, me } = fresh('mosaic', 3);
  const grid = mosaicGrid({ operator: op, mentor: me });
  grid[0][0] = grid[0][0] ? 0 : 1;
  const r = PUZZLES.mosaic.act(state, { type: 'seal', grid }, rng);
  assert.equal(r.result, 'wrong');
  assert.equal(r.penaltyMs, PENALTY_MS);
});

test('deep rooms: information split — neither role view carries the other\'s half', () => {
  const has = (obj, key) => JSON.stringify(obj).includes(`"${key}"`);
  const opForbid = { echo: ['table', 'inverting', 'swap'], vault: ['legend', 'clues'], grid: ['flips'], triangulate: ['beacons'], logic: ['table'], mosaic: ['cols'] };
  const meForbid = { echo: ['flashes'], vault: ['glyphs'], grid: ['lit'], triangulate: ['readings'], logic: ['gates', 'output', 'switches'], mosaic: ['rows'] };
  for (const id of Object.keys(opForbid)) {
    const { op, me } = fresh(id, 5);
    for (const k of opForbid[id]) assert.ok(!has(op, k), `${id}: operator view leaks "${k}"`);
    for (const k of meForbid[id]) assert.ok(!has(me, k), `${id}: mentor view leaks "${k}"`);
  }
  // the Substation's Operator sees lamps and lever glyphs, but never which lever flips what; the
  // Vault's Operator sees the glyph ring, but never the letters or the clues
  const g = fresh('grid', 5);
  assert.ok(g.op.levers.every((l) => Object.keys(l).join() === 'glyph'));
  const v = fresh('vault', 5);
  assert.ok(!has(v.op, 'letter'));
});

test('every defined room has a generator, and stage counts match the roster', () => {
  for (const [id, def] of Object.entries(ROOM_DEFS)) {
    assert.ok(PUZZLES[id], `${id} has a generator`);
    assert.ok(def.stages >= 1 && def.timeMs >= 300000, `${id} has sensible timing`);
  }
});

test('the Vault gets enough clock for three doors of talking (at least four minutes a door)', () => {
  assert.ok(ROOM_DEFS.vault.timeMs / ROOM_DEFS.vault.stages >= 240000, `vault clock is ${ROOM_DEFS.vault.timeMs / 60000} min for ${ROOM_DEFS.vault.stages} doors`);
});
