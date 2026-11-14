// Panels: toolbar, parameters, timeline, inspector, mode bar and readouts.
import { store, on, emit, update, select, featureById, undo, redo, setMode } from './store.js';
import { evalExpr, fmt } from './expr.js';
import { FEATURES, SHAPES, EDGE_PRESETS, FACE_PRESETS, MAKES_TOOL, featureLabel } from './schema.js';
import * as act from './actions.js';

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
export const ICON = {
  sketch: svg('<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>'),
  box: svg('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
  cylinder: svg('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/>'),
  sphere: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12c0 1.9 3.8 3.4 8.5 3.4s8.5-1.5 8.5-3.4"/>'),
  cone: svg('<path d="M12 3L5 18"/><path d="M12 3l7 15"/><ellipse cx="12" cy="18" rx="7" ry="2.8"/>'),
  torus: svg('<ellipse cx="12" cy="12" rx="9" ry="5.5"/><ellipse cx="12" cy="11" rx="3.6" ry="1.6"/>'),
  extrude: svg('<path d="M5 19h14l-2-5H7z"/><path d="M12 12V3M8.5 6.5L12 3l3.5 3.5"/>'),
  revolve: svg('<path d="M12 3v18"/><path d="M12 6c4.5 0 7 1.5 7 3s-2.5 3-7 3"/><path d="M19 9v6c0 1.5-2.5 3-7 3"/><path d="M7 7.5C5.8 8 5 8.5 5 9"/>'),
  fillet: svg('<path d="M4 20V11a7 7 0 017-7h9"/><path d="M4 20h16V4" stroke-dasharray="2 3"/>'),
  chamfer: svg('<path d="M4 20v-9l7-7h9"/><path d="M4 20h16V4" stroke-dasharray="2 3"/>'),
  shell: svg('<path d="M4 6h16v14H4z"/><path d="M8 6v10h8V6"/>'),
  pattern: svg('<rect x="4" y="4" width="5" height="5"/><rect x="15" y="4" width="5" height="5"/><rect x="4" y="15" width="5" height="5"/><rect x="15" y="15" width="5" height="5"/>'),
  mirror: svg('<path d="M12 3v18" stroke-dasharray="2 3"/><path d="M9 7L4 17h5z"/><path d="M15 7l5 10h-5z"/>'),
  move: svg('<path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>'),
  undo: svg('<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12h-2" transform="translate(0 -4)"/>'),
  redo: svg('<path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 000 12h2" transform="translate(0 -4)"/>'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>'),
  eyeOff: svg('<path d="M4 4l16 16"/><path d="M9.5 6C10.300 5.700 11.100 5.500 12 5.500c6 0 9.500 6.500 9.500 6.500a17 17 0 01-3 3.700M6.300 7.800A17 17 0 002.500 12S6 18.500 12 18.500c1.300 0 2.500-.300 3.600-.800"/>'),
  trash: svg('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'),
  select: svg('<path d="M6 3l12 9-5.500 1L15.500 19l-2.200 1-3-6L6 18z"/>'),
  rect: svg('<rect x="4" y="6" width="16" height="12"/>'),
  circle: svg('<circle cx="12" cy="12" r="8"/>'),
  polygon: svg('<path d="M12 3.500l7.400 4.250v8.500L12 20.500l-7.400-4.250v-8.500z"/>'),
  slot: svg('<rect x="3" y="8" width="18" height="8" rx="4"/>'),
  text: svg('<path d="M5 7V5h14v2M12 5v14M9 19h6"/>'),
  path: svg('<path d="M4 18l5-11 6 7 5-8"/><circle cx="4" cy="18" r="1.3"/><circle cx="9" cy="7" r="1.3"/><circle cx="15" cy="14" r="1.3"/><circle cx="20" cy="6" r="1.3"/>'),
  up: svg('<path d="M6 14l6-6 6 6"/>'),
  down: svg('<path d="M6 10l6 6 6-6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  warn: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'),
  file: svg('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
  download: svg('<path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M5 20h14"/>'),
};

const TOOLBAR = [
  [['sketch', 'Sketch', 'Draw a 2D profile on a plane or a flat face']],
  [
    ['box', 'Box', 'Add a box'],
    ['cylinder', 'Cylinder', 'Add a cylinder'],
    ['sphere', 'Sphere', 'Add a sphere'],
    ['cone', 'Cone', 'Add a cone'],
    ['torus', 'Torus', 'Add a ring'],
  ],
  [
    ['extrude', 'Extrude', 'Pull a sketch or a flat face into a solid (E)'],
    ['revolve', 'Revolve', 'Spin a sketch around an axis'],
  ],
  [
    ['fillet', 'Fillet', 'Round edges (F)'],
    ['chamfer', 'Chamfer', 'Bevel edges'],
    ['shell', 'Shell', 'Hollow out a solid'],
  ],
  [
    ['pattern', 'Pattern', 'Repeat a feature in rows or around an axis'],
    ['mirror', 'Mirror', 'Mirror across a plane'],
    ['move', 'Move', 'Move, rotate or copy bodies'],
  ],
];

const SKETCH_TOOLS = [
  ['select', 'Select', 'Select and drag shapes (V)'],
  ['rect', 'Rectangle', 'Drag corner to corner (R)'],
  ['circle', 'Circle', 'Drag from the centre (C)'],
  ['polygon', 'Polygon', 'Drag from the centre (P)'],
  ['slot', 'Slot', 'Drag end to end (O)'],
  ['path', 'Line', 'Click points, click the first one to close (L)'],
  ['text', 'Text', 'Click where the text starts (T)'],
];

const $ = (id) => document.getElementById(id);
let refreshers = [];
let inspectorSig = '';
let selfEdit = false;
let toastTimer = null;

export function toast(msg, kind = 'info') {
  const el = $('toast');
  el.textContent = msg;
  el.dataset.kind = kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), kind === 'error' ? 7000 : 4500);
}

const scope = () => store.results?.params || {};
const isPlain = (v) => typeof v === 'number' || /^\s*-?\d*\.?\d+\s*$/.test(String(v));

// ---------- controls ----------
function exprInput({ get, set, unit, def, id, label }) {
  const input = h('input', { type: 'text', class: 'in', id, inputmode: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': label, value: String(get() ?? def ?? '') });
  const note = h('span', { class: 'in-note' });
  const refresh = () => {
    const raw = input.value.trim();
    input.classList.remove('bad');
    note.textContent = '';
    if (raw === '') return;
    try {
      const v = evalExpr(isPlain(raw) ? Number(raw) : raw, scope());
      if (!isPlain(raw)) note.textContent = `= ${fmt(v)}${unit ? ` ${unit}` : ''}`;
    } catch (e) {
      input.classList.add('bad');
      note.textContent = e.message;
    }
  };
  const commit = () => {
    const raw = input.value.trim();
    selfEdit = true;
    set(raw === '' ? undefined : isPlain(raw) ? Number(raw) : raw);
    selfEdit = false;
    refresh();
  };
  input.addEventListener('input', commit);
  input.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isPlain(input.value)) {
      e.preventDefault();
      const step = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
      input.value = String(Math.round((Number(input.value) + step) * 1000) / 1000);
      commit();
    }
    if (e.key === 'Enter') input.blur();
  });
  refreshers.push(refresh);
  refresh();
  return h('span', { class: 'in-wrap' }, input, unit ? h('span', { class: 'in-unit' }, unit) : null, note);
}

