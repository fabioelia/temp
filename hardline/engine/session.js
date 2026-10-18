// One private session — two players, or one playing solo: lobby -> (briefing -> playing -> solved|failed)* -> ending.
//
// The session is authoritative. It generates every puzzle, holds the answer, and
// sends each player only their own role's view of it. It has no Node-only dependencies: it runs
// in the Node server for LAN play, and inside the host's browser tab when the game is served as
// plain static files (see hub.js and js/transport.js).

import { PUZZLES } from './puzzles/index.js';
import { runFor, CHAPTERS, DEFAULT_CHAPTER, ROOM_DEFS, FAIL_RESET_MS } from '../shared/rooms.js';
import { makeRng, randomSeed } from '../shared/rng.js';

// Tunable at call time so tests (and impatient developers) can shorten the clocks. In Node these
// come from the environment; in a browser, from an optional globalThis.HARDLINE_ENV object.
const env = (k) => globalThis.HARDLINE_ENV?.[k] ?? (typeof process !== 'undefined' ? process.env?.[k] : undefined);
const timeScale = () => (Number(env('TIME_SCALE')) > 0 ? Number(env('TIME_SCALE')) : 1);
const solveHoldMs = () => (env('SOLVE_HOLD_MS') !== undefined ? Number(env('SOLVE_HOLD_MS')) : 3400);
const failResetMs = () => (env('FAIL_RESET_MS') !== undefined ? Number(env('FAIL_RESET_MS')) : FAIL_RESET_MS);
const randomHex = (bytes) => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
const roomTime = (room) => Math.round(room.timeMs * timeScale());
const SYNC_EVERY_MS = 4000;
const RESUME_DELAY_MS = 1500;

