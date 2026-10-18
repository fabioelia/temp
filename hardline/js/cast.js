// HARDLINE bridge display: a read-only second screen to cast to a TV (Chrome: ⋮ → Cast…).
//
// It connects as a spectator. The server only ever sends it the shared, spoiler-free feed
// (names, the clock, strikes, stage counts, story) — never a puzzle view or either
// player's events — so both players can look at it without breaking the game.

import { Rain } from './rain.js';
import { audio } from './audio.js';
import { runFor } from '../shared/rooms.js';
import { transportMode, openSocket, siteBase } from './transport.js';
import * as story from '../shared/story.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
document.documentElement.classList.add('tv-root');

const S = {
  code: null,
  conn: 'idle',
  scene: 'connect',
  players: [],
  names: { operator: 'Operator', mentor: 'Mentor' },
  roomIndex: 0,
  chapter: 'classic',
  run: runFor('classic'),
  room: runFor('classic')[0],
  kind: 'intro',
  stage: 0,
  stageCount: 1,
  strikes: 0,
  timer: { remaining: 0, total: 1, running: false, at: 0 },
  cleared: [],
  log: [],
  pulses: [],
  playing: false,
  token: 0,
  sound: false,
  lan: undefined,
  currentRoomIdx: -1,
};
window.__tv = S; // for tests

// ----------------------------------------------------------------- helpers

function fmt(ms) {
  ms = Math.max(0, ms);
  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
}
const fmtShort = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
const remaining = () => (S.timer.running ? Math.max(0, S.timer.remaining - (performance.now() - S.timer.at)) : S.timer.remaining);
function setTimer(ms, running = S.timer.running) {
  S.timer.remaining = ms;
  S.timer.at = performance.now();
  S.timer.running = running;
}

function setScene(name) {
  S.scene = name;
  for (const s of ['connect', 'lobby', 'brief', 'play', 'end']) $(`sc-${s}`).classList.toggle('hidden', s !== name);
  $('descent').style.visibility = name === 'play' || name === 'brief' || name === 'end' ? 'visible' : 'hidden';
}

function log(text, cls = '') {
  const s = Math.floor((performance.now() - T0) / 1000);
  S.log.unshift({ text, cls, at: s });
  S.log = S.log.slice(0, 9);
  const box = $('tv-log');
  box.innerHTML = S.log
    .map((l) => `<p class="${l.cls}">[${String(Math.floor(l.at / 60)).padStart(2, '0')}:${String(l.at % 60).padStart(2, '0')}] ${l.text}</p>`)
    .join('');
}
const T0 = performance.now();

function showOverlay(kind, title, text) {
  const ov = $('tv-overlay');
  ov.className = `tv-overlay ${kind}`;
  $('tv-ov-title').textContent = title;
  $('tv-ov-text').textContent = text;
}
const hideOverlay = () => $('tv-overlay').classList.add('hidden');

// ------------------------------------------------------------------- views

function renderCode() {
  $('tv-code').textContent = S.code ?? '----';
  $('big-code').textContent = S.code ?? '----';
}

function renderLobby(m) {
  S.players = m.players;
  S.solo = !!m.solo;
  for (let i = 0; i < 2; i++) {
    const p = m.players[i];
    const el = $(`tv-slot-${i}`);
    el.className = 'tv-slot' + (p ? (p.connected ? ' on' : ' off') : '');
    el.querySelector('b').textContent = p ? p.name : '—';
    el.querySelector('i').textContent = p ? (p.host ? (m.solo ? 'solo run' : 'host') : 'guest') + (p.connected ? '' : ' · reconnecting') : 'waiting…';
  }
  $('tv-slot-1').classList.toggle('hidden', S.solo);
}

function joinHint() {
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname) && S.lan;
  const here = siteBase();
  const base = local ? here.replace(location.origin, S.lan) : here;
  $('tv-join-hint').textContent = `Players: open ${base} and enter the code, or use the invite link from the lobby.`;
}
async function loadLan() {
  if (S.lan !== undefined) return;
  S.lan = null;
  try {
    if ((await transportMode()) !== 'ws') return joinHint();
    const j = await (await fetch('api/lan', { cache: 'no-store' })).json();
    if (j.addresses?.length) S.lan = `http://${j.addresses[0]}:${j.port}`;
  } catch {}
  joinHint();
}

