import { h } from './dom.js';
import { jobLog, listLabels, prChecks } from './github.js';
import { actionButton, mergeConfig, profileFor, rowsForUrl } from './lib.js';

const ICON = { pass: '✅', fail: '❌', pending: '⏳', neutral: '➖', cancelled: '⊘', skipped: '⤼', missing: '·' };
const $ = (id) => document.getElementById(id);
let state = { snapshot: null, config: mergeConfig(), currentUrl: '', expanded: new Set() };

const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 48 * 60 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

const link = (href, ...text) => h('a', { href, target: '_blank', rel: 'noopener' }, ...text);

function send(msg) {
  return chrome.runtime.sendMessage(msg).then((r) => {
    if (!r?.ok) throw new Error(r?.error || 'failed');
  });
}

// Writes go to GitHub under your name, so every one takes a second click.
// The armed state lives here, keyed by `id`, not on the button: a poll or a
// refresh re-renders the panel between the two clicks, and a fresh button
// must still remember the first one.
let armed = { id: null, until: 0 };
function confirmButton(text, run, id) {
  const btn = h('button', {}, text);
  const arm = (on) => {
    btn.textContent = on ? `Confirm: ${text}?` : text;
    btn.classList.toggle('confirm', on);
  };
  if (armed.id === id && Date.now() < armed.until) arm(true);
  btn.addEventListener('click', async () => {
    if (armed.id !== id || Date.now() >= armed.until) {
      armed = { id, until: Date.now() + 4000 };
      arm(true);
      setTimeout(() => armed.id === id && Date.now() >= armed.until && arm(false), 4100);
      return;
    }
    armed = { id: null, until: 0 };
    btn.disabled = true;
    btn.textContent = '…';
    try {
      await run();
      btn.textContent = '✓ done';
    } catch (e) {
      arm(false);
      btn.disabled = false;
      showError(e.message);
    }
  });
  return btn;
}

function showError(msg) {
  $('error').hidden = !msg;
  $('error').textContent = msg || '';
}

function shortSession(url) {
  return `Session ${url.split('session_')[1]?.slice(0, 6) || ''}`;
}

function card(row, current) {
  const config = profileFor(state.config, row.repo);
  const checks = row.checks.map((c) => {
    const chip = h(
      c.url ? 'a' : 'span',
      { class: `chip ${c.state}`, href: c.url || undefined, target: '_blank', title: `${c.label}: ${c.state}${c.title ? ` — ${c.title}` : ''}` },
      `${c.label} ${ICON[c.state] || c.state}`,
      c.title ? h('span', { class: 't' }, c.title) : null,
    );
    if (c.state !== 'fail' || !/\/job\/\d+/.test(c.url)) return chip;
    return h('span', { class: 'chip fail' }, chip, confirmButton('↻ re-run', () => send({ type: 'act', action: { type: 'rerunJob' }, row, jobUrl: c.url }), `${row.key}|rerun|${c.label}`));
  });
  const labels = row.labels.map((l) => h('span', { class: `chip label ${l.kind}` }, l.name));
  const extracted = config.extractors.flatMap((ex) =>
    (row.extracted[ex.name] || []).map((v) =>
      ex.kind === 'link'
        ? link(v, h('span', { class: 'chip' }, v.includes('claude.ai/code/session_') ? shortSession(v) : `${ex.name} ↗`))
        : row.artifactRuns?.[ex.name]
          ? downloadChip(row, ex.name, v)
          : h('span', { class: 'chip', title: v }, `${ex.name}: `, h('span', { class: 't' }, v)),
    ),
  );
  const has = (label) => row.allLabels.includes(label);
  const actions = config.actions
    .filter((a) => !a.when || (a.when === 'draft') === row.isDraft)
    .map((a) => actionButton(a, has))
    .filter(Boolean)
    .map(({ title, action }) => confirmButton(title, () => send({ type: 'act', action, row }), `${row.key}|${title}`));
  actions.push(h('button', { onclick: () => togglePicker(row) }, state.picker?.key === row.key ? '🏷 Hide labels' : '🏷 Labels…'));

  const el = h(
    'div',
    {
      class: ['card', row.attention.length && 'needs', row.isDraft && 'draft', current && 'current', state.expanded.has(row.key) && 'open'].filter(Boolean).join(' '),
      'data-key': row.key,
      title: 'Click for every check on this PR',
    },
    h('div', { class: 'top' }, link(row.url, h('span', { class: 'num' }, `#${row.number}`)), h('span', { class: 'title', title: row.title }, row.title)),
    h(
      'div',
      { class: 'meta muted' },
      h('span', {}, row.repo.split('/')[1]),
      h('span', {}, row.author),
      row.isDraft ? h('span', { class: 'badge' }, 'Draft') : null,
      row.stale ? h('span', { class: 'badge', title: "GitHub's Actions API failed on the last refresh" }, 'checks from last refresh') : null,
      h('span', {}, ago(row.updatedAt)),
    ),
    row.attention.length ? h('div', { class: 'reasons' }, `⚑ ${row.attention.join(' · ')}`) : null,
    h('div', { class: 'chips' }, checks),
    labels.length || extracted.length ? h('div', { class: 'chips' }, labels, extracted) : null,
    h('div', { class: 'actions' }, actions),
    state.picker?.key === row.key ? picker(row) : null,
    state.expanded.has(row.key) ? details(row) : null,
  );
  el.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, label, select, .picker, .details') || getSelection().toString()) return;
    state.expanded.has(row.key) ? state.expanded.delete(row.key) : state.expanded.add(row.key);
    render();
  });
  return el;
}

