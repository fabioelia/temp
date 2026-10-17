// Captures full-quality screenshots of every room (both roles) into docs/screenshots/.
//   node test/e2e/screenshots.mjs        (or: npm run shots) — all rooms
//   node test/e2e/screenshots.mjs 4      — just room 5 (0-based index; 0-4 classic, 5-10 Deep Loop)
// Uses software WebGL, so it is slow (about a minute per room) but needs no GPU.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch, startGame, newPlayer, createAndJoin, startRun, sleep } from './lib.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });
const ROOMS = [
  ['1-lobby', 'cipher'],
  ['2-corridor', 'doors'],
  ['3-atrium', 'bullets'],
  ['4-switchboard', 'switchboard'],
  ['5-hardline', 'maze'],
  ['6-echo', 'echo'],
  ['7-vault', 'vault'],
  ['8-substation', 'grid'],
  ['9-signal-room', 'triangulate'],
  ['10-logic-wall', 'logic'],
  ['11-mosaic', 'mosaic'],
];
const NAMES = ROOMS.map((r) => r[0]);

const only = process.argv[2] === undefined ? null : Number(process.argv[2]);
const browser = await launch();
for (let room = 0; room < NAMES.length; room++) {
  if (only !== null && room !== only) continue;
  const srv = await startGame({ START_ROOM: ROOMS[room][1] });
  const a = await newPlayer(browser, srv, 'Trin');
  const b = await newPlayer(browser, srv, 'Wren');
  try {
    await createAndJoin(a, b, { hostRole: 'operator' });
    await startRun(a, b);
    await sleep(room === 0 ? 4000 : 3500);
    await a.page.screenshot({ path: path.join(OUT, `${NAMES[room]}-operator.jpg`), type: 'jpeg', quality: 82 });
    await b.page.screenshot({ path: path.join(OUT, `${NAMES[room]}-mentor.jpg`), type: 'jpeg', quality: 82 });
    console.log('captured', NAMES[room], [...a.errors, ...b.errors].length ? `(errors: ${[...a.errors, ...b.errors].join(' | ')})` : '');
  } catch (e) {
    console.log('FAILED', NAMES[room], e.message.split('\n')[0], '| page errors:', [...a.errors, ...b.errors].join(' | ') || 'none');
    console.log('   brief-wait:', await a.page.evaluate(() => document.getElementById('brief-wait')?.textContent).catch(() => '?'), '| boot:', await a.page.evaluate(() => document.getElementById('boot-text')?.textContent + ' ' + document.getElementById('boot-pct')?.textContent).catch(() => '?'));
  } finally {
    await a.ctx.close();
    await b.ctx.close();
    await srv.close();
  }
}
await browser.close();
