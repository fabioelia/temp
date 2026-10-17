// Shared helpers for driving two real browsers against the real server.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from '../../server/index.js';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ExpressPeerServer } from 'peer';

export const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
fs.mkdirSync(OUT, { recursive: true });

export async function launch() {
  return chromium.launch({
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
  });
}

export async function startGame(env = {}) {
  Object.assign(process.env, { SOLVE_HOLD_MS: '700', FAIL_RESET_MS: '2500', ...env });
  return createServer({ port: 0, host: '127.0.0.1' });
}

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATIC_MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain' };

/**
 * The game exactly as GitHub Pages would serve it: plain files under a sub-path
 * (/games/hardline/), nothing dynamic — plus a local PeerJS broker standing in for the public one,
 * so two browsers can find each other without the internet. There is no game server at all.
 */
export async function startStatic({ env = {}, root = process.env.HARDLINE_STATIC_ROOT || PROJECT, prefix = process.env.HARDLINE_STATIC_ROOT ? '/hardline/' : '/games/hardline/' } = {}) {
  const allowed = (rel) => ['index.html', 'cast.html'].includes(rel) || (/^(css|js|shared|engine|vendor)\//.test(rel) && !rel.includes('..'));
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let rel = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : null;
    if (rel !== null && (rel === '' || rel.endsWith('/'))) rel += 'index.html';
    const file = rel !== null && allowed(rel) ? path.join(root, rel) : null;
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/html' });
      return res.end('<h1>404</h1>');
    }
    res.writeHead(200, { 'content-type': STATIC_MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  const app = express();
  const broker = app.listen(0, '127.0.0.1');
  await new Promise((r) => broker.once('listening', r));
  app.use('/', ExpressPeerServer(broker, { path: '/' }));
  const peerOpts = { host: '127.0.0.1', port: broker.address().port, path: '/', secure: false, config: { iceServers: [] } };

  const port = server.address().port;
  return {
    isStatic: true,
    port,
    base: `http://127.0.0.1:${port}${prefix}`,
    peerOpts,
    env: { SOLVE_HOLD_MS: '700', FAIL_RESET_MS: '2500', ...env },
    close: () => new Promise((r) => server.close(() => broker.close(() => r()))),
  };
}

export const LOW = 'gfx=low&scale=0.6&maxdt=4';

export async function newPlayer(browser, srv, name, { viewport = { width: 1280, height: 720 }, seen = true, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  if (seen) await ctx.addInitScript(() => { try { localStorage.setItem('hardline.seen.v1', '1'); } catch {} });
  if (srv.isStatic) {
    await ctx.addInitScript(({ peerOpts, env }) => {
      window.PEERJS_OPTS = peerOpts;
      window.HARDLINE_ENV = env;
    }, { peerOpts: srv.peerOpts, env: srv.env });
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    else if (m.type() === 'warning' && /three|webgl/i.test(m.text())) errors.push(`warn: ${m.text().slice(0, 200)}`);
  });
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  return { name, ctx, page, errors, query, url: srv.base ?? `http://127.0.0.1:${srv.port}/` };
}

export async function createAndJoin(host, guest, { hostRole = 'operator' } = {}) {
  await host.page.goto(host.url + (host.query ? `?${host.query}` : ''));
  await host.page.fill('#in-name', host.name);
  await host.page.click('#btn-create');
  await host.page.waitForSelector('#screen-lobby:not(.hidden)');
  const code = (await host.page.textContent('#lobby-code')).trim();
  await guest.page.goto(`${guest.url}?join=${code}${guest.query ? `&${guest.query}` : ''}`);
  await guest.page.fill('#in-name', guest.name);
  await guest.page.click('#btn-join');
  await guest.page.waitForSelector('#screen-lobby:not(.hidden)');
  await host.page.click(`#seg-pref button[data-v="${hostRole}"]`);
  await host.page.waitForFunction(() => !document.querySelector('#btn-start').disabled);
  return code;
}

/** Start the run and get both players through the interstitial into the room. */
export async function startRun(host, guest) {
  await host.page.click('#btn-start');
  await enterRoom(host, guest);
}

export async function enterRoom(...players) {
  await Promise.all(
    players.map(async (p) => {
      await p.page.waitForSelector('#screen-brief:not(.hidden)', { timeout: 15000 });
      await p.page.waitForSelector('#btn-skip:not(.hidden)', { timeout: 15000 }).then(() => p.page.click('#btn-skip')).catch(() => {});
      await p.page.waitForSelector('#btn-ready:not(.hidden)', { timeout: 60000 });
      await p.page.click('#btn-ready');
    })
  );
  await Promise.all(players.map((p) => p.page.waitForSelector('#screen-game:not(.hidden)', { timeout: 45000 })));
}

export async function shot(p, name) {
  const file = path.join(OUT, `${name}.png`);
  await p.page.screenshot({ path: file });
  return file;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Click a named hotspot of the current Operator room (rooms expose `hot`). */
export async function clickHot(p, name, { move = true } = {}) {
  await p.page.evaluate(() => {
    const { app } = window.__hl;
    app.stage.rig.par = { x: 0, y: 0, look: 0 }; // keep the camera still so projected points stay true
    // let the renderer catch up so the camera we project with is the one we click through
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
  });
  const pt = await p.page.evaluate((n) => {
    const { app } = window.__hl;
    const o = app.room.hot[n];
    if (!o) return null;
    return app.stage.screenPos(o);
  }, name);
  if (!pt) throw new Error(`no hotspot ${name}`);
  if (move) {
    await p.page.mouse.move(pt.x, pt.y);
    await sleep(120);
  }
  await p.page.mouse.click(pt.x, pt.y);
  return pt;
}

/** The two players, resolved by role. */
export function byRole(a, b) {
  return Promise.all([a, b].map(async (p) => ({ p, role: await p.page.evaluate(() => window.__hl.app.role) }))).then((rs) => ({
    operator: rs.find((r) => r.role === 'operator').p,
    mentor: rs.find((r) => r.role === 'mentor').p,
  }));
}