function selectInput({ get, set, options, id, label }) {
  const el = h(
    'select',
    { class: 'in', id, 'aria-label': label, onchange: () => set(el.value) },
    options.map(([v, text]) => h('option', { value: v }, text)),
  );
  el.value = get();
  return el;
}

function row(label, control, hint) {
  return h('div', { class: 'row' }, h('label', { class: 'row-label', for: control.querySelector?.('input,select')?.id || control.id }, label), h('div', { class: 'row-ctl' }, control, hint ? h('div', { class: 'row-hint' }, hint) : null));
}

// ---------- toolbar ----------
function renderToolbar() {
  const bar = $('toolbar');
  bar.replaceChildren(
    ...TOOLBAR.map((group) =>
      h(
        'div',
        { class: 'tool-group' },
        group.map(([id, label, tip]) => h('button', { class: 'tool', type: 'button', title: tip, 'data-cmd': id, onclick: () => act.command(id) }, h('span', { class: 'tool-ico', html: ICON[id] }), h('span', { class: 'tool-label' }, label))),
      ),
    ),
  );
}

// ---------- parameters ----------
function renderParams() {
  const box = $('params');
  refreshersFor('params', []);
  const list = [];
  const rows = store.doc.params.map((p, i) => {
    const name = h('input', { type: 'text', class: 'in p-name', id: `param-name-${i}`, 'aria-label': 'Parameter name', spellcheck: 'false', value: p.name });
    name.addEventListener('change', () => {
      const next = name.value.trim().replace(/[^A-Za-z0-9_]/g, '_');
      update((doc) => renameParam(doc, i, next));
    });
    const value = h('input', { type: 'text', class: 'in p-value', id: `param-value-${i}`, 'aria-label': `${p.name} value`, spellcheck: 'false', autocomplete: 'off', value: p.value });
    const note = h('span', { class: 'p-note' });
    const refresh = () => {
      const err = store.results?.paramErrors?.[p.name];
      value.classList.toggle('bad', !!err);
      const v = store.results?.params?.[p.name];
      note.textContent = err ? err : !isPlain(value.value) && v !== undefined ? `= ${fmt(v)}` : '';
      note.classList.toggle('bad', !!err);
    };
    value.addEventListener('input', () => {
      selfEdit = true;
      update((doc) => (doc.params[i].value = value.value.trim() || '0'), { key: `param.${i}` });
      selfEdit = false;
    });
    value.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && isPlain(value.value)) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        value.value = String(Math.round((Number(value.value) + step) * 1000) / 1000);
        value.dispatchEvent(new Event('input'));
      }
      if (e.key === 'Enter') value.blur();
    });
    list.push(refresh);
    refresh();
    return h(
      'div',
      { class: 'p-row' },
      name,
      h('span', { class: 'p-eq' }, '='),
      value,
      h('button', { class: 'icon-btn', type: 'button', title: `Delete ${p.name}`, 'aria-label': `Delete parameter ${p.name}`, html: ICON.close, onclick: () => update((doc) => doc.params.splice(i, 1)) }),
      note,
    );
  });
  refreshersFor('params', list);
  box.replaceChildren(
    ...rows,
    h(
      'button',
      {
        class: 'ghost-btn',
        type: 'button',
        onclick: () => {
          update((doc) => {
            let n = doc.params.length + 1;
            while (doc.params.some((p) => p.name === `p${n}`)) n++;
            doc.params.push({ name: `p${n}`, value: '10' });
          });
          $(`param-name-${store.doc.params.length - 1}`)?.select();
        },
      },
      h('span', { html: ICON.plus }),
      'Add parameter',
    ),
  );
}

