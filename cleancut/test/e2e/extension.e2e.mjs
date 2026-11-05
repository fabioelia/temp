// End-to-end: loads the built extension into Chromium, serves a community dataset
// as static files (the way GitHub Pages does), plays the demo "episode" and checks
// that scenes are really skipped, muted and blurred.
//
//   npm run test:e2e
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { buildDataset } from '../../shared/dataset.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = fileURLToPath(new URL('../../', import.meta.url));
const ext = join(root, 'extension/dist/chrome');
const PORT = 8787; // demo page server
const BASE = `http://localhost:${PORT}`;
const DATA_PORT = 8788; // static dataset (the extension is built with CLEANCUT_DATA_BASE pointing here)
const tmp = mkdtempSync(join(tmpdir(), 'cleancut-e2e-'));

if (!existsSync(join(root, 'server/public/demo.webm'))) execFileSync('sh', [join(root, 'scripts/make-demo-video.sh')], { stdio: 'inherit' });

const server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', join(root, 'server/src/index.js')], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', CLEANCUT_DB: join(tmp, 'e2e.db') },
  stdio: ['ignore', 'pipe', 'inherit'],
});
let context;
let dataServer;
const results = [];

async function step(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok  ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push({ name, ok: false });
    console.log(`  FAIL ${name}\n       ${e.message.split('\n').join('\n       ')}`);
  }
}

async function waitFor(fn, { timeout = 10_000, interval = 100, what = 'condition' } = {}) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`timed out waiting for ${what}`);
}

