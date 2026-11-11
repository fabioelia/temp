import { fillSuggestions, onRepoSelected, renderBuilder, setKnownRepos } from './builder.js';
import { checkNames, diagnose, listLabels, listRepos, whoami } from './github.js';
import { DEFAULT_CONFIG, mergeConfig, validateConfig } from './lib.js';

const $ = (id) => document.getElementById(id);
const status = (msg, bad = false) => {
  $('status').textContent = msg;
  $('status').className = bad ? 'bad' : 'muted';
};

// The form and the JSON tab edit the same object; whichever tab is open is
// the source of truth when switching or saving.
let cfg = structuredClone(DEFAULT_CONFIG);
let tab = 'form';

function show(next) {
  cfg = next;
  $('config').value = JSON.stringify(cfg, null, 2);
  renderBuilder($('form'), cfg, () => ($('config').value = JSON.stringify(cfg, null, 2)));
}

// Pulls a JSON-tab edit into `cfg`; false (with the parse error shown) if it doesn't parse.
function readJson() {
  if (tab !== 'json') return true;
  try {
    cfg = mergeConfig(JSON.parse($('config').value));
    return true;
  } catch (e) {
    status(`Not valid JSON: ${e.message}`, true);
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
  const { config, token } = await chrome.storage.local.get(['config', 'token']);
  show(structuredClone(mergeConfig(config)));
  $('token').value = token || '';
  if (token) listRepos(token).then(fillRepos).catch(() => {});
  const first = Object.keys(cfg.repos)[0];
  if (token && first) suggest(first);
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
  fillSuggestions(labels.value || [], checks.value || []);
  $('suggestStatus').textContent = `${repo}: ${[
    labels.value ? `${labels.value.length} labels` : `labels unavailable (${labels.reason.message})`,
    checks.value ? `${checks.value.length} check names` : `check names unavailable (${checks.reason.message})`,
  ].join(', ')} autocomplete in the form.`;
}
onRepoSelected(suggest);

for (const b of document.querySelectorAll('#viewTabs button')) b.addEventListener('click', () => setTab(b.dataset.tab));

$('save').addEventListener('click', async () => {
  if (!readJson()) return;
  const errors = validateConfig(cfg);
  if (errors.length) return status(errors.join('\n'), true);
  await chrome.storage.local.set({ config: cfg, token: token() });
  status('Saved. Refreshing…');
});

$('reset').addEventListener('click', () => {
  show(structuredClone(DEFAULT_CONFIG));
  status('Defaults loaded. Save to apply.');
});


const token = () => $('token').value.trim();
const cell = (text, cls) => Object.assign(document.createElement('td'), { textContent: text, className: cls || '' });

$('test').addEventListener('click', async () => {
  const info = $('tokenInfo');
  info.className = 'muted';
  info.textContent = 'Checking…';
  $('access').hidden = true;
  try {
    const me = await whoami(token());
    const repos = await listRepos(token());
    const byOwner = Object.entries(Object.groupBy(repos, (r) => r.split('/')[0]));
    info.textContent = [
      `Signed in as ${me.login} · ${me.kind} token`,
      me.scopes && `scopes: ${me.scopes}`,
      me.expires && `expires ${me.expires}`,
      `sees ${repos.length} repos (${byOwner.map(([o, rs]) => `${o}: ${rs.length}`).join(', ') || 'none'})`,
    ]
      .filter(Boolean)
      .join(' · ');
    $('repoList').querySelector('summary').textContent = 'Show repos';
    $('repoList').querySelector('ul').replaceChildren(...repos.map((r) => Object.assign(document.createElement('li'), { textContent: r })));
    fillRepos(repos);
    $('probes').replaceChildren();
    $('access').hidden = !repos.length;
    if (!repos.length) info.textContent += '. If this is a fine-grained token for an org, it may be waiting for the org to approve it.';
  } catch (e) {
    info.className = 'bad';
    info.textContent = e.message;
  }
});

$('check').addEventListener('click', async () => {
  $('probes').replaceChildren(Object.assign(document.createElement('tr'), { textContent: 'Checking…' }));
  const results = await diagnose(token(), $('repo').value);
  $('probes').replaceChildren(
    ...results.map((r) => {
      const tr = document.createElement('tr');
      tr.append(cell(r.ok ? '✅' : '❌'), cell(r.name), cell(r.ok || !r.need ? r.detail : `${r.detail} → needs ${r.need}`, r.ok ? '' : 'bad'));
      return tr;
    }),
  );
});

load();
