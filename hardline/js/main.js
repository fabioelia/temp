// HARDLINE client: screens, session flow, HUD, interstitials. Rooms plug in from
// ./operator/*.js (3D) and ./mentor/*.js (manual pages).

import { Net } from './net.js';
import { transportMode, currentTurn } from './transport.js';
import { audio } from './audio.js';
import { Rain } from './rain.js';
import { ROLE_LABEL, CHAPTERS } from '../shared/rooms.js';
import * as story from '../shared/story.js';
import { createMentorShell } from './mentor/shell.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

const net = new Net();
const app = {
  screen: 'landing',
  name: store.get('hardline.name') || '',
  code: null,
  you: null,
  lobby: null,
  role: null,
  prevRole: null,
  names: { operator: 'Operator', mentor: 'Mentor' },
  briefing: null,
  briefToken: 0,
  textDone: false,
  built: false,
  readySent: false,
  skip: false,
  room: null,
  stage: null, // Stage (Operator 3D) — kept alive for the whole session
  shell: null, // mentor shell
  mentorRoom: null, // solo: the Mentor's manual page module, alongside the Operator's room
  mentorView: null,
  solo: false,
  timer: { remaining: 0, total: 1, running: false, at: 0 },
  strikes: 0,
  stageIdx: 0,
  stageCount: 1,
  playing: false,
  view: null,
  fxLog: [],
  seenStory: store.get('hardline.seen.v1') === '1',
  gfx: store.get('hardline.gfx') || 'auto',
};
window.__hl = { app, net, audio }; // handy for debugging and the e2e tests

// ------------------------------------------------------------------- screens

const SCREENS = ['landing', 'lobby', 'brief', 'game', 'end'];
let bgRain = null;
let briefRain = null;
let endRain = null;

function show(name) {
  app.screen = name;
  for (const s of SCREENS) $(`screen-${s}`).classList.toggle('hidden', s !== name);
  $('bg-rain').style.display = name === 'landing' || name === 'lobby' ? '' : 'none';
  if (name === 'landing' || name === 'lobby') bgRain?.start();
  else bgRain?.stop();
  if (name === 'brief') {
    briefRain ??= new Rain($('brief-rain'), { size: 17, speed: 1.1 });
    briefRain.resize();
    briefRain.start();
  } else briefRain?.stop();
  if (name === 'end') {
    endRain ??= new Rain($('end-rain'), { size: 17, speed: 0.8 });
    endRain.resize();
    endRain.start();
  } else endRain?.stop();
}

function toast(msg, ms = 3200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.add('hidden'), ms);
}

function fmt(ms) {
  ms = Math.max(0, ms);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const d = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}
const fmtShort = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

// ------------------------------------------------------------------- landing

function landingError(msg) {
  $('landing-error').textContent = msg || '';
}

async function connectThen(msg) {
  landingError('');
  const name = $('in-name').value.trim() || 'Guest';
  app.name = name;
  store.set('hardline.name', name);
  audio.unlock();
  const busy = (on) => {
    for (const id of ['btn-create', 'btn-join', 'btn-solo']) $(id).disabled = on;
  };
  try {
    busy(true);
    // a solo run on a static host lives entirely in this tab: no broker, no code worth sharing, no TV link
    app.offlineSolo = !!msg.solo && (await transportMode()) === 'p2p';
    if (net.status !== 'open') {
      if ((await transportMode()) === 'p2p' && !msg.solo) landingError(msg.t === 'create' ? 'Opening a line…' : 'Looking for that session…');
      await net.open(msg.t === 'create' ? { host: true, solo: !!msg.solo } : { code: msg.code });
      landingError('');
    }
    net.send({ ...msg, name });
  } catch (err) {
    landingError(err?.message && err.message !== 'Could not reach the server.' ? err.message : 'Could not reach the server. Is it running?');
  } finally {
    busy(false);
  }
}