// Renaming a parameter also rewrites the expressions that use it.
function renameParam(doc, i, next) {
  const prev = doc.params[i].name;
  if (!next || next === prev || doc.params.some((p) => p.name === next)) return;
  doc.params[i].name = next;
  const re = new RegExp(`(?<![A-Za-z0-9_])${prev}(?![A-Za-z0-9_])`, 'g');
  const walk = (o) => {
    for (const k of Object.keys(o)) {
      if (k === 'id' || k === 'name' || k === 'type' || k === 'kind' || k === 'text') continue;
      if (typeof o[k] === 'string') o[k] = o[k].replace(re, next);
      else if (o[k] && typeof o[k] === 'object') walk(o[k]);
    }
  };
  doc.params.forEach((p) => (p.value = p.value.replace(re, next)));
  doc.features.forEach(walk);
}

const groups = {};
function refreshersFor(name, list) {
  groups[name] = list;
}

// ---------- timeline ----------
function renderTimeline() {
  const ol = $('timeline');
  const info = store.results?.features || {};
  const rolled = store.mode.kind === 'sketch' ? store.mode.id : store.mode.kind === 'pick' ? store.mode.feature : null;
  let after = false;
  const items = store.doc.features.map((f) => {
    const err = !f.suppressed && info[f.id]?.error;
    const li = h(
      'li',
      {
        class: `tl-item${store.sel.feature === f.id ? ' selected' : ''}${err ? ' error' : ''}${f.suppressed ? ' suppressed' : ''}${after ? ' rolled' : ''}`,
        'data-id': f.id,
        tabindex: '0',
        onclick: () => {
          if (store.mode.kind === 'sketch' && store.mode.id !== f.id) act.finishSketch();
          select({ feature: f.id, shape: null });
        },
        ondblclick: () => f.type === 'sketch' && act.editSketch(f.id),
        onkeydown: (e) => {
          if (e.key === 'Enter') {
            if (f.type === 'sketch') act.editSketch(f.id);
            else select({ feature: f.id, shape: null });
          }
        },
      },
      h('span', { class: 'tl-ico', html: ICON[f.type] || ICON.box }),
      h('span', { class: 'tl-name' }, featureLabel(f)),
      err ? h('span', { class: 'tl-err', title: err, html: ICON.warn }) : null,
      h('button', {
        class: 'icon-btn tl-eye',
        type: 'button',
        title: f.suppressed ? 'Turn this feature back on' : 'Suppress (skip) this feature',
        'aria-label': f.suppressed ? `Unsuppress ${featureLabel(f)}` : `Suppress ${featureLabel(f)}`,
        html: f.suppressed ? ICON.eyeOff : ICON.eye,
        onclick: (e) => {
          e.stopPropagation();
          act.toggleSuppress(f.id);
        },
      }),
    );
    if (f.id === rolled) after = true;
    return li;
  });
  ol.replaceChildren(...(items.length ? items : [h('li', { class: 'tl-empty' }, 'Nothing here yet. Start with Sketch or a Box, or ask the assistant for a first draft.')]));
}

