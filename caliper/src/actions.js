// Commands: everything the toolbar, timeline, viewport clicks and keyboard can do to the document.
import { store, update, select, setMode, newFeatureId, featureById, emit } from './store.js';
import { FEATURES, DEFAULTS, MAKES_TOOL } from './schema.js';

export const app = { viewport: null, sketcher: null, kernel: null, toast: () => {}, rebuildNow: async () => null };

const round = (v) => Math.round(v * 1000) / 1000;

export function bodyOf(pick) {
  return store.results?.bodies.find((b) => b.id === pick.b) || null;
}
export function descOf(pick) {
  const b = bodyOf(pick);
  if (!b) return null;
  return (pick.kind === 'face' ? b.faces : b.edges)[pick.i] || null;
}
export function pickRef(pick) {
  const d = descOf(pick) || {};
  return pick.kind === 'face' ? { b: pick.b, i: pick.i, c: d.c, n: d.n, t: d.t } : { b: pick.b, i: pick.i, m: d.m, l: d.l, t: d.t, d: d.d };
}
const selected = (kind) => store.sel.picks.filter((p) => p.kind === kind);
const selectedPlanarFace = () => selected('face').find((p) => descOf(p)?.n) || null;
const hasBodies = () => (store.results?.bodies.length || 0) > 0;

function defaultName(type) {
  const label = FEATURES[type]?.label || type;
  const n = store.doc.features.filter((f) => f.type === type).length + 1;
  return `${label} ${n}`;
}

export function addFeature(type, props = {}) {
  const f = { id: newFeatureId(type), type, name: defaultName(type), ...structuredClone(DEFAULTS[type] || {}), ...props };
  update((doc) => doc.features.push(f));
  select({ feature: f.id, shape: null, picks: [] });
  emit('focus-first');
  return f;
}

export function deleteFeature(id) {
  if (store.mode.kind !== 'model') leaveMode();
  update((doc) => {
    doc.features = doc.features.filter((f) => f.id !== id);
  });
  if (store.sel.feature === id) select({ feature: null, shape: null });
}

export function toggleSuppress(id) {
  update((doc) => {
    const f = doc.features.find((x) => x.id === id);
    if (f) {
      if (f.suppressed) delete f.suppressed;
      else f.suppressed = true;
    }
  });
}

export function moveFeature(id, delta) {
  update((doc) => {
    const i = doc.features.findIndex((f) => f.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= doc.features.length) return;
    const [f] = doc.features.splice(i, 1);
    doc.features.splice(j, 0, f);
  });
}

// ---------- modes ----------
export function leaveMode() {
  const { mode } = store;
  if (mode.kind === 'sketch') return finishSketch();
  app.viewport.showPlanes(false);
  if (mode.kind !== 'model') setMode({ kind: 'model' });
}

export function startSketch() {
  if (store.mode.kind !== 'model') leaveMode();
  const face = selectedPlanarFace();
  if (face) return createSketch({ face: { pick: [pickRef(face)] } });
  select({ picks: [] });
  setMode({ kind: 'plane' });
  app.viewport.showPlanes(true);
}

export function createSketch(plane) {
  app.viewport.showPlanes(false);
  const f = addFeature('sketch', { plane, shapes: [] });
  editSketch(f.id);
}

export function editSketch(id) {
  const f = featureById(id);
  if (!f) return;
  if (store.mode.kind === 'sketch' && store.mode.id !== id) finishSketch();
  select({ feature: id, shape: null, picks: [] });
  setMode({ kind: 'sketch', id, tool: f.shapes?.length ? 'select' : 'rect' });
}

export function finishSketch() {
  const { mode } = store;
  if (mode.kind !== 'sketch') return;
  const id = mode.id;
  app.sketcher.exit();
  setMode({ kind: 'model' });
  const f = featureById(id);
  if (!f) return;
  const used = store.doc.features.some((x) => x.sketch === id);
  if (!f.shapes?.length && !used) {
    update((doc) => {
      doc.features = doc.features.filter((x) => x.id !== id);
    }, { quiet: true });
    select({ feature: null, shape: null });
    return;
  }
  if (!used && f.shapes?.length) {
    const onFace = typeof f.plane === 'object' || !['XY', 'XZ', 'YZ'].includes(String(f.plane).toUpperCase());
    addFeature('extrude', { sketch: id, distance: 10, op: hasBodies() ? 'join' : 'new', ...(onFace ? { op: 'join' } : {}) });
    app.toast('Sketch finished. Set the extrude distance, or switch the operation to Cut.');
  } else select({ feature: id, shape: null });
}

export function startPick(feature, key, kind) {
  if (store.mode.kind === 'sketch') finishSketch();
  select({ feature, picks: [] });
  setMode({ kind: 'pick', feature, key, pick: kind });
}

export function setSketchTool(tool) {
  if (store.mode.kind !== 'sketch') return;
  store.mode = { ...store.mode, tool };
  app.sketcher.setTool(tool);
  emit('mode');
}