function renderCrew() {
  $('crew-op').textContent = S.names.operator;
  $('crew-mentor').textContent = S.names.mentor;
  $('tv-crew-brief').innerHTML = S.names.solo
    ? `<span>SOLO <b>${esc(S.names.operator)}</b> — inside the construct, the Protocol on their wrist</span>`
    : `<span>OPERATOR <b>${esc(S.names.operator)}</b> — jacked in</span><span>MENTOR <b>${esc(S.names.mentor)}</b> — aboard the Halcyon</span>`;
}
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderPips() {
  const box = $('tv-pips');
  box.innerHTML = '';
  $('stage-label').textContent = S.stageCount > 1 ? `PROGRESS — ${Math.min(S.stage + 1, S.stageCount)} OF ${S.stageCount}` : 'PROGRESS';
  for (let i = 0; i < S.stageCount; i++) {
    const el = document.createElement('i');
    el.className = i < S.stage ? 'done' : i === S.stage ? 'now' : '';
    box.appendChild(el);
  }
}

function renderStrikes() {
  const box = $('tv-strikes');
  box.innerHTML = S.strikes ? '' : '<i class="none">none yet</i>';
  for (let i = 0; i < S.strikes; i++) box.appendChild(document.createElement('i'));
}

function renderDescent() {
  const el = $('descent');
  const many = S.run.length > 6;
  el.classList.toggle('many', many);
  el.innerHTML = S.run.map((r, i) => {
    const done = S.scene === 'end' || i < S.currentRoomIdx || S.cleared[i] != null;
    const now = !done && i === S.currentRoomIdx;
    const cls = done ? 'done' : now ? 'now' : '';
    const t = S.cleared[i] != null ? fmtShort(S.cleared[i]) : '';
    return `<div class="node ${cls}"><div class="dot"></div><div class="nm">${r.title.replace('THE ', '')}</div><div class="tm">${t}</div></div>`;
  }).join('');
}

// ------------------------------------------------------------- story text

async function typeInto(container, beats, token) {
  container.innerHTML = '';
  for (const beat of beats) {
    if (token !== S.token) return;
    const p = document.createElement('p');
    p.className = `bl ${beat.who.toLowerCase()}`;
    const tn = document.createTextNode('');
    p.appendChild(tn);
    container.appendChild(p);
    for (let i = 1; i <= beat.text.length; i++) {
      if (token !== S.token) return;
      tn.textContent = beat.text.slice(0, i);
      await sleep(beat.who === 'SYS' ? 7 : 15);
    }
    await sleep(beat.who === 'SYS' ? 160 : 340);
  }
}

function beatsFor(m) {
  const room = story.roomBeats(m.room.id, m.names?.solo);
  if (m.kind === 'intro') return [...story.introBeats(m.names, m.chapter), ...room];
  if (m.kind === 'retry') return story.retryBeats(m.retry, m.names?.solo);
  return room;
}

// ---------------------------------------------------------------- messages

function onBriefing(m) {
  hideOverlay();
  const token = ++S.token;
  S.names = m.names;
  S.roomIndex = m.roomIndex;
  S.chapter = m.chapter ?? 'classic';
  if (m.run) S.run = m.run;
  S.currentRoomIdx = m.roomIndex;
  S.room = m.room;
  S.kind = m.kind;
  S.stage = 0;
  S.stageCount = m.room.stages;
  S.strikes = 0;
  S.playing = false;
  S.timer = { remaining: m.room.timeMs, total: m.room.timeMs, running: false, at: performance.now() };
  if (m.kind === 'intro') {
    S.cleared = [];
    S.log = [];
    $('tv-log').innerHTML = '';
  }
  $('tv-room').textContent = `${m.room.sub} · ${m.room.title}`;
  renderCrew();
  renderPips();
  renderStrikes();
  renderDescent();
  audio.stopScore();
  audio.resetBeat();
  if (m.resume) {
    setScene('play');
    return;
  }
  log(m.kind === 'retry' ? `Resimulating — ${m.room.title} reloads` : `${m.room.sub}: ${m.room.title} loading`, m.kind === 'retry' ? 'warn' : '');
  setScene('brief');
  $('tv-kind').textContent = { intro: 'JACKING IN', transition: 'LOADING CONSTRUCT', retry: 'RESIMULATING' }[m.kind];
  $('tv-title').textContent = `${m.room.sub} · ${m.room.title}`;
  typeInto($('tv-lines'), beatsFor(m), token);
}

function onGo(m) {
  hideOverlay();
  S.token++; // stop any story typing
  setScene('play');
  S.playing = true;
  S.strikes = m.strikes ?? 0;
  S.stage = m.stage ?? 0;
  setTimer(m.remainingMs, !m.paused);
  renderPips();
  renderStrikes();
  renderDescent();
  log(`Countdown running — ${S.room.title}`, 'good');
  if (m.paused) showOverlay('', 'SIGNAL LOST', 'Waiting for the line to settle…');
  if (S.sound) audio.startScore(S.room.audioRoot ?? 0);
}