// Loaded on expand and again after each poll, since a poll means the checks
// may have moved. Results live outside the DOM so re-renders keep them.
const checksCache = new Map();
const logCache = new Map();

async function loadChecks(row) {
  const at = state.snapshot.fetchedAt;
  const hit = checksCache.get(row.key);
  if (hit && hit.at === at) return;
  checksCache.set(row.key, { at, data: hit?.data, loading: true });
  const { token } = await chrome.storage.local.get('token');
  try {
    checksCache.set(row.key, { at, data: await prChecks(token, row) });
  } catch (e) {
    checksCache.set(row.key, { at, data: hit?.data, error: e.message });
  }
  render();
}

async function loadLog(row, jobId) {
  logCache.set(jobId, { loading: true });
  render();
  const { token } = await chrome.storage.local.get('token');
  try {
    logCache.set(jobId, { data: await jobLog(token, row.repo, jobId) });
  } catch (e) {
    logCache.set(jobId, { error: e.message });
  }
  render();
}

function checkLine(c) {
  return h('div', { class: 'check-line' }, `${ICON[c.state] || c.state} `, c.url ? link(c.url, c.name) : c.name, c.title ? h('span', { class: 'muted' }, ` · ${c.title}`) : null);
}

function failure(row, c) {
  const log = c.jobId && logCache.get(c.jobId);
  return h(
    'div',
    { class: 'failure' },
    h('div', { class: 'check-line' }, `${ICON[c.state]} `, c.url ? link(c.url, c.name) : c.name, c.workflow ? h('span', { class: 'muted' }, ` · ${c.workflow}`) : null),
    c.title ? h('div', { class: 'muted' }, c.title) : null,
    c.annotations?.length
      ? h(
          'ul',
          { class: 'annotations' },
          c.annotations.map((a) => h('li', {}, h('span', { class: 'muted' }, `${a.path}${a.line ? `:${a.line}` : ''} `), a.message)),
        )
      : null,
    c.summary ? h('div', { class: 'summary' }, c.summary.length > 600 ? `${c.summary.slice(0, 600)}…` : c.summary) : null,
    h(
      'div',
      { class: 'actions' },
      c.jobId && !log ? h('button', { onclick: () => loadLog(row, c.jobId) }, 'Show log tail') : null,
      c.jobId ? confirmButton('↻ re-run job', () => send({ type: 'act', action: { type: 'rerunJob' }, row, jobUrl: c.url }), `${row.key}|rerun|${c.name}`) : null,
    ),
    log?.loading ? h('div', { class: 'muted' }, 'Loading log…') : null,
    log?.error ? h('div', { class: 'reasons' }, log.error) : null,
    log?.data?.errors.length ? h('pre', { class: 'log errors' }, log.data.errors.join('\n')) : null,
    log?.data ? scrolledToEnd(h('pre', { class: 'log' }, log.data.tail)) : null,
  );
}

