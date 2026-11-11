import { fillSuggestions, onRepoSelected, renderBuilder, setKnownRepos } from './builder.js';
import { h } from './dom.js';
import { checkNames, diagnose, listLabels, listRepos, whoami } from './github.js';
import { DEFAULT_CONFIG, mergeConfig, validateConfig } from './lib.js';

const $ = (id) => document.getElementById(id);
const token = () => $('token').value.trim();

// The form and the JSON tab edit the same object; whichever tab is open is
// the source of truth when switching or saving. `saved` is what storage
// holds, so the save bar can tell whether anything changed.
let cfg = structuredClone(DEFAULT_CONFIG);
let tab = 'form';
let saved = { config: '', token: '' };

function status(msg, tone = 'muted') {
  $('status').textContent = msg;
  $('status').className = tone === 'bad' ? 'bad' : 'muted';
}

function refreshDirty() {
  const dirty = (tab === 'json' ? $('config').value !== JSON.stringify(cfg, null, 2) : false) || JSON.stringify(cfg) !== saved.config || token() !== saved.token;
  $('dirtyDot').className = `dot ${dirty ? 'dirty' : 'saved'}`;
  if ($('status').className !== 'bad') status(dirty ? 'Unsaved changes' : 'All changes saved');
  $('save').disabled = !dirty;
}

function show(next) {
  cfg = next;
  $('config').value = JSON.stringify(cfg, null, 2);
  renderBuilder($('form'), cfg, () => {
    $('config').value = JSON.stringify(cfg, null, 2);
    refreshDirty();
  });
  refreshDirty();
}

// Pulls a JSON-tab edit into `cfg`; false (with the parse error shown) if it doesn't parse.
function readJson() {
  if (tab !== 'json') return true;
  try {
    cfg = mergeConfig(JSON.parse($('config').value));
    return true;
  } catch (e) {
    status(`Not valid JSON: ${e.message}`, 'bad');
    return false;
  }
}

function setTab(next) {
  if (!readJson()) return;
  tab = next;
  if (tab === 'form') show(cfg);
  $('form').hidden = tab !== 'form';
  $('config').hidden = tab !== 'json';
  for (const b of document.querySelectorAll('#viewTabs button')) b.classList.toggle('on', b.dataset.tab === tab);
}

async function load() {
  const { config, token: stored } = await chrome.storage.local.get(['config', 'token']);
  const merged = structuredClone(mergeConfig(config));
  saved = { config: JSON.stringify(merged), token: stored || '' };
  $('token').value = stored || '';
  show(merged);
  if (stored) listRepos(stored).then(fillRepos).catch(() => {});
  const first = Object.keys(cfg.repos)[0];
  if (stored && first) suggest(first);
}

function fillRepos(repos) {
  $('repo').replaceChildren(...repos.map((r) => new Option(r, r)));
  setKnownRepos(repos);
  if (tab === 'form') show(cfg);
}

// Labels and check names of the repo being edited, so its fields autocomplete.
async function suggest(repo) {
  $('suggestStatus').textContent = `Loading suggestions from ${repo}…`;
  const [labels, checks] = await Promise.allSettled([listLabels(token(), repo), checkNames(token(), repo)]);
  fillSuggestions((labels.value || []).map((l) => l.name), checks.value || []);
  $('suggestStatus').textContent = [
    labels.value ? `${labels.value.length} labels` : 'no labels',
    checks.value ? `${checks.value.length} check names` : 'no check names',
  ].join(' and ') + ` from ${repo} autocomplete below`;
  $('suggestStatus').title = [labels.reason?.message, checks.reason?.message].filter(Boolean).join('\n');
}
onRepoSelected(suggest);

for (const b of document.querySelectorAll('#viewTabs button')) b.addEventListener('click', () => setTab(b.dataset.tab));
$('config').addEventListener('input', refreshDirty);
$('token').addEventListener('input', refreshDirty);
$('reveal').addEventListener('click', () => {
  const hidden = $('token').type === 'password';
  $('token').type = hidden ? 'text' : 'password';
  $('reveal').textContent = hidden ? 'Hide' : 'Show';
});

$('save').addEventListener('click', async () => {
  if (!readJson()) return;
  const errors = validateConfig(cfg);
  if (errors.length) return status(errors.join('\n'), 'bad');
  await chrome.storage.local.set({ config: cfg, token: token() });
  saved = { config: JSON.stringify(cfg), token: token() };
  status('Saved. The panel is refreshing.');
  $('dirtyDot').className = 'dot saved';
  $('save').disabled = true;
});

$('reset').addEventListener('click', () => {
  show(structuredClone(DEFAULT_CONFIG));
  status('Defaults loaded. Save to apply them.');
});

$('test').addEventListener('click', async () => {
  const info = $('tokenInfo');
  info.hidden = false;
  info.className = 'token-info';
  info.textContent = 'Checking…';
  $('access').hidden = true;
  try {
    const me = await whoami(token());
    const repos = await listRepos(token());
    const byOwner = Object.entries(Object.groupBy(repos, (r) => r.split('/')[0]));
    info.textContent = [
      `Signed in as ${me.login}`,
      `${me.kind} token`,
      me.scopes && `scopes: ${me.scopes}`,
      me.expires && `expires ${me.expires}`,
      `sees ${repos.length} repos (${byOwner.map(([o, rs]) => `${o}: ${rs.length}`).join(', ') || 'none'})`,
    ]
      .filter(Boolean)
      .join(' · ');
    $('repoList').querySelector('summary').textContent = `Show all ${repos.length} repos`;
    $('repoList').querySelector('ul').replaceChildren(...repos.map((r) => h('li', {}, r)));
    fillRepos(repos);
    $('probes').replaceChildren();
    $('access').hidden = !repos.length;
    if (!repos.length) info.textContent += '. If this is a fine-grained token for an org, it may be waiting for the org to approve it.';
  } catch (e) {
    info.className = 'token-info bad';
    info.textContent = e.message;
  }
});

$('check').addEventListener('click', async () => {
  $('probes').replaceChildren(h('div', { class: 'probe' }, '', h('span', { class: 'muted' }, 'Checking…')));
  const results = await diagnose(token(), $('repo').value);
  $('probes').replaceChildren(
    ...results.map((r) =>
      h(
        'div',
        { class: `probe${r.ok ? '' : ' bad'}` },
        h('span', { class: `dot ${r.ok ? 'pass' : 'fail'}` }),
        h('span', { class: 'name' }, r.name),
        h('span', { class: 'detail' }, r.ok || !r.need ? r.detail : `${r.detail} → needs ${r.need}`),
      ),
    ),
  );
});

load();
