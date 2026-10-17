// HARDLINE server: static files + one WebSocket endpoint for private two-player sessions.

import http from 'node:http';
import os from 'node:os';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createHub } from '../engine/hub.js';

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

// The project root doubles as the static site (it is also what gets published to GitHub Pages),
// so only the browser-facing parts of it are served: never server/, test/, docs/ or node_modules/.
const PUBLIC_DIRS = ['css', 'js', 'shared', 'engine', 'vendor'];
const PUBLIC_FILES = new Set(['index.html', 'cast.html', 'favicon.ico']);

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
  const hub = createHub();
  const sessions = hub.sessions;

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
      if (pathname === '/cast') pathname = '/cast.html'; // the TV screen
      if (pathname.endsWith('/')) pathname += 'index.html';
      const rel = pathname.replace(/^\/+/, '');
      const top = rel.split('/')[0];
      if (!(PUBLIC_DIRS.includes(top) && rel.includes('/')) && !PUBLIC_FILES.has(rel)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('not found');
      }
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403);
        return res.end('forbidden');
      }
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('not found');
      }
      let body = await readFile(file);
      // a Node server behind the page means plain WebSockets; on a static host this marker stays
      // an inert comment and the page falls back to peer-to-peer (see js/transport.js)
      if (file.endsWith('.html')) body = Buffer.from(body.toString('utf8').replace('<!--hardline:server-->', '<meta name="hardline-transport" content="ws">'));
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': rel.startsWith('vendor/') ? 'public, max-age=86400' : 'no-cache',
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

  wss.on('connection', (ws) => hub.attach(ws));

  // sweep abandoned sessions
  const sweep = setInterval(() => hub.sweep(), 60 * 1000);
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
          hub.closeAll();
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
