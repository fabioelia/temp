// Full end-to-end: two real Chromium sessions, the real server, every room played
// through the real UI (clicking real 3D hotspots), with a deliberate mistake in
// each room. Screenshots land in test/e2e/out/.
//
//   node test/e2e/run.mjs            # everything
//   node test/e2e/run.mjs resilience # only the reconnect + timeout scenarios

import { launch, startGame, startStatic, newPlayer, createAndJoin, startRun, enterRoom, shot, sleep, clickHot, byRole, LOW } from './lib.mjs';
import { solvers, localise, mazeRoute, bulletCells, echoPresses, vaultCandidates, gridLevers, triangulateCell, logicSwitches, mosaicGrid } from '../solvers.js';
import { PYLONS } from '../../engine/puzzles/echo.js';
import { evaluate } from '../../engine/puzzles/logic.js';

const only = process.argv[2];
const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${extra ? `  — ${extra}` : ''}`);
}

const get = (p, fn, arg) => p.page.evaluate(fn, arg);
// `p.mentorView` marks the "Mentor" stand-in for a solo player (their manual half lives on the same page)
const appView = (p) => get(p, (m) => JSON.parse(JSON.stringify(m ? window.__hl.app.mentorView : window.__hl.app.view)), !!p.mentorView);
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


// ---------------------------------------------------------- Deep Loop rooms
// Same rule as above: the oracle only sees what the two role views show, and every move is made
// through the real 3D hotspots.

Object.assign(rooms, {
  async echo(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      let presses = echoPresses({ operator: ov, mentor: mv, strikes: await strikes(op) });
      if (stage === 1) {
        const bad = PYLONS.find((c) => c !== presses[0]);
        const fx = await act(op, me, () => clickHot(op, `pylon:${bad}`));
        check('echo: a wrong pylon is a strike on both screens, and the sequence replays', fx.result === 'wrong' && (await strikes(me)) === 1);
        await waitIdle(op);
        presses = echoPresses({ operator: ov, mentor: mv, strikes: await strikes(op) });
      }
      let fx;
      for (let i = 0; i < presses.length; i++) {
        fx = await act(op, me, () => clickHot(op, `pylon:${presses[i]}`));
        if (i < presses.length - 1) await sleep(250);
      }
      check(`echo: sequence ${stage + 1}/3 cleared`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
      if (stage === 0) await shot(op, 'e2e-echo-cleared');
    }
  },

  async vault(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const history = [];
      let fx;
      for (let tries = 0; tries < 4; tries++) {
        const cands = vaultCandidates({ operator: ov, mentor: mv, history });
        const code = cands[0];
        const cur = await get(op, () => window.__hl.app.room.dials);
        for (let i = 0; i < code.length; i++) {
          const steps = (ov.glyphs.indexOf(code[i]) - cur[i] + ov.glyphs.length) % ov.glyphs.length;
          for (let s = 0; s < steps; s++) await clickHot(op, `dial:${i}:up`);
        }
        fx = await act(op, me, () => clickHot(op, 'lever'));
        if (fx.result !== 'wrong') break;
        history.push({ code, bulls: fx.event.bulls });
        if (!history.checked) {
          history.checked = true;
          check('vault: a wrong try costs a strike on both screens and reports how many dials were right', (await strikes(me)) >= 1 && Number.isInteger(fx.event.bulls));
          await shot(op, 'e2e-vault-feedback');
        }
        await waitIdle(op);
      }
      check(`vault: door ${stage + 1}/3 opens (${history.length} wrong ${history.length === 1 ? 'try' : 'tries'} first)`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
    }
  },

  async grid(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const levers = gridLevers({ operator: ov, mentor: mv });
      if (stage === 0) {
        const fx = await act(op, me, () => clickHot(op, 'engage')); // pulling nothing leaves the grid overloaded
        check('grid: engaging without the right levers is a strike', fx.result === 'wrong' && (await strikes(op)) === 1);
        await waitIdle(op);
      }
      for (const i of levers) await clickHot(op, `lever:${i}`);
      const fx = await act(op, me, () => clickHot(op, 'engage'));
      check(`grid: ${stage + 1}/3 — pulling ${levers.length} lever${levers.length === 1 ? '' : 's'} makes every node safe`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
    }
  },

  async triangulate(op, me) {
    const pick = async (x, y) => {
      await clickHot(op, `col:${x}`);
      await clickHot(op, `row:${y + 1}`);
    };
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const { best } = triangulateCell({ operator: ov, mentor: mv });
      if (stage === 0) await shot(op, 'e2e-triangulate-readings');
      if (stage === 1) {
        await pick((best.x + 3) % 10, best.y);
        const fx = await act(op, me, () => clickHot(op, 'enter'));
        check('signal room: a wrong square is a strike', fx.result === 'wrong');
        await waitIdle(op);
      }
      await pick(best.x, best.y);
      const fx = await act(op, me, () => clickHot(op, 'enter'));
      check(`signal room: fix ${stage + 1}/3 — the square the readings agree on is right`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
    }
  },

  async logic(op, me) {
    const setSwitches = async (want) => {
      const cur = await get(op, () => window.__hl.app.room.switches);
      for (let i = 0; i < want.length; i++) if (!!want[i] !== !!cur[i]) await clickHot(op, `switch:${i}`);
    };
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const sw = logicSwitches({ operator: ov, mentor: mv });
      if (stage === 1) {
        // an assignment that leaves the lamp dark
        const typeOf = Object.fromEntries(mv.table.map((t) => [t.glyph, t.type]));
        const circuit = { gates: ov.gates, output: ov.output };
        let dark = null;
        for (let m = 0; m < 1 << ov.switches && !dark; m++) {
          const a = Array.from({ length: ov.switches }, (_, i) => !!(m & (1 << i)));
          if (!evaluate(circuit, a, (g) => typeOf[g.glyph])) dark = a;
        }
        await setSwitches(dark);
        const fx = await act(op, me, () => clickHot(op, 'engage'));
        check('logic wall: a failing switch setting is a strike', fx.result === 'wrong');
        await waitIdle(op);
      }
      await setSwitches(sw);
      const fx = await act(op, me, () => clickHot(op, 'engage'));
      check(`logic wall: circuit ${stage + 1}/3 lights the lamp`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
    }
  },

  async mosaic(op, me) {
    for (let stage = 0; stage < 3; stage++) {
      await waitIdle(op);
      const [ov, mv] = [await appView(op), await appView(me)];
      const grid = mosaicGrid({ operator: ov, mentor: mv });
      if (stage === 0) {
        const fx = await act(op, me, () => clickHot(op, 'seal')); // a blank wall is not the picture
        check('mosaic: sealing the wrong picture is a strike', fx.result === 'wrong');
        await waitIdle(op);
      }
      for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid.length; c++) if (grid[r][c]) await clickHot(op, `tile:${r},${c}`);
      if (stage === 0) await shot(op, 'e2e-mosaic-filled');
      const fx = await act(op, me, () => clickHot(op, 'seal'));
      check(`mosaic: picture ${stage + 1}/3 (${grid.length}×${grid.length}) is accepted`, fx.result === (stage === 2 ? 'solved' : 'stage'), fx.result);
    }
  },
});

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


/** A normal lobby can flip to solo while the host is alone, and back again to invite someone. */
async function soloToggle(browser, srv) {
  console.log('\n● Lobby: switch between solo and inviting a partner');
  const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
  try {
    await a.page.goto(`${a.url}?${LOW}`);
    await a.page.fill('#in-name', 'Trin');
    await a.page.click('#btn-create');
    await a.page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 15000 });
    const state = () => get(a, () => ({ eyebrow: document.getElementById('lobby-eyebrow').textContent, codeHidden: document.querySelector('.code-row').classList.contains('hidden'), on: !document.getElementById('btn-solo-on').classList.contains('hidden'), off: !document.getElementById('btn-solo-off').classList.contains('hidden'), tv: !document.getElementById('tv-offer').classList.contains('hidden'), startDisabled: document.getElementById('btn-start').disabled }));
    let st = await state();
    check('toggle: a lone host sees PLAY SOLO INSTEAD and cannot start without a partner', st.on && !st.off && st.startDisabled && st.eyebrow === 'PRIVATE SESSION');
    await a.page.click('#btn-solo-on');
    await a.page.waitForFunction(() => document.getElementById('lobby-eyebrow').textContent === 'SOLO RUN');
    st = await state();
    check('toggle: solo hides the invite, keeps the TV link, and START is enabled', st.codeHidden && st.tv && st.off && !st.on && !st.startDisabled);
    await a.page.click('#btn-solo-off');
    await a.page.waitForFunction(() => document.getElementById('lobby-eyebrow').textContent === 'PRIVATE SESSION');
    st = await state();
    check('toggle: back to inviting a partner', !st.codeHidden && st.on && !st.off && st.startDisabled);
  } finally {
    check('toggle: no browser errors', a.errors.length === 0, a.errors.slice(0, 3).join(' | '));
    await a.ctx.close();
  }
}

/** Solo: one player, both halves, on a static host with no partner and no matchmaking broker at all. */
async function solo(browser) {
  console.log('\n● Solo run (static host, fully offline: no partner, no broker)');
  const stat = await startStatic();
  const a = await newPlayer(browser, stat, 'Trin', { query: LOW });
  try {
    await a.page.goto(`${a.url}?${LOW}`);
    await a.page.fill('#in-name', 'Trin');
    await a.page.click('#btn-solo');
    await a.page.waitForSelector('#screen-lobby:not(.hidden)', { timeout: 15000 });
    check('solo: the lobby is a solo run with no invite code and no second seat', await get(a, () => document.getElementById('lobby-eyebrow').textContent === 'SOLO RUN' && document.querySelector('.code-row').classList.contains('hidden') && document.getElementById('slot-1').classList.contains('hidden')));
    check('solo: START is available straight away', await get(a, () => !document.getElementById('btn-start').disabled));
    await shot(a, 'e2e-solo-lobby');
    await a.page.click('#btn-start');
    await enterRoom(a);
    const me = { ...a, mentorView: true };
    check('solo: the PROTOCOL button is on the HUD and the manual starts closed', await get(a, () => !document.getElementById('btn-hud-manual').classList.contains('hidden') && document.getElementById('mentor-root').classList.contains('hidden')));
    await sleep(1200);
    await shot(a, 'e2e-solo-room');

    // M opens the manual (the Mentor's pages, built from the Mentor's half of the briefing); Esc closes it
    await a.page.keyboard.press('m');
    await a.page.waitForSelector('#mentor-root:not(.hidden) .manual', { timeout: 5000 });
    check('solo: M opens the Protocol manual on top of the room', await get(a, () => document.querySelectorAll('#mentor-root .manual-tabs button').length >= 2));
    await shot(a, 'e2e-solo-manual');
    // typing digits into the notes must not leak into the room's keypad
    await a.page.click('#mentor-root .manual-tabs button:last-child');
    await a.page.click('#mentor-root textarea.notes');
    await a.page.keyboard.type('4821');
    check('solo: keys typed into the notes never reach the room (keypad untouched)', (await get(a, () => window.__hl.app.room.entered)) === '' && (await get(a, () => document.querySelector('#mentor-root textarea.notes').value)) === '4821');
    await a.page.keyboard.press('Escape');
    check('solo: Esc closes the manual again', await get(a, () => document.getElementById('mentor-root').classList.contains('hidden')));

    // play two whole rooms alone, reading the manual for the Mentor's half
    await rooms.cipher(a, me);
    await waitScreen(a, 'screen-brief', 40000);
    await enterRoom(a);
    check('solo: no role swap between rooms — still inside the construct with the manual', (await get(a, () => window.__hl.app.role)) === 'operator' && (await get(a, () => !document.getElementById('btn-hud-manual').classList.contains('hidden'))));
    await rooms.doors(a, me);
  } finally {
    check('solo: no browser errors', a.errors.length === 0, a.errors.slice(0, 3).join(' | '));
    await a.ctx.close();
    await stat.close();
  }
}

/** The Deep Loop chapter: six harder rooms, chosen in the lobby. */
async function deepLoop(browser, srv) {
  console.log('\n● Deep Loop chapter (six rooms, chosen from the lobby)');
  const a = await newPlayer(browser, srv, 'Trin', { query: LOW });
  const b = await newPlayer(browser, srv, 'Wren', { query: LOW });
  try {
    await createAndJoin(a, b, { hostRole: 'operator' });
    await a.page.click('#seg-chapter button[data-v="deep"]');
    await sleep(400);
    check('lobby: the Deep Loop chapter is selectable', (await get(a, () => document.querySelector('#seg-chapter button.on')?.dataset.v)) === 'deep');
    const guestSees = await get(b, () => document.querySelector('#seg-chapter button.on')?.dataset.v);
    check('lobby: the partner sees the chosen chapter', guestSees === 'deep', guestSees);
    await shot(a, 'e2e-lobby-deep');
    await a.page.click('#btn-start');
    const order = ['echo', 'vault', 'grid', 'triangulate', 'logic', 'mosaic'];
    for (let r = 0; r < order.length; r++) {
      if (r === 0) await Promise.all([a, b].map((p) => waitScreen(p, 'screen-brief')));
      await enterRoom(a, b);
      const { operator, mentor } = await byRole(a, b);
      const id = await get(operator, () => window.__hl.app.briefing.room.id);
      check(`deep room ${r + 1}: it is ${order[r]}`, id === order[r], id);
      await sleep(1500);
      await shot(operator, `e2e-deep${r + 1}-${order[r]}-operator`);
      await shot(mentor, `e2e-deep${r + 1}-${order[r]}-mentor`);
      await rooms[order[r]](operator, mentor);
      if (r < order.length - 1) await Promise.all([a, b].map((p) => waitScreen(p, 'screen-brief', 40000)));
    }
    await Promise.all([a, b].map((p) => waitScreen(p, 'screen-end', 40000)));
    await a.page.waitForSelector('#end-stats:not(.hidden)', { timeout: 60000 });
    await sleep(400);
    await shot(a, 'e2e-ending-deep');
    const rowsN = await get(a, () => document.querySelectorAll('#end-stats tbody tr').length);
    check('ending: stats table lists six layers plus a total', rowsN === 7, `${rowsN} rows`);
  } catch (e) {
    for (const p of [a, b]) {
      await shot(p, `e2e-deep-fail-${p.name}`).catch(() => {});
      console.log('    state', p.name, await get(p, () => ({ screen: window.__hl.app.screen, brief: window.__hl.app.briefing?.room?.id, kind: window.__hl.app.briefing?.kind, strikes: window.__hl.app.strikes })).catch(() => '?'));
    }
    throw e;
  } finally {
    for (const p of [a, b]) check(`no browser errors (${p.name})`, p.errors.length === 0, p.errors.slice(0, 3).join(' | '));
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
    await tv.page.goto(`${tv.url}cast.html?code=${code}`);
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


/**
 * The game as published on GitHub Pages: plain static files under a sub-path, no game server. The
 * host's own tab runs the engine and the partner (and a TV screen) connect to it over WebRTC.
 */
async function staticHosting(browser) {
  console.log('\n● Static hosting (no server): the host\'s tab runs the game, partner + TV connect over WebRTC');
  const stat = await startStatic();
  const a = await newPlayer(browser, stat, 'Trin', { query: LOW });
  const b = await newPlayer(browser, stat, 'Wren', { query: LOW });
  const tv = await newPlayer(browser, stat, 'TV', { viewport: { width: 1920, height: 1080 } });
  try {
    const health = await a.ctx.request.get(`${stat.base}healthz`);
    check('static: there is no server behind the site (no /healthz)', health.status() === 404);
    const code = await createAndJoin(a, b, { hostRole: 'operator' });
    const mode = await get(a, () => import(new URL('js/transport.js', location.href).href).then((m) => m.transportMode()));
    check('static: the page picked the peer-to-peer transport on its own', mode === 'p2p', mode);
    check('static: partner joined by code and both are seated', (await get(a, () => document.querySelectorAll('#screen-lobby .slot.on').length)) === 2);
    const invite = await get(a, () => window.__hl.app.lobby && document.querySelector('#btn-copy') && location.href);
    check('static: the invite link stays under the sub-path', typeof invite === 'string' && invite.includes(new URL(stat.base).pathname));

    await tv.page.goto(`${tv.url}cast.html?code=${code}`);
    await tv.page.waitForSelector('#sc-lobby:not(.hidden)', { timeout: 20000 });
    await tv.page.waitForFunction(() => document.querySelectorAll('#tv-slot-0.on, #tv-slot-1.on').length === 2, null, { timeout: 10000 });
    check('static: the TV screen joins the host tab and shows the crew', (await get(tv, () => document.getElementById('big-code').textContent)) === code);

    await a.page.click('#btn-start');
    await enterRoom(a, b);
    const { operator, mentor } = await byRole(a, b);
    await sleep(1200);

    // the partner drops, the host's tab pauses the shared clock, and they slip back into the same seat
    await b.page.goto('about:blank');
    await a.page.waitForSelector('#ov-pause:not(.hidden)', { timeout: 30000 });
    check('static: the host pauses the clock when the partner\'s connection drops', true);
    await b.page.goBack();
    await waitScreen(b, 'screen-game', 40000);
    await a.page.waitForSelector('#ov-pause', { state: 'hidden', timeout: 30000 });
    check('static: the partner resumes the same seat over a fresh WebRTC connection', (await get(b, () => window.__hl.app.role)) === (mentor === b ? 'mentor' : 'operator'));
    await sleep(800);

    await rooms.cipher(operator, mentor);
    await tv.page.waitForFunction(() => document.querySelectorAll('#tv-strikes i:not(.none)').length >= 0, null, { timeout: 5000 });
    await shot(tv, 'e2e-static-tv');

    // the host closing their tab ends the session for everyone else
    await a.page.close();
    await b.page.waitForSelector('#screen-landing:not(.hidden)', { timeout: 90000 });
    check('static: when the host leaves, the partner is returned to the landing page', true);
  } finally {
    for (const p of [a, b, tv]) if (p.errors.length) check(`static: no browser errors (${p.name})`, false, p.errors.slice(0, 3).join(' | '));
    for (const p of [a, b, tv]) await p.ctx.close();
    await stat.close();
  }
}

// --------------------------------------------------------------------- main

const srv = await startGame({ SOLVE_HOLD_MS: '1400', FAIL_RESET_MS: '3000' });
const browser = await launch();
try {
  if (only === 'static') await staticHosting(browser);
  if (only === 'solo') await solo(browser);
  if (!only || only === 'full') await fullRun(browser, srv);
  if (!only || only === 'solo') await soloToggle(browser, srv);
  if (!only || only === 'deep') await deepLoop(browser, srv);
  if (!only || only === 'picking') await picking(browser, srv);
  if (!only || only === 'cast') await cast(browser, srv);
  if (!only || only === 'resilience') await resilience(browser, srv);
  if (!only) await staticHosting(browser);
  if (!only) await solo(browser);
} catch (e) {
  check(`scenario crashed: ${e.message.split('\n')[0]}`, false);
  console.error(e);
}
await browser.close();
await srv.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
