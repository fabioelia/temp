// Full end-to-end: two real Chromium sessions, the real server, every room played
// through the real UI (clicking real 3D hotspots), with a deliberate mistake in
// each room. Screenshots land in test/e2e/out/.
//
//   node test/e2e/run.mjs            # everything
//   node test/e2e/run.mjs resilience # only the reconnect + timeout scenarios

import { launch, startGame, newPlayer, createAndJoin, startRun, enterRoom, shot, sleep, clickHot, byRole, LOW } from './lib.mjs';
import { solvers, localise, mazeRoute, bulletCells } from '../solvers.js';

const only = process.argv[2];
const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${extra ? `  — ${extra}` : ''}`);
}

const get = (p, fn, arg) => p.page.evaluate(fn, arg);
const appView = (p) => get(p, () => JSON.parse(JSON.stringify(window.__hl.app.view)));
const fxCount = (p) => get(p, () => window.__hl.app.fxCount ?? 0);
const strikes = (p) => get(p, () => window.__hl.app.strikes);
const stageIdx = (p) => get(p, () => window.__hl.app.stageIdx);
const timerText = (p) => get(p, () => document.getElementById('hud-timer').textContent);

async function waitIdle(p, timeout = 40000) {
  await p.page.waitForFunction(() => window.__hl.app.room && window.__hl.app.room.idle === true, null, { timeout });
  await sleep(150);
}
async function waitFxCount(p, n, timeout = 20000) {
  await p.page.waitForFunction((n) => (window.__hl.app.fxCount ?? 0) >= n, n, { timeout });
}
async function waitScreen(p, id, timeout = 30000) {
  await p.page.waitForSelector(`#${id}:not(.hidden)`, { timeout });
}

/** Do `action` on the operator and wait for the server's reply on both sides. */
async function act(op, mentor, fn) {
  const [a, b] = await Promise.all([fxCount(op), fxCount(mentor)]);
  await fn();
  await Promise.all([waitFxCount(op, a + 1), waitFxCount(mentor, b + 1)]);
  return (await get(op, () => window.__hl.app.fxLog.at(-1)));
}

// -------------------------------------------------------------------- rooms