function initLanding() {
  $('in-name').value = app.name;
  const params = new URLSearchParams(location.search);
  const invite = (params.get('join') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (invite) {
    $('in-code').value = invite;
    $('btn-create').classList.remove('primary');
    $('btn-join').classList.add('primary');
    $('in-name').focus();
  }
  $('btn-create').onclick = () => connectThen({ t: 'create' });
  $('btn-solo').onclick = () => connectThen({ t: 'create', solo: true });
  $('btn-join').onclick = () => {
    const code = $('in-code').value.trim().toUpperCase();
    if (code.length !== 4) return landingError('Session codes are four letters.');
    connectThen({ t: 'join', code });
  };
  $('in-code').addEventListener('input', (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')));
  for (const id of ['in-name', 'in-code']) {
    $(id).addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      ($('in-code').value.length === 4 ? $('btn-join') : $('btn-create')).click();
    });
  }
}

// --------------------------------------------------------------------- lobby

function onLobby(m) {
  app.lobby = m;
  if (m.phase !== 'lobby') return;
  if (app.screen !== 'lobby') {
    show('lobby');
    hideOverlays();
  }
  $('lobby-code').textContent = m.code;
  loadLan();
  const me = m.players.find((p) => p.id === m.you);
  const isHost = !!me?.host;
  const offline = !!m.solo && !!app.offlineSolo;
  $('lobby-eyebrow').textContent = m.solo ? 'SOLO RUN' : 'PRIVATE SESSION';
  $('lobby-code').parentElement.classList.toggle('hidden', !!m.solo);
  $('tv-offer').classList.toggle('hidden', offline);
  $('solo-note').classList.toggle('hidden', !m.solo);
  $('lobby-hint').classList.toggle('hidden', !!m.solo);
  // a lone host can switch between solo and inviting someone (a session that is solo from the start
  // on a static host has no peer connection, so it can't open up to a partner)
  $('btn-solo-on').classList.toggle('hidden', !isHost || m.solo || m.players.length !== 1);
  $('btn-solo-off').classList.toggle('hidden', !isHost || !m.solo || offline);
  transportMode().then((mode) => {
    if (!m.solo && mode === 'p2p') {
      $('lobby-hint').textContent = isHost
        ? 'Send your partner the code or the link, then open your Discord call. This tab is hosting the session — keep it open until the run is over.'
        : 'Connected straight to your partner\'s browser. Open your Discord call.';
    }
  });
  for (let i = 0; i < 2; i++) {
    const p = m.players[i];
    const slot = $(`slot-${i}`);
    slot.className = 'slot' + (p ? (p.connected ? ' on' : ' off') : '');
    slot.querySelector('b').textContent = p ? p.name + (p.id === m.you ? ' (you)' : '') : '—';
    slot.querySelector('i').textContent = p ? (p.host ? (m.solo ? 'operator + protocol' : 'host') : 'guest') + (p.connected ? '' : ' · reconnecting') : 'waiting…';
  }
  $('slot-1').classList.toggle('hidden', !!m.solo);
  $('host-controls').classList.toggle('hidden', !isHost);
  $('guest-wait').classList.toggle('hidden', isHost);
  for (const el of [$('pref-label'), $('seg-pref'), $('swap-row')]) el.classList.toggle('hidden', !!m.solo);
  for (const b of $('seg-pref').children) b.classList.toggle('on', b.dataset.v === m.pref);
  for (const b of $('seg-chapter').children) b.classList.toggle('on', b.dataset.v === m.chapter);
  const ch = CHAPTERS[m.chapter] ?? CHAPTERS.classic;
  $('chapter-blurb').textContent = `${ch.blurb} (${ch.rooms.length} rooms)`;
  $('chapter-guest').textContent = `Run: ${ch.name} — ${ch.blurb} (${ch.rooms.length} rooms)`;
  $('chk-swap').checked = m.swap;
  const ready = m.solo ? m.players.length === 1 && m.players[0].connected : m.players.length === 2 && m.players.every((p) => p.connected);
  $('btn-start').disabled = !ready;
  $('btn-start').textContent = ready ? 'START THE RUN' : 'WAITING FOR PARTNER…';
}

// If the game was opened via localhost, an invite built from the address bar is useless to a
// friend. Ask the server for this machine's LAN address and use that instead.
const isLocalHost = () => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname);

