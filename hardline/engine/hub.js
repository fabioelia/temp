// The lobby and connection logic, independent of how bytes reach it. A "socket" is anything with
// the small subset of the `ws` API used below: send(string), close(), readyState (1 = open),
// and on('message' | 'close' | 'error', fn).
//
// Two things host a Hub:
//   - server/index.js   — a Node process, sockets are WebSockets (LAN play)
//   - js/transport.js   — the host player's browser tab, sockets are WebRTC data channels, so the
//                         game can be published as plain static files (GitHub Pages)

import { Session } from './session.js';
import { CODE_ALPHABET } from '../shared/rooms.js';

/**
 * @param {object} [opts]
 * @param {string}  [opts.fixedCode]   use this session code instead of a random one (browser host:
 *                                     the code is also the peer id, so it is chosen first)
 * @param {boolean} [opts.localOnlyCreate] only sockets attached with { local: true } may create a
 *                                     session (a browser host is its own server; guests only join)
 */
export function createHub({ fixedCode = null, localOnlyCreate = false } = {}) {
  const sessions = new Map();

  function newCode() {
    if (fixedCode && !sessions.has(fixedCode)) return fixedCode;
    for (let i = 0; i < 50; i++) {
      let code = '';
      for (let j = 0; j < 4; j++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      if (!sessions.has(code)) return code;
    }
    throw new Error('no free session codes');
  }

  const find = (code) => sessions.get(String(code ?? '').toUpperCase().trim());

  function attach(ws, { local = false } = {}) {
    let session = null;
    let player = null;
    let watching = null; // { session, sp } when this socket is a read-only TV screen
    let budget = 60;
    const refill = setInterval(() => (budget = 60), 1000);
    const reply = (msg) => ws.send(JSON.stringify(msg));
    const fail = (code, message) => reply({ t: 'error', code, message });

    ws.on('message', (raw) => {
      if (--budget < 0) return;
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg.t !== 'string') return;

      if (watching) {
        // spectators are strictly read-only
        if (msg.t === 'ping') reply({ t: 'pong' });
        return;
      }

      if (!session) {
        if (msg.t === 'spectate') {
          const s = find(msg.code);
          if (!s) return fail('no_session', 'No session with that code. Check it and try again.');
          const sp = s.addSpectator(ws);
          if (!sp) return fail('too_many', 'That session already has as many TV screens as it can serve.');
          watching = { session: s, sp };
          reply({ t: 'spectating', code: s.code });
          s.sendSpecSnapshot(sp);
          return;
        }
        if (msg.t === 'create') {
          if (localOnlyCreate && !local) return fail('no_create', 'This session is hosted by someone else. Join it with its code.');
          session = new Session(newCode(), (s) => sessions.delete(s.code));
          sessions.set(session.code, session);
          player = session.addPlayer(ws, msg.name);
          reply({ t: 'joined', code: session.code, token: player.token, id: player.id });
          session.sendLobby();
        } else if (msg.t === 'join') {
          const s = find(msg.code);
          if (!s) return fail('no_session', 'No session with that code. Check it and try again.');
          const p = s.addPlayer(ws, msg.name);
          if (!p) return fail('session_full', s.phase === 'lobby' ? 'That session already has two players.' : 'That run is already underway.');
          session = s;
          player = p;
          reply({ t: 'joined', code: s.code, token: p.token, id: p.id });
          s.sendLobby();
        } else if (msg.t === 'resume') {
          const s = find(msg.code);
          const p = s?.players.find((q) => q.token === msg.token);
          if (!s || !p) return fail('no_session', 'That session has ended.');
          session = s;
          player = p;
          reply({ t: 'joined', code: s.code, token: p.token, id: p.id, resumed: true });
          s.reconnect(p, ws);
        } else if (msg.t === 'ping') {
          reply({ t: 'pong' });
        }
        return;
      }
      session.handle(player, msg);
    });

    ws.on('close', () => {
      clearInterval(refill);
      if (watching) watching.session.removeSpectator(watching.sp);
      if (session && player) session.disconnect(player, ws);
    });
    ws.on('error', () => {});
  }

  /** Drop sessions nobody has been connected to for a while. */
  function sweep(maxIdleMs = 15 * 60 * 1000) {
    const now = Date.now();
    for (const s of sessions.values()) {
      if (!s.connectedCount && now - s.lastActive > maxIdleMs) {
        s.resetRun();
        sessions.delete(s.code);
      }
    }
  }

  function closeAll() {
    for (const s of sessions.values()) s.resetRun();
    sessions.clear();
  }

  return { sessions, attach, sweep, closeAll };
}