const rooms = {
  async cipher(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const right = solvers.cipher({ operator: ov, mentor: mv }).code;
      const typeCode = async (code) => {
        for (const d of code) await clickHot(op, `key:${d}`);
        await clickHot(op, 'key:OK');
      };
      if (stage === 0) {
        const t0 = await timerText(op);
        const wrong = right === '000' ? '111' : '000';
        const fx = await act(op, me, () => typeCode(wrong));
        check('cipher: wrong code is rejected with a strike on both screens', fx.result === 'wrong' && (await strikes(op)) === 1 && (await strikes(me)) === 1);
        check('cipher: HUD strike pip rendered', (await get(op, () => document.querySelectorAll('#hud-strikes i').length)) === 1);
        await shot(op, 'e2e-cipher-wrong');
        await waitIdle(op);
      }
      const fx = await act(op, me, () => typeCode(right));
      check(`cipher: door ${stage + 1}/3 opens with the right code`, fx.result === (stage === 2 ? 'solved' : 'stage'));
      if (stage === 0) await shot(op, 'e2e-cipher-opening');
      if (stage < 2) await sleep(300);
    }
  },

  async doors(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const right = solvers.doors({ operator: ov, mentor: mv }).door;
      if (stage === 0) await shot(op, 'e2e-doors-row1');
      if (stage === 1) {
        const wrong = ov.doors.findIndex((_, i) => i !== right);
        const fx = await act(op, me, () => clickHot(op, `door:${wrong}`));
        check('doors: a wrong door costs a strike and is struck off', fx.result === 'wrong');
        await sleep(600);
        await shot(op, 'e2e-doors-wrong');
        await waitIdle(op);
      }
      const fx = await act(op, me, () => clickHot(op, `door:${right}`));
      check(`doors: row ${stage + 1}/3 passes through the safe door`, fx.result === (stage === 2 ? 'solved' : 'stage'));
    }
  },

  async bullets(op, me) {
    for (let round = 0; round < 3; round++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const { safe, unsafe } = bulletCells(ov, mv);
      if (round === 0) await shot(op, 'e2e-bullets-frozen');
      if (round === 1) {
        const c = unsafe[0];
        const fx = await act(op, me, () => clickHot(op, `cell:${c.col},${c.row}`));
        check('bullets: dodging into a landing cell gets you hit (strike, rewind)', fx.result === 'wrong');
        await sleep(500);
        await shot(op, 'e2e-bullets-hit');
        await waitIdle(op);
      }
      const c = safe[0];
      const fx = await act(op, me, () => clickHot(op, `cell:${c.col},${c.row}`));
      check(`bullets: volley ${round + 1}/3 dodged`, fx.result === (round === 2 ? 'solved' : 'stage'));
      if (round === 0) {
        await sleep(450);
        await shot(op, 'e2e-bullets-thaw');
      }
    }
  },

  async switchboard(op, me) {
    for (let round = 0; round < 3; round++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      if (round === 0) await shot(op, 'e2e-switchboard-start');
      const done = new Set();
      let first = true;
      while (done.size < ov.cables.length) {
        const sol = solvers.switchboard({ operator: { ...ov, __done: done }, mentor: mv });
        if (round === 1 && first) {
          const wrongJack = ov.jacks.findIndex((_, i) => i !== sol.jack);
          await clickHot(op, `cable:${sol.__cable}`);
          await sleep(700);
          const fx = await act(op, me, () => clickHot(op, `jack:${wrongJack}`));
          check('switchboard: plugging the wrong jack sparks and costs a strike', fx.result === 'wrong');
          await sleep(1400);
          await shot(op, 'e2e-switchboard-wrong');
          await waitIdle(op);
        } else {
          await clickHot(op, `cable:${sol.__cable}`);
          await sleep(700);
        }
        first = false;
        if (round === 0 && done.size === 1) await shot(op, 'e2e-switchboard-plugged');
        const fx = await act(op, me, () => clickHot(op, `jack:${sol.jack}`));
        done.add(sol.__cable);
        await waitIdle(op);
        if (fx.result === 'stage' || fx.result === 'solved') {
          check(`switchboard: board ${round + 1}/3 fully wired`, fx.result === (round === 2 ? 'solved' : 'stage'));
          break;
        }
      }
    }
  },

  async maze(op, me) {
    await waitIdle(op);
    const mentorView = await appView(me);
    let opView = await appView(op);
    const loc = localise(opView, mentorView);
    check('maze: mentor can pin the operator down from the 3x3 patch (unique match)', loc.candidates.length === 1);
    await shot(op, 'e2e-maze-start');
    await shot(me, 'e2e-maze-map');
    const route = mazeRoute(mentorView, { x: loc.candidates[0].x, y: loc.candidates[0].y });
    let i = 0;
    for (const dir of route) {
      const fx = await act(op, me, () => clickHot(op, `move:${dir}`));
      if (fx.result !== 'move') check(`maze: step ${i} moved`, false, fx.result);
      await waitIdle(op);
      if (++i === Math.floor(route.length / 2)) await shot(op, 'e2e-maze-mid');
    }
    await shot(op, 'e2e-maze-exit');
    const fx = await act(op, me, () => clickHot(op, 'phone'));
    check('maze: picking up the phone finishes the run', fx.result === 'solved');
  },
};

// ---------------------------------------------------------------- scenarios

async function fullRun(browser, srv) {
  console.log('\n● Full playthrough');
  const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
  const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
  try {
    await createAndJoin(a, b, { hostRole: 'operator' });
    await shot(a, 'e2e-lobby');
    check('lobby: both players seated', (await get(a, () => document.querySelectorAll('#screen-lobby .slot.on').length)) === 2);
    await a.page.click('#btn-start');
    const order = ['cipher', 'doors', 'bullets', 'switchboard', 'maze'];
    let prevOpName = null;
    for (let r = 0; r < order.length; r++) {
      if (r === 0) {
        await Promise.all([a, b].map((p) => waitScreen(p, 'screen-brief')));
        await shot(a, 'e2e-interstitial');
      }
      await enterRoom(a, b);
      const { operator, mentor } = await byRole(a, b);
      check(`room ${r + 1} (${order[r]}): roles are opposite and the room is live`, operator !== mentor && (await get(operator, () => !!window.__hl.app.stage)));
      if (prevOpName) check(`room ${r + 1}: roles swapped since last room`, operator.name !== prevOpName);
      prevOpName = operator.name;
      await sleep(1500);
      await shot(operator, `e2e-room${r + 1}-operator`);
      await shot(mentor, `e2e-room${r + 1}-mentor`);
      await rooms[order[r]](operator, mentor);
      if (r < order.length - 1) await Promise.all([a, b].map((p) => waitScreen(p, 'screen-brief', 40000)));
    }
    await Promise.all([a, b].map((p) => waitScreen(p, 'screen-end', 40000)));
    await a.page.waitForSelector('#end-stats:not(.hidden)', { timeout: 60000 });
    await sleep(400);
    await shot(a, 'e2e-ending');
    const rowsN = await get(a, () => document.querySelectorAll('#end-stats tbody tr').length);
    check('ending: stats table lists five layers plus a total', rowsN === 6, `${rowsN} rows`);
    const total = await get(a, () => document.querySelector('#end-stats tbody tr:last-child').textContent);
    console.log('    totals:', total.replace(/\s+/g, ' '));
  } finally {
    for (const p of [a, b]) if (p.errors.length) check(`no browser errors (${p.name})`, false, p.errors.slice(0, 3).join(' | '));
    for (const p of [a, b]) if (!p.errors.length) check(`no browser errors (${p.name})`, true);
    await a.ctx.close();
    await b.ctx.close();
  }
}