async function loadLan() {
  if (!isLocalHost() || app.lan !== undefined) return;
  app.lan = null;
  try {
    if ((await transportMode()) !== 'ws') return;
    const r = await fetch('api/lan', { cache: 'no-store' });
    const j = await r.json();
    app.lan = j.addresses?.length ? { base: `http://${j.addresses[0]}:${j.port}`, all: j.addresses.map((a) => `http://${a}:${j.port}`) } : null;
  } catch {
    app.lan = null;
  }
  if (app.lan) {
    $('lan-hint').textContent = `On the same network? Your partner can open ${app.lan.all.join(' or ')} and enter the code.`;
    $('lan-hint').classList.remove('hidden');
  }
}

// Links to sibling pages work wherever the game lives: the site root of a Node server, or a
// sub-folder of a static host (https://user.github.io/games/hardline/).
function siteUrl(file, query = '') {
  const base = isLocalHost() && app.lan ? app.lan.base : location.origin;
  const dir = location.pathname.replace(/[^/]*$/, '');
  const turn = currentTurn();
  const q = new URLSearchParams(query);
  if (turn && !q.has('turn')) q.set('turn', turn);
  const qs = q.toString();
  return `${base}${dir}${file}${qs ? `?${qs}` : ''}`;
}

function inviteUrl() {
  return siteUrl('', `join=${app.lobby?.code ?? ''}`);
}

// the spoiler-free bridge display, castable to a TV (Chrome: ⋮ → Cast…)
function castUrl() {
  return siteUrl('cast.html', `code=${app.code ?? app.lobby?.code ?? ''}`);
}
const openTv = () => window.open(castUrl(), '_blank', 'noopener');

function initLobby() {
  $('btn-tv').onclick = openTv;
  $('btn-copy').onclick = async () => {
    const url = inviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast('Invite link copied. Paste it to your partner.');
    } catch {
      toast(url, 6000);
    }
  };
  for (const b of $('seg-pref').children) b.onclick = () => net.send({ t: 'setPref', value: b.dataset.v });
  for (const b of $('seg-chapter').children) b.onclick = () => net.send({ t: 'setChapter', value: b.dataset.v });
  $('chk-swap').onchange = (e) => net.send({ t: 'setSwap', value: e.target.checked });
  $('btn-solo-on').onclick = () => net.send({ t: 'setSolo', value: true });
  $('btn-solo-off').onclick = () => net.send({ t: 'setSolo', value: false });
  $('btn-start').onclick = () => {
    audio.unlock();
    net.send({ t: 'start' });
  };
  $('btn-leave').onclick = leaveSession;
  $('btn-lobby-audio').onclick = () => openSettings();
}

function leaveSession() {
  net.send({ t: 'leave' });
  net.close();
  location.href = location.pathname;
}

// --------------------------------------------------------------- interstitial

function beatsFor(b) {
  const room = story.roomBeats(b.room.id, b.names?.solo);
  if (b.kind === 'intro') return [...story.introBeats(b.names, b.chapter), ...room];
  if (b.kind === 'retry') return story.retryBeats(b.retry, b.names?.solo);
  return room;
}

async function typeLine(p, text, token) {
  const speed = p.classList.contains('sys') ? 7 : 15;
  const tn = p.firstChild; // empty text node created by the caller
  const caret = document.createElement('span');
  caret.className = 'caret';
  p.appendChild(caret);
  for (let i = 1; i <= text.length; i++) {
    if (token !== app.briefToken) return;
    if (app.skip) {
      tn.textContent = text;
      break;
    }
    tn.textContent = text.slice(0, i);
    if (i % 3 === 0) audio.type();
    await sleep(speed);
  }
  caret.remove();
}

async function playBeats(b, token) {
  const box = $('brief-lines');
  box.innerHTML = '';
  const kind = { intro: 'JACKING IN', transition: 'LOADING CONSTRUCT', retry: 'RESIMULATING' }[b.kind];
  $('brief-kind').textContent = kind;
  $('brief-room').textContent = `${b.room.sub} · ${b.room.title}`;
  for (const beat of beatsFor(b)) {
    if (token !== app.briefToken) return;
    const p = document.createElement('p');
    p.className = `bl ${beat.who.toLowerCase()}`;
    p.appendChild(document.createTextNode(''));
    box.appendChild(p);
    await typeLine(p, beat.text, token);
    if (!app.skip) await sleep(beat.who === 'SYS' ? 160 : 340);
  }
  if (token !== app.briefToken) return;
  showRoleCard(b);
  app.textDone = true;
  maybeReady();
}

