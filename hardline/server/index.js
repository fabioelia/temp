// HARDLINE server: static files + one WebSocket endpoint for private two-player sessions.

import http from 'node:http';
import os from 'node:os';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Session } from './session.js';
import { CODE_ALPHABET } from '../shared/rooms.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
// '::' listens on every IPv4 *and* IPv6 interface (so localhost works however it resolves,
// and so does your LAN address). Where IPv6 is unavailable we fall back to '0.0.0.0'.
const HOST = process.env.HOST || '::';

/** Non-loopback IPv4 addresses of this machine, i.e. what a friend on your network would use. */
export function lanAddresses() {
  const out = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs ?? []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  return out;
}

const MOUNTS = [
  ['/vendor/three/', path.join(ROOT, 'node_modules/three/')],
  ['/shared/', path.join(ROOT, 'shared/')],
  ['/', path.join(ROOT, 'public/')],
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

export function createServer({ port = PORT, host = HOST } = {}) {
  const sessions = new Map();

  function newCode() {
    for (let i = 0; i < 50; i++) {
      let code = '';
      for (let j = 0; j < 4; j++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      if (!sessions.has(code)) return code;
    }
    throw new Error('no free session codes');
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/healthz') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, sessions: sessions.size }));
      }
      if (url.pathname === '/api/lan') {
        // lets the lobby build an invite link a friend on your network can actually open
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        return res.end(JSON.stringify({ port: server.address()?.port, addresses: lanAddresses() }));
      }
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const mount = MOUNTS.find(([prefix]) => pathname.startsWith(prefix));
      const file = path.normalize(path.join(mount[1], pathname.slice(mount[0].length)));
      if (!file.startsWith(mount[1])) {
        res.writeHead(403);
        return res.end('forbidden');
      }
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('not found');
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': file.includes('node_modules') ? 'public, max-age=86400' : 'no-cache',
        'x-content-type-options': 'nosniff',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end('server error');
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });
  // ws re-emits the HTTP server's errors (e.g. a failed IPv6 bind); listen() below handles them
  wss.on('error', () => {});

  wss.on('connection', (ws) => {
    let session = null;
    let player = null;
    let budget = 60;
    const refill = setInterval(() => (budget = 60), 1000);

    const fail = (code, message) => ws.send(JSON.stringify({ t: 'error', code, message }));

    ws.on('message', (raw) => {
      if (--budget < 0) return;
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg.t !== 'string') return;

      if (!session) {
        if (msg.t === 'create') {
          session = new Session(newCode(), (s) => sessions.delete(s.code));
          sessions.set(session.code, session);
          player = session.addPlayer(ws, msg.name);
          ws.send(JSON.stringify({ t: 'joined', code: session.code, token: player.token, id: player.id }));
          session.sendLobby();
        } else if (msg.t === 'join') {
          const s = sessions.get(String(msg.code ?? '').toUpperCase().trim());
          if (!s) return fail('no_session', 'No session with that code. Check it and try again.');
          const p = s.addPlayer(ws, msg.name);
          if (!p) return fail('session_full', s.phase === 'lobby' ? 'That session already has two players.' : 'That run is already underway.');
          session = s;
          player = p;
          ws.send(JSON.stringify({ t: 'joined', code: s.code, token: p.token, id: p.id }));
          s.sendLobby();
        } else if (msg.t === 'resume') {
          const s = sessions.get(String(msg.code ?? '').toUpperCase().trim());
          const p = s?.players.find((q) => q.token === msg.token);
          if (!s || !p) return fail('no_session', 'That session has ended.');
          session = s;
          player = p;
          ws.send(JSON.stringify({ t: 'joined', code: s.code, token: p.token, id: p.id, resumed: true }));
          s.reconnect(p, ws);
        } else if (msg.t === 'ping') {
          ws.send(JSON.stringify({ t: 'pong' }));
        }
        return;
      }
      session.handle(player, msg);
    });

    ws.on('close', () => {
      clearInterval(refill);
      if (session && player) session.disconnect(player, ws);
    });
    ws.on('error', () => {});
  });

  // sweep abandoned sessions
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const s of sessions.values()) {
      if (!s.connectedCount && now - s.lastActive > 15 * 60 * 1000) {
        s.resetRun();
        sessions.delete(s.code);
      }
    }
  }, 60 * 1000);
  sweep.unref();

  const listen = (h) =>
    new Promise((resolve, reject) => {
      const onError = (err) => reject(err);
      server.once('error', onError);
      server.listen(port, h, () => {
        server.off('error', onError);
        resolve(h);
      });
    });

  return (async () => {
    let boundHost;
    try {
      boundHost = await listen(host);
    } catch (err) {
      // no IPv6 on this machine: fall back to all IPv4 interfaces
      if (host === '::' && ['EAFNOSUPPORT', 'EADDRNOTAVAIL', 'EINVAL'].includes(err.code)) boundHost = await listen('0.0.0.0');
      else throw err;
    }
    return {
      server,
      wss,
      sessions,
      host: boundHost,
      port: server.address().port,
      close: () =>
        new Promise((r) => {
          clearInterval(sweep);
          for (const s of sessions.values()) s.resetRun();
          for (const c of wss.clients) c.terminate();
          wss.close(() => server.close(() => r()));
        }),
    };
  })();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().then(({ port, host }) => {
    const lan = lanAddresses();
    console.log(`\n  HARDLINE is live (listening on ${host === '::' ? 'all interfaces, IPv4 + IPv6' : host}, port ${port})\n`);
    console.log(`  This computer   http://localhost:${port}`);
    for (const ip of lan) console.log(`  On your network http://${ip}:${port}   <- send this to your partner`);
    if (!lan.length) console.log('  (no network connection found; only this computer can reach it)');
    console.log('\n  Open it in two browsers, start a Discord call, and jack in.');
    console.log('  If a friend cannot connect, allow Node through your firewall for this port.\n');
  });
}
