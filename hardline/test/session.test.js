import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createServer } from '../server/index.js';
import { runFor } from '../shared/rooms.js';
const ROOMS = runFor('classic');
import { solvers, localise, mazeRoute, deepActions, DEEP_IDS } from './solvers.js';

class Bot {
  constructor(port, name) {
    this.name = name;
    this.port = port;
    this.log = [];
    this.waiters = [];
    this.view = null;
    this.role = null;
    this.remainingMs = null;
  }
  async connect() {
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws`);
    this.ws.on('message', (raw) => this.onMessage(JSON.parse(raw.toString())));
    await new Promise((r) => this.ws.once('open', r));
  }
  onMessage(m) {
    this.log.push(m);
    if (m.t === 'joined') Object.assign(this, { id: m.id, token: m.token, code: m.code });
    if (m.t === 'briefing') {
      this.briefing = m;
      this.view = m.view;
      this.mentorView = m.mentorView; // solo only
      this.role = m.role;
      this.send({ t: 'ready' });
    }
    if (m.t === 'fx' && m.view) this.view = m.view;
    if (m.t === 'fx' && m.mentor?.view) this.mentorView = m.mentor.view;
    if (m.t === 'fx' && m.event?.pickup) this.pickedUp = true;
    if (m.t === 'go' || m.t === 'fx' || m.t === 'timer' || m.t === 'resume' || m.t === 'pause') if (m.remainingMs != null) this.remainingMs = m.remainingMs;
    this.waiters = this.waiters.filter((w) => !(w.pred(m) && (w.resolve(m), true)));
  }
  send(m) {
    this.ws.send(JSON.stringify(m));
  }
  next(pred, ms = 5000) {
    const past = this.log.find((m) => !m.__seen && pred(m));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${this.name}: timeout waiting for message (last: ${JSON.stringify(this.log.at(-1))?.slice(0, 200)})`)), ms);
      this.waiters.push({ pred, resolve: (m) => (clearTimeout(timer), resolve(m)) });
    });
  }
  close() {
    this.ws.close();
  }
}

async function setup(env = {}) {
  Object.assign(process.env, { SOLVE_HOLD_MS: '0', FAIL_RESET_MS: '50', TIME_SCALE: '1', ...env });
  const srv = await createServer({ port: 0, host: '127.0.0.1' });
  const host = new Bot(srv.port, 'Host');
  const guest = new Bot(srv.port, 'Guest');
  await host.connect();
  await guest.connect();
  host.send({ t: 'create', name: 'Trin' });
  const joined = await host.next((m) => m.t === 'joined');
  guest.send({ t: 'join', code: joined.code, name: 'Wren' });
  await guest.next((m) => m.t === 'joined');
  return { srv, host, guest, code: joined.code };
}

/** Plays the current room to completion; resolves when the room is solved. */
async function playRoom(host, guest, roomId) {
  const bots = [host, guest];
  const op = bots.find((b) => b.role === 'operator');
  const mentor = bots.find((b) => b.role === 'mentor');
  const from = Math.min(...bots.map((b) => b.log.findLastIndex((m) => m.t === 'briefing')));
  await Promise.all(bots.map((b) => until(b, (m) => m.t === 'go', from)));
  const solved = op.next((m) => m.t === 'solved', 20000);
  const stageSolver = solvers[roomId];

  if (roomId === 'maze') {
    const loc = localise(op.view, mentor.view);
    assert.equal(loc.candidates.length, 1);
    let pos = { x: loc.candidates[0].x, y: loc.candidates[0].y };
    for (const dir of mazeRoute(mentor.view, pos)) {
      op.send({ t: 'act', action: { type: 'move', dir } });
      await op.next((m) => m.t === 'fx');
      const d = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }[dir];
      pos = { x: pos.x + d[0], y: pos.y + d[1] };
    }
    op.send({ t: 'act', action: { type: 'answer' } });
    return solved;
  }

  const done = new Set();
  for (let guard = 0; guard < 40; guard++) {
    op.view.__done = done;
    const a = stageSolver({ operator: op.view, mentor: mentor.view });
    const { __cable, ...clean } = a;
    const fx = op.next((m) => m.t === 'fx');
    op.send({ t: 'act', action: clean });
    const res = await fx;
    assert.notEqual(res.result, 'wrong', `${roomId}: the bots should never be wrong`);
    if (roomId === 'switchboard' && __cable) done.add(__cable);
    if (res.result === 'stage') {
      done.clear();
      // let mentor receive its fx too
      await mentor.next((m) => m.t === 'fx' && m.result === 'stage').catch(() => {});
      mentor.view = mentor.log.filter((m) => m.t === 'fx' && m.view).at(-1)?.view ?? mentor.view;
    }
    if (res.result === 'solved') break;
  }
  return solved;
}