function showRoleCard(b) {
  if (b.solo) {
    const card = $('brief-role');
    card.classList.remove('hidden');
    card.innerHTML = `<div><span class="rn">YOU GO IN ALONE</span><span class="rw">inside the construct, with the Protocol on your wrist</span></div>
      <p>Look at the room, then press <b>M</b> (or <b>PROTOCOL</b> in the corner) to open the manual. The clock keeps running while you read. Your notes page is in there too.</p>`;
    return;
  }
  const r = ROLE_LABEL[b.role];
  const partner = b.role === 'operator' ? b.names.mentor : b.names.operator;
  const swapped = app.prevRole && app.prevRole !== b.role && b.kind === 'transition';
  const card = $('brief-role');
  card.classList.remove('hidden');
  card.innerHTML = `<div><span class="rn">YOU ARE THE ${r.name}</span><span class="rw">${r.where}</span></div>
    <p>${r.blurb} ${swapped ? '<b>Roles swapped.</b> ' : ''}${partner} is your ${b.role === 'operator' ? 'Mentor' : 'Operator'}.</p>`;
}

function setBoot(pct, text) {
  $('boot-fill').style.width = `${pct}%`;
  $('boot-pct').textContent = `${Math.round(pct)}%`;
  if (text) $('boot-text').textContent = text;
}

function maybeReady() {
  if (!app.textDone || !app.built || app.readySent) return;
  const btn = $('btn-ready');
  btn.classList.remove('hidden');
  btn.classList.add('pulse');
  btn.disabled = false;
  btn.textContent = app.role === 'operator' ? 'JACK IN' : 'OPEN THE PROTOCOL';
  $('btn-skip').classList.add('hidden');
  audio.ready();
}

function sendReady() {
  if (app.readySent) return;
  app.readySent = true;
  audio.unlock();
  net.send({ t: 'ready' });
  const btn = $('btn-ready');
  btn.classList.remove('pulse');
  btn.disabled = true;
  btn.textContent = app.solo ? 'LINKING…' : 'WAITING FOR PARTNER…';
}

function initBriefing() {
  $('btn-ready').onclick = sendReady;
  $('btn-swap').onclick = () => net.send({ t: 'swap' });
  $('btn-skip').onclick = () => (app.skip = true);
  $('brief-lines').addEventListener('click', () => (app.skip = app.skip || (app.briefing?.kind === 'retry' || app.seenStory)));
}

// ------------------------------------------------------------------- rooms

async function teardownRoom() {
  try {
    app.room?.dispose?.();
  } catch (e) {
    console.error(e);
  }
  app.room = null;
  try {
    app.mentorRoom?.dispose?.();
  } catch (e) {
    console.error(e);
  }
  app.mentorRoom = null;
  app.shell?.dispose();
  app.shell = null;
  app.playing = false;
  $('op-root').classList.add('hidden');
  $('mentor-root').classList.add('hidden');
  $('mentor-root').classList.remove('solo');
  $('btn-hud-manual').classList.add('hidden');
  app.stage?.setActive(false);
}

