// How this page reaches a game session.
//
//   'ws'  — a Node server is serving the page (LAN play): a plain WebSocket to /ws.
//   'p2p' — the page is just static files (GitHub Pages). There is no server, so the player who
//           creates the session IS the server: their tab runs the game engine (engine/hub.js) and
//           everyone else — the partner, a TV screen — connects to it over a WebRTC data channel,
//           found through PeerJS's free public broker, using the four-letter session code.
//
// Every socket handed out here looks like a WebSocket (send / close / readyState / onopen /
// onmessage / onclose), so net.js and cast.js do not care which kind they got. A socket that cannot
// connect closes without ever opening, with a human-readable `failReason`.

import { CODE_ALPHABET } from '../shared/rooms.js';

const PEER_PREFIX = 'hardline-';
const TURN_KEYS = ['hardline-turn', 'pixel-pitch-turn']; // the Pixel Pitch setting carries over
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ mode

let modePromise = null;

/**
 * 'ws' when a HARDLINE Node server is behind this page (it marks the HTML it serves), else 'p2p'.
 * `?transport=ws|p2p` forces one, for testing.
 */
export function transportMode() {
  return (modePromise ??= Promise.resolve().then(() => {
    const forced = new URLSearchParams(location.search).get('transport');
    if (forced === 'ws' || forced === 'p2p') return forced;
    return document.querySelector('meta[name="hardline-transport"]')?.content === 'ws' ? 'ws' : 'p2p';
  }));
}

/** The directory this page lives in, as an absolute URL ending in "/" (works under /games/hardline/). */
export const siteBase = () => new URL('./', location.href).href;

// -------------------------------------------------------- PeerJS plumbing

let peerLib = null;
function loadPeerJS() {
  if (window.Peer) return Promise.resolve();
  return (peerLib ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/peerjs.min.js', import.meta.url).href;
    s.onload = () => resolve();
    s.onerror = () => {
      peerLib = null;
      reject(new Error('Could not load the networking library. Check your connection and reload.'));
    };
    document.head.appendChild(s);
  }));
}

// Optional TURN relay for restrictive networks (VPNs, some carriers):
//   ?turn=USERNAME:CREDENTIAL@standard.relay.metered.ca
// It is remembered in this browser and carried into invite links, like Pixel Pitch does.
export function currentTurn() {
  const fromUrl = new URLSearchParams(location.search).get('turn');
  if (fromUrl) {
    try {
      localStorage.setItem(TURN_KEYS[0], fromUrl);
    } catch {}
    return fromUrl;
  }
  for (const k of TURN_KEYS) {
    try {
      const v = localStorage.getItem(k);
      if (v) return v;
    } catch {}
  }
  return null;
}

function turnServer(spec) {
  const m = /^(.+):(.+)@([^@]+)$/.exec(spec || '');
  if (!m) return null;
  return { urls: [`turn:${m[3]}:80`, `turn:${m[3]}:443`, `turns:${m[3]}:443?transport=tcp`], username: m[1], credential: m[2] };
}

function peerOptions() {
  if (window.PEERJS_OPTS) return window.PEERJS_OPTS;
  const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const turn = turnServer(currentTurn());
  if (turn) ice.push(turn);
  return { config: { iceServers: ice } };
}

const friendly = (err) => {
  switch (err?.type) {
    case 'peer-unavailable':
      return 'No session with that code. Check it and try again.';
    case 'browser-incompatible':
      return 'This browser does not support WebRTC, which online play needs.';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'Could not reach the matchmaking service. Check your connection and try again.';
    default:
      return err?.message || 'Could not connect.';
  }
};

// ----------------------------------------------------------- socket shapes

/** The WebSocket-ish face every client-side socket shares. */
class PipeSocket {
  constructor() {
    this.readyState = 0; // 0 connecting · 1 open · 3 closed
    this.failReason = '';
    this.onopen = this.onmessage = this.onclose = this.onerror = null;
  }
  _open() {
    if (this.readyState !== 0) return;
    this.readyState = 1;
    this.onopen?.({});
  }
  _message(data) {
    if (this.readyState === 1) this.onmessage?.({ data });
  }
  _closed() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.onclose?.({});
  }
  _fail(reason) {
    this.failReason = reason;
    this._closed();
  }
}

/** The server-side face of a socket, as engine/hub.js expects it (a subset of the `ws` API). */
class HubSocket {
  constructor() {
    this.readyState = 0;
    this.l = { message: [], close: [], error: [] };
  }
  on(evt, fn) {
    this.l[evt]?.push(fn);
    return this;
  }
  _emit(evt, arg) {
    for (const f of this.l[evt] ?? []) f(arg);
  }
}

/** A guest or TV screen connected to the host's tab, seen from the host's hub. */
class ConnHubSocket extends HubSocket {
  constructor(conn) {
    super();
    this.conn = conn;
    this.readyState = conn.open ? 1 : 0;
    conn.on('open', () => (this.readyState = 1));
    conn.on('data', (d) => this._emit('message', typeof d === 'string' ? d : String(d)));
    const gone = () => this._gone();
    conn.on('close', gone);
    conn.on('error', gone);
  }
  _gone() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this._emit('close');
  }
  send(s) {
    if (this.readyState === 1) {
      try {
        this.conn.send(s);
      } catch {}
    }
  }
  close() {
    try {
      this.conn.close();
    } catch {}
    this._gone();
  }
}

/** The host player's own end of the line: an in-memory pipe straight into their hub. */
class LoopServer extends HubSocket {
  constructor(client) {
    super();
    this.client = client;
    this.readyState = 1;
  }
  send(s) {
    if (this.readyState === 1) queueMicrotask(() => this.client._message(s));
  }
  fromClient(s) {
    queueMicrotask(() => this._emit('message', s));
  }
  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this._emit('close');
    this.client._closed();
  }
}

