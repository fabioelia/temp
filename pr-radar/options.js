import { diagnose, listRepos, whoami } from './github.js';
import { DEFAULT_CONFIG, mergeConfig, validateConfig } from './lib.js';

const $ = (id) => document.getElementById(id);
const status = (msg, bad = false) => {
  $('status').textContent = msg;
  $('status').className = bad ? 'bad' : 'muted';
};

async function load() {
  const { config, token } = await chrome.storage.local.get(['config', 'token']);
  $('config').value = JSON.stringify(mergeConfig(config), null, 2);
  $('token').value = token || '';
}

$('save').addEventListener('click', async () => {
  let cfg;
  try {
    cfg = JSON.parse($('config').value);
  } catch (e) {
    return status(`Not valid JSON: ${e.message}`, true);
  }
  const errors = validateConfig(mergeConfig(cfg));
  if (errors.length) return status(errors.join('\n'), true);
  await chrome.storage.local.set({ config: cfg, token: $('token').value.trim() });
  status('Saved. Refreshing…');
});

$('reset').addEventListener('click', () => {
  $('config').value = JSON.stringify(DEFAULT_CONFIG, null, 2);
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
    $('repo').replaceChildren(...repos.map((r) => new Option(r, r)));
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
