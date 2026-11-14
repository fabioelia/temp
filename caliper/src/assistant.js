// The side assistant: a chat that edits the same document the person does, through two tools.
// Inside a Claude artifact it uses the viewer's Claude (the `sample` capability); elsewhere it calls
// the Claude API directly with a key the person keeps in their own browser.
import Anthropic from '@anthropic-ai/sdk';
import { store, update, replaceDoc, normalize, on } from './store.js';
import { GUIDE, TOOLS } from './guide.js';
import { FEATURES } from './schema.js';
import { fmt } from './expr.js';
import * as act from './actions.js';
import { h } from './ui.js';

const KEY_STORE = 'caliper.apiKey';
const MODEL_STORE = 'caliper.model';
const MODELS = [
  ['claude-opus-5-5', 'Claude Opus 5.5'],
  ['claude-sonnet-5-5', 'Claude Sonnet 5.5'],
  ['claude-fable-5-2', 'Claude Fable 5.2'],
];
const SUGGESTIONS = [
  'Make the plate 80 mm wide and add two more holes along the long edges',
  'A 70 × 45 × 25 mm open box with 2 mm walls and rounded corners',
  'A phone stand that holds the phone at 65°',
  'Chamfer the bottom edges by 0.6 mm so it lifts off the bed cleanly',
];

const $ = (id) => document.getElementById(id);
const r2 = (v) => Math.round(v * 100) / 100;
const read = (k) => {
  try {
    return localStorage.getItem(k) || '';
  } catch {
    return '';
  }
};
const write = (k, v) => {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
};

const state = {
  backend: 'pending', // pending | claude | key
  sample: null,
  apiKey: read(KEY_STORE),
  model: read(MODEL_STORE) || MODELS[0][0],
  turns: [], // text-only history for the artifact backend
  apiMessages: [], // append-only message history for the API backend
  running: null, // AbortController
};

// ---------- what the assistant is told about the model ----------
function buildReport(res) {
  if (!res) return { ok: false, note: 'The model could not be rebuilt.' };
  const errors = [];
  for (const f of store.doc.features) {
    const e = res.features?.[f.id]?.error;
    if (e && !f.suppressed) errors.push({ feature: f.id, type: f.type, message: e });
  }
  const paramErrors = Object.entries(res.paramErrors || {}).map(([name, message]) => ({ parameter: name, message }));
  return {
    ok: !errors.length && !paramErrors.length,
    errors,
    ...(paramErrors.length ? { parameter_errors: paramErrors } : {}),
    bodies: res.bodies.map((b) => ({ name: b.name, size_mm: b.max.map((v, i) => r2(v - b.min[i])), min: b.min.map(r2), max: b.max.map(r2), volume_mm3: r2(b.volume) })),
    ...(res.bodies.length ? {} : { note: 'The model has no solid bodies.' }),
  };
}

function describeSelection() {
  const lines = [];
  for (const p of store.sel.picks) {
    const d = act.descOf(p);
    const body = act.bodyOf(p);
    if (!d || !body) continue;
    if (p.kind === 'face') lines.push(`- face on ${body.name}: ${d.n ? `flat, normal [${d.n.map(r2)}]` : d.t.toLowerCase()}, centre [${d.c.map(r2)}], area ${r2(d.a)} mm2. Selector: {"near": [${d.c.map(r2)}]${d.n ? `, "normal": "${normalName(d.n)}"` : ''}}`);
    else lines.push(`- edge on ${body.name}: ${d.t.toLowerCase()}, from [${d.s.map(r2)}] to [${d.e.map(r2)}], midpoint [${d.m.map(r2)}], length ${r2(d.l)} mm. Selector: {"near": [${d.m.map(r2)}]}`);
  }
  const f = store.doc.features.find((x) => x.id === store.sel.feature);
  if (f) lines.push(`- timeline feature selected: "${f.name || f.type}" (id ${f.id})`);
  return lines.length ? `WHAT THE PERSON HAS SELECTED (they may say "this" or "here"):\n${lines.join('\n')}` : '';
}

function normalName(n) {
  const i = n.findIndex((c) => Math.abs(c) > 0.999);
  return i < 0 ? '' : `${n[i] > 0 ? '+' : '-'}${'xyz'[i]}`;
}

