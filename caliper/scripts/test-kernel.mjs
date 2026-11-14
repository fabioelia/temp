import { loadKernel } from './kernel-node.mjs';
const k = await loadKernel();
let failed = 0;
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
function run(name, doc, check) {
  const t = performance.now();
  const { result: res } = k.evaluate(doc);
  const ms = Math.round(performance.now() - t);
  const errs = Object.entries(res.features).filter(([, v]) => v.error).map(([id, v]) => `${id}: ${v.error}${v.detail ? ' [' + v.detail + ']' : ''}`);
  let ok = true, why = '';
  try { why = check(res, errs) || ''; ok = why === true || why === ''; } catch (e) { ok = false; why = e.message; }
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (${ms}ms) bodies=${res.bodies.length} vol=${res.volume.toFixed(1)} bb=${JSON.stringify(res.min?.map(x=>+x.toFixed(2)))}..${JSON.stringify(res.max?.map(x=>+x.toFixed(2)))} ${errs.length ? 'errors: ' + errs.join(' | ') : ''} ${ok ? '' : '<< ' + why}`);
  return res;
}
const expect = (c, m) => { if (!c) throw new Error(m); };

run('box', { features: [{ id: 'b', type: 'box', w: 40, d: 30, h: 10 }] }, (r, e) => { expect(!e.length, 'errors'); expect(near(r.volume, 12000), 'vol'); });

run('params + plate with holes', {
  params: [{ name: 'w', value: '60' }, { name: 'hole', value: 'w/10' }],
  features: [
    { id: 's1', type: 'sketch', plane: 'XY', shapes: [
      { id: 'a', kind: 'rect', x: 0, y: 0, w: 'w', h: 40, r: 5 },
      { id: 'h1', kind: 'circle', x: 20, y: 10, d: 'hole', hole: true },
      { id: 'h2', kind: 'circle', x: -20, y: -10, d: 'hole', hole: true } ] },
    { id: 'e1', type: 'extrude', sketch: 's1', distance: 5 } ] },
  (r, e) => { expect(!e.length, 'errors'); const v = (60*40 - (4-Math.PI)*25 - 2*Math.PI*9) * 5; expect(near(r.volume, v), 'vol ' + v); expect(near(r.max[2], 5), 'z'); });

run('XZ plane extrude goes +Y, both sides', { features: [
  { id: 's', type: 'sketch', plane: 'XZ', shapes: [{ id: 'a', kind: 'rect', x: 0, y: 10, w: 20, h: 20 }] },
  { id: 'e', type: 'extrude', sketch: 's', distance: 8 } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(near(r.min[1], 0) && near(r.max[1], 8), 'y range'); expect(near(r.min[2], 0) && near(r.max[2], 20), 'z range'); });

run('symmetric + negative', { features: [
  { id: 's', type: 'sketch', plane: 'YZ', shapes: [{ id: 'a', kind: 'circle', x: 0, y: 0, d: 10 }] },
  { id: 'e', type: 'extrude', sketch: 's', distance: 30, side: 'both' },
  { id: 's2', type: 'sketch', plane: 'XY', offset: 5, shapes: [{ id: 'a', kind: 'polygon', x: 0, y: 0, d: 6, sides: 6 }] },
  { id: 'e2', type: 'extrude', sketch: 's2', distance: -20, op: 'new' } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(near(r.min[0], -15) && near(r.max[0], 15), 'x range'); expect(r.bodies.length === 2, 'bodies'); expect(near(r.bodies[1].min[2], -15) && near(r.bodies[1].max[2], 5), 'z of body 2'); });

const boss = run('sketch on top face, boss + pocket + through hole', { features: [
  { id: 'b', type: 'box', w: 40, d: 30, h: 10 },
  { id: 's', type: 'sketch', plane: 'top', shapes: [{ id: 'a', kind: 'circle', x: 10, y: 0, d: 10 }] },
  { id: 'e', type: 'extrude', sketch: 's', distance: 6 },
  { id: 's2', type: 'sketch', plane: { face: { at: { z: 10 }, normal: '+z' } }, shapes: [{ id: 'a', kind: 'slot', x: -8, y: 0, l: 14, w: 6, rot: 90 }] },
  { id: 'e2', type: 'extrude', sketch: 's2', distance: -4, op: 'cut' },
  { id: 's3', type: 'sketch', plane: 'XY', shapes: [{ id: 'a', kind: 'circle', x: 10, y: 0, d: 4 }] },
  { id: 'e3', type: 'extrude', sketch: 's3', extent: 'through', op: 'cut' } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(r.bodies.length === 1, 'one body'); expect(near(r.max[2], 16), 'boss height');
    const slotA = 8*6 + Math.PI*9; const v = 12000 + Math.PI*25*6 - slotA*4 - Math.PI*4*16; expect(near(r.volume, v), 'vol ' + v);
    expect(near(r.features.s2.frame.origin[2], 10), 's2 origin ' + r.features.s2.frame.origin); });

run('fillet vertical + chamfer top + shell', { features: [
  { id: 'b', type: 'box', w: 40, d: 30, h: 20 },
  { id: 'f', type: 'fillet', edges: { parallel: 'z' }, radius: 4 },
  { id: 'c', type: 'chamfer', edges: { on: 'bottom' }, distance: 1 },
  { id: 'sh', type: 'shell', faces: 'top', thickness: 0.8 } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(r.volume < 12000 && r.volume > 2000, 'vol plausible'); });

run('bad fillet reports error, rest continues', { features: [
  { id: 'b', type: 'box', w: 10, d: 10, h: 10 },
  { id: 'f', type: 'fillet', edges: 'all', radius: 20 },
  { id: 'c', type: 'cylinder', d: 4, h: 30, at: [0, 0, -5], op: 'cut' } ] },
  (r, e) => { expect(e.length === 1 && e[0].startsWith('f:'), 'one error on f'); expect(near(r.volume, 1000 - Math.PI*4*10), 'vol'); });

run('revolve + cone + torus + sphere', { features: [
  { id: 's', type: 'sketch', plane: 'XZ', shapes: [{ id: 'p', kind: 'path', pts: [[5, 0], [15, 0], [15, 4], [8, 4], [8, 20], [5, 20]] }] },
  { id: 'rv', type: 'revolve', sketch: 's', axis: 'y', angle: 360 },
  { id: 'cn', type: 'cone', d1: 10, d2: 4, h: 8, at: [40, 0, 0], op: 'new' },
  { id: 'to', type: 'torus', d: 20, tube: 4, at: [0, 40, 2], op: 'new' },
  { id: 'sp', type: 'sphere', d: 10, at: [40, 40, 5], op: 'new' } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(r.bodies.length === 4, 'bodies');
    const v = Math.PI*(15*15-5*5)*4 + Math.PI*(64-25)*16; expect(near(r.bodies[0].volume, v), 'revolve vol ' + v + ' got ' + r.bodies[0].volume);
    expect(near(r.bodies[1].volume, Math.PI*8/3*(25+10+4)), 'cone vol'); expect(near(r.bodies[3].volume, 4/3*Math.PI*125), 'sphere'); });

run('patterns + mirror + move', { features: [
  { id: 'b', type: 'box', w: 60, d: 40, h: 4 },
  { id: 'h', type: 'cylinder', d: 3, h: 10, at: [-24, -14, -2], op: 'cut' },
  { id: 'p', type: 'pattern', features: ['h'], kind: 'linear', dir: 'x', count: 4, spacing: 16, dir2: 'y', count2: 2, spacing2: 28 },
  { id: 'peg', type: 'cylinder', d: 4, h: 6, at: [10, 0, 4] },
  { id: 'cp', type: 'pattern', features: ['peg'], kind: 'circular', axis: 'z', center: [0, 0, 0], count: 6 },
  { id: 'rib', type: 'box', w: 2, d: 40, h: 8, at: [20, 0, 4] },
  { id: 'm', type: 'mirror', plane: 'YZ', features: ['rib'] },
  { id: 'mv', type: 'move', by: [0, 0, 5], rot: [0, 0, 90] } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(r.bodies.length === 1, 'one body');
    const v = 60*40*4 - 8*Math.PI*2.25*4 + 6*Math.PI*4*6 + 2*2*40*8; expect(near(r.volume, v), 'vol ' + v);
    expect(near(r.min[2], 5) && near(r.max[0], 20), 'moved/rotated ' + r.max); });

run('near picks the rim, not the seam; face rim selector', { features: [
  { id: 'b', type: 'box', w: 60, d: 40, h: 4 },
  { id: 'c', type: 'cylinder', d: 14, h: 16, at: [0, 0, 4] },
  { id: 'f', type: 'fillet', edges: { kind: 'circle', near: [0, 7, 4] }, radius: 2 },
  { id: 'f2', type: 'fillet', edges: { near: [7, 0, 20] }, radius: 1 },
  { id: 'ch', type: 'chamfer', edges: { face: 'bottom' }, distance: 0.6 } ] },
  (r, e) => { expect(!e.length, 'errors'); expect(r.bodies[0].edges.some(x => x.seam), 'seams flagged'); expect(r.bodies[0].edges.filter(x => !x.seam).every(x => x.f.length === 2), 'adjacency'); });

// push/pull + picks that survive a parameter change
const d1 = { params: [{ name: 'w', value: '40' }], features: [
  { id: 'b', type: 'box', w: 'w', d: 30, h: 10 } ] };
const r1 = run('base for picks', d1, () => {});
const topIdx = r1.bodies[0].faces.findIndex(f => f.n && f.n[2] > 0.9);
const rightIdx = r1.bodies[0].faces.findIndex(f => f.n && f.n[0] > 0.9);
const eIdx = r1.bodies[0].edges.findIndex(e => e.t === 'LINE' && Math.abs(e.m[0] - 20) < 1e-6 && Math.abs(e.m[1] - 15) < 1e-6);
const fd = r1.bodies[0].faces, ed = r1.bodies[0].edges;
d1.features.push({ id: 'pp', type: 'extrude', face: { pick: [{ b: 'b', i: rightIdx, c: fd[rightIdx].c, n: fd[rightIdx].n }] }, distance: 5 });
const r2 = k.evaluate(d1).result; const ed2 = r2.bodies[0].edges;
const eIdx2 = ed2.findIndex(e => e.t === 'LINE' && Math.abs(e.m[0] - 25) < 1e-6 && Math.abs(e.m[1] - 15) < 1e-6);
d1.features.push({ id: 'fl', type: 'fillet', edges: { pick: [{ b: 'b', i: eIdx2, m: ed2[eIdx2].m, l: ed2[eIdx2].l, t: 'LINE', d: ed2[eIdx2].d }] }, radius: 3 });
run('push/pull right face + picked fillet', d1, (r, e) => { expect(!e.length, 'errors'); expect(near(r.max[0], 25), 'pulled to 25'); expect(r.volume < 45*30*10 && r.volume > 45*30*10 - 30, 'fillet removed a little'); });
d1.params[0].value = '70';
const r3 = run('same picks after w=70', d1, (r, e) => { expect(!e.length, 'errors'); expect(near(r.max[0], 40), 'pulled to 40'); expect(near(r.volume, 75*30*10 - (1-Math.PI/4)*9*10, 0.001), 'fillet followed the edge'); expect(Object.keys(r.picks).length >= 1, 'picks refreshed'); });
console.log('  refreshed picks:', JSON.stringify(r3.picks.pp?.face));

// caching: second identical evaluate is fast
let t = performance.now(); k.evaluate(d1); console.log('cached re-eval ms', Math.round(performance.now() - t));
const stl = k.exportSTL(null, 'standard'); console.log('stl', stl.triangles, 'tris', stl.buffer.byteLength, 'bytes');
const step = await k.exportSTEP(); console.log('step bytes', step.buffer.byteLength);
console.log(failed ? `${failed} FAILED` : 'ALL PASS');
process.exit(failed ? 1 : 0);