// message types that carry nothing role-specific and are safe to mirror to spectators
const PUBLIC_TYPES = new Set(['timer', 'pause', 'resume', 'failed', 'solved', 'peer']);
const other = (role) => (role === 'operator' ? 'mentor' : 'operator');
const cleanName = (n) => String(n ?? '').replace(/[^\p{L}\p{N} _.\-']/gu, '').trim().slice(0, 16) || 'Guest';

export class Session {
  constructor(code, onEmpty) {
    this.code = code;
    this.onEmpty = onEmpty;
    this.players = [];
    this.spectators = new Set(); // read-only TV screens: { id, ws }
    this.chapter = DEFAULT_CHAPTER; // which run the host picked (classic / deep / gauntlet)
    this.run = runFor(this.chapter);
    this.pref = 'random'; // host's choice for the first room
    this.swapEachRoom = true;
    this.solo = false; // one player holds both roles (set by the host in the lobby)
    this.phase = 'lobby';
    this.createdAt = Date.now();
    this.lastActive = Date.now();
    this.resetRun();
  }

  resetRun() {
    clearTimeout(this.expireHandle);
    clearTimeout(this.phaseHandle);
    clearInterval(this.syncHandle);
    clearTimeout(this.resumeHandle);
    this.roomIndex = 0;
    this.retry = 0;
    this.kind = 'intro';
    this.puzzle = null;
    this.views = null;
    this.ready = new Set();
    this.timer = { remaining: 0, startedAt: null };
    this.paused = false;
    this.strikes = 0;
    this.stage = 0;
    this.roomStats = [];
    this.attempt = null;
    this.roomResets = 0;
    this.roomStrikes = 0;
  }

  // ---------------------------------------------------------------- players

  get host() {
    return this.players[0];
  }

  get connectedCount() {
    return this.players.filter((p) => p.ws).length;
  }

  /** Seats that must be connected for the clock to run: two players, or one when playing solo. */
  get seats() {
    return this.solo ? 1 : 2;
  }

  names() {
    if (this.solo) return { operator: this.players[0]?.name ?? 'Operator', mentor: 'the Protocol', solo: true };
    const op = this.players.find((p) => p.role === 'operator');
    const me = this.players.find((p) => p.role === 'mentor');
    return { operator: op?.name ?? 'Operator', mentor: me?.name ?? 'Mentor' };
  }

  addPlayer(ws, name) {
    if (this.players.length >= this.seats) return null;
    if (this.phase !== 'lobby') return null;
    const player = { id: randomHex(4), token: randomHex(12), name: cleanName(name), ws, role: null };
    this.players.push(player);
    this.touch();
    return player;
  }

  reconnect(player, ws) {
    if (player.ws && player.ws !== ws) {
      try {
        player.ws.close(4000, 'replaced');
      } catch {}
    }
    player.ws = ws;
    clearTimeout(player.dropTimer);
    this.ready.delete(player.id);
    this.touch();
    this.broadcast({ t: 'peer', id: player.id, name: player.name, connected: true }, player);
    this.sendLobby();
    this.sendSnapshot(player);
    if (this.phase === 'playing' && this.paused && this.connectedCount >= this.seats) this.scheduleResume();
  }

  disconnect(player, ws) {
    if (player.ws !== ws) return;
    player.ws = null;
    this.touch();
    this.broadcast({ t: 'peer', id: player.id, name: player.name, connected: false }, player);
    if (this.phase === 'lobby') {
      // nobody has started yet: hold the seat briefly so a page refresh can slip back in
      clearTimeout(player.dropTimer);
      player.dropTimer = setTimeout(() => {
        if (player.ws) return;
        this.players = this.players.filter((p) => p !== player);
        if (!this.players.length) return this.onEmpty?.(this);
        this.sendLobby();
      }, 15000);
      this.sendLobby();
      return;
    }
    if (this.phase === 'playing') this.pause(this.solo ? 'Signal lost — reconnecting you to the line.' : 'Signal lost — your partner dropped off the line.');
    if (!this.connectedCount) this.touch();
  }

  leave(player) {
    this.players = this.players.filter((p) => p !== player);
    if (this.phase !== 'lobby') {
      // a deliberate exit ends the run for everybody
      this.resetRun();
      this.phase = 'lobby';
      for (const p of this.players) p.role = null;
      this.broadcast({ t: 'error', code: 'partner_left', message: 'Your partner left the session.' });
    }
    if (!this.players.length) return this.onEmpty?.(this);
    this.sendLobby();
  }

  touch() {
    this.lastActive = Date.now();
  }

  // -------------------------------------------------------------- spectators
  // A spectator is a read-only TV screen (e.g. a cast browser tab). It gets the shared,
  // spoiler-free feed only: names, the clock, strikes, stage counts, story beats. It NEVER
  // receives a puzzle view or a per-role event, so showing it to both players leaks nothing.

  addSpectator(ws) {
    if (this.spectators.size >= 6) return null;
    const sp = { id: randomHex(4), ws };
    this.spectators.add(sp);
    this.touch();
    return sp;
  }

  removeSpectator(sp) {
    this.spectators.delete(sp);
  }

  spec(msg, only = null) {
    const data = JSON.stringify(msg);
    for (const sp of only ? [only] : this.spectators) if (sp.ws && sp.ws.readyState === 1) sp.ws.send(data);
  }

  publicLobby() {
    return {
      t: 'lobby',
      code: this.code,
      you: null,
      phase: this.phase,
      chapter: this.chapter,
      solo: this.solo,
      players: this.players.map((q) => ({ id: q.id, name: q.name, host: q === this.host, connected: !!q.ws })),
    };
  }

  runSummary() {
    return this.run.map((r) => ({ id: r.id, title: r.title, sub: r.sub, stages: r.stages }));
  }

  publicBriefing(resume = false) {
    const room = this.run[this.roomIndex];
    return {
      t: 'briefing',
      kind: this.kind,
      resume,
      chapter: this.chapter,
      run: this.runSummary(),
      roomIndex: this.roomIndex,
      roomCount: this.run.length,
      room: { ...room, timeMs: roomTime(room) },
      role: null,
      names: this.names(),
      solo: this.solo,
      retry: this.retry,
    };
  }

  /** Everything a spectator needs to catch up when it connects mid-session. */
  sendSpecSnapshot(sp) {
    this.spec(this.publicLobby(), sp);
    switch (this.phase) {
      case 'briefing':
        this.spec(this.publicBriefing(), sp);
        break;
      case 'playing':
        this.spec(this.publicBriefing(true), sp);
        this.spec({ t: 'go', resume: true, remainingMs: this.remaining(), paused: this.paused, strikes: this.strikes, stage: this.stage }, sp);
        break;
      case 'failed':
        this.spec({ t: 'failed', retry: this.retry + 1 }, sp);
        break;
      case 'solved':
        this.spec({ t: 'solved', roomIndex: this.roomIndex }, sp);
        break;
      case 'ending':
        this.spec(this.endingPayload(), sp);
        break;
    }
  }

  // --------------------------------------------------------------- messaging

  send(player, msg) {
    if (player.ws && player.ws.readyState === 1) player.ws.send(JSON.stringify(msg));
  }

  broadcast(msg, except) {
    for (const p of this.players) if (p !== except) this.send(p, msg);
    if (PUBLIC_TYPES.has(msg.t)) this.spec(msg);
  }

  sendLobby() {
    this.spec(this.publicLobby());
    for (const p of this.players) {
      this.send(p, {
        t: 'lobby',
        code: this.code,
        you: p.id,
        phase: this.phase,
        pref: this.pref,
        swap: this.swapEachRoom,
        chapter: this.chapter,
        solo: this.solo,
        players: this.players.map((q) => ({ id: q.id, name: q.name, host: q === this.host, connected: !!q.ws })),
      });
    }
  }

  viewFor(player, { withResync = false } = {}) {
    const view = this.views?.[player.role];
    if (!view || !withResync) return view;
    const extra = this.puzzle?.def.resync?.(this.puzzle.state)?.[player.role];
    return extra ? { ...view, ...extra } : view;
  }

  sendBriefing(player, { resume = false } = {}) {
    const room = this.run[this.roomIndex];
    this.send(player, {
      t: 'briefing',
      kind: this.kind,
      resume,
      chapter: this.chapter,
      run: this.runSummary(),
      roomIndex: this.roomIndex,
      roomCount: this.run.length,
      room: { ...room, timeMs: roomTime(room) },
      role: player.role,
      names: this.names(),
      view: this.viewFor(player, { withResync: resume }),
      // a lone player holds the Mentor's manual as well
      ...(this.solo ? { solo: true, mentorView: this.viewFor({ role: 'mentor' }, { withResync: resume }) } : {}),
      retry: this.retry,
    });
  }

  sendSnapshot(player) {
    switch (this.phase) {
      case 'lobby':
        break;
      case 'briefing':
        this.sendBriefing(player);
        break;
      case 'playing':
        this.sendBriefing(player, { resume: true });
        this.send(player, { t: 'go', resume: true, remainingMs: this.remaining(), paused: this.paused, strikes: this.strikes, stage: this.stage });
        break;
      case 'failed':
        this.send(player, { t: 'failed', retry: this.retry + 1 });
        break;
      case 'solved':
        this.send(player, { t: 'solved', roomIndex: this.roomIndex });
        break;
      case 'ending':
        this.send(player, this.endingPayload());
        break;
    }
  }

  // ---------------------------------------------------------------- lobby

  handle(player, msg) {
    this.touch();
    switch (msg.t) {
      case 'setPref':
        if (player !== this.host || this.phase !== 'lobby') return;
        if (['operator', 'mentor', 'random'].includes(msg.value)) this.pref = msg.value;
        return this.sendLobby();
      case 'setChapter':
        if (player !== this.host || this.phase !== 'lobby') return;
        if (msg.value in CHAPTERS) {
          this.chapter = msg.value;
          this.run = runFor(this.chapter);
        }
        return this.sendLobby();
      case 'setSolo':
        // only while the host is alone: a session with a partner in it can't turn solo
        if (player !== this.host || this.phase !== 'lobby' || this.players.length !== 1) return;
        this.solo = !!msg.value;
        return this.sendLobby();
      case 'setSwap':
        if (player !== this.host || this.phase !== 'lobby') return;
        this.swapEachRoom = !!msg.value;
        return this.sendLobby();
      case 'start':
        if (player !== this.host || this.phase !== 'lobby') return;
        if (this.players.length < this.seats || this.connectedCount < this.seats) return this.send(player, { t: 'error', code: 'need_partner', message: 'Waiting for your partner to join.' });
        return this.startRun();
      case 'ready':
        return this.onReady(player);
      case 'swap':
        return this.swapRoles();
      case 'act':
        return this.onAct(player, msg.action);
      case 'again':
        if (this.phase !== 'ending' || player !== this.host) return;
        this.resetRun();
        this.phase = 'lobby';
        for (const p of this.players) p.role = null;
        return this.sendLobby();
      case 'leave':
        return this.leave(player);
      case 'ping':
        return this.send(player, { t: 'pong' });
    }
  }

  startRun() {
    this.resetRun();
    const [a, b] = this.players;
    if (this.solo) {
      a.role = 'operator'; // the one player acts in the room; the manual comes along as mentorView
    } else {
      let hostRole = this.pref;
      if (hostRole === 'random') hostRole = Math.random() < 0.5 ? 'operator' : 'mentor';
      a.role = hostRole;
      b.role = other(hostRole);
    }
    this.run = runFor(this.chapter);
    // START_ROOM is a development aid: jump straight to a room, by position in the run or by id
    // (an id from outside the chosen chapter switches to the full gauntlet so it can be found)
    const start = env('START_ROOM');
    if (start && start in ROOM_DEFS) {
      if (!this.run.some((r) => r.id === start)) {
        this.chapter = 'gauntlet';
        this.run = runFor('gauntlet');
      }
      this.roomIndex = this.run.findIndex((r) => r.id === start);
    } else {
      this.roomIndex = Math.min(this.run.length - 1, Math.max(0, Number(start) || 0));
    }
    this.kind = 'intro';
    this.beginBriefing();
  }

  // -------------------------------------------------------------- briefing

  beginBriefing() {
    clearTimeout(this.phaseHandle);
    this.phase = 'briefing';
    this.ready.clear();
    const room = this.run[this.roomIndex];
    const def = PUZZLES[room.id];
    const rng = makeRng(randomSeed());
    const { state, views } = def.create(rng);
    this.puzzle = { def, state, rng };
    this.views = views;
    this.stage = 0;
    this.strikes = 0;
    this.timer = { remaining: roomTime(room), startedAt: null };
    this.paused = false;
    for (const p of this.players) this.sendBriefing(p);
    this.spec(this.publicBriefing());
    this.sendLobby();
  }

  swapRoles() {
    if (this.phase !== 'briefing' || this.solo) return;
    for (const p of this.players) p.role = other(p.role);
    this.ready.clear();
    for (const p of this.players) this.sendBriefing(p);
    this.spec(this.publicBriefing());
  }

  onReady(player) {
    if (this.phase !== 'briefing') return;
    this.ready.add(player.id);
    this.broadcast({ t: 'partnerReady', id: player.id });
    if (this.players.length === this.seats && this.ready.size === this.seats && this.connectedCount === this.seats) this.go();
  }

  // --------------------------------------------------------------- playing

  go() {
    this.phase = 'playing';
    this.attempt = { startedAt: Date.now() };
    this.startTimer();
    for (const p of this.players) this.send(p, { t: 'go', remainingMs: this.remaining(), strikes: 0, stage: 0 });
    this.spec({ t: 'go', remainingMs: this.remaining(), strikes: 0, stage: 0 });
    this.syncHandle = setInterval(() => {
      if (this.phase === 'playing' && !this.paused) this.broadcast({ t: 'timer', remainingMs: this.remaining() });
    }, SYNC_EVERY_MS);
  }

  remaining() {
    const t = this.timer;
    if (t.startedAt == null) return Math.max(0, Math.round(t.remaining));
    return Math.max(0, Math.round(t.remaining - (Date.now() - t.startedAt)));
  }

  startTimer() {
    this.timer.startedAt = Date.now();
    clearTimeout(this.expireHandle);
    this.expireHandle = setTimeout(() => this.expire(), this.timer.remaining + 5);
  }

  stopTimer() {
    this.timer.remaining = this.remaining();
    this.timer.startedAt = null;
    clearTimeout(this.expireHandle);
    clearInterval(this.syncHandle);
  }

  pause(reason) {
    if (this.phase !== 'playing' || this.paused) return;
    clearTimeout(this.resumeHandle);
    this.timer.remaining = this.remaining();
    this.timer.startedAt = null;
    clearTimeout(this.expireHandle);
    this.paused = true;
    this.broadcast({ t: 'pause', reason, remainingMs: this.timer.remaining });
  }

  scheduleResume() {
    clearTimeout(this.resumeHandle);
    this.resumeHandle = setTimeout(() => {
      if (this.phase !== 'playing' || !this.paused || this.connectedCount < this.seats) return;
      this.paused = false;
      this.startTimer();
      this.broadcast({ t: 'resume', remainingMs: this.remaining() });
    }, RESUME_DELAY_MS);
  }

  onAct(player, action) {
    if (this.phase !== 'playing' || this.paused || player.role !== 'operator') return;
    const res = this.puzzle.def.act(this.puzzle.state, action, this.puzzle.rng, { strikes: this.strikes });
    if (!res) return;

    if (res.penaltyMs) {
      this.strikes += 1;
      this.timer.remaining = Math.max(0, this.remaining() - res.penaltyMs);
      this.timer.startedAt = Date.now();
      clearTimeout(this.expireHandle);
      this.expireHandle = setTimeout(() => this.expire(), this.timer.remaining + 5);
    }
    if (res.result === 'stage') this.stage += 1;
    if (res.views) this.views = { ...this.views, ...res.views };

    const remainingMs = this.remaining();
    for (const p of this.players) {
      this.send(p, {
        t: 'fx',
        result: res.result,
        penaltyMs: res.penaltyMs ?? 0,
        remainingMs,
        strikes: this.strikes,
        stage: this.stage,
        event: res.events?.[p.role] ?? null,
        view: res.views?.[p.role] ?? null,
        ...(this.solo ? { mentor: { event: res.events?.mentor ?? null, view: res.views?.mentor ?? null } } : {}),
      });
    }

    this.spec({ t: 'fx', result: res.result, penaltyMs: res.penaltyMs ?? 0, remainingMs, strikes: this.strikes, stage: this.stage });

    if (res.result === 'solved') return this.solved();
    if (remainingMs <= 0) this.expire();
  }

  expire() {
    if (this.phase !== 'playing') return;
    this.stopTimer();
    this.timer.remaining = 0;
    this.roomResets = (this.roomResets ?? 0) + 1;
    this.roomStrikes = (this.roomStrikes ?? 0) + this.strikes;
    this.phase = 'failed';
    this.broadcast({ t: 'failed', retry: this.retry + 1 });
    this.phaseHandle = setTimeout(() => {
      this.retry += 1;
      this.kind = 'retry';
      this.beginBriefing();
    }, failResetMs());
  }

  solved() {
    const room = this.run[this.roomIndex];
    this.stopTimer();
    const timeMs = roomTime(room) - this.timer.remaining;
    this.roomStats.push({
      id: room.id,
      title: room.title,
      timeMs,
      strikes: (this.roomStrikes ?? 0) + this.strikes,
      resets: this.roomResets ?? 0,
    });
    this.roomResets = 0;
    this.roomStrikes = 0;
    this.phase = 'solved';
    this.broadcast({ t: 'solved', roomIndex: this.roomIndex });
    this.phaseHandle = setTimeout(() => {
      if (this.roomIndex + 1 >= this.run.length) return this.ending();
      this.roomIndex += 1;
      this.retry = 0;
      this.kind = 'transition';
      if (this.swapEachRoom && !this.solo) for (const p of this.players) p.role = other(p.role);
      this.beginBriefing();
    }, solveHoldMs());
  }

  endingPayload() {
    return { t: 'ending', chapter: this.chapter, solo: this.solo, names: this.names(), rooms: this.roomStats, totalMs: this.roomStats.reduce((a, r) => a + r.timeMs, 0) };
  }

  ending() {
    this.phase = 'ending';
    for (const p of this.players) this.send(p, this.endingPayload());
    this.spec(this.endingPayload());
  }
}