// ---------- inspector ----------
function presetOf(value, presets) {
  if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.pick) && Object.keys(value).length === 1) return 'pick';
  const s = JSON.stringify(value);
  const hit = presets.find((p) => p.length > 2 && (JSON.stringify(p[2]) === s || (typeof p[2] === 'string' && JSON.stringify({ on: p[2] }) === s)));
  return hit ? hit[0] : 'custom';
}

function selectorField(f, fd, setKey) {
  const kind = fd.type === 'edges' ? 'edge' : 'face';
  const presets = fd.single ? [FACE_PRESETS[0]] : kind === 'edge' ? EDGE_PRESETS : FACE_PRESETS;
  const cur = presetOf(f[fd.key], presets);
  const opts = presets.map((p) => [p[0], p[1]]);
  if (cur === 'custom') opts.push(['custom', 'Custom (set by the assistant)']);
  const sel = selectInput({
    id: `f-${fd.key}`,
    label: fd.label,
    options: opts,
    get: () => cur,
    set: (v) => {
      const p = presets.find((x) => x[0] === v);
      if (v === 'pick') setKey({ pick: [] });
      else if (p) setKey(structuredClone(p[2]));
    },
  });
  const parts = [fd.single ? null : sel];
  if (cur === 'pick') {
    const n = f[fd.key].pick.length;
    const picking = store.mode.kind === 'pick' && store.mode.feature === f.id && store.mode.key === fd.key;
    parts.push(
      h(
        'div',
        { class: 'pick-line' },
        h('span', { class: `pick-count${n ? '' : ' none'}` }, n ? `${n} ${kind}${n === 1 ? '' : 's'} picked` : `No ${kind}s picked yet`),
        h('button', { class: picking ? 'btn primary small' : 'btn small', type: 'button', onclick: () => (picking ? act.leaveMode() : act.startPick(f.id, fd.key, kind)) }, picking ? 'Done' : n ? 'Change' : `Pick ${kind}s`),
      ),
    );
  } else if (cur === 'custom') parts.push(h('code', { class: 'custom-sel' }, JSON.stringify(f[fd.key])));
  return h('div', { class: 'sel-field' }, parts);
}

function vec3Field(obj, fd, setKey, idp) {
  const cur = () => (Array.isArray(obj[fd.key]) ? obj[fd.key] : fd.def || [0, 0, 0]);
  return h(
    'div',
    { class: 'vec3' },
    ['x', 'y', 'z'].map((axis, i) =>
      h(
        'label',
        { class: 'vec3-cell' },
        h('span', { class: 'vec3-axis' }, axis),
        exprInput({
          id: `${idp}-${fd.key}-${axis}`,
          label: `${fd.label} ${axis}`,
          get: () => cur()[i],
          set: (v) => {
            const next = cur().slice();
            next[i] = v === undefined ? 0 : v;
            setKey(next);
          },
        }),
      ),
    ),
  );
}

function fieldControl(obj, fd, setKey, idp) {
  switch (fd.type) {
    case 'expr':
      return exprInput({ id: `${idp}-${fd.key}`, label: fd.label, unit: fd.unit, def: fd.def, get: () => obj[fd.key], set: setKey });
    case 'text': {
      const el = h('input', { type: 'text', class: 'in', id: `${idp}-${fd.key}`, value: obj[fd.key] ?? '' });
      el.addEventListener('input', () => {
        selfEdit = true;
        setKey(el.value);
        selfEdit = false;
      });
      return el;
    }
    case 'select':
      return selectInput({ id: `${idp}-${fd.key}`, label: fd.label, options: fd.options, get: () => obj[fd.key] ?? fd.def ?? fd.options[0][0], set: setKey });
    case 'bool': {
      const el = h('input', { type: 'checkbox', id: `${idp}-${fd.key}`, onchange: () => setKey(el.checked || undefined) });
      el.checked = !!obj[fd.key];
      return el;
    }
    case 'vec3':
      return vec3Field(obj, fd, setKey, idp);
    case 'edges':
    case 'faces':
      return selectorField(obj, fd, setKey);
    case 'sketch': {
      const sketches = store.doc.features.filter((x) => x.type === 'sketch');
      return selectInput({ id: `${idp}-${fd.key}`, label: fd.label, options: sketches.length ? sketches.map((s) => [s.id, featureLabel(s)]) : [['', 'No sketches yet']], get: () => obj[fd.key] ?? '', set: setKey });
    }
    case 'tools': {
      const tools = store.doc.features.filter((x) => MAKES_TOOL.has(x.type) && x.id !== obj.id);
      const opts = tools.map((s) => [s.id, featureLabel(s)]);
      if (fd.optional) opts.unshift(['', fd.optional]);
      return selectInput({ id: `${idp}-${fd.key}`, label: fd.label, options: opts.length ? opts : [['', 'Nothing to repeat yet']], get: () => [].concat(obj[fd.key] || [])[0] ?? '', set: (v) => setKey(v ? [v] : undefined) });
    }
    case 'plane': {
      const pl = obj.plane ?? 'XY';
      const base = typeof pl === 'string' && ['XY', 'XZ', 'YZ'].includes(pl.toUpperCase());
      const opts = [
        ['XY', 'XY (top view)'],
        ['XZ', 'XZ (front view)'],
        ['YZ', 'YZ (side view)'],
      ];
      if (!base) opts.push(['face', typeof pl === 'string' ? `Face: ${pl}` : 'A face of the model']);
      return selectInput({ id: `${idp}-${fd.key}`, label: fd.label, options: opts, get: () => (base ? pl.toUpperCase() : 'face'), set: (v) => v !== 'face' && setKey(v) });
    }
    default:
      return h('span', {}, '');
  }
}