async function buildRoom(b, token) {
  const id = b.room.id;
  setBoot(8, 'LOADING MODULES');
  const ctx = {
    view: b.view,
    names: b.names,
    audio,
    room: b.room,
    send: (action) => net.send({ t: 'act', action }),
  };
  if (b.role === 'operator') {
    const [{ Stage }, mod] = await Promise.all([import('./stage.js'), import(`./operator/${id}.js`)]);
    if (token !== app.briefToken) return;
    setBoot(35, 'COMPILING SHADERS');
    $('op-root').classList.remove('hidden');
    if (app.stage && app.stage.gfx !== app.gfx && !new URLSearchParams(location.search).get('gfx')) {
      app.stage.dispose(); // graphics setting changed: rebuild the renderer
      app.stage = null;
    }
    if (!app.stage) {
      try {
        app.stage = new Stage($('op-root'), { audio, gfx: app.gfx });
      } catch (err) {
        console.error(err);
        toast('WebGL is unavailable in this browser. HARDLINE needs it for the Operator view.', 9000);
        throw err;
      }
    } else {
      app.stage.setActive(true);
      app.stage.resetScene();
    }
    await sleep(30);
    setBoot(60, 'GENERATING GEOMETRY');
    ctx.stage = app.stage;
    app.room = await mod.create(ctx);
    setBoot(88, 'WARMING UP RENDERER');
    app.stage.renderer.compile(app.stage.scene, app.stage.camera);
    await sleep(40);
    app.stage.resize();
    if (b.solo) await buildSoloManual(b, id, token);
  } else {
    const mod = await import(`./mentor/${id}.js`);
    if (token !== app.briefToken) return;
    setBoot(50, 'OPENING PROTOCOL');
    $('mentor-root').classList.remove('hidden');
    app.shell = createMentorShell($('mentor-root'), { audio });
    ctx.shell = app.shell;
    app.room = await mod.create(ctx);
  }
  setBoot(100, 'CONSTRUCT READY');
}

/** Solo: the Mentor's manual for this room, kept as a pull-up overlay on top of the Operator's room. */
async function buildSoloManual(b, id, token) {
  const mod = await import(`./mentor/${id}.js`);
  if (token !== app.briefToken) return;
  const root = $('mentor-root');
  root.classList.add('solo');
  app.shell = createMentorShell(root, { audio, solo: true });
  app.mentorRoom = await mod.create({ shell: app.shell, view: b.mentorView, audio, names: b.names, room: b.room });
  app.mentorView = b.mentorView;
  root.classList.add('hidden'); // closed until the player opens it
  $('btn-hud-manual').classList.remove('hidden');
}

function setManual(open) {
  if (!app.solo || !app.mentorRoom) return;
  $('mentor-root').classList.toggle('hidden', !open);
  $('btn-hud-manual').classList.toggle('on', open);
  if (open) audio.pageFlip?.();
}
const manualOpen = () => !$('mentor-root').classList.contains('hidden');

function initSolo() {
  $('btn-hud-manual').onclick = () => setManual(!manualOpen());
  const typing = (el) => !!el?.matches?.('input, textarea, select, [contenteditable]');
  window.addEventListener('keydown', (e) => {
    if (!app.solo || !app.mentorRoom || e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target)) return;
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      setManual(!manualOpen());
    }
  });
  // keys typed into the manual (notes, row clues) must never reach the Operator room's own handlers
  $('mentor-root').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || ((e.key === 'm' || e.key === 'M') && !typing(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      setManual(false);
    }
    e.stopPropagation();
  });
}

// ----------------------------------------------------------------- briefing

async function onBriefing(b) {
  hideOverlays();
  audio.stopScore();
  audio.resetBeat();
  const token = ++app.briefToken;
  await teardownRoom();
  // a role swap re-sends the same briefing: don't make the players sit through the story twice
  const repeat = !!app.briefing && !b.resume && app.briefing.roomIndex === b.roomIndex && app.briefing.kind === b.kind && app.briefing.retry === b.retry;
  app.briefing = b;
  app.view = b.view;
  app.prevRole = app.role;
  app.role = b.role;
  app.solo = !!b.solo;
  app.mentorView = b.mentorView ?? null;
  app.names = b.names;
  app.stageIdx = 0;
  app.stageCount = b.room.stages;
  app.strikes = 0;
  app.textDone = false;
  app.built = false;
  app.readySent = false;
  app.skip = repeat;
  app.timer = { remaining: b.room.timeMs, total: b.room.timeMs, running: false, at: performance.now() };

  $('btn-ready').classList.add('hidden');
  $('btn-ready').classList.remove('pulse');
  $('brief-role').classList.add('hidden');
  $('brief-wait').textContent = '';
  $('btn-swap').classList.toggle('hidden', b.resume || !!b.solo);
  const canSkip = b.kind === 'retry' || app.seenStory;
  $('btn-skip').classList.toggle('hidden', !canSkip);
  setBoot(0, 'BUILDING CONSTRUCT');
  setHud(b);
  $('btn-hud-tv').classList.toggle('hidden', !!b.solo && !!app.offlineSolo);

  if (b.resume) {
    // rejoining mid-room: no interstitial, straight back to the puzzle
    show('game');
    try {
      await buildRoom(b, token);
    } catch (e) {
      console.error(e);
    }
    app.built = true;
    app.readySent = true;
    net.send({ t: 'ready' });
    return;
  }

  show('brief');
  playBeats(b, token);
  try {
    await buildRoom(b, token);
  } catch (e) {
    console.error(e);
    $('brief-wait').textContent = 'Something went wrong building this room. Try reloading the page.';
    return;
  }
  if (token !== app.briefToken) return;
  app.built = true;
  maybeReady();
}

