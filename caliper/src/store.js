// Document state, undo history, selection and persistence.

const KEY = 'caliper.doc.v1';

export const EXAMPLE_DOC = {
  name: 'Example: standoff plate',
  example: true,
  params: [
    { name: 'width', value: '60' },
    { name: 'depth', value: '40' },
    { name: 'thickness', value: '4' },
    { name: 'hole', value: '4.2' },
    { name: 'post_d', value: '14' },
    { name: 'post_h', value: '16' },
  ],
  features: [
    {
      id: 'sketch1',
      type: 'sketch',
      name: 'Plate outline',
      plane: 'XY',
      shapes: [
        { id: 'r1', kind: 'rect', x: 0, y: 0, w: 'width', h: 'depth', r: 6 },
        { id: 'c1', kind: 'circle', x: 'width/2 - 8', y: 'depth/2 - 8', d: 'hole', hole: true },
        { id: 'c2', kind: 'circle', x: '-(width/2 - 8)', y: 'depth/2 - 8', d: 'hole', hole: true },
        { id: 'c3', kind: 'circle', x: 'width/2 - 8', y: '-(depth/2 - 8)', d: 'hole', hole: true },
        { id: 'c4', kind: 'circle', x: '-(width/2 - 8)', y: '-(depth/2 - 8)', d: 'hole', hole: true },
      ],
    },
    { id: 'extrude1', type: 'extrude', name: 'Plate', sketch: 'sketch1', distance: 'thickness', op: 'new' },
    { id: 'cylinder1', type: 'cylinder', name: 'Post', d: 'post_d', h: 'post_h', at: [0, 0, 'thickness'], op: 'join' },
    { id: 'cylinder2', type: 'cylinder', name: 'Bore', d: 'post_d - 6', h: 'post_h + thickness + 2', at: [0, 0, -1], op: 'cut' },
    { id: 'fillet1', type: 'fillet', name: 'Post root', edges: { kind: 'circle', near: [0, 'post_d/2', 'thickness'] }, radius: 2 },
    { id: 'chamfer1', type: 'chamfer', name: 'Post rim', edges: { kind: 'circle', near: [0, 'post_d/2', 'thickness + post_h'] }, distance: 1 },
  ],
};

const listeners = {};
export const on = (evt, fn) => {
  (listeners[evt] ||= []).push(fn);
};
export const emit = (evt, data) => {
  for (const fn of listeners[evt] || []) fn(data);
};

export const store = {
  doc: structuredClone(EXAMPLE_DOC),
  results: null, // last kernel output for the displayed state
  kernel: { state: 'loading', progress: 0, message: '' },
  sel: { feature: null, shape: null, picks: [] }, // picks: [{ kind: 'face'|'edge', b, i }]
  mode: { kind: 'model' }, // model | plane | sketch {id, tool} | pick {feature, key, kind}
  undoStack: [],
  redoStack: [],
  lastKey: null,
  lastAt: 0,
};

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const doc = JSON.parse(raw);
    if (doc && Array.isArray(doc.features)) {
      store.doc = normalize(doc);
      return true;
    }
  } catch {
    /* storage may be unavailable; start from the example */
  }
  return false;
}

let saveTimer = null;
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store.doc));
    } catch {
      /* ignore: autosave is a convenience */
    }
  }, 400);
}

export function normalize(doc) {
  const out = { name: String(doc.name || 'Untitled part'), params: [], features: [] };
  if (doc.example) out.example = true;
  for (const p of doc.params || []) {
    if (p && p.name !== undefined) out.params.push({ name: String(p.name), value: typeof p.value === 'number' ? String(p.value) : String(p.value ?? '0') });
  }
  if (doc.params && !Array.isArray(doc.params) && typeof doc.params === 'object') {
    for (const [name, value] of Object.entries(doc.params)) out.params.push({ name, value: String(value) });
  }
  const seen = new Set();
  for (const f of doc.features || []) {
    if (!f || typeof f !== 'object' || !f.type) continue;
    const g = { ...f };
    if (!g.id || seen.has(g.id)) g.id = uniqueId(g.type, seen);
    seen.add(g.id);
    if (g.type === 'sketch') {
      const ids = new Set();
      g.shapes = (g.shapes || []).filter((s) => s && s.kind).map((s) => {
        const t = { ...s };
        if (!t.id || ids.has(t.id)) t.id = uniqueId(t.kind[0], ids);
        ids.add(t.id);
        return t;
      });
    }
    out.features.push(g);
  }
  return out;
}

function uniqueId(prefix, taken) {
  for (let i = 1; ; i++) if (!taken.has(`${prefix}${i}`)) return `${prefix}${i}`;
}

export function newFeatureId(type) {
  return uniqueId(type, new Set(store.doc.features.map((f) => f.id)));
}
export function newShapeId(sketch, kind) {
  return uniqueId(kind[0], new Set((sketch.shapes || []).map((s) => s.id)));
}

export const featureById = (id) => store.doc.features.find((f) => f.id === id) || null;

// Change the document. `key` coalesces rapid edits of the same field into one undo step.
export function update(fn, { key = null, quiet = false } = {}) {
  const now = Date.now();
  const before = JSON.stringify(store.doc);
  fn(store.doc);
  const after = JSON.stringify(store.doc);
  if (after === before) return false;
  if (!quiet) {
    if (!(key && key === store.lastKey && now - store.lastAt < 1500)) {
      store.undoStack.push(before);
      if (store.undoStack.length > 200) store.undoStack.shift();
    }
    store.redoStack.length = 0;
    store.lastKey = key;
    store.lastAt = now;
    if (store.doc.example) delete store.doc.example;
  }
  saveSoon();
  emit('doc', { quiet });
  return true;
}

export function replaceDoc(doc, { undoable = true } = {}) {
  if (undoable) {
    store.undoStack.push(JSON.stringify(store.doc));
    store.redoStack.length = 0;
  }
  store.lastKey = null;
  store.doc = normalize(doc);
  store.sel = { feature: null, shape: null, picks: [] };
  store.mode = { kind: 'model' };
  saveSoon();
  emit('doc', {});
  emit('select');
  emit('mode');
}

function restore(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(store.doc));
  store.doc = JSON.parse(from.pop());
  store.lastKey = null;
  if (store.sel.feature && !featureById(store.sel.feature)) store.sel = { feature: null, shape: null, picks: [] };
  if ((store.mode.kind === 'sketch' && !featureById(store.mode.id)) || (store.mode.kind === 'pick' && !featureById(store.mode.feature))) {
    store.mode = { kind: 'model' };
    emit('mode');
  }
  store.sel.picks = [];
  saveSoon();
  emit('doc', {});
  emit('select');
}
export const undo = () => restore(store.undoStack, store.redoStack);
export const redo = () => restore(store.redoStack, store.undoStack);

export function select(patch) {
  store.sel = { ...store.sel, ...patch };
  emit('select');
}

export function setMode(mode) {
  store.mode = mode;
  emit('mode');
}

// The slice of the document the viewport should show for the current mode: while a sketch is open
// or a selection is being re-picked, later features are rolled back, as in a CAD timeline.
export function visibleDoc() {
  const { doc, mode } = store;
  if (mode.kind === 'sketch' || mode.kind === 'pick') {
    const id = mode.kind === 'sketch' ? mode.id : mode.feature;
    const at = doc.features.findIndex((f) => f.id === id);
    if (at >= 0) return { ...doc, features: doc.features.slice(0, mode.kind === 'sketch' ? at + 1 : at) };
  }
  return doc;
}
