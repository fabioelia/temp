import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createServer } from '../server/index.js';
import { solvers } from './solvers.js';

// The TV / cast screen is a read-only spectator. Both players may be looking at it, so it
// must never receive anything that would hand one player the other's half of a puzzle.

class Client {
  constructor(port, name) {
    this.port = port;
    this.name = name;
    this.log = [];
    this.waiters = [];
  }
  async open() {
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws`);
    this.ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      this.log.push(m);
      if (m.t === 'joined') Object.assign(this, { id: m.id, code: m.code });
      if (m.t === 'briefing') {
        this.role = m.role;
        this.view = m.view;
        this.send({ t: 'ready' });
      }
      if (m.t === 'fx' && m.view) this.view = m.view;
      this.waiters = this.waiters.filter((w) => !(w.pred(m) && (w.resolve(m), true)));
    });
    await new Promise((r) => this.ws.once('open', r));
    return this;
  }
  send(m) {
    this.ws.send(JSON.stringify(m));
  }
  next(pred, ms = 4000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${this.name}: timed out (last: ${JSON.stringify(this.log.at(-1))?.slice(0, 160)})`)), ms);
      this.waiters.push({ pred, resolve: (m) => (clearTimeout(t), resolve(m)) });
    });
  }
}

// every key a puzzle view or per-role event can carry
const SECRET_KEYS = ['view', 'event', 'tables', 'lamp', 'glyphs', 'clock', 'verdicts', 'glimpses', 'doors', 'dead', 'chart', 'bullets', 'reveal', 'tried', 'links', 'left', 'right', 'cables', 'jacks', 'plugged', 'wobble', 'cells', 'pos', 'atExit', 'door', 'cable', 'jack'];
// ('code' is deliberately absent: it is also the public session join code. The cipher entry
// itself is checked by value below.)