function context() {
  const { example, ...doc } = store.doc;
  const parts = [`CURRENT MODEL:\n${JSON.stringify(doc)}`, `BUILD REPORT:\n${JSON.stringify(buildReport(store.results))}`];
  const sel = describeSelection();
  if (sel) parts.push(sel);
  return parts.join('\n\n');
}

// ---------- tools ----------
function checkFeatures(list) {
  if (!Array.isArray(list)) throw new Error('"features" must be an array of feature objects.');
  for (const f of list) {
    if (!f || typeof f !== 'object' || !f.type) throw new Error('Every feature needs a "type".');
    if (!FEATURES[f.type]) throw new Error(`Unknown feature type "${f.type}". Valid types: ${Object.keys(FEATURES).join(', ')}.`);
  }
}

async function runTool(name, input, turn) {
  if (store.mode.kind !== 'model') act.leaveMode();
  const first = !turn.changed;
  if (name === 'set_model') {
    checkFeatures(input.features);
    replaceDoc({ name: input.name || store.doc.name, params: input.params || [], features: input.features }, { undoable: first });
  } else if (name === 'edit_model') {
    if (input.upsert) checkFeatures(input.upsert);
    const before = JSON.stringify(store.doc);
    update(
      (doc) => {
        for (const [k, v] of Object.entries(input.set_params || {})) {
          const p = doc.params.find((x) => x.name === k);
          if (p) p.value = String(v);
          else doc.params.push({ name: k, value: String(v) });
        }
        const drop = new Set(input.remove || []);
        if (drop.size) doc.features = doc.features.filter((f) => !drop.has(f.id));
        let at = input.after ? doc.features.findIndex((f) => f.id === input.after) : -1;
        for (const f of input.upsert || []) {
          const i = f.id ? doc.features.findIndex((x) => x.id === f.id) : -1;
          if (i >= 0) doc.features[i] = f;
          else if (at >= 0) doc.features.splice(++at, 0, f);
          else doc.features.push(f);
        }
        const fixed = normalize(doc);
        doc.params = fixed.params;
        doc.features = fixed.features;
      },
      { quiet: !first },
    );
    if (JSON.stringify(store.doc) === before) return { ...buildReport(store.results), note: 'Nothing changed: the edit matched the current model.' };
  } else throw new Error(`Unknown tool "${name}".`);
  turn.changed = true;
  turn.steps++;
  turn.onStep?.('Rebuilding…');
  const res = await act.app.rebuildNow();
  const report = buildReport(res);
  turn.lastReport = report;
  turn.onStep?.(report.ok ? 'Model updated' : `Model updated, ${report.errors.length + (report.parameter_errors?.length || 0)} problem${report.errors.length === 1 ? '' : 's'} to fix`);
  return report;
}

// ---------- backends ----------
async function askClaudeArtifact(text, turn, signal, onText) {
  const turns = [{ role: 'user', content: GUIDE }, ...state.turns.slice(-12), { role: 'user', content: `${context()}\n\nREQUEST: ${text}` }];
  const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.schema, execute: (input) => runTool(t.name, input || {}, turn) }));
  const out = await state.sample(turns, { tools, signal, onText: ({ text: whole }) => onText(whole) });
  state.turns.push({ role: 'user', content: text }, { role: 'assistant', content: out.text });
  return out.text;
}

async function askClaudeApi(text, turn, signal, onText) {
  const client = new Anthropic({ apiKey: state.apiKey, dangerouslyAllowBrowser: true });
  const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema }));
  const messages = state.apiMessages;
  const mark = messages.length;
  messages.push({ role: 'user', content: `${context()}\n\nREQUEST: ${text}` });
  let shown = '';
  try {
    for (let round = 0; round < 8; round++) {
      const stream = client.beta.messages.stream(
        {
          model: state.model,
          max_tokens: 64000,
          system: [{ type: 'text', text: GUIDE, cache_control: { type: 'ephemeral' } }],
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          // If a safety classifier declines, let the API retry on a fallback model instead of stopping.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          cache_control: { type: 'ephemeral' },
          tools,
          messages,
        },
        { signal },
      );
      const base = shown;
      let cur = '';
      stream.on('text', (delta) => {
        cur += delta;
        onText(base + cur);
      });
      const message = await stream.finalMessage();
      shown = base + cur + (cur ? '\n\n' : '');
      messages.push({ role: 'assistant', content: message.content });
      if (message.stop_reason === 'refusal') {
        messages.length = mark;
        throw Object.assign(new Error('Claude declined this request. Try describing the part differently.'), { handled: true });
      }
      if (message.stop_reason === 'max_tokens') throw Object.assign(new Error('The reply was cut off for length. Ask for a smaller change.'), { handled: true });
      if (message.stop_reason === 'pause_turn') continue;
      const calls = message.content.filter((b) => b.type === 'tool_use');
      if (!calls.length) break;
      const results = [];
      for (const call of calls) {
        try {
          results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(await runTool(call.name, call.input || {}, turn)) });
        } catch (e) {
          results.push({ type: 'tool_result', tool_use_id: call.id, content: `Error: ${e.message}`, is_error: true });
        }
      }
      messages.push({ role: 'user', content: results });
    }
  } catch (e) {
    // Never leave the history ending on an unanswered tool call.
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && Array.isArray(last.content) && last.content.some((b) => b.type === 'tool_use')) messages.length = mark;
    else if (last && last.role === 'user' && messages.length === mark + 1) messages.length = mark;
    throw e;
  }
  return shown.trim();
}

