import { mergeConfig, rowsForUrl } from './lib.js';

const ICON = { pass: '✅', fail: '❌', pending: '⏳', neutral: '➖', cancelled: '⊘', skipped: '⤼', missing: '·' };
const $ = (id) => document.getElementById(id);
let state = { snapshot: null, config: mergeConfig(), currentUrl: '' };

// textContent-only element builder: titles, labels and extracted values come
// from PRs anyone can write, so nothing here ever goes through innerHTML.
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== '') el.append(c);
  return el;
}

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
function confirmButton(text, run) {
  const btn = h('button', {}, text);
  let armed = null;
  btn.addEventListener('click', async () => {
    if (!armed) {
      btn.textContent = `Confirm: ${text}?`;
      btn.classList.add('confirm');
      armed = setTimeout(() => {
        armed = null;
        btn.textContent = text;
        btn.classList.remove('confirm');
      }, 4000);
      return;
    }
    clearTimeout(armed);
    btn.disabled = true;
    btn.textContent = '…';
    try {
      await run();
      btn.textContent = '✓ done';
    } catch (e) {
      btn.textContent = text;
      btn.classList.remove('confirm');
      btn.disabled = false;
      showError(e.message);
    }
    armed = null;
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
  const { config } = state;
  const checks = row.checks.map((c) => {
    const chip = h(
      c.url ? 'a' : 'span',
      { class: `chip ${c.state}`, href: c.url || undefined, target: '_blank', title: `${c.label}: ${c.state}${c.title ? ` — ${c.title}` : ''}` },
      `${c.label} ${ICON[c.state] || c.state}`,
      c.title ? h('span', { class: 't' }, c.title) : null,
    );
    if (c.state !== 'fail' || !/\/job\/\d+/.test(c.url)) return chip;
    return h('span', { class: 'chip fail' }, chip, confirmButton('↻ re-run', () => send({ type: 'act', action: { type: 'rerunJob' }, row, jobUrl: c.url })));
  });
  const labels = row.labels.map((l) => h('span', { class: `chip label ${l.kind}` }, l.name));
  const extracted = config.extractors.flatMap((ex) =>
    (row.extracted[ex.name] || []).map((v) =>
      ex.kind === 'link'
        ? link(v, h('span', { class: 'chip' }, v.includes('claude.ai/code/session_') ? shortSession(v) : `${ex.name} ↗`))
        : h('span', { class: 'chip', title: v }, `${ex.name}: `, h('span', { class: 't' }, v)),
    ),
  );
  const actions = config.actions
    .filter((a) => !a.when || (a.when === 'draft') === row.isDraft)
    .filter((a) => !(a.type === 'addLabel' && row.allLabels.includes(a.label)))
    .filter((a) => !(a.type === 'removeLabel' && !row.allLabels.includes(a.label)))
    .map((a) => confirmButton(a.title, () => send({ type: 'act', action: a, row })));

  return h(
    'div',
    { class: ['card', row.attention.length && 'needs', row.isDraft && 'draft', current && 'current'].filter(Boolean).join(' '), 'data-key': row.key },
    h('div', { class: 'top' }, link(row.url, h('span', { class: 'num' }, `#${row.number}`)), h('span', { class: 'title', title: row.title }, row.title)),
    h(
      'div',
      { class: 'meta muted' },
      h('span', {}, row.repo.split('/')[1]),
      h('span', {}, row.author),
      row.isDraft ? h('span', { class: 'badge' }, 'Draft') : null,
      h('span', {}, ago(row.updatedAt)),
    ),
    row.attention.length ? h('div', { class: 'reasons' }, `⚑ ${row.attention.join(' · ')}`) : null,
    h('div', { class: 'chips' }, checks),
    labels.length || extracted.length ? h('div', { class: 'chips' }, labels, extracted) : null,
    actions.length ? h('div', { class: 'actions' }, actions) : null,
  );
}

function render() {
  const { snapshot, config } = state;
  if (!snapshot) return;
  $('updated').textContent = snapshot.fetchedAt ? `updated ${ago(snapshot.fetchedAt)}` : '';
  showError(snapshot.error);
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
$('needsOnly').addEventListener('change', render);
chrome.storage.onChanged.addListener((c) => (c.snapshot || c.config) && load());
chrome.tabs.onActivated.addListener(trackTab);
chrome.tabs.onUpdated.addListener((_id, info) => info.url && trackTab());
setInterval(render, 60000);
load().then(trackTab);