function scrolledToEnd(el) {
  requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  return el;
}

function details(row) {
  const entry = checksCache.get(row.key);
  if (!entry || entry.at !== state.snapshot.fetchedAt) loadChecks(row);
  const pane = h('div', { class: 'details' });
  if (entry?.error) pane.append(h('div', { class: 'reasons' }, entry.error));
  const data = entry?.data;
  if (!data) {
    pane.append(h('div', { class: 'muted' }, 'Loading checks…'));
    return pane;
  }
  if (data.warning) pane.append(h('div', { class: 'reasons' }, data.warning));
  if (data.note) pane.append(h('div', { class: 'muted' }, data.note));
  const by = Object.groupBy(data.checks, (c) => (['fail', 'cancelled'].includes(c.state) ? 'bad' : c.state === 'pending' ? 'running' : 'rest'));
  const count = (k) => by[k]?.length || 0;
  pane.append(
    h(
      'div',
      { class: 'muted' },
      `${count('bad')} failing · ${count('running')} running · ${count('rest')} other · `,
      link(`${row.url}/checks`, 'checks tab'),
    ),
  );
  for (const c of by.bad || []) pane.append(failure(row, c));
  if (by.running) pane.append(h('div', { class: 'group' }, by.running.map(checkLine)));
  if (by.rest) pane.append(h('details', {}, h('summary', {}, `${count('rest')} passed, skipped or neutral`), by.rest.map(checkLine)));
  if (!data.checks.length) pane.append(h('div', { class: 'muted' }, 'No checks on the latest commit.'));
  return pane;
}

function downloadChip(row, name, value) {
  const chip = h('button', { class: 'chip', title: `${value}\nClick to download this run's artifacts` }, `${name}: `, h('span', { class: 't' }, value), ' ⬇');
  chip.addEventListener('click', async () => {
    chip.disabled = true;
    try {
      await send({ type: 'download', row, extractor: name });
    } catch (e) {
      showError(e.message);
    }
    chip.disabled = false;
  });
  return chip;
}

// Repo label lists, fetched once per panel session.
const labelCache = new Map();
async function repoLabels(repo) {
  if (!labelCache.has(repo)) {
    const { token } = await chrome.storage.local.get('token');
    labelCache.set(repo, listLabels(token, repo).catch((e) => (labelCache.delete(repo), Promise.reject(e))));
  }
  return labelCache.get(repo);
}

function togglePicker(row) {
  state.picker = state.picker?.key === row.key ? null : { key: row.key, filter: '', add: new Set(), remove: new Set(), labels: null };
  render();
  if (state.picker) {
    const p = state.picker;
    repoLabels(row.repo)
      .then((names) => {
        p.labels = names;
        render();
      })
      .catch((e) => showError(e.message));
  }
}