// ------------------------------------------------------------------- HUD

function setHud(b) {
  const r = ROLE_LABEL[b.role];
  $('hud-role').textContent = b.solo ? 'SOLO · INSIDE THE CONSTRUCT' : `${r.name} · ${r.where}`;
  $('hud-room').textContent = `${b.room.sub} · ${b.room.title}`;
  renderStagePips();
  renderStrikes();
  $('hud-timer').textContent = fmt(app.timer.remaining);
  $('hud-timer').className = 'hud-timer';
}

function renderStagePips() {
  const box = $('hud-stage');
  box.innerHTML = '';
  if (app.stageCount <= 1) return;
  for (let i = 0; i < app.stageCount; i++) {
    const el = document.createElement('i');
    el.className = i < app.stageIdx ? 'done' : i === app.stageIdx ? 'now' : '';
    box.appendChild(el);
  }
}

function renderStrikes() {
  const box = $('hud-strikes');
  box.innerHTML = '';
  for (let i = 0; i < app.strikes; i++) box.appendChild(document.createElement('i'));
}

function remaining() {
  const t = app.timer;
  return t.running ? Math.max(0, t.remaining - (performance.now() - t.at)) : t.remaining;
}

function setTimer(ms, running = app.timer.running) {
  app.timer.remaining = ms;
  app.timer.at = performance.now();
  app.timer.running = running;
}

let lastDrive = 0;
function hudLoop(now) {
  requestAnimationFrame(hudLoop);
  if (app.screen !== 'game') return;
  const rem = remaining();
  const el = $('hud-timer');
  el.textContent = fmt(rem);
  const frac = rem / app.timer.total;
  el.classList.toggle('low', app.timer.running && (rem < 30000 || frac < 0.12));
  el.classList.toggle('mid', !el.classList.contains('low') && frac < 0.3);
  el.classList.toggle('paused', !app.timer.running);
  if (now - lastDrive > 100) {
    lastDrive = now;
    if (app.playing) audio.drive(rem, app.timer.total, app.timer.running);
    app.shell?.setStatus({ strikes: app.strikes, frac, running: app.timer.running });
  }
}

