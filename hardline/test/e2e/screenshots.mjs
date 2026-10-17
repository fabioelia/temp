// Captures full-quality screenshots of every room (both roles) into docs/screenshots/.
//   node test/e2e/screenshots.mjs        (or: npm run shots)
// Uses software WebGL, so it is slow (about a minute per room) but needs no GPU.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch, startGame, newPlayer, createAndJoin, startRun, sleep } from './lib.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });
const NAMES = ['1-lobby', '2-corridor', '3-atrium', '4-switchboard', '5-hardline'];

const browser = await launch();
for (let room = 0; room < NAMES.length; room++) {
  const srv = await startGame({ START_ROOM: String(room) });
  const a = await newPlayer(browser, srv, 'Trin');
  const b = await newPlayer(browser, srv, 'Wren');
  try {
    await createAndJoin(a, b, { hostRole: 'operator' });
    await startRun(a, b);
    await sleep(room === 0 ? 4000 : 3500);
    await a.page.screenshot({ path: path.join(OUT, `${NAMES[room]}-operator.jpg`), type: 'jpeg', quality: 82 });
    await b.page.screenshot({ path: path.join(OUT, `${NAMES[room]}-mentor.jpg`), type: 'jpeg', quality: 82 });
    console.log('captured', NAMES[room], [...a.errors, ...b.errors].length ? `(errors: ${[...a.errors, ...b.errors].join(' | ')})` : '');
  } finally {
    await a.ctx.close();
    await b.ctx.close();
    await srv.close();
  }
}
await browser.close();