function onFx(m) {
  setTimer(m.remainingMs, true);
  S.strikes = m.strikes;
  renderStrikes();
  if (m.result === 'wrong') {
    S.pulses.push({ t0: performance.now(), color: '255,61,77' });
    log(`TRACE SPIKE — clock −${Math.round(m.penaltyMs / 1000)}s`, 'bad');
    $('strike-note').textContent = `${m.strikes} mistake${m.strikes === 1 ? '' : 's'} so far — each costs 15 seconds.`;
    if (S.sound) audio.wrong();
  } else if (m.result === 'stage') {
    S.stage = m.stage;
    renderPips();
    S.pulses.push({ t0: performance.now(), color: '45,255,122' });
    log('Segment cleared — next page unlocked', 'good');
    if (S.sound) audio.stage();
  } else if (m.result === 'correct') {
    log('Link confirmed', 'good');
    if (S.sound) audio.correct();
  }
}

function onSolved(m) {
  S.playing = false;
  S.timer.running = false;
  const used = S.timer.total - S.timer.remaining;
  S.cleared[m.roomIndex] = used;
  renderDescent();
  log(`${S.run[m.roomIndex].title} cleared in ${fmtShort(used)}`, 'good');
  audio.stopScore();
  if (S.sound) audio.solved();
  showOverlay('solved', 'LAYER CLEARED', `${S.run[m.roomIndex].title} — the way is open.`);
}

function onFailed() {
  S.playing = false;
  setTimer(0, false);
  log('Patrol closed the loop — resimulating', 'bad');
  audio.stopScore();
  if (S.sound) audio.fail();
  showOverlay('fail', 'RESIMULATING', 'The patrol closed the loop. Same room — new numbers.');
}

async function onEnding(m) {
  const token = ++S.token;
  hideOverlay();
  audio.stopScore();
  S.names = m.names;
  S.currentRoomIdx = S.run.length;
  m.rooms.forEach((r, i) => (S.cleared[i] = r.timeMs));
  setScene('end');
  $('tv-room').textContent = 'HARDLINE CONNECTED';
  renderDescent();
  const lines = $('tv-end-lines');
  $('tv-end-stats').classList.add('hidden');
  await typeInto(lines, story.outroBeats(m.names, m.chapter), token);
  if (token !== S.token) return;
  const note = document.createElement('div');
  note.className = 'page-note';
  note.textContent = story.epilogueNote(m.names);
  lines.appendChild(note);
  if (S.sound) audio.solved();
  const rows = m.rooms.map((r) => `<tr><td>${r.title}</td><td class="num">${fmtShort(r.timeMs)}</td><td class="num">${r.strikes}</td><td class="num">${r.resets}</td></tr>`).join('');
  const tot = m.rooms.reduce((a, r) => ({ s: a.s + r.strikes, r: a.r + r.resets }), { s: 0, r: 0 });
  $('tv-end-stats').innerHTML = `<table><thead><tr><th>LAYER</th><th class="num">TIME</th><th class="num">MISTAKES</th><th class="num">RESETS</th></tr></thead><tbody>${rows}
    <tr><td><b>TOTAL</b></td><td class="num"><b>${fmtShort(m.totalMs)}</b></td><td class="num"><b>${tot.s}</b></td><td class="num"><b>${tot.r}</b></td></tr></tbody></table>`;
  $('tv-end-stats').classList.remove('hidden');
}

