// End-to-end check of the main modelling flows in headless Chromium.
// Usage: node scripts/e2e.cjs [url] [screenshot dir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://127.0.0.1:4173/';
const dir = process.argv[3] || '.';
let failed = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) failed++; };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const errors = [];
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  p.on('pageerror', (e) => errors.push(`${e.message} ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`.slice(0, 500)));
  await p.goto(url);
  await p.waitForFunction(() => window.caliper?.store.results, null, { timeout: 60000 });
  const settle = async () => { await p.waitForTimeout(120); await p.evaluate(() => window.caliper.rebuildNow()); await p.waitForTimeout(450); };
  const state = () => p.evaluate(() => { const s = window.caliper.store; const r = s.results; return { mode: s.mode, sel: s.sel, n: s.doc.features.length, types: s.doc.features.map((f) => f.type), vol: r?.volume, bodies: r?.bodies.length, min: r?.min, max: r?.max, errs: Object.entries(r?.features || {}).filter(([, v]) => v.error).map(([k, v]) => `${k}: ${v.error}`) }; });
  const screen = (w) => p.evaluate((w) => { const v = window.caliper.viewport; const r = v.canvas.getBoundingClientRect(); const s = v.worldToScreen(w); return [r.left + s[0], r.top + s[1]]; }, w);
  const clickWorld = async (w, opts) => { const [x, y] = await screen(w); await p.mouse.move(x, y); await p.mouse.click(x, y, opts); await p.waitForTimeout(80); };
  const dragWorld = async (a, c) => { const [x0, y0] = await screen(a); const [x1, y1] = await screen(c); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await p.mouse.move(x1, y1, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(80); };
  const near = (a, c, t = 0.02) => Math.abs(a - c) <= t * Math.max(1, Math.abs(c));

  let s = await state();
  ok(s.bodies === 1 && !s.errs.length, `example part builds clean (${s.errs.join('; ')})`);

  // --- new part: sketch a rectangle on XY and extrude it
  await p.click('#file-btn'); await p.click('[data-file="new"]'); await settle();
  s = await state(); ok(s.n === 0 && s.bodies === 0, 'new empty part');
  await p.click('[data-cmd="sketch"]');
  ok((await state()).mode.kind === 'plane', 'sketch asks for a plane');
  await p.click('#modebar >> text=Top (XY)'); await settle(); await p.waitForTimeout(400);
  s = await state(); ok(s.mode.kind === 'sketch' && s.mode.tool === 'rect', 'sketch mode opens with the rectangle tool');
  await dragWorld([-30, -20, 0], [30, 20, 0]); await settle();
  let sk = await p.evaluate(() => window.caliper.store.doc.features[0].shapes[0]);
  ok(sk && sk.kind === 'rect' && near(sk.w, 60) && near(sk.h, 40) && near(sk.x, 0), `rectangle drawn 60 x 40 (${JSON.stringify(sk)})`);
  await p.click('#modebar >> text=Circle');
  await dragWorld([10, 5, 0], [15, 5, 0]); await settle();
  sk = await p.evaluate(() => window.caliper.store.doc.features[0].shapes[1]);
  ok(sk && sk.kind === 'circle' && sk.d > 6 && sk.hole === true, `circle inside becomes a cut-out (${JSON.stringify(sk)})`);
  await p.screenshot({ path: `${dir}/e2e-sketch.png` });
  await p.fill('#shape-d', '8'); await settle();
  await p.click('#finish-sketch'); await settle();
  s = await state(); ok(s.types.join() === 'sketch,extrude' && s.bodies === 1 && near(s.vol, (2400 - Math.PI * 16) * 10), `finish adds an extrude (vol ${s.vol})`);
  await p.fill('#f-distance', '6'); await settle();
  s = await state(); ok(near(s.max[2], 6), 'typing a distance rebuilds live');

  // --- select top face -> sketch here -> pocket
  await clickWorld([-20, -10, 6]); s = await state();
  ok(s.sel.picks.length === 1 && s.sel.picks[0].kind === 'face', 'clicking the model selects a face');
  await p.click('#modebar >> text=Sketch here'); await settle(); await p.waitForTimeout(400);
  s = await state(); ok(s.mode.kind === 'sketch', 'sketch on face');
  await p.click('#modebar >> text=Slot');
  await dragWorld([-22, -8, 6], [-8, -8, 6]); await settle();
  await p.click('#finish-sketch'); await settle();
  await p.selectOption('#f-op', 'cut'); await p.fill('#f-distance', '-3'); await settle();
  s = await state(); const slotA = 14 * 6 + Math.PI * 9;
  ok(!s.errs.length && near(s.vol, (2400 - Math.PI * 16) * 6 - slotA * 3), `pocket cut into the face (vol ${s.vol}, errs ${s.errs})`);

  // --- fillet: pick mode with rollback
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.click('[data-cmd="fillet"]'); await settle();
  s = await state(); ok(s.mode.kind === 'pick' && s.mode.pick === 'edge', 'fillet with nothing selected enters pick mode');
  await clickWorld([30, -20, 3]); await clickWorld([-30, -20, 3]); await settle();
  await p.click('#pick-done'); await settle();
  s = await state(); const f = await p.evaluate(() => window.caliper.store.doc.features.at(-1));
  ok(f.type === 'fillet' && f.edges.pick.length === 2 && !s.errs.length, `two edges picked and filleted (${f.edges.pick.length}, ${s.errs})`);
  await p.fill('#f-radius', '5'); await settle();
  s = await state(); ok(!s.errs.length, 'radius edit rebuilds');

  // --- select then tool: chamfer on a preselected edge; shell on a preselected face
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await clickWorld([0, 20, 6]); s = await state();
  ok(s.sel.picks[0]?.kind === 'edge', 'clicking an edge selects it');
  await p.click('#modebar >> text=Chamfer'); await settle();
  s = await state(); ok(s.types.at(-1) === 'chamfer' && !s.errs.length, `chamfer from selection (${s.errs})`);
  const volBefore = s.vol;
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => window.caliper.viewport.view('bottom')); await p.waitForTimeout(500);
  await clickWorld([5, -12, 0]);
  await p.click('#modebar >> text=Shell'); await settle();
  await p.fill('#f-thickness', '1.2'); await settle();
  s = await state(); ok(s.types.at(-1) === 'shell' && !s.errs.length && s.vol < volBefore * 0.8, `shell from a selected face (vol ${s.vol} < ${volBefore}; ${s.errs})`);
  await p.evaluate(() => window.caliper.viewport.view('iso')); await p.waitForTimeout(500);

  // --- primitives, pattern, parameters, undo/redo
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.click('[data-cmd="cylinder"]'); await settle();
  await p.fill('#f-d', '4'); await p.fill('#f-h', '12'); await p.fill('#f-at-x', '-24'); await p.fill('#f-at-y', '14'); await settle();
  await p.click('[data-cmd="pattern"]'); await settle();
  await p.fill('#f-count', '4'); await p.fill('#f-spacing', '16'); await settle();
  s = await state(); ok(s.types.slice(-2).join() === 'cylinder,pattern' && !s.errs.length, `cylinder + pattern (${s.errs})`);
  await p.click('#params .ghost-btn'); await p.fill('#param-name-0', 'peg'); await p.keyboard.press('Tab'); await p.fill('#param-value-0', '18'); await settle();
  await p.click('#timeline [data-id="cylinder1"]'); await p.fill('#f-h', 'peg + 2'); await settle();
  s = await state(); ok(near(s.max[2], 20) && !s.errs.length, `parameter expression drives height (max z ${s.max[2]})`);
  const before = s.n;
  await p.keyboard.press('Escape');
  await p.click('#undo'); await p.click('#undo'); await settle();
  await p.click('#redo'); await p.click('#redo'); await settle();
  s = await state(); ok(s.n === before && near(s.max[2], 20), 'undo and redo round-trip');
  await p.screenshot({ path: `${dir}/e2e-model.png` });

  // --- export
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), (async () => { await p.click('#export-btn'); await p.click('[data-file="stl"]'); })()]);
  const path = await dl.path(); const size = require('fs').statSync(path).size;
  const buf = require('fs').readFileSync(path); const tris = buf.readUInt32LE(80);
  ok(dl.suggestedFilename().endsWith('.stl') && size === 84 + tris * 50 && tris > 100, `STL downloads (${dl.suggestedFilename()}, ${tris} triangles)`);
  const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), (async () => { await p.click('#file-btn'); await p.click('[data-file="step"]'); })()]);
  ok(dl2.suggestedFilename().endsWith('.step'), 'STEP downloads');

  // --- reload restores the autosave
  await p.waitForTimeout(600); await p.reload();
  await p.waitForFunction(() => window.caliper?.store.results, null, { timeout: 60000 });
  s = await state(); ok(s.n === before, 'reload restores the saved part');

  ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' || ') : ''}`);
  await b.close();
  console.log(failed ? `${failed} FAILED` : 'ALL PASS');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('e2e crashed:', e.message.split('\n').slice(0, 6).join('\n')); process.exit(2); });
