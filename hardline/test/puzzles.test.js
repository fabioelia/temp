import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../engine/puzzles/index.js';
import { makeRng } from '../shared/rng.js';
import { ROOM_DEFS, PENALTY_MS } from '../shared/rooms.js';
import { solvers, localise, mazeRoute } from './solvers.js';

const SEEDS = 150;

function playTable(id, seed) {
  const rng = makeRng(seed);
  const p = PUZZLES[id];
  const { state, views } = p.create(rng);
  let { operator, mentor } = views;
  let stages = 0;
  const done = new Set();
  for (let guard = 0; guard < 60; guard++) {
    operator.__done = done;
    const action = solvers[id]({ operator, mentor });
    const { __cable, ...clean } = action;
    const res = p.act(state, clean, rng);
    assert.ok(res, `${id} seed ${seed}: solver action rejected ${JSON.stringify(clean)}`);
    if (res.result === 'wrong') assert.fail(`${id} seed ${seed}: oracle solver made a mistake`);
    if (id === 'switchboard' && (res.result === 'correct' || res.result === 'stage' || res.result === 'solved')) done.add(__cable);
    if (res.result === 'solved') return { stages: stages + 1 };
    if (res.result === 'stage') {
      stages++;
      done.clear();
      operator = res.views.operator;
      mentor = res.views.mentor;
    }
  }
  assert.fail(`${id} seed ${seed}: did not finish`);
}

for (const id of ['cipher', 'doors', 'bullets', 'switchboard']) {
  test(`${id}: oracle solver using only the two views solves ${SEEDS} seeds`, () => {
    for (let s = 1; s <= SEEDS; s++) {
      const { stages } = playTable(id, s);
      assert.equal(stages, ROOM_DEFS[id].stages);
    }
  });
}

test('maze: Mentor can localise the Operator from the patch and route to the phone', () => {
  for (let s = 1; s <= SEEDS; s++) {
    const rng = makeRng(s);
    const p = PUZZLES.maze;
    const { state, views } = p.create(rng);
    let op = views.operator;
    const loc = localise(op, views.mentor);
    assert.equal(loc.candidates.length, 1, `seed ${s}: start patch must be unique`);
    let pos = { x: loc.candidates[0].x, y: loc.candidates[0].y };
    const route = mazeRoute(views.mentor, pos);
    assert.ok(route.length >= 8, `seed ${s}: route too short (${route.length})`);
    for (const dir of route) {
      const res = p.act(state, { type: 'move', dir });
      assert.equal(res.result, 'move', `seed ${s}: unexpected ${res.result} on a safe route`);
      op = res.views.operator;
      const d = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }[dir];
      pos = { x: pos.x + d[0], y: pos.y + d[1] };
      const here = localise(op, views.mentor).candidates.some((c) => c.x === pos.x && c.y === pos.y);
      assert.ok(here, `seed ${s}: tracked position disagrees with operator patch`);
    }
    assert.equal(p.act(state, { type: 'answer' }).result, 'solved');
  }
});

test('maze: stepping on a watched cell sends you back to the start and costs time', () => {
  const rng = makeRng(3);
  const { state, views } = PUZZLES.maze.create(rng);
  const trap = state.maze.cells.find((c) => c.trap);
  // teleport next to the trap for the test and step in
  const order = ['n', 'e', 's', 'w'];
  const D = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
  for (const dir of order) {
    const [dx, dy] = D[dir];
    const nx = trap.x - dx;
    const ny = trap.y - dy;
    if (nx < 0 || ny < 0 || nx >= 6 || ny >= 6) continue;
    const from = state.maze.cells[ny * 6 + nx];
    if (from.w[dir]) continue;
    state.pos = ny * 6 + nx;
    const res = PUZZLES.maze.act(state, { type: 'move', dir });
    assert.equal(res.result, 'wrong');
    assert.equal(res.penaltyMs, PENALTY_MS);
    assert.equal(state.pos, state.maze.start);
    return;
  }
  assert.fail('no approach to trap found');
});

test('wrong answers cost time and never end the puzzle', () => {
  const rng = makeRng(11);
  {
    const { state } = PUZZLES.cipher.create(rng);
    const r = PUZZLES.cipher.act(state, { type: 'submit', code: state.expected === '000' ? '111' : '000' });
    assert.equal(r.result, 'wrong');
    assert.equal(r.penaltyMs, PENALTY_MS);
  }
  {
    const { state } = PUZZLES.doors.create(rng);
    const wrong = state.doors.findIndex((_, i) => i !== state.safe);
    const r = PUZZLES.doors.act(state, { type: 'open', door: wrong });
    assert.equal(r.result, 'wrong');
    assert.equal(PUZZLES.doors.act(state, { type: 'open', door: wrong }), null, 'a dead door cannot be reopened');
  }
});

test('information split: neither role view contains the other role\'s reference data', () => {
  const opForbidden = { cipher: ['tables'], doors: ['verdicts', 'glimpses'], bullets: ['chart'], switchboard: ['links', 'left', 'right'], maze: [] };
  const mentorForbidden = { cipher: ['lamp', 'glyphs', 'clock'], doors: ['doors'], bullets: ['bullets'], switchboard: ['cables', 'jacks'], maze: ['pos'] };
  for (const id of Object.keys(opForbidden)) {
    const { views } = PUZZLES[id].create(makeRng(5));
    for (const k of opForbidden[id]) assert.ok(!(k in views.operator), `${id}: operator view leaks ${k}`);
    for (const k of mentorForbidden[id]) assert.ok(!(k in views.mentor), `${id}: mentor view leaks ${k}`);
  }
  // and the answer itself is never shipped to either side
  const c = PUZZLES.cipher.create(makeRng(9));
  assert.ok(!JSON.stringify(c.views).includes(c.state.expected + '"'), 'cipher answer must not be in a view');
  const d = PUZZLES.doors.create(makeRng(9));
  assert.ok(!('safe' in d.views.operator) && !('safe' in d.views.mentor));
});

test('operator alone cannot do better than chance on the cipher door', () => {
  let wins = 0;
  for (let s = 1; s <= 400; s++) {
    const rng = makeRng(s);
    const { state } = PUZZLES.cipher.create(rng);
    const guess = String(Math.floor(rng.next() * 1000)).padStart(3, '0');
    if (PUZZLES.cipher.act(state, { type: 'submit', code: guess }).result !== 'wrong') wins++;
  }
  assert.ok(wins < 10, `blind guessing won ${wins}/400`);
});

test('rooms are reasonably tuned: stage counts match the roster', () => {
  for (const id of Object.keys(ROOM_DEFS)) assert.ok(PUZZLES[id], `${id} has a puzzle generator`);
});