async function resilience(browser, srv) {
  console.log('\n● Disconnect pauses the clock; refresh rejoins the same seat');
  {
    const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
    const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
    try {
      await createAndJoin(a, b, { hostRole: 'operator' });
      await startRun(a, b);
      await sleep(1500);
      // the partner leaves for a few seconds (navigating away keeps this tab's session
      // storage, so coming back resumes the same seat — exactly what a refresh does)
      await b.page.goto('about:blank');
      await a.page.waitForSelector('#ov-pause:not(.hidden)', { timeout: 10000 });
      check('pause: host sees SIGNAL LOST when partner drops', true);
      await shot(a, 'e2e-paused');
      const t1 = await timerText(a);
      await sleep(2500);
      const t2 = await timerText(a);
      check('pause: the shared clock is frozen while the partner is away', t1 === t2, `${t1} -> ${t2}`);
      await b.page.goBack();
      await waitScreen(b, 'screen-game', 30000);
      await a.page.waitForSelector('#ov-pause', { state: 'hidden', timeout: 15000 });
      check('rejoin: partner is back in the room and the overlay clears', true);
      const roleB = await get(b, () => window.__hl.app.role);
      check('rejoin: partner kept their role', roleB === 'mentor');
      await sleep(1200);
      const t3 = await timerText(a);
      check('rejoin: the clock runs again', t3 !== t2, `${t2} -> ${t3}`);
      await shot(b, 'e2e-rejoined-mentor');
    } finally {
      await a.ctx.close();
      await b.ctx.close();
    }
  }

  console.log('\n● Timer expiry is a soft reset');
  {
    process.env.TIME_SCALE = '0.02'; // ~7s per room
    const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
    const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
    try {
      await createAndJoin(a, b, { hostRole: 'operator' });
      await startRun(a, b);
      await a.page.waitForSelector('#ov-fail:not(.hidden)', { timeout: 20000 });
      check('fail: RESIMULATING overlay shown when the clock runs out', true);
      await shot(a, 'e2e-fail');
      await Promise.all([a, b].map((p) => waitScreen(p, 'screen-brief', 20000)));
      const kind = await get(a, () => document.getElementById('brief-kind').textContent);
      check('fail: same room reloads through a "resimulating" interstitial', kind === 'RESIMULATING', kind);
      const sameRoom = await get(a, () => window.__hl.app.briefing.room.id);
      check('fail: it is the same room', sameRoom === 'cipher');
    } finally {
      process.env.TIME_SCALE = '1';
      await a.ctx.close();
      await b.ctx.close();
    }
  }
}

/**
 * Regression: a disabled hotspot must never swallow a click meant for something behind
 * it. The phone booth's tall hit box sits between the camera and the "south" arrow when
 * you approach the phone from the north, which used to make the final step unclickable.
 */
async function picking(browser, srv) {
  console.log('\n● Disabled hotspots are transparent to the pointer (phone approached from the north)');
  process.env.START_ROOM = '4';
  const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
  const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
  try {
    await createAndJoin(a, b, { hostRole: 'operator' });
    await startRun(a, b);
    await sleep(1500);
    const res = await a.page.evaluate(() => {
      const st = window.__hl.app.stage, r = window.__hl.app.room;
      st.rig.par = { x: 0, y: 0, look: 0 };
      const arrow = r.hot['move:s'];
      const arrowHs = arrow.userData.hotspot;
      arrowHs.opts.enabled = true;
      const avatar = arrow.parent.parent;
      const Mesh = st.pickMeshes[0].constructor, Box = arrow.geometry.constructor, Mat = arrow.material.constructor;
      const booth = new Mesh(new Box(1.1, 2.4, 1.1), new Mat({ visible: false }));
      booth.position.set(avatar.position.x, 1.2, avatar.position.z + 2.4 - 0.55 - 0.4);
      st.scene.add(booth);
      booth.updateMatrixWorld(true);
      booth.userData.hotspot = { opts: { enabled: false }, meshes: [booth], target: booth };
      st.pickMeshes.push(booth);
      arrow.updateMatrixWorld(true);
      const p = st.screenPos(arrow), rect = st.renderer.domElement.getBoundingClientRect();
      st.pointer.set(((p.x - rect.left) / rect.width) * 2 - 1, -(((p.y - rect.top) / rect.height) * 2 - 1));
      st.raycaster.setFromCamera(st.pointer, st.camera);
      const hits = st.raycaster.intersectObjects(st.pickMeshes, false);
      return { boothInTheWay: hits[0]?.object === booth, picksArrow: st._pick() === arrowHs };
    });
    check('picking: the disabled booth hit box really is in the ray\'s path', res.boothInTheWay);
    check('picking: the arrow behind it is still clickable', res.picksArrow);
  } finally {
    delete process.env.START_ROOM;
    await a.ctx.close();
    await b.ctx.close();
  }
}