function fieldRows(obj, fields, setter, idp) {
  return fields.filter((fd) => !fd.showIf || fd.showIf(obj)).map((fd) => (fd.type === 'bool' ? h('label', { class: 'row check' }, fieldControl(obj, fd, (v) => setter(fd.key, v), idp), h('span', {}, fd.label)) : row(fd.label, fieldControl(obj, fd, (v) => setter(fd.key, v), idp), fd.hint)));
}

function inspectorSignature() {
  const { mode, sel } = store;
  const f = featureById(sel.feature);
  const sk = mode.kind === 'sketch' ? featureById(mode.id) : null;
  const shape = sk && sel.shape ? sk.shapes.find((s) => s.id === sel.shape) : null;
  const shapeOf = (o) => (o ? Object.keys(o).sort().join(',') + JSON.stringify([o.type, o.kind, o.extent, o.face !== undefined, o.plane, o.hole, o.suppressed, o.sketch, o.features, o.op, o.side, o.axis, o.dir, o.dir2, o.copy]) : '');
  const sels = f ? JSON.stringify([f.edges && (f.edges.pick ? f.edges.pick.length : f.edges), f.faces && (f.faces.pick ? f.faces.pick.length : f.faces), f.face && f.face.pick && f.face.pick.length]) : '';
  return [mode.kind, mode.feature, mode.key, sel.feature, sel.shape, shapeOf(f), sels, shapeOf(shape), sk ? sk.shapes.length : '', store.doc.features.length, sel.picks.length, store.results?.bodies.length].join('|');
}