test('full playthrough: lobby -> five rooms -> ending, roles swap between rooms', async (t) => {
  const { srv, host, guest } = await setup();
  t.after(() => srv.close());

  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  const rolesSeen = [];
  for (let i = 0; i < ROOMS.length; i++) {
    await Promise.all([host, guest].map((b) => until(b, (m) => m.t === 'briefing' && m.roomIndex === i, 0, 20000)));
    if (i === 0) assert.equal(host.role, 'operator');
    rolesSeen.push(host.role);
    assert.equal(host.briefing.room.id, ROOMS[i].id);
    assert.equal(host.briefing.kind, i === 0 ? 'intro' : 'transition');
    assert.notEqual(host.role, guest.role);
    await playRoom(host, guest, ROOMS[i].id);
  }
  const ending = await host.next((m) => m.t === 'ending');
  assert.equal(ending.rooms.length, ROOMS.length);
  assert.deepEqual(rolesSeen, ['operator', 'mentor', 'operator', 'mentor', 'operator']);
  assert.ok(host.pickedUp, 'operator saw the phone pickup event');
});

test('timer expiry is a soft reset: same room, fresh puzzle, no session end', async (t) => {
  const { srv, host, guest } = await setup({ TIME_SCALE: '0.0005' }); // ~180ms rooms
  t.after(() => srv.close());
  host.send({ t: 'start' });
  const first = await host.next((m) => m.t === 'briefing');
  const firstView = JSON.stringify(host.view);
  await host.next((m) => m.t === 'go');
  const failed = await host.next((m) => m.t === 'failed');
  assert.equal(failed.retry, 1);
  const again = await host.next((m) => m.t === 'briefing');
  assert.equal(again.kind, 'retry');
  assert.equal(again.room.id, first.room.id, 'same room after failing');
  assert.equal(again.retry, 1);
  assert.notEqual(JSON.stringify(again.view), firstView, 'puzzle is re-rolled');
  assert.equal(again.role, first.role, 'roles stay put on a retry');
});

test('wrong answers take 15s off the shared clock and strike both players', async (t) => {
  const { srv, host, guest } = await setup();
  t.after(() => srv.close());
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await host.next((m) => m.t === 'briefing');
  const go = await host.next((m) => m.t === 'go');
  const before = go.remainingMs;
  host.send({ t: 'act', action: { type: 'submit', code: '12345678' } });
  const fx = await host.next((m) => m.t === 'fx');
  const gfx = await guest.next((m) => m.t === 'fx').catch(() => guest.log.findLast((m) => m.t === 'fx'));
  assert.equal(fx.result, 'wrong');
  assert.equal(fx.penaltyMs, 15000);
  assert.equal(fx.strikes, 1);
  assert.ok(before - fx.remainingMs >= 14900 && before - fx.remainingMs <= 15600, `remaining dropped by ${before - fx.remainingMs}`);
  assert.equal(gfx.strikes, 1);
  assert.equal(gfx.event, null, 'the mentor is not shown the operator\'s entry');
});

test('mentor cannot act on the puzzle', async (t) => {
  const { srv, host, guest } = await setup();
  t.after(() => srv.close());
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await guest.next((m) => m.t === 'briefing');
  await guest.next((m) => m.t === 'go');
  guest.send({ t: 'act', action: { type: 'submit', code: '1' } });
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(host.log.filter((m) => m.t === 'fx').length, 0);
});