/** The TV / cast screen: a spoiler-free spectator that both players can watch. */
async function cast(browser, srv) {
  console.log('\n● TV screen (castable spectator)');
  const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
  const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
  const tv = await newPlayer(browser, srv, 'TV', { viewport: { width: 1920, height: 1080 } });
  try {
    const code = await createAndJoin(a, b, { hostRole: 'operator' });
    await tv.page.goto(`${tv.url}cast?code=${code}`);
    await tv.page.waitForSelector('#sc-lobby:not(.hidden)', { timeout: 15000 });
    await tv.page.waitForFunction(() => document.querySelectorAll('#tv-slot-0.on, #tv-slot-1.on').length === 2, null, { timeout: 10000 });
    check('tv: shows the session code and both crew members in the lobby', (await get(tv, () => document.getElementById('big-code').textContent)) === code);
    await sleep(800);
    await shot(tv, 'e2e-tv-lobby');

    await a.page.click('#btn-start');
    await tv.page.waitForSelector('#sc-brief:not(.hidden)', { timeout: 20000 });
    await sleep(2500);
    const typed = await get(tv, () => document.getElementById('tv-lines').textContent.length);
    check('tv: the story beats are typed out on the big screen', typed > 40, `${typed} chars`);
    await shot(tv, 'e2e-tv-story');

    await enterRoom(a, b);
    await tv.page.waitForSelector('#sc-play:not(.hidden)', { timeout: 20000 });
    check('tv: switches to the live room when the countdown starts', true);
    const t1 = await get(tv, () => document.getElementById('tv-timer').textContent);
    await sleep(1500);
    const t2 = await get(tv, () => document.getElementById('tv-timer').textContent);
    check('tv: the clock counts down', t1 !== t2, `${t1} -> ${t2}`);

    // a real mistake by the Operator shows up on the TV, with no detail about what was entered
    const { operator } = await byRole(a, b);
    await sleep(1000);
    for (const d of ['1', '2', '3']) await clickHot(operator, `key:${d}`);
    await clickHot(operator, 'key:OK');
    await tv.page.waitForFunction(() => document.querySelectorAll('#tv-strikes i:not(.none)').length === 1, null, { timeout: 25000 });
    check('tv: a mistake shows as a strike and a trace spike in the log', /TRACE SPIKE/.test(await get(tv, () => document.getElementById('tv-log').textContent)));
    await sleep(500);
    await shot(tv, 'e2e-tv-play');

    // spoiler check: nothing from either player's secret half is anywhere in the TV's page
    const leak = await tv.page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const bad = [];
      if (document.querySelector('svg.glyph, canvas#ring ~ svg, .tables, .cells5')) bad.push('glyph/table markup');
      for (const w of ['sconce', 'cipher table', 'tracer', 'glimpse', 'EXIT']) if (document.getElementById('tv').innerText.toLowerCase().includes(w.toLowerCase())) bad.push(w);
      return bad;
    });
    check('tv: no puzzle information anywhere on the TV page', leak.length === 0, leak.join(', '));

    // a reload (or a flaky TV connection) rejoins the same session
    await tv.page.reload();
    await tv.page.waitForSelector('#sc-play:not(.hidden)', { timeout: 20000 });
    await tv.page.waitForFunction(() => document.querySelectorAll('#tv-strikes i:not(.none)').length === 1, null, { timeout: 10000 });
    check('tv: reloading the TV tab rejoins and shows the current state', true);
    check('tv: the players were not disturbed (still in the room)', (await get(a, () => document.getElementById('screen-game').classList.contains('hidden'))) === false);
  } finally {
    for (const p of [a, b, tv]) await p.ctx.close();
    for (const p of [tv]) if (p.errors.length) check('tv: no browser errors', false, p.errors.slice(0, 3).join(' | '));
  }
}

// --------------------------------------------------------------------- main

const srv = await startGame({ SOLVE_HOLD_MS: '1400', FAIL_RESET_MS: '3000' });
const browser = await launch();
try {
  if (!only || only === 'full') await fullRun(browser, srv);
  if (!only || only === 'picking') await picking(browser, srv);
  if (!only || only === 'cast') await cast(browser, srv);
  if (!only || only === 'resilience') await resilience(browser, srv);
} catch (e) {
  check(`scenario crashed: ${e.message.split('\n')[0]}`, false);
  console.error(e);
}
await browser.close();
await srv.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
