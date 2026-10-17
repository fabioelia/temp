// Shared helpers for driving two real browsers against the real server.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from '../../server/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const LOW = 'gfx=low&scale=0.6&maxdt=4';

export async function newPlayer(browser, srv, name, { viewport = { width: 1280, height: 720 }, seen = true, query = '' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  if (seen) await ctx.addInitScript(() => localStorage.setItem('hardline.seen.v1', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    else if (m.type() === 'warning' && /three|webgl/i.test(m.text())) errors.push(`warn: ${m.text().slice(0, 200)}`);
  });
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  return { name, ctx, page, errors, query, url: `http://127.0.0.1:${srv.port}/` };
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
  await Promise.all(players.map((p) => p.page.waitForSelector('#screen-game:not(.hidden)', { timeout: 15000 })));
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
