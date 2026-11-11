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

$('test').addEventListener('click', async () => {
  const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${$('token').value.trim()}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return status(`Token rejected: ${res.status} ${body.message || ''}`, true);
  const scopes = res.headers.get('x-oauth-scopes');
  status(`Signed in as ${body.login}${scopes ? ` · scopes: ${scopes}` : ' · fine-grained token'}`);
});

load();