function renderInspector(force = false) {
  const sig = inspectorSignature();
  if (!force && sig === inspectorSig) return;
  inspectorSig = sig;
  refreshers = [];
  const box = $('inspector');
  const { mode, sel } = store;
  const info = store.results?.features || {};

  // A shape inside the open sketch.
  if (mode.kind === 'sketch') {
    const sk = featureById(mode.id);
    const shape = sk && sel.shape ? sk.shapes.find((s) => s.id === sel.shape) : null;
    if (sk && shape) {
      const def = SHAPES[shape.kind] || { label: shape.kind, fields: [] };
      const setter = (key, v) =>
        update(
          (doc) => {
            const s = doc.features.find((x) => x.id === sk.id)?.shapes.find((x) => x.id === shape.id);
            if (!s) return;
            if (v === undefined) delete s[key];
            else s[key] = v;
          },
          { key: `${sk.id}.${shape.id}.${key}` },
        );
      const hole = h('input', { type: 'checkbox', id: 'shape-hole', onchange: () => setter('hole', hole.checked || undefined) });
      hole.checked = !!shape.hole;
      box.replaceChildren(
        h('div', { class: 'insp-head' }, h('span', { class: 'insp-ico', html: ICON[shape.kind] || ICON.rect }), h('h2', {}, def.label), h('span', { class: 'insp-tag' }, 'in sketch')),
        ...fieldRows(shape, def.fields, setter, 'shape'),
        h('p', { class: 'insp-note' }, shape.kind === 'path' ? `${shape.pts.length} points. Drag the path to move it.` : shape.kind === 'text' ? 'The box in the view is a placeholder; the real letters appear once the sketch is extruded.' : 'Type exact sizes here. Values can use parameters, like width/2.'),
        h('label', { class: 'row check' }, hole, h('span', {}, 'Cut-out (subtract from the other shapes)')),
        h('div', { class: 'insp-actions' }, h('button', { class: 'btn danger', type: 'button', onclick: () => { update((doc) => { const s = doc.features.find((x) => x.id === sk.id); s.shapes = s.shapes.filter((x) => x.id !== shape.id); }); select({ shape: null }); } }, 'Delete shape')),
      );
      return;
    }
  }

  const f = featureById(sel.feature);
  if (f) {
    const def = FEATURES[f.type] || { label: f.type, fields: [] };
    const setter = (key, v) =>
      update(
        (doc) => {
          const x = doc.features.find((y) => y.id === f.id);
          if (!x) return;
          if (v === undefined) delete x[key];
          else x[key] = v;
        },
        { key: `${f.id}.${key}` },
      );
    const name = h('input', { type: 'text', class: 'in insp-name', id: 'feature-name', 'aria-label': 'Feature name', value: featureLabel(f) });
    name.addEventListener('input', () => {
      selfEdit = true;
      setter('name', name.value);
      selfEdit = false;
      renderTimeline();
    });
    const err = !f.suppressed && info[f.id]?.error;
    const at = store.doc.features.findIndex((x) => x.id === f.id);
    const kids = [
      h('div', { class: 'insp-head' }, h('span', { class: 'insp-ico', html: ICON[f.type] || ICON.box }), name, h('span', { class: 'insp-tag' }, def.label)),
      err ? h('div', { class: 'insp-error', role: 'alert' }, h('span', { html: ICON.warn }), h('span', {}, err)) : null,
      f.suppressed ? h('div', { class: 'insp-warn' }, 'Suppressed: this feature is skipped until you turn it back on.') : null,
      ...fieldRows(f, def.fields, setter, 'f'),
    ];
    if (f.type === 'sketch') {
      const editing = mode.kind === 'sketch' && mode.id === f.id;
      kids.push(
        h('p', { class: 'insp-note' }, f.shapes?.length ? `${f.shapes.length} shape${f.shapes.length === 1 ? '' : 's'}: ${f.shapes.map((s) => SHAPES[s.kind]?.label || s.kind).join(', ')}` : 'Empty sketch. Pick a shape tool above the view and drag on the plane.'),
        h('div', { class: 'insp-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => (editing ? act.finishSketch() : act.editSketch(f.id)) }, editing ? 'Finish sketch' : 'Edit sketch')),
      );
    }
    kids.push(
      h(
        'div',
        { class: 'insp-actions foot' },
        h('button', { class: 'icon-btn', type: 'button', title: 'Move earlier in the timeline', 'aria-label': 'Move earlier', html: ICON.up, disabled: at <= 0, onclick: () => act.moveFeature(f.id, -1) }),
        h('button', { class: 'icon-btn', type: 'button', title: 'Move later in the timeline', 'aria-label': 'Move later', html: ICON.down, disabled: at >= store.doc.features.length - 1, onclick: () => act.moveFeature(f.id, 1) }),
        h('button', { class: 'btn small', type: 'button', onclick: () => act.toggleSuppress(f.id) }, f.suppressed ? 'Unsuppress' : 'Suppress'),
        h('button', { class: 'btn small danger', type: 'button', onclick: () => act.deleteFeature(f.id) }, 'Delete'),
      ),
    );
    box.replaceChildren(...kids.filter(Boolean));
    return;
  }

  // Nothing selected: part summary.
  const res = store.results;
  const bodies = res?.bodies || [];
  box.replaceChildren(
    h('div', { class: 'insp-head' }, h('span', { class: 'insp-ico', html: ICON.box }), h('h2', {}, 'Part')),
    bodies.length
      ? h(
          'table',
          { class: 'bodies' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Body'), h('th', {}, 'Size (mm)'), h('th', {}, 'Volume'))),
          h(
            'tbody',
            {},
            bodies.map((b) => h('tr', {}, h('td', {}, b.name), h('td', { class: 'num' }, b.max.map((v, i) => fmt(v - b.min[i], 1)).join(' × ')), h('td', { class: 'num' }, `${fmt(b.volume / 1000, 2)} cm³`))),
          ),
        )
      : h('p', { class: 'insp-note' }, 'No solids yet.'),
    h('p', { class: 'insp-note' }, 'Click a feature in the timeline to edit it. Click a face or edge in the view to select it, then pick a tool.'),
  );
}

// ---------- mode bar, hints, readout ----------
function renderModebar() {
  const bar = $('modebar');
  const { mode, sel } = store;
  let kids = null;
  if (mode.kind === 'sketch') {
    const f = featureById(mode.id);
    kids = [
      h('span', { class: 'mb-title' }, featureLabel(f || { type: 'sketch' })),
      h(
        'div',
        { class: 'mb-tools', role: 'toolbar', 'aria-label': 'Sketch tools' },
        SKETCH_TOOLS.map(([id, label, tip]) => h('button', { class: `tool${mode.tool === id ? ' active' : ''}`, type: 'button', title: tip, 'aria-pressed': String(mode.tool === id), onclick: () => act.setSketchTool(id) }, h('span', { class: 'tool-ico', html: ICON[id] }), h('span', { class: 'tool-label' }, label))),
      ),
      h('button', { class: 'btn primary', type: 'button', id: 'finish-sketch', onclick: () => act.finishSketch() }, 'Finish sketch'),
    ];
  } else if (mode.kind === 'plane') {
    kids = [
      h('span', { class: 'mb-title' }, 'Where do you want to sketch?'),
      h('div', { class: 'mb-tools' }, [['XY', 'Top (XY)'], ['XZ', 'Front (XZ)'], ['YZ', 'Side (YZ)']].map(([p, label]) => h('button', { class: 'btn', type: 'button', onclick: () => act.createSketch(p) }, label))),
      h('span', { class: 'mb-note' }, 'or click a flat face'),
      h('button', { class: 'btn', type: 'button', onclick: () => act.leaveMode() }, 'Cancel'),
    ];
  } else if (mode.kind === 'pick') {
    const f = featureById(mode.feature);
    const n = f?.[mode.key]?.pick?.length || 0;
    const noun = mode.pick === 'edge' ? 'edges' : 'faces';
    kids = [
      h('span', { class: 'mb-title' }, `Pick ${noun}`),
      h('span', { class: 'mb-note' }, `Click ${noun} for ${featureLabel(f || {})}. ${n} picked.`),
      h('button', { class: 'btn primary', type: 'button', id: 'pick-done', onclick: () => act.leaveMode() }, 'Done'),
    ];
  } else if (sel.picks.length) {
    const faces = sel.picks.filter((p) => p.kind === 'face');
    const edges = sel.picks.filter((p) => p.kind === 'edge');
    const planar = faces.some((p) => act.descOf(p)?.n);
    const btn = (label, cmd) => h('button', { class: 'btn small', type: 'button', onclick: () => act.command(cmd) }, label);
    kids = [
      h('span', { class: 'mb-title' }, edges.length ? `${edges.length} edge${edges.length === 1 ? '' : 's'} selected` : `${faces.length} face${faces.length === 1 ? '' : 's'} selected`),
      h('div', { class: 'mb-tools' }, edges.length ? [btn('Fillet', 'fillet'), btn('Chamfer', 'chamfer')] : [planar ? btn('Sketch here', 'sketch') : null, planar ? btn('Push / pull', 'extrude') : null, btn('Shell', 'shell')]),
      h('span', { class: 'mb-note' }, describePick(sel.picks[sel.picks.length - 1])),
      h('button', { class: 'icon-btn', type: 'button', title: 'Clear selection', 'aria-label': 'Clear selection', html: ICON.close, onclick: () => select({ picks: [] }) }),
    ];
  }
  bar.hidden = !kids;
  bar.replaceChildren(...(kids || []).filter(Boolean));
  const hint = $('hint');
  hint.textContent =
    mode.kind === 'sketch'
      ? 'Drag to draw. Right-drag orbits, middle-drag pans. Hold Alt to turn off snapping. Esc cancels.'
      : mode.kind === 'pick'
        ? 'Click to add or remove. Later features are hidden while you pick.'
        : mode.kind === 'plane'
          ? 'Pick a plane or a flat face.'
          : 'Drag to orbit, right-drag to pan, scroll to zoom. Click a face or edge to select it.';
}

function describePick(p) {
  const d = act.descOf(p);
  if (!d) return '';
  if (p.kind === 'edge') return d.t === 'LINE' ? `Straight, ${fmt(d.l, 2)} mm` : d.t === 'CIRCLE' ? `Arc, ${fmt(d.l, 2)} mm long` : `Curve, ${fmt(d.l, 2)} mm`;
  return d.n ? `Flat, ${fmt(d.a, 1)} mm²` : `${d.t.charAt(0)}${d.t.slice(1).toLowerCase()}, ${fmt(d.a, 1)} mm²`;
}

function renderReadout() {
  const el = $('readout');
  const res = store.results;
  const k = store.kernel;
  if (k.state === 'error') {
    el.textContent = '';
    return;
  }
  if (!res || !res.min) {
    el.textContent = res ? 'Empty part' : '';
    return;
  }
  const size = res.max.map((v, i) => fmt(v - res.min[i], 1)).join(' × ');
  const n = res.bodies.length;
  el.textContent = `${size} mm  ·  ${fmt(res.volume / 1000, 2)} cm³${n > 1 ? `  ·  ${n} bodies` : ''}`;
}

function renderKernel() {
  const k = store.kernel;
  const box = $('loading');
  box.hidden = k.state === 'ready';
  if (k.state === 'loading') {
    $('loading-text').textContent = k.message || 'Loading the geometry kernel…';
    $('loading-bar').style.width = `${Math.round((k.progress || 0) * 100)}%`;
    $('loading-bar').parentElement.hidden = false;
  } else if (k.state === 'error') {
    $('loading-text').textContent = k.message;
    $('loading-bar').parentElement.hidden = true;
  }
  $('busy').hidden = !k.busy;
}

function renderTop() {
  $('undo').disabled = !store.undoStack.length;
  $('redo').disabled = !store.redoStack.length;
  const name = $('doc-name');
  if (document.activeElement !== name) name.value = store.doc.name;
  $('example-tag').hidden = !store.doc.example;
}

// ---------- menus ----------
function bindMenus(fileActions) {
  const menus = [
    ['file-btn', 'file-menu'],
    ['export-btn', 'export-menu'],
  ];
  const closeAll = () => menus.forEach(([b, m]) => { $(m).hidden = true; $(b).setAttribute('aria-expanded', 'false'); });
  for (const [b, m] of menus) {
    $(b).addEventListener('click', (e) => {
      e.stopPropagation();
      const open = $(m).hidden;
      closeAll();
      $(m).hidden = !open;
      $(b).setAttribute('aria-expanded', String(open));
    });
    $(m).addEventListener('click', (e) => e.stopPropagation());
  }
  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeAll());
  for (const el of document.querySelectorAll('[data-file]')) {
    el.addEventListener('click', () => {
      closeAll();
      fileActions[el.dataset.file]?.();
    });
  }
}

export function initUI(fileActions) {
  renderToolbar();
  bindMenus(fileActions);
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('doc-name').addEventListener('input', () => {
    selfEdit = true;
    update((doc) => (doc.name = $('doc-name').value || 'Untitled part'), { key: 'docname' });
    selfEdit = false;
  });
  for (const b of document.querySelectorAll('[data-view]')) b.addEventListener('click', () => (b.dataset.view === 'fit' ? act.app.viewport.fit() : act.app.viewport.view(b.dataset.view)));
  for (const t of document.querySelectorAll('[data-tab]')) {
    t.addEventListener('click', () => {
      document.body.dataset.tab = t.dataset.tab;
      for (const o of document.querySelectorAll('[data-tab]')) o.setAttribute('aria-selected', String(o === t));
    });
  }

  const all = (force) => {
    renderTop();
    renderParams();
    renderTimeline();
    renderInspector(force);
    renderModebar();
  };
  on('doc', () => {
    renderTop();
    if (!selfEdit) renderParams();
    renderTimeline();
    renderInspector(!selfEdit);
    renderModebar();
  });
  on('select', () => {
    renderTimeline();
    renderInspector(true);
    renderModebar();
    if (store.sel.feature && document.body.dataset.tab === 'model' && store.mode.kind !== 'sketch') showTab('inspect');
  });
  on('mode', () => {
    renderTimeline();
    renderInspector(true);
    renderModebar();
  });
  on('results', () => {
    renderTimeline();
    renderInspector();
    renderReadout();
    for (const fn of refreshers) fn();
    for (const fn of groups.params || []) fn();
    // Errors on the selected feature appear and clear as dimensions change.
    const f = featureById(store.sel.feature);
    const err = f && store.results?.features?.[f.id]?.error;
    const shown = document.querySelector('#inspector .insp-error span:last-child')?.textContent;
    if ((err || '') !== (shown || '') && document.activeElement?.closest?.('#inspector') == null) renderInspector(true);
    else if ((err || '') !== (shown || '')) patchError(err);
    if (store.mode.kind === 'model' && store.sel.picks.length) renderModebar();
  });
  on('kernel', renderKernel);
  on('focus-first', () => {
    requestAnimationFrame(() => {
      const el = document.querySelector('#inspector .row .in:not(select)');
      if (el && window.matchMedia('(min-width: 821px)').matches) {
        el.focus();
        el.select?.();
      }
    });
  });
  all(true);
  renderKernel();
  renderReadout();
}

function patchError(err) {
  const box = $('inspector');
  box.querySelector('.insp-error')?.remove();
  if (err) box.querySelector('.insp-head')?.after(h('div', { class: 'insp-error', role: 'alert' }, h('span', { html: ICON.warn }), h('span', {}, err)));
}

export function showTab(name) {
  document.body.dataset.tab = name;
  for (const o of document.querySelectorAll('[data-tab]')) o.setAttribute('aria-selected', String(o.dataset.tab === name));
}

export { setMode, emit };