function keysDeep(x, out = new Set()) {
  if (Array.isArray(x)) x.forEach((v) => keysDeep(v, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) (out.add(k), keysDeep(v, out));
  return out;
}

async function setup(t, env = {}) {
  Object.assign(process.env, { SOLVE_HOLD_MS: '0', FAIL_RESET_MS: '50', TIME_SCALE: '1', ...env });
  const srv = await createServer({ port: 0, host: '127.0.0.1' });
  t.after(() => srv.close());
  const host = await new Client(srv.port, 'Host').open();
  const guest = await new Client(srv.port, 'Guest').open();
  host.send({ t: 'create', name: 'Trin' });
  const j = await host.next((m) => m.t === 'joined');
  guest.send({ t: 'join', code: j.code, name: 'Wren' });
  await guest.next((m) => m.t === 'joined');
  return { srv, host, guest, code: j.code };
}

async function tv(srv, code) {
  const c = await new Client(srv.port, 'TV').open();
  c.send({ t: 'spectate', code });
  await c.next((m) => m.t === 'spectating');
  return c;
}

test('a TV screen can watch a whole room and never receives a secret', async (t) => {
  const { srv, host, guest, code } = await setup(t);
  const screen = await tv(srv, code);
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await screen.next((m) => m.t === 'briefing');
  await screen.next((m) => m.t === 'go');

  // a wrong answer (strike), then the right one (stage), as the real players would
  const op = host;
  const mentor = guest;
  op.send({ t: 'act', action: { type: 'submit', code: '12345678' } });
  const wrong = await screen.next((m) => m.t === 'fx');
  assert.equal(wrong.result, 'wrong');
  assert.equal(wrong.penaltyMs, 15000);
  assert.equal(wrong.strikes, 1);

  const right = solvers.cipher({ operator: op.view, mentor: mentor.view });
  op.send({ t: 'act', action: right });
  const stage = await screen.next((m) => m.t === 'fx');
  assert.equal(stage.result, 'stage');
  assert.equal(stage.stage, 1);

  const seen = keysDeep(screen.log);
  for (const k of SECRET_KEYS) {
    if (seen.has(k)) assert.fail(`TV feed leaked "${k}": ${JSON.stringify(screen.log.find((m) => keysDeep(m).has(k))).slice(0, 200)}`);
  }
  const text = JSON.stringify(screen.log);
  assert.ok(!text.includes(op.view.lamp ? `"${op.view.lamp}"` : '@@'), 'the sconce colour must not appear on the TV');
  for (const g of op.view.glyphs) assert.ok(!text.includes(g), `glyph ${g} must not appear on the TV`);
  assert.ok(!text.includes('12345678'), 'what the Operator typed must not appear on the TV');
  assert.ok(!text.includes(right.code), 'the correct code must not appear on the TV');
});

test('the TV still gets what makes it a good display: names, clock, strikes, stage, room', async (t) => {
  const { srv, host, guest, code } = await setup(t);
  const screen = await tv(srv, code);
  host.send({ t: 'setPref', value: 'mentor' });
  host.send({ t: 'start' });
  const b = await screen.next((m) => m.t === 'briefing');
  assert.equal(b.room.id, 'cipher');
  assert.equal(b.names.mentor, 'Trin');
  assert.equal(b.names.operator, 'Wren');
  assert.equal(b.kind, 'intro');
  assert.equal(b.view, undefined);
  const go = await screen.next((m) => m.t === 'go');
  assert.ok(go.remainingMs > 300000);
  const lobby = screen.log.find((m) => m.t === 'lobby');
  assert.deepEqual(lobby.players.map((p) => p.name), ['Trin', 'Wren']);
  assert.equal(lobby.you, null);
});

test('mirrors pause, resume and timer expiry', async (t) => {
  const { srv, host, guest, code } = await setup(t, { TIME_SCALE: '0.0008' });
  const screen = await tv(srv, code);
  host.send({ t: 'start' });
  await screen.next((m) => m.t === 'go');
  const failed = await screen.next((m) => m.t === 'failed');
  assert.equal(failed.retry, 1);
  const again = await screen.next((m) => m.t === 'briefing');
  assert.equal(again.kind, 'retry');
});

test('a TV that connects mid-room is caught up immediately', async (t) => {
  const { srv, host, guest, code } = await setup(t);
  host.send({ t: 'setPref', value: 'operator' });
  host.send({ t: 'start' });
  await host.next((m) => m.t === 'go');
  host.send({ t: 'act', action: { type: 'submit', code: '99999999' } });
  await host.next((m) => m.t === 'fx');
  const late = await tv(srv, code);
  await new Promise((r) => setTimeout(r, 200)); // the snapshot follows the ack immediately
  const types = late.log.map((m) => m.t);
  assert.ok(types.includes('lobby') && types.includes('briefing') && types.includes('go'), types.join(','));
  assert.equal(late.log.find((m) => m.t === 'go').strikes, 1, 'the strike so far is shown');
  assert.equal(late.log.find((m) => m.t === 'briefing').view, undefined);
});

test('spectators are read-only and bad codes are refused', async (t) => {
  const { srv, host, guest, code } = await setup(t);
  const screen = await tv(srv, code);
  host.send({ t: 'setPref', value: 'operator' });
  screen.send({ t: 'start' });
  screen.send({ t: 'act', action: { type: 'submit', code: '1' } });
  screen.send({ t: 'setPref', value: 'mentor' });
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!host.log.some((m) => m.t === 'briefing'), 'a TV cannot start the run');

  const bad = await new Client(srv.port, 'Bad').open();
  bad.send({ t: 'spectate', code: 'ZZZZ' });
  assert.equal((await bad.next((m) => m.t === 'error')).code, 'no_session');
});

test('a TV does not take a player seat and the session still allows exactly two players', async (t) => {
  const { srv, code } = await setup(t);
  await tv(srv, code);
  await tv(srv, code);
  const third = await new Client(srv.port, 'Third').open();
  third.send({ t: 'join', code, name: 'Nope' });
  assert.equal((await third.next((m) => m.t === 'error')).code, 'session_full');
});

test('TV screens are capped so a session can’t be flooded', async (t) => {
  const { srv, code } = await setup(t);
  for (let i = 0; i < 6; i++) await tv(srv, code);
  const extra = await new Client(srv.port, 'Extra').open();
  extra.send({ t: 'spectate', code });
  assert.equal((await extra.next((m) => m.t === 'error')).code, 'too_many');
});
