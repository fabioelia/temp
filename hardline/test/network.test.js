import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import WebSocket from 'ws';
import { createServer, lanAddresses } from '../server/index.js';

// The server must be reachable on every interface, not just localhost, so a friend on the
// same network can play via your local IP.

const hasIPv6Loopback = Object.values(os.networkInterfaces()).flat().some((a) => a && a.family === 'IPv6' && a.internal);

test('default settings listen on all interfaces: reachable by LAN address and loopback', async (t) => {
  const srv = await createServer({ port: 0 }); // no host given: use the default
  t.after(() => srv.close());
  assert.ok(['::', '0.0.0.0'].includes(srv.host), `bound to ${srv.host}`);

  const targets = ['127.0.0.1', ...lanAddresses()];
  for (const ip of targets) {
    const res = await fetch(`http://${ip}:${srv.port}/healthz`);
    assert.equal(res.status, 200, `GET via ${ip}`);
    const page = await fetch(`http://${ip}:${srv.port}/`);
    assert.match(await page.text(), /HARDLINE/, `index page via ${ip}`);
  }
  console.log('    reachable via:', targets.join(', '));
});

test('the game protocol works over the LAN address, not just localhost', async (t) => {
  const srv = await createServer({ port: 0 });
  t.after(() => srv.close());
  const ip = lanAddresses()[0] ?? '127.0.0.1';
  const ws = new WebSocket(`ws://${ip}:${srv.port}/ws`);
  const joined = await new Promise((resolve, reject) => {
    ws.on('open', () => ws.send(JSON.stringify({ t: 'create', name: 'LanTester' })));
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.t === 'joined') resolve(m);
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('no reply over ' + ip)), 4000);
  });
  assert.match(joined.code, /^[A-Z]{4}$/);
  ws.close();
});

test('/api/lan reports this machine\'s network addresses for invite links', async (t) => {
  const srv = await createServer({ port: 0 });
  t.after(() => srv.close());
  const j = await (await fetch(`http://127.0.0.1:${srv.port}/api/lan`)).json();
  assert.equal(j.port, srv.port);
  assert.deepEqual(j.addresses, lanAddresses());
  for (const a of j.addresses) assert.match(a, /^\d+\.\d+\.\d+\.\d+$/);
});

test('IPv6 loopback works too when the machine has it (so "localhost" works however it resolves)', { skip: !hasIPv6Loopback }, async (t) => {
  const srv = await createServer({ port: 0 });
  t.after(() => srv.close());
  if (srv.host !== '::') return; // fell back to IPv4-only
  const res = await fetch(`http://[::1]:${srv.port}/healthz`);
  assert.equal(res.status, 200);
});

test('an explicit HOST still wins (e.g. bind to loopback only)', async (t) => {
  const srv = await createServer({ port: 0, host: '127.0.0.1' });
  t.after(() => srv.close());
  assert.equal(srv.host, '127.0.0.1');
  const lan = lanAddresses()[0];
  if (lan) await assert.rejects(fetch(`http://${lan}:${srv.port}/healthz`), 'loopback-only must not answer on the LAN address');
});