test('disconnect pauses the shared clock; rejoining resumes it with state intact', async (t) => {
  const { srv, host, guest, code } = await setup();
  t.after(() => srv.close());
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await host.next((m) => m.t === 'briefing');
  await host.next((m) => m.t === 'go');
  host.send({ t: 'act', action: { type: 'submit', code: '999999' } }); // strike
  await host.next((m) => m.t === 'fx');

  guest.close();
  const paused = await host.next((m) => m.t === 'pause');
  const frozenAt = paused.remainingMs;
  await new Promise((r) => setTimeout(r, 400));

  const back = new Bot(srv.port, 'GuestAgain');
  await back.connect();
  back.send({ t: 'resume', code, token: guest.token });
  const joined = await back.next((m) => m.t === 'joined');
  assert.ok(joined.resumed);
  const resumeMsg = await host.next((m) => m.t === 'resume', 4000);
  assert.ok(frozenAt - resumeMsg.remainingMs < 50, `clock must not advance while paused (${frozenAt} -> ${resumeMsg.remainingMs})`);
  const brief = back.log.find((m) => m.t === 'briefing');
  assert.ok(brief?.resume, 'rejoining player is handed the current room');
  assert.equal(brief.role, 'mentor');
  const go = back.log.find((m) => m.t === 'go');
  assert.equal(go.strikes, 1);
  assert.ok(go.paused);
});

test('lobby rules: two players max, bad codes rejected, only host starts', async (t) => {
  const { srv, host, guest, code } = await setup();
  t.after(() => srv.close());
  const third = new Bot(srv.port, 'Third');
  await third.connect();
  third.send({ t: 'join', code, name: 'Nope' });
  assert.equal((await third.next((m) => m.t === 'error')).code, 'session_full');
  const fourth = new Bot(srv.port, 'Fourth');
  await fourth.connect();
  fourth.send({ t: 'join', code: 'ZZZZ', name: 'Nope' });
  assert.equal((await fourth.next((m) => m.t === 'error')).code, 'no_session');
  guest.send({ t: 'start' });
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(!host.log.some((m) => m.t === 'briefing'), 'guest cannot start the run');
  host.send({ t: 'start' });
  await host.next((m) => m.t === 'briefing');
});

test('both players are always on opposite roles; random pref still splits roles', async (t) => {
  for (let i = 0; i < 6; i++) {
    const { srv, host, guest } = await setup();
    host.send({ t: 'setPref', value: 'random' });
    host.send({ t: 'start' });
    await Promise.all([host.next((m) => m.t === 'briefing'), guest.next((m) => m.t === 'briefing')]);
    assert.deepEqual([host.role, guest.role].sort(), ['mentor', 'operator']);
    await srv.close();
  }
});


// ---------------------------------------------------------------- Deep Loop + Gauntlet runs

const until = async (bot, pred, from = 0, ms = 15000) => {
  const t0 = Date.now();
  for (;;) {
    const hit = bot.log.slice(from).find(pred);
    if (hit) return hit;
    if (Date.now() - t0 > ms) throw new Error(`${bot.name}: timed out (last: ${JSON.stringify(bot.log.at(-1))?.slice(0, 160)})`);
    await new Promise((r) => setTimeout(r, 5));
  }
};

/** Plays one Deep Loop room over the wire, with only what each role is shown. */
async function playDeepRoom(host, guest, roomId) {
  const bots = [host, guest];
  const op = bots.find((b) => b.role === 'operator');
  const mentor = bots.find((b) => b.role === 'mentor');
  const from = Math.min(...bots.map((b) => b.log.findLastIndex((m) => m.t === 'briefing')));
  await Promise.all(bots.map((b) => until(b, (m) => m.t === 'go', from)));
  let strikes = 0;
  const history = [];
  let wrongs = 0;
  for (let guard = 0; guard < 40; guard++) {
    const actions = deepActions(roomId, { operator: op.view, mentor: mentor.view }, { strikes, history });
    let res = null;
    for (const action of actions) {
      const mark = op.log.length;
      op.send({ t: 'act', action });
      res = await until(op, (m) => m.t === 'fx', mark);
      if (res.result === 'wrong') {
        wrongs++;
        strikes = res.strikes;
        if (roomId === 'vault') history.push({ code: action.code, bulls: res.event.bulls });
        break;
      }
    }
    if (res.result === 'wrong') {
      assert.equal(roomId, 'vault', `${roomId}: the bots should never be wrong (only the Vault is a guess-and-feedback room)`);
      assert.ok(wrongs <= 3, 'vault: clues + feedback finish it within three wrong tries');
      continue;
    }
    if (res.result === 'solved') {
      await until(mentor, (m) => m.t === 'solved', from);
      return;
    }
    assert.equal(res.result, 'stage');
    // wait until the Mentor has been handed the new stage too
    const stage = res.stage;
    await until(mentor, (m) => m.t === 'fx' && m.result === 'stage' && m.stage === stage, from);
    await new Promise((r) => setTimeout(r, 20));
    wrongs = 0;
    history.length = 0;
  }
  assert.fail(`${roomId}: not solved`);
}