// ---------- viewport clicks ----------
export function viewportClick(pick, evt) {
  const { mode } = store;
  if (mode.kind === 'plane') {
    if (!pick) return;
    if (pick.kind === 'plane') createSketch(pick.name);
    else if (pick.kind === 'face' && pick.planar) createSketch({ face: { pick: [pickRef(pick)] } });
    else app.toast('Sketches need a flat face. Pick a planar face or one of the three planes.');
    return;
  }
  if (mode.kind === 'pick') {
    if (!pick || pick.kind !== mode.pick) return;
    const single = FEATURES[featureById(mode.feature)?.type]?.fields.find((x) => x.key === mode.key)?.single;
    update((doc) => {
      const f = doc.features.find((x) => x.id === mode.feature);
      if (!f) return;
      const cur = f[mode.key] && typeof f[mode.key] === 'object' && Array.isArray(f[mode.key].pick) ? f[mode.key].pick : [];
      const at = cur.findIndex((p) => p.b === pick.b && p.i === pick.i);
      if (at >= 0) cur.splice(at, 1);
      else if (single) cur.splice(0, cur.length, pickRef(pick));
      else cur.push(pickRef(pick));
      f[mode.key] = { pick: cur };
    });
    return;
  }
  if (mode.kind !== 'model') return;
  if (!pick) {
    if (store.sel.picks.length) select({ picks: [] });
    return;
  }
  const p = { kind: pick.kind, b: pick.b, i: pick.i };
  const same = (q) => q.kind === p.kind && q.b === p.b && q.i === p.i;
  const multi = evt.shiftKey || evt.ctrlKey || evt.metaKey;
  let picks;
  if (multi) picks = store.sel.picks.some(same) ? store.sel.picks.filter((q) => !same(q)) : [...store.sel.picks.filter((q) => q.kind === p.kind), p];
  else picks = store.sel.picks.length === 1 && same(store.sel.picks[0]) ? [] : [p];
  select({ picks });
}

// ---------- toolbar ----------
function findSketch() {
  const cur = featureById(store.sel.feature);
  if (cur?.type === 'sketch') return cur;
  const sketches = store.doc.features.filter((f) => f.type === 'sketch' && !f.suppressed && f.shapes?.length);
  const unused = sketches.filter((s) => !store.doc.features.some((f) => f.sketch === s.id));
  return unused[unused.length - 1] || sketches[sketches.length - 1] || null;
}

function placement() {
  const face = selectedPlanarFace();
  if (!face) return {};
  const d = descOf(face);
  const n = d.n;
  const at = d.c.map(round);
  let rot = null;
  if (n[0] > 0.999) rot = [0, 90, 0];
  else if (n[0] < -0.999) rot = [0, -90, 0];
  else if (n[1] > 0.999) rot = [-90, 0, 0];
  else if (n[1] < -0.999) rot = [90, 0, 0];
  else if (n[2] < -0.999) rot = [180, 0, 0];
  return rot ? { at, rot } : { at };
}

export function command(name) {
  if (name !== 'sketch' && store.mode.kind !== 'model') leaveMode();
  const op = hasBodies() ? 'join' : 'new';
  switch (name) {
    case 'sketch':
      return startSketch();
    case 'box':
    case 'cylinder':
    case 'cone':
    case 'torus':
      return addFeature(name, { ...placement(), op });
    case 'sphere': {
      const pl = placement();
      return addFeature('sphere', { ...(pl.at ? { at: pl.at } : {}), op });
    }
    case 'extrude': {
      const face = selectedPlanarFace();
      if (face) return addFeature('extrude', { name: defaultName('extrude').replace('Extrude', 'Push/pull'), face: { pick: [pickRef(face)] }, distance: 5, op: 'join' });
      const sk = findSketch();
      if (!sk) {
        app.toast('Extrude needs a profile. Draw a sketch, or select a flat face to push or pull it.');
        return startSketch();
      }
      return addFeature('extrude', { sketch: sk.id, distance: 10, op });
    }
    case 'revolve': {
      const sk = findSketch();
      if (!sk) {
        app.toast('Revolve needs a profile. Draw half of the cross-section in a sketch first.');
        return startSketch();
      }
      return addFeature('revolve', { sketch: sk.id, op });
    }
    case 'fillet':
    case 'chamfer': {
      if (!hasBodies()) return app.toast('Make a solid first, then round or bevel its edges.');
      let edges = selected('edge');
      if (!edges.length) {
        // A selected face stands for the edges around it.
        const seen = new Set();
        for (const fc of selected('face')) {
          const body = bodyOf(fc);
          body?.edges.forEach((d, i) => {
            if (!d.seam && (d.f || []).includes(fc.i) && !seen.has(`${fc.b}:${i}`)) {
              seen.add(`${fc.b}:${i}`);
              edges.push({ kind: 'edge', b: fc.b, i });
            }
          });
        }
      }
      const f = addFeature(name, { edges: { pick: edges.map(pickRef) } });
      if (!edges.length) startPick(f.id, 'edges', 'edge');
      return f;
    }
    case 'shell': {
      if (!hasBodies()) return app.toast('Make a solid first, then hollow it out.');
      const faces = selected('face');
      const f = addFeature('shell', { faces: { pick: faces.map(pickRef) } });
      if (!faces.length) startPick(f.id, 'faces', 'face');
      return f;
    }
    case 'pattern': {
      const cur = featureById(store.sel.feature);
      const tools = store.doc.features.filter((f) => MAKES_TOOL.has(f.type) && !f.suppressed);
      const src = cur && MAKES_TOOL.has(cur.type) ? cur : tools[tools.length - 1];
      if (!src) return app.toast('Patterns repeat an extrude, revolve or primitive. Create one first.');
      return addFeature('pattern', { features: [src.id] });
    }
    case 'mirror': {
      if (!hasBodies()) return app.toast('Make a solid first, then mirror it.');
      const cur = featureById(store.sel.feature);
      return addFeature('mirror', cur && MAKES_TOOL.has(cur.type) ? { features: [cur.id] } : {});
    }
    case 'move':
      if (!hasBodies()) return app.toast('Make a solid first, then move it.');
      return addFeature('move');
    default:
      return null;
  }
}
