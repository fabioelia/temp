// Seed stress test: builds every Operator room and every Mentor manual in a real browser from
// many generated puzzles (all stages, plus maze patches along the route). Bugs that depend on
// which puzzle you happen to draw — like a scene helper used before it is initialised when the
// phone starts in view — only show up this way; one playthrough per room would miss them.
//
//   node test/e2e/rooms-stress.mjs [seedsPerRoom=6]

import { launch, startGame, newPlayer, createAndJoin, startRun, sleep, LOW } from './lib.mjs';
import { PUZZLES } from '../../engine/puzzles/index.js';
import { makeRng } from '../../shared/rng.js';
import { solvers, localise, mazeRoute, solveDeepStage, DEEP_IDS } from '../solvers.js';

const SEEDS = Number(process.argv[2]) || 6;
const ROOM_IDS = (process.env.ROOMS || 'cipher,doors,bullets,switchboard,maze,echo,vault,grid,triangulate,logic,mosaic').split(',');

/** Every {operator, mentor} view pair a player could be shown for this seed. */
function viewsFor(id, seed) {
  const rng = makeRng(seed);
  const p = PUZZLES[id];
  const { state, views } = p.create(rng);
  const out = [{ label: `${id}#${seed} start`, operator: views.operator, mentor: views.mentor }];

  if (id === 'maze') {
    const loc = localise(views.operator, views.mentor);
    const route = mazeRoute(views.mentor, { x: loc.candidates[0].x, y: loc.candidates[0].y });
    let sawExit = views.operator.cells.some((c) => c.exit);
    for (const dir of route) {
      const res = p.act(state, { type: 'move', dir });
      const v = res.views.operator;
      const exitNow = v.cells.some((c) => c.exit);
      if (exitNow && !sawExit) out.push({ label: `${id}#${seed} phone first in view`, operator: v, mentor: views.mentor });
      sawExit ||= exitNow;
      if (v.atExit) out.push({ label: `${id}#${seed} at the phone`, operator: v, mentor: views.mentor });
    }
    return out;
  }

  let operator = views.operator;
  let mentor = views.mentor;
  if (DEEP_IDS.includes(id)) {
    for (let guard = 0; guard < 6; guard++) {
      const res = solveDeepStage(id, p, state, rng, { operator, mentor });
      if (res.result !== 'stage') break;
      operator = res.views.operator;
      mentor = res.views.mentor;
      out.push({ label: `${id}#${seed} stage ${out.length}`, operator, mentor });
    }
    return out;
  }
  const done = new Set();
  for (let guard = 0; guard < 80; guard++) {
    const a = solvers[id]({ operator: { ...operator, __done: done }, mentor });
    const { __cable, ...clean } = a;
    const res = p.act(state, clean, rng);
    if (!res || res.result === 'solved') break;
    if (id === 'switchboard' && __cable) done.add(__cable);
    if (res.result === 'stage') {
      done.clear();
      operator = res.views.operator;
      mentor = res.views.mentor;
      out.push({ label: `${id}#${seed} stage ${out.length}`, operator, mentor });
    }
  }
  return out;
}

const srv = await startGame({ START_ROOM: '0' });
const browser = await launch();
const host = await newPlayer(browser, srv, 'Trin', { query: LOW });
const guest = await newPlayer(browser, srv, 'Wren', { query: LOW });
const failures = [];
let builds = 0;
try {
  await createAndJoin(host, guest, { hostRole: 'operator' });
  await startRun(host, guest);
  await sleep(1500);

  for (const id of ROOM_IDS) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const v of viewsFor(id, seed * 7919 + ROOM_IDS.indexOf(id))) {
        builds++;
        // Operator: rebuild the 3D scene from this view and let a couple of frames run
        const op = await host.page.evaluate(async ({ id, view }) => {
          const { app, audio } = window.__hl;
          try {
            app.room?.dispose?.();
            app.stage.resetScene();
            const mod = await import(`./js/operator/${id}.js`);
            const room = await mod.create({ stage: app.stage, view, send() {}, audio, names: { operator: 'a', mentor: 'b' }, room: {} });
            app.room = room;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            return { ok: true };
          } catch (e) {
            return { ok: false, error: `${e.name}: ${e.message}` };
          }
        }, { id, view: v.operator });
        if (!op.ok) failures.push(`OPERATOR ${v.label}: ${op.error}`);

        // Mentor: render the manual from this view (DOM only)
        const me = await guest.page.evaluate(async ({ id, view }) => {
          try {
            // detach the page's own live manual so the app's status ticker doesn't poke at it
            if (window.__hl.app.shell) {
              window.__hl.app.shell.dispose();
              window.__hl.app.shell = null;
            }
            const { createMentorShell } = await import('./js/mentor/shell.js');
            const root = document.getElementById('mentor-root');
            const shell = createMentorShell(root, { audio: window.__hl.audio });
            const mod = await import(`./js/mentor/${id}.js`);
            const room = mod.create({ shell, view, audio: window.__hl.audio });
            room.onFx?.({ view, event: null, result: 'stage' });
            shell.dispose();
            return { ok: true };
          } catch (e) {
            return { ok: false, error: `${e.name}: ${e.message}` };
          }
        }, { id, view: v.mentor });
        if (!me.ok) failures.push(`MENTOR ${v.label}: ${me.error}`);
      }
    }
    console.log(`  ${id}: done (${builds} builds so far, ${failures.length} failures)`);
  }
} catch (e) {
  failures.push(`harness crashed: ${e.message}`);
}
for (const p of [host, guest]) for (const e of p.errors) failures.push(`${p.name} page: ${e.slice(0, 160)}`);
await browser.close();
await srv.close();

console.log(`\n${builds} room builds (operator + mentor each) across ${SEEDS} seeds per room`);
if (failures.length) {
  const uniq = [...new Set(failures)];
  console.log(`✗ ${uniq.length} distinct failure(s):`);
  for (const f of uniq.slice(0, 20)) console.log('   -', f);
  process.exit(1);
}
console.log('✓ every room built cleanly from every generated puzzle');