// -------------------------------------------------------------- the host

let hosting = null; // one hub per tab: { hub, peer, code }

function randomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

function registerPeer(code) {
  return new Promise((resolve, reject) => {
    const peer = new window.Peer(PEER_PREFIX + code, peerOptions());
    peer.once('open', () => resolve(peer));
    peer.once('error', (err) => {
      try {
        peer.destroy();
      } catch {}
      reject(err);
    });
  });
}

function startHosting() {
  return (hosting ??= (async () => {
    await loadPeerJS();
    const { createHub } = await import('../engine/hub.js');
    let peer = null;
    let code = null;
    for (let attempt = 0; attempt < 8 && !peer; attempt++) {
      code = randomCode();
      try {
        peer = await registerPeer(code);
      } catch (err) {
        if (err?.type !== 'unavailable-id') throw new Error(friendly(err));
      }
    }
    if (!peer) throw new Error('Could not find a free session code. Try again.');
    const hub = createHub({ fixedCode: code, localOnlyCreate: true });
    peer.on('connection', (conn) => hub.attach(new ConnHubSocket(conn)));
    peer.on('disconnected', () => {
      try {
        peer.reconnect();
      } catch {}
    });
    peer.on('error', () => {}); // per-guest hiccups must not take the session down
    const sweep = setInterval(() => hub.sweep(), 60 * 1000);
    window.addEventListener('pagehide', () => {
      clearInterval(sweep);
      try {
        peer.destroy();
      } catch {}
    });
    return { hub, peer, code };
  })().catch((err) => {
    hosting = null;
    throw err;
  }));
}

class HostSocket extends PipeSocket {
  constructor() {
    super();
    this.server = null;
    startHosting().then(
      ({ hub }) => {
        this.server = new LoopServer(this);
        hub.attach(this.server, { local: true });
        this._open();
      },
      (err) => this._fail(err.message || 'Could not start a session.')
    );
  }
  send(s) {
    if (this.readyState === 1) this.server.fromClient(s);
  }
  close() {
    if (this.server) this.server.close();
    else this._closed();
  }
}

// ------------------------------------------------------ guests and TV screens

class GuestSocket extends PipeSocket {
  constructor(code, { resume = false } = {}) {
    super();
    this.code = String(code || '').toUpperCase();
    this.attempts = resume ? 2 : 5; // a returning player expects the host to still be there
    this.peer = null;
    this.conn = null;
    this.gone = false;
    this._boot().catch((err) => {
      this._destroyPeer();
      this._fail(err.message || 'Could not connect.');
    });
  }

  _destroyPeer() {
    try {
      this.peer?.destroy();
    } catch {}
  }

  async _boot() {
    await loadPeerJS();
    const peer = (this.peer = new window.Peer(peerOptions()));
    peer.on('disconnected', () => {
      try {
        peer.reconnect();
      } catch {}
    });
    this.peerError = null;
    peer.on('error', (err) => this.peerError?.(err));
    await new Promise((resolve, reject) => {
      this.peerError = (err) => reject(new Error(friendly(err)));
      peer.once('open', resolve);
    });
    const ATTEMPTS = this.attempts;
    for (let i = 0; i < ATTEMPTS; i++) {
      const outcome = await this._attempt();
      if (outcome === 'open') return;
      if (outcome === 'gone') {
        // the host may still be registering with the broker: give it a few seconds
        if (i < ATTEMPTS - 1) {
          await sleep(1600);
          continue;
        }
        throw new Error('No session with that code. Check it and try again.');
      }
      throw new Error('Found the session but could not open a direct connection. If either of you is on a VPN or a strict network, add a TURN relay (see the README).');
    }
  }

  /** One try at reaching the host: 'open' | 'gone' (nobody has that code) | 'failed'. */
  _attempt() {
    return new Promise((resolve) => {
      const conn = this.peer.connect(PEER_PREFIX + this.code, { reliable: true, serialization: 'json' });
      let settled = false;
      const done = (v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.peerError = null;
        if (v !== 'open') {
          try {
            conn.close();
          } catch {}
        }
        resolve(v);
      };
      const timer = setTimeout(() => done('failed'), 20000);
      this.peerError = (err) => done(err?.type === 'peer-unavailable' ? 'gone' : 'failed');
      conn.on('open', () => {
        this.conn = conn;
        conn.on('data', (d) => this._message(typeof d === 'string' ? d : String(d)));
        const closed = () => this._closed();
        conn.on('close', closed);
        conn.on('error', closed);
        this.peerError = () => {};
        done('open');
        this._open();
      });
      conn.on('error', () => done('failed'));
      conn.on('close', () => done('failed'));
    });
  }

  send(s) {
    if (this.readyState === 1) {
      try {
        this.conn.send(s);
      } catch {}
    }
  }

  close() {
    try {
      this.conn?.close();
    } catch {}
    this._destroyPeer();
    this._closed();
  }
}

// ------------------------------------------------------------------ public

/**
 * A WebSocket-like socket to a session.
 * @param {'ws'|'p2p'} mode
 * @param {{ host?: boolean, code?: string, resume?: boolean }} intent
 *        host: create a session here · code: join/watch one · resume: we were here a moment ago
 */
export function openSocket(mode, { host = false, code = '', resume = false } = {}) {
  if (mode === 'ws') {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return new WebSocket(`${proto}://${location.host}/ws`);
  }
  return host ? new HostSocket() : new GuestSocket(code, { resume });
}