function popPenalty(ms) {
  const el = $('penalty-pop');
  el.textContent = `−${Math.round(ms / 1000)}s`;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

// ------------------------------------------------------------ play events

function onGo(m) {
  hideOverlays();
  show('game');
  app.playing = true;
  app.strikes = m.strikes ?? 0;
  app.stageIdx = m.stage ?? 0;
  setTimer(m.remainingMs, !m.paused);
  renderStagePips();
  renderStrikes();
  audio.unlock();
  audio.startScore(app.briefing?.room?.audioRoot ?? 0);
  if (m.paused) showPause('Reconnected. Waiting for the line to settle…');
  app.room?.onGo?.(m);
  app.mentorRoom?.onGo?.(m);
  app.stage?.resize();
}

function onFx(m) {
  app.fxCount = (app.fxCount ?? 0) + 1;
  app.fxLog.push({ result: m.result, strikes: m.strikes, stage: m.stage, event: m.event ?? null });
  if (app.fxLog.length > 80) app.fxLog.shift();
  if (m.view) app.view = m.view;
  setTimer(m.remainingMs, true);
  const prevStrikes = app.strikes;
  app.strikes = m.strikes;
  if (m.strikes !== prevStrikes) renderStrikes();
  if (m.result === 'wrong') {
    audio.wrong();
    if (m.penaltyMs) popPenalty(m.penaltyMs);
    app.stage?.pulseGlitch(0.8, 400);
    app.stage?.shake(0.12, 350);
    app.stage?.flash(0xff2030, 0.22, 380);
    app.shell?.log(`TRACE SPIKE — clock −${Math.round(m.penaltyMs / 1000)}s`, true);
  } else if (m.result === 'correct') {
    audio.correct();
    app.shell?.log('Link confirmed.');
  } else if (m.result === 'stage') {
    audio.stage();
    app.stageIdx = m.stage;
    renderStagePips();
    app.shell?.log('Segment cleared. Next page unlocked.');
  }
  try {
    app.room?.onFx?.(m);
  } catch (e) {
    console.error(e);
  }
  if (app.solo && app.mentorRoom) {
    // the manual gets the Mentor's half of the reply: its own event and (on a new stage) its own page
    if (m.mentor?.view) app.mentorView = m.mentor.view;
    try {
      app.mentorRoom.onFx?.({ ...m, event: m.mentor?.event ?? null, view: m.mentor?.view ?? null });
    } catch (e) {
      console.error(e);
    }
  }
}

function showPause(text) {
  $('pause-text').textContent = text;
  $('ov-pause').classList.remove('hidden');
}

function hideOverlays() {
  clearTimeout(app.overlayTimer); // a delayed "layer cleared" / "resimulating" card must not appear over the next screen
  for (const id of ['ov-pause', 'ov-fail', 'ov-solved']) $(id).classList.add('hidden');
}

function onFailed() {
  app.playing = false;
  setTimer(0, false);
  audio.stopScore();
  audio.fail();
  app.stage?.pulseGlitch(1, 1200);
  app.stage?.setGlitch(0.6);
  app.stage?.tween(1500, (k) => app.stage.setDrain(k));
  app.room?.onFailed?.();
  app.overlayTimer = setTimeout(() => $('ov-fail').classList.remove('hidden'), 600);
}

function onSolved(m) {
  app.playing = false;
  app.timer.running = false;
  audio.stopScore();
  audio.solved();
  app.room?.onSolved?.();
  $('solved-text').textContent = `${app.briefing?.room?.title ?? 'This layer'} — the way is open.`;
  app.overlayTimer = setTimeout(() => $('ov-solved').classList.remove('hidden'), 900);
}

// ------------------------------------------------------------------- ending

async function onEnding(m) {
  const token = ++app.briefToken;
  hideOverlays();
  audio.stopScore();
  await teardownRoom();
  app.stage?.setActive(false);
  show('end');
  app.seenStory = true;
  store.set('hardline.seen.v1', '1');
  const lines = $('end-lines');
  lines.innerHTML = '';
  $('end-stats').classList.add('hidden');
  $('end-actions').classList.add('hidden');
  app.skip = false;
  for (const beat of story.outroBeats(m.names, m.chapter)) {
    if (token !== app.briefToken) return;
    const p = document.createElement('p');
    p.className = `bl ${beat.who.toLowerCase()}`;
    p.appendChild(document.createTextNode(''));
    lines.appendChild(p);
    await typeLine(p, beat.text, token);
    await sleep(app.skip ? 0 : 420);
  }
  const note = document.createElement('div');
  note.className = 'page-note';
  note.textContent = story.epilogueNote(m.names);
  lines.appendChild(note);
  audio.solved();

  const rows = m.rooms
    .map((r) => `<tr><td>${r.title}</td><td class="num">${fmtShort(r.timeMs)}</td><td class="num">${r.strikes}</td><td class="num">${r.resets}</td></tr>`)
    .join('');
  const totals = m.rooms.reduce((a, r) => ({ s: a.s + r.strikes, r: a.r + r.resets }), { s: 0, r: 0 });
  $('end-stats').innerHTML = `<table><thead><tr><th>LAYER</th><th class="num">TIME</th><th class="num">MISTAKES</th><th class="num">RESETS</th></tr></thead><tbody>${rows}
    <tr><td><b>TOTAL</b></td><td class="num"><b>${fmtShort(m.totalMs)}</b></td><td class="num"><b>${totals.s}</b></td><td class="num"><b>${totals.r}</b></td></tr></tbody></table>`;
  $('end-stats').classList.remove('hidden');
  const host = app.lobby?.players.find((p) => p.id === app.lobby.you)?.host;
  $('btn-again').classList.toggle('hidden', !host);
  $('end-actions').classList.remove('hidden');
}

function initEnding() {
  $('btn-again').onclick = () => net.send({ t: 'again' });
  $('btn-end-leave').onclick = leaveSession;
}

// ------------------------------------------------------------------ settings

function openSettings() {
  const s = audio.settings;
  $('vol-master').value = s.master;
  $('vol-music').value = s.music;
  $('vol-sfx').value = s.sfx;
  $('chk-mute').checked = s.muted;
  $('sel-gfx').value = app.gfx;
  $('chk-duck').checked = s.micDuck;
  $('ov-settings').classList.remove('hidden');
  audio.unlock();
}

function initSettings() {
  $('btn-hud-audio').onclick = openSettings;
  $('btn-hud-tv').onclick = openTv;
  $('btn-settings-close').onclick = () => $('ov-settings').classList.add('hidden');
  $('vol-master').oninput = (e) => audio.set('master', +e.target.value);
  $('vol-music').oninput = (e) => audio.set('music', +e.target.value);
  $('vol-sfx').oninput = (e) => {
    audio.set('sfx', +e.target.value);
    audio.correct();
  };
  $('chk-mute').onchange = (e) => audio.set('muted', e.target.checked);
  $('sel-gfx').onchange = (e) => {
    app.gfx = e.target.value;
    store.set('hardline.gfx', app.gfx);
    toast('Graphics change applies from the next room.');
  };
  $('chk-duck').onchange = async (e) => {
    audio.unlock();
    const want = e.target.checked;
    const ok = await audio.enableMicDuck(want);
    if (want && !ok) {
      e.target.checked = false;
      toast('Microphone access was blocked, so ducking is off.');
    }
    audio.settings.micDuck = want && ok;
    audio.save();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('ov-settings').classList.add('hidden');
  });
}