for (const chapter of ['deep', 'gauntlet']) {
  test(`${chapter} playthrough over the wire: every room solvable from the two role views, roles swap each room`, async (t) => {
    const { srv, host, guest } = await setup();
    t.after(() => srv.close());
    const run = runFor(chapter);
    host.send({ t: 'setChapter', value: chapter });
    host.send({ t: 'setPref', value: 'operator' });
    host.send({ t: 'start' });
    const roles = [];
    for (let i = 0; i < run.length; i++) {
      await Promise.all([host, guest].map((b) => until(b, (m) => m.t === 'briefing' && m.roomIndex === i, 0, 20000)));
      assert.equal(host.briefing.room.id, run[i].id);
      assert.equal(host.briefing.chapter, chapter);
      assert.notEqual(host.role, guest.role);
      roles.push(host.role);
      if (DEEP_IDS.includes(run[i].id)) await playDeepRoom(host, guest, run[i].id);
      else await playRoom(host, guest, run[i].id);
    }
    const ending = await until(host, (m) => m.t === 'ending', 0, 20000);
    assert.equal(ending.rooms.length, run.length);
    assert.equal(ending.chapter, chapter);
    assert.deepEqual(roles, run.map((_, i) => (i % 2 === 0 ? 'operator' : 'mentor')));
  });
}


// ------------------------------------------------------------------------------ solo

async function setupSolo(env = {}) {
  Object.assign(process.env, { SOLVE_HOLD_MS: '0', FAIL_RESET_MS: '50', TIME_SCALE: '1', ...env });
  const srv = await createServer({ port: 0, host: '127.0.0.1' });
  const me = new Bot(srv.port, 'Solo');
  await me.connect();
  me.send({ t: 'create', name: 'Trin', solo: true });
  const joined = await me.next((m) => m.t === 'joined');
  return { srv, me, code: joined.code };
}