function picker(row) {
  const p = state.picker;
  if (!p.labels) return h('div', { class: 'picker muted' }, 'Loading labels…');
  const configured = profileFor(state.config, row.repo).labels.map((l) => l.name);
  const isOn = (n) => (row.allLabels.includes(n) || p.add.has(n)) && !p.remove.has(n);
  const rank = (n) => (row.allLabels.includes(n) ? 0 : configured.includes(n) ? 1 : 2);
  const list = h('div', { class: 'picker-list' });
  const fill = () => {
    const f = p.filter.toLowerCase();
    const names = p.labels.filter((n) => n.toLowerCase().includes(f)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    list.replaceChildren(
      ...names.map((n) => {
        const box = h('input', { type: 'checkbox' });
        box.checked = isOn(n);
        box.addEventListener('change', () => {
          const was = row.allLabels.includes(n);
          for (const set of [p.add, p.remove]) set.delete(n);
          if (box.checked !== was) (box.checked ? p.add : p.remove).add(n);
          apply.replaceWith((apply = applyButton()));
        });
        return h('label', {}, box, ` ${n}`);
      }),
    );
  };
  const applyButton = () =>
    p.add.size || p.remove.size
      ? confirmButton(`Apply ${[...[...p.add].map((n) => `+${n}`), ...[...p.remove].map((n) => `−${n}`)].join(' ')}`, async () => {
          await send({ type: 'act', action: { type: 'setLabels', add: [...p.add], remove: [...p.remove] }, row });
          state.picker = null;
        }, `${row.key}|apply`)
      : h('span', { class: 'muted' }, 'Tick or untick labels, then apply.');
  let apply = applyButton();
  const filter = h('input', { type: 'search', placeholder: 'Find a label…', value: p.filter });
  filter.addEventListener('input', () => {
    p.filter = filter.value;
    fill();
  });
  fill();
  return h('div', { class: 'picker' }, filter, list, h('div', { class: 'actions' }, apply));
}

function render() {
  const { snapshot, config } = state;
  if (!snapshot) return;
  // A poll landing while you type in the label picker would rebuild it and
  // drop focus; finish the render when focus leaves the picker.
  if (document.activeElement?.closest?.('.picker')) {
    state.renderPending = true;
    return;
  }
  state.renderPending = false;
  const every = snapshot.busy ? `every ${config.pollMinutes}m while checks run` : `every ${config.quietPollMinutes}m, all settled`;
  $('updated').textContent = snapshot.fetchedAt ? `updated ${ago(snapshot.fetchedAt)} · ${every}` : '';
  const left = [['REST', snapshot.rate?.rest], ['GraphQL', snapshot.rate?.graphql]]
    .filter(([, r]) => Number.isFinite(r?.remaining))
    .map(([name, r]) => `${name} ${r.remaining.toLocaleString()}`);
  const rest = snapshot.rate?.rest;
  $('rate').textContent = left.length ? `· API left: ${left.join(' · ')}` : '';
  $('rate').title = Number.isFinite(rest?.reset) ? `REST: of ${rest.limit.toLocaleString()} an hour, resets at ${new Date(rest.reset).toLocaleTimeString()}` : '';
  showError(snapshot.error || snapshot.warning);
  const q = $('filter').value.trim().toLowerCase();
  const needsOnly = $('needsOnly').checked;
  const byKey = Object.fromEntries(snapshot.rows.map((r) => [r.key, r]));
  const current = new Set(rowsForUrl(snapshot.rows, state.currentUrl, config).map((r) => r.key));
  const matches = (r) =>
    (!needsOnly || r.attention.length) &&
    (!q || [r.title, `#${r.number}`, r.author, r.repo, ...r.allLabels].join(' ').toLowerCase().includes(q));

  const list = $('list');
  list.replaceChildren();
  for (const s of snapshot.sections) {
    const rows = s.keys.map((k) => byKey[k]).filter(matches);
    // Needs-you first, then most recently active.
    rows.sort((a, b) => (b.attention.length > 0) - (a.attention.length > 0) || (a.updatedAt < b.updatedAt ? 1 : -1));
    list.append(h('h2', {}, `${s.title} (${rows.length})`));
    if (!rows.length) list.append(h('div', { class: 'empty' }, 'Nothing here.'));
    for (const r of rows) list.append(card(r, current.has(r.key)));
  }
  list.querySelector('.card.current')?.scrollIntoView({ block: 'nearest' });
}

async function load() {
  const { snapshot, config } = await chrome.storage.local.get(['snapshot', 'config']);
  state.snapshot = snapshot || { rows: [], sections: [], error: null };
  state.config = mergeConfig(config);
  render();
}

async function trackTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  // tab.url is only visible for hosts in host_permissions (GitHub, claude.ai).
  state.currentUrl = (tab?.url || '').split(/[?#]/)[0];
  render();
}

$('refresh').addEventListener('click', () => send({ type: 'refresh' }).catch((e) => showError(e.message)));
$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('filter').addEventListener('input', render);
document.addEventListener('focusout', () => setTimeout(() => state.renderPending && render()));
$('needsOnly').addEventListener('change', render);
chrome.storage.onChanged.addListener((c) => (c.snapshot || c.config) && load());
chrome.tabs.onActivated.addListener(trackTab);
chrome.tabs.onUpdated.addListener((_id, info) => info.url && trackTab());
setInterval(render, 60000);
load().then(trackTab);