// ---------------------------------------------------------------- messages

let chain = Promise.resolve();

function handle(m) {
  switch (m.t) {
    case 'joined':
      app.you = m.id;
      app.code = m.code;
      break;
    case 'lobby':
      onLobby(m);
      break;
    case 'briefing':
      return onBriefing(m);
    case 'partnerReady':
      if (app.screen === 'brief') $('brief-wait').textContent = app.readySent ? '' : 'Your partner is ready and waiting on you.';
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
      showPause(m.reason);
      break;
    case 'resume':
      setTimer(m.remainingMs, true);
      $('ov-pause').classList.add('hidden');
      audio.ready();
      break;
    case 'failed':
      onFailed(m);
      break;
    case 'solved':
      onSolved(m);
      break;
    case 'ending':
      return onEnding(m);
    case 'peer':
      break;
    case 'pong':
      break;
    case 'error':
      if (m.code === 'no_session' && app.screen !== 'landing' && net.session) {
        net.close();
        toast(m.message);
        show('landing');
      } else if (app.screen === 'landing') landingError(m.message);
      else toast(m.message);
      break;
  }
}

net.onMessage = (m) => {
  chain = chain.then(() => handle(m)).catch((e) => console.error('handler error', m.t, e));
};

net.onStatus = (s) => {
  $('ov-conn').classList.toggle('hidden', s !== 'reconnecting');
};

// -------------------------------------------------------------------- boot

function boot() {
  bgRain = new Rain($('bg-rain'), { size: 18, speed: 0.9, density: 0.8 });
  initLanding();
  transportMode().then((mode) => mode === 'p2p' && $('arcade-link').classList.remove('hidden'));
  initLobby();
  initBriefing();
  initSolo();
  initEnding();
  initSettings();
  show('landing');
  requestAnimationFrame(hudLoop);
  // first gesture unlocks audio (browsers require it)
  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  // refresh / reconnect: slip back into the same seat
  const s = net.session;
  if (s) {
    net.open({ code: s.code, resume: true })
      .then(() => net.send({ t: 'resume', code: s.code, token: s.token }))
      .catch(() => net.saveSession(null));
  }
}

boot();