function handle(m) {
  switch (m.t) {
    case 'spectating':
      S.code = m.code;
      renderCode();
      try {
        sessionStorage.setItem('hardline.cast', m.code);
      } catch {}
      break;
    case 'lobby':
      S.code = m.code;
      renderCode();
      renderLobby(m);
      if (m.phase === 'lobby') {
        hideOverlay();
        S.token++;
        $('tv-room').textContent = '';
        setScene('lobby');
        joinHint();
        loadLan();
      } else if (S.scene === 'connect' || S.scene === 'lobby') {
        // joined mid-run: the briefing/go that follows will pick the right scene
      }
      break;
    case 'briefing':
      onBriefing(m);
      break;
    case 'go':
      onGo(m);
      break;
    case 'fx':
      onFx(m);
      break;
    case 'timer':
      setTimer(m.remainingMs);
      break;
    case 'pause':
      setTimer(m.remainingMs, false);
      log('Signal lost — clock stopped', 'warn');
      showOverlay('', 'SIGNAL LOST', 'A crew member dropped off the line. The clock is stopped — nobody is penalised.');
      break;
    case 'resume':
      setTimer(m.remainingMs, true);
      hideOverlay();
      log('Signal restored — clock running', 'good');
      break;
    case 'failed':
      onFailed();
      break;
    case 'solved':
      onSolved(m);
      break;
    case 'ending':
      onEnding(m);
      break;
    case 'peer':
      if (m.name) log(`${esc(m.name)} ${m.connected ? 'is back on the line' : 'dropped off the line'}`, m.connected ? 'good' : 'warn');
      break;
    case 'error':
      $('connect-error').textContent = m.message;
      if (m.code === 'no_session') {
        try {
          sessionStorage.removeItem('hardline.cast');
        } catch {}
        S.code = null;
        S.wantOpen = false;
        setScene('connect');
      }
      break;
  }
}

// -------------------------------------------------------------- connection

let ws = null;
let retry = 400;
let chain = Promise.resolve();

function connect(code) {
  S.code = code;
  S.wantOpen = true;
  renderCode();
  open();
}

async function open() {
  const mode = await transportMode();
  const mine = (ws = openSocket(mode, { code: S.code }));
  let opened = false;
  ws.onopen = () => {
    opened = true;
    S.everOpened = true;
    retry = 400;
    $('tv-conn').textContent = '';
    mine.send(JSON.stringify({ t: 'spectate', code: S.code }));
    clearInterval(open.pinger);
    open.pinger = setInterval(() => mine.readyState === 1 && mine.send(JSON.stringify({ t: 'ping' })), 15000);
  };
  ws.onmessage = (ev) => {
    let m;
    try {
      m = JSON.parse(ev.data);
    } catch {
      return;
    }
    chain = chain.then(() => handle(m)).catch((e) => console.error('cast handler', m.t, e));
  };
  ws.onclose = () => {
    clearInterval(open.pinger);
    if (ws !== mine || !S.wantOpen) return;
    if (!opened && !S.everOpened) {
      // never got through (a wrong code, or the host's tab is gone): say so instead of looping
      S.wantOpen = false;
      $('connect-error').textContent = mine.failReason || 'Could not reach the server.';
      setScene('connect');
      return;
    }
    $('tv-conn').textContent = 'RECONNECTING…';
    setTimeout(open, retry);
    retry = Math.min(4000, retry * 1.6);
  };
  ws.onerror = () => {};
}

// --------------------------------------------------------- the trace ring

const ring = $('ring');
const rctx = ring.getContext('2d');

function sizeRing() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = ring.clientWidth;
  const h = ring.clientHeight;
  if (ring.width !== Math.floor(w * dpr)) {
    ring.width = Math.floor(w * dpr);
    ring.height = Math.floor(h * dpr);
  }
  return dpr;
}

let sweep = 0;
let lastFrame = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;

  if (S.scene === 'play') {
    const rem = remaining();
    const frac = Math.max(0, Math.min(1, rem / S.timer.total));
    const t = $('tv-timer');
    t.textContent = fmt(rem);
    const low = S.timer.running && (rem < 30000 || frac < 0.12);
    t.classList.toggle('low', low);
    t.classList.toggle('mid', !low && frac < 0.3);
    t.classList.toggle('paused', !S.timer.running);
    $('tv-trace').textContent = `${Math.round((1 - frac) * 100)}%`;
    drawRing(frac, dt, now);
    if (S.sound && S.playing) audio.drive(rem, S.timer.total, S.timer.running);
  }
}

