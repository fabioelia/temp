// Caliper: boot, wire the kernel, viewport, sketcher and panels together.
import './style.css';
import { Kernel } from './kernel/client.js';
import { Viewport } from './viewport.js';
import { Sketcher } from './sketcher.js';
import { store, on, emit, update, select, loadSaved, visibleDoc, featureById, replaceDoc, undo, redo, setMode, EXAMPLE_DOC, normalize } from './store.js';
import { initUI, toast } from './ui.js';
import { initAssistant } from './assistant.js';
import { saveFile, safeName } from './export.js';
import * as act from './actions.js';

const $ = (id) => document.getElementById(id);
document.body.dataset.tab ||= 'model';

loadSaved();
const viewport = new Viewport($('viewport'));
const kernel = new Kernel();
const sketcher = new Sketcher(viewport, $('sk-label'), {
  sketch: () => (store.mode.kind === 'sketch' ? featureById(store.mode.id) : null),
  scope: () => store.results?.params || {},
  change: (fn, key) =>
    update(
      (doc) => {
        const sk = doc.features.find((f) => f.id === store.mode.id);
        if (sk) fn(sk);
      },
      { key },
    ),
  selectShape: (id) => select({ shape: id }),
  selectedShape: () => store.sel.shape,
  setTool: (tool) => act.setSketchTool(tool),
});
Object.assign(act.app, { viewport, sketcher, kernel, toast, rebuildNow });

// ---------- rebuild loop ----------
let timer = null;
let waiters = [];
let sketchFrameKey = '';

function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(runRebuild, 30);
}

function rebuildNow() {
  return new Promise((resolve) => {
    waiters.push(resolve);
    clearTimeout(timer);
    runRebuild();
  });
}

async function runRebuild() {
  if (store.kernel.state !== 'ready') return;
  store.kernel.busy = true;
  emit('kernel');
  let res = null;
  try {
    res = await kernel.evaluate(JSON.parse(JSON.stringify(visibleDoc())));
    if (res === null) return; // a newer rebuild took over and will report
  } catch (e) {
    toast(e.message || 'The geometry kernel hit an error.', 'error');
    store.kernel.busy = false;
    emit('kernel');
    waiters.splice(0).forEach((w) => w(null));
    return;
  }
  store.kernel.busy = false;
  store.results = res;
  // Picked faces/edges are re-anchored by the kernel as the model changes; keep those refreshed
  // references without creating undo steps or another rebuild.
  let refreshed = false;
  for (const [id, fresh] of Object.entries(res.picks || {})) {
    const f = featureById(id);
    if (!f) continue;
    for (const key of ['edges', 'faces', 'face']) if (fresh[key] && f[key]) f[key] = fresh[key];
    if (fresh.plane && f.plane) f.plane = fresh.plane;
    refreshed = true;
  }
  if (refreshed) {
    try {
      localStorage.setItem('caliper.doc.v1', JSON.stringify(store.doc));
    } catch {
      /* autosave is a convenience */
    }
  }
  viewport.setBodies(res.bodies, res.min ? { min: res.min, max: res.max } : {});
  emit('kernel');
  emit('results');
  syncSketch();
  syncHighlights();
  waiters.splice(0).forEach((w) => w(res));
}

// ---------- mode plumbing ----------
function syncSketch() {
  const { mode } = store;
  if (mode.kind !== 'sketch') {
    if (sketcher.active) sketcher.exit();
    sketchFrameKey = '';
    return;
  }
  const info = store.results?.features?.[mode.id];
  if (!info) return;
  if (!info.frame) {
    toast(info.error || 'This sketch has lost its plane.', 'error');
    sketcher.exit();
    setMode({ kind: 'model' });
    return;
  }
  const key = `${mode.id}:${JSON.stringify(info.frame)}`;
  if (key !== sketchFrameKey) {
    const first = sketchFrameKey.split(':')[0] !== mode.id;
    sketchFrameKey = key;
    sketcher.enter(info.frame);
    sketcher.tool = mode.tool;
    if (first) {
      viewport.lookAtFrame(info.frame);
      const sk = featureById(mode.id);
      if (!viewport.bounds && !sk?.shapes?.length) viewport.fit(true, { min: [-45, -45, -1], max: [45, 45, 1] });
    }
  }
  sketcher.redraw();
}

function syncHighlights() {
  const { mode } = store;
  let selected = [];
  if (mode.kind === 'pick') {
    const f = featureById(mode.feature);
    selected = (f?.[mode.key]?.pick || []).map((p) => ({ kind: mode.pick, b: p.b, i: p.i }));
  } else if (mode.kind === 'model') selected = store.sel.picks;
  viewport.setHighlights({ selected });
}

let lastModeKind = 'model';
on('mode', () => {
  const { mode } = store;
  viewport.pickFilter = mode.kind === 'model' ? 'any' : mode.kind === 'plane' ? 'plane' : mode.kind === 'pick' ? mode.pick : 'none';
  viewport.showPlanes(mode.kind === 'plane');
  viewport.setHighlights({ hover: null });
  viewport.canvas.style.cursor = mode.kind === 'sketch' ? 'crosshair' : '';
  if (mode.kind === 'sketch' && sketcher.active && sketcher.tool !== mode.tool) sketcher.setTool(mode.tool);
  if (lastModeKind === 'sketch' && mode.kind !== 'sketch') {
    viewport.view('iso');
    setTimeout(() => viewport.fit(), 300);
  }
  lastModeKind = mode.kind;
  scheduleRebuild();
  syncHighlights();
});
on('doc', () => {
  scheduleRebuild();
  if (sketcher.active) sketcher.redraw();
});
on('select', () => {
  syncHighlights();
  if (sketcher.active) sketcher.redraw();
});