try {
  // ---- dataset + servers ------------------------------------------------------------
  const demo = { platform: 'web', platformId: 'demo-episode-1', series: 'CleanCut Demo', season: 1, episode: 1, name: 'Pilot', duration: 90 };
  const { files, errors: dataErrors } = buildDataset({
    titles: [{ path: 'titles/web/e2e.json', json: { title: demo, segments: [
      { start: 20, end: 30, category: 'violence', severity: 3, note: 'sword fight' },
      { start: 70, end: 75, category: 'gore', severity: 3 },
    ] } }],
    lists: [{ path: 'lists/demo-everything-goes.json', json: { name: 'Demo: everything goes', author: 'e2e', settings: { preset: 'unfiltered' }, title: { platform: 'web', platformId: 'demo-episode-1' } } }],
  });
  assert.deepEqual(dataErrors, []);
  const dataDir = join(tmp, 'data');
  for (const [path, json] of Object.entries(files)) {
    mkdirSync(dirname(join(dataDir, 'v1', path)), { recursive: true });
    writeFileSync(join(dataDir, 'v1', path), JSON.stringify(json));
  }
  const dataRequests = [];
  dataServer = createServer((req, res) => {
    dataRequests.push(req.url);
    res.setHeader('Access-Control-Allow-Origin', '*'); // GitHub Pages does the same
    try {
      const body = readFileSync(join(dataDir, new URL(req.url, 'http://x').pathname));
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end('not found');
    }
  });
  await new Promise((r) => dataServer.listen(DATA_PORT, '127.0.0.1', r));
  await waitFor(() => fetch(`${BASE}/health`).then((r) => r.ok, () => false), { what: 'demo server' });

  // ---- browser with the extension ----------------------------------------------
  context = await chromium.launchPersistentContext(join(tmp, 'profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--autoplay-policy=no-user-gesture-required'],
  });
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(worker.url()).host;
  const setSettings = (patch) => worker.evaluate(async (p) => {
    const { settings } = await chrome.storage.sync.get('settings');
    await chrome.storage.sync.set({ settings: { ...settings, ...p, profile: { ...settings.profile, ...(p.profile || {}) } } });
  }, patch);
  await waitFor(() => worker.evaluate(() => chrome.storage.sync.get('settings').then((s) => !!s.settings)), { what: 'default settings' });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  async function openDemo(query = '') {
    await page.goto(`${BASE}/demo${query}`);
    await page.waitForSelector('cleancut-overlay', { state: 'attached', timeout: 10_000 });
    await page.waitForFunction(() => document.getElementById('v').readyState >= 2);
  }
  const playFrom = (t) => page.evaluate(async (t) => {
    const v = document.getElementById('v');
    window.cleancutDemoEvents.length = 0;
    v.currentTime = t;
    await v.play();
  }, t);
  const events = () => page.evaluate(() => window.cleancutDemoEvents.map(({ type, from, to }) => ({ type, from, to })));
  const badge = () => page.evaluate(() => document.querySelector('cleancut-overlay').shadowRoot.querySelector('.badge').textContent);
  const autoSeeks = async () => (await events()).filter((e) => e.type === 'seek').slice(1); // [0] is our own playFrom seek

  console.log('CleanCut e2e');
  await openDemo();

  await step('identifies the title and builds a PG-13 plan from tags + subtitle scan', async () => {
    const text = await waitFor(async () => {
      const b = await badge();
      return /4 cuts/.test(b) && b;
    }, { what: 'badge with 4 cuts' });
    assert.match(text, /PG-13/);
  });

  await step('skips a community-tagged violent scene (0:20–0:30)', async () => {
    await playFrom(17.5);
    const seek = await waitFor(async () => (await autoSeeks()).find((s) => s.to >= 29.9), { what: 'skip past 0:30' });
    assert.ok(seek.from < 20.5, `skipped from ${seek.from}`);
    assert.ok(seek.to < 31, `landed at ${seek.to}`);
  });

  await step('skips an untagged sex scene found by scan-ahead SDH analysis (0:44–0:52)', async () => {
    await playFrom(40);
    const seek = await waitFor(async () => (await autoSeeks()).find((s) => s.to >= 51.5), { what: 'skip past 0:51' });
    assert.ok(seek.from < 44, `skipped from ${seek.from}`);
  });

  await step('mutes strong language found in subtitles (1:00–1:02), then unmutes', async () => {
    await playFrom(58.5);
    await waitFor(async () => (await events()).some((e) => e.type === 'muted'), { what: 'mute' });
    await waitFor(async () => (await events()).some((e) => e.type === 'unmuted'), { what: 'unmute' });
    assert.equal(await page.evaluate(() => document.getElementById('v').muted), false);
  });

  await step('skips tagged gore (1:10–1:15)', async () => {
    await playFrom(68);
    await waitFor(async () => (await autoSeeks()).find((s) => s.to >= 74.9), { what: 'skip past 1:15' });
  });

  await step('"blur" action blurs instead of skipping', async () => {
    await setSettings({ profile: { actions: { violence: 'blur' } } });
    await page.waitForTimeout(300);
    await playFrom(19);
    await waitFor(async () => (await events()).some((e) => e.type === 'blurred'), { what: 'blur' });
    assert.equal((await autoSeeks()).length, 0, 'should not seek when blurring');
    await waitFor(async () => (await events()).some((e) => e.type === 'unblurred'), { timeout: 15_000, what: 'unblur after 0:30' });
    await setSettings({ profile: { actions: { violence: 'skip' } } });
  });

  await step('stricter and looser ratings change the cut', async () => {
    await setSettings({ profile: { preset: 'unfiltered' } });
    await waitFor(async () => /0 cuts/.test(await badge()), { what: 'unfiltered → 0 cuts' });
    await setSettings({ profile: { preset: 'R' } });
    // R keeps the violence and the language but cuts strong sex and gore.
    await waitFor(async () => /2 cuts/.test(await badge()), { what: 'R → 2 cuts' });
    await setSettings({ profile: { preset: 'PG-13' } });
    await waitFor(async () => /4 cuts/.test(await badge()), { what: 'back to 4 cuts' });
  });

  await step('Undo lets a skipped scene play', async () => {
    await playFrom(17.5);
    await waitFor(async () => (await autoSeeks()).find((s) => s.to >= 29.9), { what: 'skip' });
    await page.locator('cleancut-overlay .toast button', { hasText: 'Undo' }).first().click();
    const back = await waitFor(async () => (await autoSeeks()).find((s) => s.to < 21 && s.from > 25), { what: 'seek back to 0:20' });
    assert.ok(back);
    await page.waitForTimeout(1500);
    const t = await page.evaluate(() => document.getElementById('v').currentTime);
    assert.ok(t > 20 && t < 29, `now playing inside the scene at ${t}`);
  });

  await step('a published community skip list can be adopted', async () => {
    const index = await (await fetch(`http://127.0.0.1:${DATA_PORT}/v1/index.json`)).json();
    const list = index.lists.find((p) => p.name === 'Demo: everything goes');
    assert.ok(list, 'list is published in the index');
    // Store the list exactly as the popup's "Use" button does (background useList).
    await worker.evaluate(async (profile) => {
      const { activeLists = {} } = await chrome.storage.local.get('activeLists');
      activeLists['web:demo-episode-1'] = { id: profile.id, name: profile.name, settings: profile.settings, overrides: profile.overrides, scope: 'this title' };
      await chrome.storage.local.set({ activeLists });
    }, list);
    await waitFor(async () => /everything goes · 0 cuts/.test(await badge()), { what: 'list applied' });
    await worker.evaluate(() => chrome.storage.local.remove('activeLists'));
    await waitFor(async () => /4 cuts/.test(await badge()), { what: 'list removed' });
  });

  await step('tagging with Alt+[ / Alt+] saves a local tag that is applied immediately', async () => {
    await playFrom(4);
    await page.waitForTimeout(400);
    await page.keyboard.press('Alt+BracketLeft');
    await page.waitForTimeout(1200);
    await page.keyboard.press('Alt+BracketRight');
    const form = page.locator('cleancut-overlay .form');
    await form.waitFor();
    await form.locator('.chip', { hasText: 'Drugs & alcohol' }).click();
    await form.locator('.chip', { hasText: 'strong' }).click();
    await form.locator('.note').fill('e2e tag');
    await form.locator('.save').click();
    await page.locator('cleancut-overlay .toast', { hasText: 'Tag saved' }).waitFor();
    const tags = await worker.evaluate(() => chrome.storage.local.get('localTags').then((r) => r.localTags));
    const seg = tags['web:demo-episode-1'].segments[0];
    assert.equal(seg.category, 'drugs');
    assert.equal(seg.severity, 3);
    assert.ok(seg.start >= 3.5 && seg.end > seg.start, JSON.stringify(seg));
    await waitFor(async () => /5 cuts/.test(await badge()), { what: 'new tag in plan' });
  });

  await step('page hook finds the subtitle track from player JSON (Prime-style) and scans it', async () => {
    await worker.evaluate(() => chrome.storage.local.remove('localTags'));
    await openDemo('?mode=hook');
    assert.equal(await page.evaluate(() => document.querySelectorAll('track').length), 0);
    await waitFor(async () => /4 cuts/.test(await badge()), { what: 'badge with 4 cuts via hook' });
    await playFrom(58.5);
    await waitFor(async () => (await events()).some((e) => e.type === 'muted'), { what: 'mute from hooked subtitles' });
  });

  await step('popup renders without errors', async () => {
    const popup = await context.newPage();
    const perrs = [];
    popup.on('pageerror', (e) => perrs.push(e.message));
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForSelector('#presets button');
    assert.equal(await popup.locator('#presets button').count(), 6);
    await popup.locator('#presets button', { hasText: 'Custom' }).click();
    await popup.waitForSelector('#custom .cat-row');
    assert.equal(await popup.locator('#custom .cat-row').count(), 7);
    const options = await context.newPage();
    options.on('pageerror', (e) => perrs.push(e.message));
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.locator('#data-status', { hasText: '1 title and 1 skip list available' }).waitFor();
    assert.deepEqual(perrs, []);
    await popup.close();
    await options.close();
  });

  await step('only fetched the index and the one title file (no per-title requests for unknown titles)', async () => {
    const paths = [...new Set(dataRequests)];
    assert.ok(paths.includes('/v1/index.json'));
    assert.ok(paths.every((p) => p === '/v1/index.json' || /^\/v1\/titles\/web\/[0-9a-f]{16}\.json$/.test(p)), paths.join(', '));
  });

  await step('"Submit on GitHub" builds a pull-request link from a local tag', async () => {
    await worker.evaluate(() => chrome.storage.local.set({ localTags: { 'web:demo-episode-1': {
      title: { platform: 'web', platformId: 'demo-episode-1', series: 'CleanCut Demo', season: 1, episode: 1, name: 'Pilot' },
      segments: [{ id: 'local:x', start: 4, end: 9, category: 'drugs', severity: 3, source: 'local', note: 'e2e' }],
    } } }));
    const opts = await context.newPage();
    await opts.goto(`chrome-extension://${extensionId}/options.html`);
    const res = await opts.evaluate(() => chrome.runtime.sendMessage({ type: 'contributeTags', key: 'web:demo-episode-1' }));
    await opts.locator('#tag-titles button', { hasText: 'Submit on GitHub' }).waitFor();
    await opts.close();
    const url = new URL(res.url);
    assert.equal(url.hostname, 'github.com');
    assert.match(url.searchParams.get('filename'), /^community\/titles\/web\/\d{8}-[a-z0-9]{6}\.json$/);
    const file = JSON.parse(url.searchParams.get('value'));
    assert.equal(file.title.platformId, 'demo-episode-1');
    assert.equal(file.segments[0].category, 'drugs');
    assert.equal(file.segments[0].id, undefined);
  });

  await step('no page errors', async () => assert.deepEqual(errors, []));
} catch (e) {
  console.error(e);
  results.push({ name: 'setup', ok: false });
} finally {
  await context?.close();
  server.kill();
  dataServer?.close();
  rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