function drawRing(frac, dt, now) {
  const dpr = sizeRing();
  const W = ring.width;
  const c = W / 2;
  const R = c * 0.9;
  const tension = frac > 0.5 ? 0 : (0.5 - frac) / 0.5;
  const col = frac > 0.3 ? '45,255,122' : frac > 0.12 ? '255,176,46' : '255,61,77';
  rctx.clearRect(0, 0, W, W);
  rctx.save();
  rctx.translate(c, c);

  // tick marks: the ones already burned are dim
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2 - Math.PI / 2;
    const alive = i / 120 <= frac;
    const len = i % 10 === 0 ? 0.075 : 0.035;
    rctx.strokeStyle = alive ? `rgba(${col},${i % 10 === 0 ? 0.95 : 0.55})` : 'rgba(45,255,122,0.12)';
    rctx.lineWidth = (i % 10 === 0 ? 3 : 1.6) * dpr;
    rctx.beginPath();
    rctx.moveTo(Math.cos(a) * R * (1 - len), Math.sin(a) * R * (1 - len));
    rctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    rctx.stroke();
  }

  // the remaining-time arc
  rctx.lineCap = 'round';
  rctx.strokeStyle = 'rgba(45,255,122,0.1)';
  rctx.lineWidth = 16 * dpr;
  rctx.beginPath();
  rctx.arc(0, 0, R * 0.86, 0, Math.PI * 2);
  rctx.stroke();
  rctx.shadowColor = `rgba(${col},0.9)`;
  rctx.shadowBlur = 26 * dpr;
  rctx.strokeStyle = `rgb(${col})`;
  rctx.lineWidth = 16 * dpr;
  rctx.beginPath();
  rctx.arc(0, 0, R * 0.86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  rctx.stroke();
  rctx.shadowBlur = 0;

  // the Agent patrol: a radar sweep that spins faster as the trace closes in
  if (S.timer.running) sweep += dt * (0.5 + 2.6 * tension);
  const g = rctx.createConicGradient(sweep, 0, 0);
  g.addColorStop(0, `rgba(${col},0.0)`);
  g.addColorStop(0.9, `rgba(${col},0.0)`);
  g.addColorStop(1, `rgba(${col},${0.22 + 0.25 * tension})`);
  rctx.fillStyle = g;
  rctx.beginPath();
  rctx.arc(0, 0, R * 0.78, 0, Math.PI * 2);
  rctx.fill();
  rctx.strokeStyle = `rgba(${col},${0.5 + 0.4 * tension})`;
  rctx.lineWidth = 2 * dpr;
  rctx.beginPath();
  rctx.moveTo(0, 0);
  rctx.lineTo(Math.cos(sweep) * R * 0.78, Math.sin(sweep) * R * 0.78);
  rctx.stroke();

  // inner guide rings
  rctx.strokeStyle = 'rgba(45,255,122,0.1)';
  rctx.lineWidth = 1.5 * dpr;
  for (const k of [0.62, 0.46]) {
    rctx.beginPath();
    rctx.arc(0, 0, R * k, 0, Math.PI * 2);
    rctx.stroke();
  }

  // mistakes and cleared segments send a pulse across the whole ring
  S.pulses = S.pulses.filter((p) => now - p.t0 < 1400);
  for (const p of S.pulses) {
    const k = (now - p.t0) / 1400;
    rctx.strokeStyle = `rgba(${p.color},${(1 - k) * 0.9})`;
    rctx.lineWidth = (10 - 8 * k) * dpr;
    rctx.beginPath();
    rctx.arc(0, 0, R * (0.3 + 0.75 * k), 0, Math.PI * 2);
    rctx.stroke();
  }
  rctx.restore();
}

// ----------------------------------------------------------------- controls

function initControls() {
  const rain = new Rain($('rain'), { size: 20, speed: 0.7, density: 0.75 });
  rain.start();

  const params = new URLSearchParams(location.search);
  const fromUrl = (params.get('code') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  let remembered = null;
  try {
    remembered = sessionStorage.getItem('hardline.cast');
  } catch {}

  $('in-code').addEventListener('input', (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')));
  $('connect-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('in-code').value.trim().toUpperCase();
    if (code.length !== 4) return ($('connect-error').textContent = 'Session codes are four letters.');
    $('connect-error').textContent = '';
    connect(code);
  });

  $('btn-sound').onclick = () => {
    S.sound = !S.sound;
    $('btn-sound').textContent = `SOUND: ${S.sound ? 'ON' : 'OFF'}`;
    if (S.sound) {
      audio.unlock();
      audio.ready();
      if (S.playing) audio.startScore(S.room.audioRoot ?? 0);
    } else audio.stopScore();
  };
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  $('btn-full').onclick = toggleFull;
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'f' || e.key === 'F') toggleFull();
  });

  // hide the controls (and the cursor) a few seconds after the last mouse movement
  let idle;
  const wake = () => {
    $('tv-controls').classList.remove('idle');
    document.body.classList.remove('idle-cursor');
    clearTimeout(idle);
    idle = setTimeout(() => {
      if (S.scene !== 'connect') {
        $('tv-controls').classList.add('idle');
        document.body.classList.add('idle-cursor');
      }
    }, 4000);
  };
  window.addEventListener('mousemove', wake);
  window.addEventListener('keydown', wake);
  wake();

  setScene('connect');
  renderDescent();
  requestAnimationFrame(frame);
  const start = fromUrl || remembered;
  if (start) connect(start);
}

initControls();