function explain(e) {
  if (e?.handled) return e.message;
  // Artifact capability errors carry a code; API errors are typed SDK classes.
  switch (e?.code) {
    case 'cancelled':
      return '';
    case 'not_granted':
    case 'sampling_disabled':
    case 'not_declared':
    case 'capability_disabled':
    case 'capability_removed':
      return 'The assistant is not allowed to use Claude in this view. You can still model by hand.';
    case 'tools_unavailable':
      return 'This view cannot let the assistant edit the model. Open the page in claude.ai to use it.';
    case 'rate_limited':
      return 'Claude is rate limited right now. Wait a moment, then send again.';
    case 'session_expired':
      return 'Your Claude session expired. Sign in again, then send again.';
    case 'refused':
      return 'Claude declined this request. Try describing the part differently.';
    case 'prompt_too_large':
      return 'This model is too large to send to the assistant. Clear the chat or simplify the model.';
    default:
  }
  if (e instanceof Anthropic.APIUserAbortError) return '';
  if (e instanceof Anthropic.AuthenticationError) return 'That API key was rejected. Check it in the assistant settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key is not allowed to use that model. Pick another model in the assistant settings.';
  if (e instanceof Anthropic.RateLimitError) return 'The API is rate limited right now. Wait a moment, then send again.';
  if (e instanceof Anthropic.BadRequestError) return `The API rejected the request: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'Could not reach the Claude API. Check your connection, then send again.';
  if (e instanceof Anthropic.APIError) return `The Claude API returned an error (${e.status}). Send again in a moment.`;
  return 'Something went wrong while asking Claude. Send again.';
}

// ---------- UI ----------
function bubble(role, text) {
  const body = h('div', { class: 'msg-text' }, text);
  const steps = h('div', { class: 'msg-steps' });
  const el = h('div', { class: `msg ${role === 'assistant' ? 'from-claude' : 'from-user'}` }, role === 'assistant' ? steps : null, body);
  $('chat-log').append(el);
  $('chat-log').scrollTop = $('chat-log').scrollHeight;
  return { el, body, steps };
}

function setRunning(on) {
  $('chat-send').hidden = on;
  $('chat-stop').hidden = !on;
  $('chat-input').disabled = on;
  $('assistant').classList.toggle('running', on);
}

async function send(text) {
  text = text.trim();
  if (!text || state.running) return;
  if (state.backend === 'pending') return;
  if (state.backend === 'key' && !state.apiKey) {
    $('chat-settings').hidden = false;
    $('api-key').focus();
    return;
  }
  if (store.kernel.state !== 'ready') {
    act.app.toast('The geometry kernel is still loading. Try again in a moment.');
    return;
  }
  $('chat-suggest').hidden = true;
  $('chat-empty').hidden = true;
  $('chat-input').value = '';
  bubble('user', text);
  const out = bubble('assistant', 'Thinking…');
  out.el.classList.add('pending');
  const ctl = new AbortController();
  state.running = ctl;
  setRunning(true);
  const chip = h('span', { class: 'step' }, '');
  const turn = {
    changed: false,
    steps: 0,
    onStep: (label) => {
      if (!chip.isConnected) out.steps.append(chip);
      chip.textContent = label;
      chip.classList.toggle('warn', /problem/.test(label));
    },
  };
  let got = '';
  const onText = (whole) => {
    got = whole;
    out.el.classList.remove('pending');
    out.body.textContent = whole;
    $('chat-log').scrollTop = $('chat-log').scrollHeight;
  };
  try {
    const answer = state.backend === 'claude' ? await askClaudeArtifact(text, turn, ctl.signal, onText) : await askClaudeApi(text, turn, ctl.signal, onText);
    out.el.classList.remove('pending');
    out.body.textContent = answer || got || (turn.changed ? 'Done.' : 'No reply.');
  } catch (e) {
    const msg = explain(e);
    out.el.classList.remove('pending');
    const partial = (e && e.code !== 'refused' && (e.text || got)) || '';
    out.body.textContent = partial || (msg ? '' : 'Stopped.');
    if (msg) out.el.append(h('div', { class: 'msg-error', role: 'alert' }, msg));
    if (!partial && !msg) out.body.textContent = 'Stopped.';
    if (e?.code && ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable'].includes(e.code)) $('chat-form').hidden = true;
  } finally {
    if (turn.changed) {
      out.el.append(
        h(
          'div',
          { class: 'msg-foot' },
          h(
            'button',
            {
              class: 'link-btn',
              type: 'button',
              onclick: (ev) => {
                import('./store.js').then((m) => m.undo());
                ev.target.replaceWith(h('span', { class: 'muted' }, 'Change undone'));
              },
            },
            'Undo this change',
          ),
        ),
      );
      act.app.viewport.fit();
    }
    state.running = null;
    setRunning(false);
    $('chat-log').scrollTop = $('chat-log').scrollHeight;
    if (window.matchMedia('(min-width: 821px)').matches) $('chat-input').focus();
  }
}

function renderBackend() {
  const key = state.backend === 'key';
  $('chat-settings-btn').hidden = !key;
  $('chat-note').textContent =
    state.backend === 'claude'
      ? 'Uses your Claude account. It sees the model and what you have selected.'
      : key
        ? state.apiKey
          ? `Using ${MODELS.find((m) => m[0] === state.model)?.[1] || state.model} with your API key.`
          : 'Add a Claude API key to turn the assistant on.'
        : '';
  $('chat-input').placeholder = key && !state.apiKey ? 'Add an API key above to start' : 'Describe a part, or a change to this one';
}

export async function initAssistant() {
  const box = $('chat-suggest');
  box.replaceChildren(...SUGGESTIONS.map((s) => h('button', { class: 'suggest', type: 'button', onclick: () => send(s) }, s)));
  $('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    send($('chat-input').value);
  });
  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send($('chat-input').value);
    }
    e.stopPropagation();
  });
  $('chat-stop').addEventListener('click', () => state.running?.abort());
  $('chat-clear').addEventListener('click', () => {
    if (state.running) return;
    state.turns = [];
    state.apiMessages = [];
    $('chat-log').replaceChildren();
    $('chat-suggest').hidden = false;
    $('chat-empty').hidden = false;
  });
  $('chat-settings-btn').addEventListener('click', () => ($('chat-settings').hidden = !$('chat-settings').hidden));
  const modelSel = $('api-model');
  modelSel.replaceChildren(...MODELS.map(([v, label]) => h('option', { value: v }, label)));
  modelSel.value = state.model;
  $('api-key').value = state.apiKey;
  $('api-save').addEventListener('click', () => {
    state.apiKey = $('api-key').value.trim();
    state.model = modelSel.value;
    write(KEY_STORE, state.apiKey);
    write(MODEL_STORE, state.model);
    state.apiMessages = [];
    $('chat-settings').hidden = !!state.apiKey;
    renderBackend();
  });
  on('kernel', () => {});

  // Inside a Claude artifact the viewer lends the page Claude; resolve that first.
  let sample = null;
  try {
    sample = (await window.claude?.use?.('sample')) || null;
    if (sample) {
      const limits = await sample.limits().catch(() => null);
      if (limits && !limits.tools) sample = null;
    }
  } catch {
    sample = null;
  }
  state.sample = sample;
  state.backend = sample ? 'claude' : 'key';
  if (!sample && window.claude?.use) {
    // In a Claude viewer without the capability (signed out, shared link): no key prompt there either.
    $('chat-note').textContent = 'The assistant needs Claude, which is not available in this view. Modelling by hand works as usual.';
    $('chat-form').hidden = true;
    $('chat-suggest').hidden = true;
    state.backend = 'none';
    return;
  }
  renderBackend();
}