/** One player, both views: plays a whole room with the same solvers the pairs use. */
async function playSoloRoom(bot, roomId) {
  const from = bot.log.findLastIndex((m) => m.t === 'briefing');
  await until(bot, (m) => m.t === 'go', from);
  const act = async (action) => {
    const mark = bot.log.length;
    bot.send({ t: 'act', action });
    return until(bot, (m) => m.t === 'fx', mark);
  };
  if (roomId === 'maze') {
    const loc = localise(bot.view, bot.mentorView);
    assert.equal(loc.candidates.length, 1);
    let pos = { x: loc.candidates[0].x, y: loc.candidates[0].y };
    for (const dir of mazeRoute(bot.mentorView, pos)) {
      await act({ type: 'move', dir });
      const d = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }[dir];
      pos = { x: pos.x + d[0], y: pos.y + d[1] };
    }
    const res = await act({ type: 'answer' });
    assert.equal(res.result, 'solved');
    return;
  }
  const done = new Set();
  let strikes = 0;
  const history = [];
  for (let guard = 0; guard < 60; guard++) {
    let actions;
    if (DEEP_IDS.includes(roomId)) actions = deepActions(roomId, { operator: bot.view, mentor: bot.mentorView }, { strikes, history });
    else {
      bot.view.__done = done;
      const { __cable, ...clean } = solvers[roomId]({ operator: bot.view, mentor: bot.mentorView });
      actions = [clean];
      if (roomId === 'switchboard' && __cable) done.add(__cable);
    }
    let res = null;
    for (const action of actions) {
      res = await act(action);
      if (res.result === 'wrong') {
        assert.equal(roomId, 'vault', `${roomId}: the solo bot should never be wrong`);
        strikes = res.strikes;
        history.push({ code: action.code, bulls: res.event.bulls });
        break;
      }
    }
    if (res.result === 'wrong') continue;
    if (res.result === 'solved') return;
    if (res.result === 'stage') {
      done.clear();
      history.length = 0;
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  assert.fail(`${roomId}: not solved`);
}

for (const chapter of ['classic', 'deep']) {
  test(`solo ${chapter} run: one player, both halves, no partner and no role swap`, async (t) => {
    const { srv, me } = await setupSolo();
    t.after(() => srv.close());
    const run = runFor(chapter);
    me.send({ t: 'setChapter', value: chapter });
    me.send({ t: 'start' });
    for (let i = 0; i < run.length; i++) {
      await until(me, (m) => m.t === 'briefing' && m.roomIndex === i, 0, 20000);
      const b = me.briefing;
      assert.equal(b.solo, true);
      assert.equal(b.role, 'operator', 'the lone player always acts in the room');
      assert.ok(b.mentorView && b.view, 'both halves arrive together');
      assert.equal(b.names.solo, true);
      assert.equal(b.room.id, run[i].id);
      await playSoloRoom(me, run[i].id);
    }
    const ending = await until(me, (m) => m.t === 'ending', 0, 20000);
    assert.equal(ending.solo, true);
    assert.equal(ending.rooms.length, run.length);
  });
}

test('solo: only the host can go solo, a partnered session cannot, and no second seat opens', async (t) => {
  const { srv, host, guest, code } = await setup();
  t.after(() => srv.close());
  host.send({ t: 'setSolo', value: true }); // two players already seated: ignored
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(host.log.filter((m) => m.t === 'lobby').at(-1).solo, false);

  const solo = await setupSolo();
  t.after(() => solo.srv.close());
  const intruder = new Bot(solo.srv.port, 'Intruder');
  await intruder.connect();
  intruder.send({ t: 'join', code: solo.code, name: 'Wren' });
  const err = await intruder.next((m) => m.t === 'error');
  assert.equal(err.code, 'session_full');
  assert.match(err.message, /solo/i);

  // a lobby that was created normally can switch to solo while the host is alone
  const lone = new Bot(srv.port, 'Lone');
  await lone.connect();
  lone.send({ t: 'create', name: 'Neo' });
  await lone.next((m) => m.t === 'joined');
  lone.send({ t: 'setSolo', value: true });
  const lobby = await lone.next((m) => m.t === 'lobby' && m.solo === true);
  assert.equal(lobby.players.length, 1);
  lone.send({ t: 'start' });
  const b = await lone.next((m) => m.t === 'briefing');
  assert.equal(b.solo, true);
});

test('two-player sessions never carry the Mentor half to the Operator (no solo leak)', async (t) => {
  const { srv, host, guest } = await setup();
  t.after(() => srv.close());
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await until(host, (m) => m.t === 'briefing');
  await until(guest, (m) => m.t === 'briefing');
  await until(host, (m) => m.t === 'go');
  host.send({ t: 'act', action: { type: 'submit', code: '999999' } });
  await until(host, (m) => m.t === 'fx');
  for (const b of [host, guest]) {
    for (const m of b.log) {
      assert.equal('mentorView' in m, false, `${b.name} ${m.t}: mentorView must not appear in a two-player session`);
      if (m.t === 'fx') assert.equal('mentor' in m, false, 'fx must not carry a mentor half');
    }
  }
});

test('solo: a dropped connection pauses the clock and the same seat resumes it', async (t) => {
  const { srv, me, code } = await setupSolo();
  t.after(() => srv.close());
  me.send({ t: 'start' });
  await until(me, (m) => m.t === 'go');
  me.close();
  await new Promise((r) => setTimeout(r, 200));
  const back = new Bot(srv.port, 'Again');
  await back.connect();
  back.send({ t: 'resume', code, token: me.token });
  await back.next((m) => m.t === 'joined');
  const snap = await until(back, (m) => m.t === 'briefing' && m.resume === true);
  assert.ok(snap.mentorView, 'the manual comes back with the seat');
  const resumed = await until(back, (m) => m.t === 'resume', 0, 8000);
  assert.ok(resumed.remainingMs > 0);
});