viewport.handlers = {
  click: (pick, evt) => act.viewportClick(pick, evt),
  hover: (pick) => {
    if (store.mode.kind === 'plane') viewport.showPlanes(true, pick?.kind === 'plane' ? pick.name : null);
    viewport.setHighlights({ hover: pick && pick.kind !== 'plane' ? pick : null });
    viewport.canvas.style.cursor = store.mode.kind === 'sketch' ? 'crosshair' : pick ? 'pointer' : '';
  },
  pointer: (type, evt) => {
    if (store.mode.kind === 'sketch') sketcher.pointer(type, evt);
  },
  theme: () => sketcher.redraw(),
};

// ---------- keyboard ----------
window.addEventListener('keydown', (e) => {
  const t = e.target;
  const typing = t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 'y' && !typing) {
    e.preventDefault();
    redo();
    return;
  }
  if (typing) {
    if (e.key === 'Escape') t.blur();
    return;
  }
  if (store.mode.kind === 'sketch' && sketcher.key(e)) {
    e.preventDefault();
    return;
  }
  if (e.key === 'Escape') {
    if (store.mode.kind !== 'model') act.leaveMode();
    else if (store.sel.picks.length) select({ picks: [] });
    else if (store.sel.feature) select({ feature: null, shape: null });
    return;
  }
  if (e.key === 'Enter' && store.mode.kind !== 'model') {
    act.leaveMode();
    return;
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && store.mode.kind === 'model' && store.sel.feature) {
    e.preventDefault();
    act.deleteFeature(store.sel.feature);
    return;
  }
  if (mod || e.altKey || store.mode.kind !== 'model') return;
  const keys = { e: 'extrude', f: 'fillet', s: 'sketch' };
  const cmd = keys[e.key.toLowerCase()];
  if (cmd) {
    e.preventDefault();
    act.command(cmd);
  }
});

// ---------- file menu ----------
async function exportFile(kind) {
  if (!store.results?.bodies.length || store.mode.kind !== 'model') {
    if (store.mode.kind !== 'model') act.leaveMode();
    await rebuildNow();
  }
  if (!store.results?.bodies.length) return toast('There is nothing to export yet. Build a solid first.');
  const base = safeName(store.doc.name);
  try {
    if (kind === 'stl') {
      const out = await kernel.exportSTL(null, $('stl-quality').value);
      const msg = await saveFile(`${base}.stl`, out.buffer, 'model/stl');
      if (msg) toast(`${msg} · ${out.triangles.toLocaleString()} triangles`);
    } else {
      const out = await kernel.exportSTEP(null);
      const msg = await saveFile(`${base}.step`, out.buffer, 'model/step');
      if (msg) toast(msg);
    }
  } catch (e) {
    toast(e.message || 'Export failed.', 'error');
  }
}

const fileActions = {
  new: () => {
    replaceDoc({ name: 'Untitled part', params: [], features: [] });
    viewport.fit(true, { min: [-40, -40, 0], max: [40, 40, 30] });
  },
  example: () => {
    replaceDoc(structuredClone(EXAMPLE_DOC));
    viewport.fitted = false;
  },
  open: () => $('open-file').click(),
  save: async () => {
    try {
      const { example, ...doc } = store.doc;
      const msg = await saveFile(`${safeName(store.doc.name)}.caliper.json`, JSON.stringify(doc, null, 2), 'application/json');
      if (msg) toast(msg);
    } catch (e) {
      toast(e.message, 'error');
    }
  },
  stl: () => exportFile('stl'),
  step: () => exportFile('step'),
};

$('open-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const doc = JSON.parse(await file.text());
    if (!doc || !Array.isArray(doc.features)) throw new Error('not a Caliper project');
    replaceDoc(normalize(doc));
    viewport.fitted = false;
    toast(`Opened ${file.name}`);
  } catch {
    toast('That file is not a Caliper project (.caliper.json).', 'error');
  }
});

// ---------- theme ----------
const refreshTheme = () => viewport.applyTheme();
new MutationObserver(refreshTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshTheme);

// ---------- go ----------
initUI(fileActions);
initAssistant();
document.fonts?.ready.then(() => viewport.resize());

kernel
  .init((p) => {
    store.kernel.progress = p;
    emit('kernel');
  })
  .then(() => {
    store.kernel = { state: 'ready', progress: 1, message: '' };
    emit('kernel');
    runRebuild();
    kernel
      .loadFont()
      .then((ok) => {
        store.fontReady = ok;
        if (ok && store.doc.features.some((f) => f.shapes?.some((s) => s.kind === 'text'))) {
          // Text shapes were waiting for the font: rebuild them now.
          kernel.call('evaluate', { doc: { features: [] } }).then(() => runRebuild());
        }
      })
      .catch(() => {});
  })
  .catch((e) => {
    store.kernel = { state: 'error', progress: 0, message: `The geometry kernel could not start (${e.message || 'unknown error'}). Reload the page to try again.` };
    emit('kernel');
  });

// Small hook for automated checks.
window.caliper = { store, viewport, act, rebuildNow };
