import { DRAFT_MUTATIONS, gh, graphql } from './github.js';
import { QUERY, diff, mergeConfig, normalize, rowsForUrl, summarizeErrors } from './lib.js';

async function settings() {
  const { config, token } = await chrome.storage.local.get(['config', 'token']);
  return { config: mergeConfig(config), token };
}

async function refresh() {
  const { config, token } = await settings();
  if (!token) {
    await chrome.storage.local.set({ snapshot: { rows: [], sections: [], error: 'Add a GitHub token in Settings.', fetchedAt: null } });
    chrome.action.setBadgeText({ text: '!' });
    return;
  }
  const { snapshot: prev } = await chrome.storage.local.get('snapshot');
  try {
    const seen = new Set();
    const rows = [];
    const sections = [];
    let rate = null;
    const errors = [];
    for (const { title, q } of config.queries) {
      const { data, errors: partial } = await graphql(token, QUERY, { q, n: 50 });
      errors.push(...(partial || []));
      rate = data.rateLimit;
      const keys = [];
      for (const node of data.search.nodes) {
        if (!node?.number) continue;
        const row = normalize(node, config);
        if (seen.has(row.key)) continue;
        seen.add(row.key);
        rows.push(row);
        keys.push(row.key);
      }
      sections.push({ title, keys });
    }
    for (const e of diff(prev?.rows, rows, config)) {
      chrome.notifications.create(e.url, { type: 'basic', iconUrl: 'icon.png', title: e.title, message: e.message });
    }
    const needs = rows.filter((r) => r.attention.length).length;
    chrome.action.setBadgeText({ text: needs ? String(needs) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#d73a4a' });
    const warning = errors.length ? summarizeErrors(errors) : null;
    await chrome.storage.local.set({ snapshot: { rows, sections, rate, error: null, warning, fetchedAt: new Date().toISOString() } });
  } catch (err) {
    // Keep the last good rows on screen; only surface the error.
    await chrome.storage.local.set({ snapshot: { ...(prev || { rows: [], sections: [] }), error: String(err.message || err) } });
    chrome.action.setBadgeText({ text: '!' });
  }
}

async function act({ action, row, jobUrl }) {
  const { token } = await settings();
  const [owner, repo] = row.repo.split('/');
  const issue = `/repos/${owner}/${repo}/issues/${row.number}`;
  if (action.type === 'setLabels') {
    if (action.add?.length) await gh(token, `${issue}/labels`, { method: 'POST', body: { labels: action.add } });
    for (const name of action.remove || []) await gh(token, `${issue}/labels/${encodeURIComponent(name)}`, { method: 'DELETE' });
  } else if (DRAFT_MUTATIONS[action.type]) {
    const { errors } = await graphql(token, DRAFT_MUTATIONS[action.type], { id: row.id });
    if (errors?.length) throw new Error(summarizeErrors(errors));
  } else if (action.type === 'close') {
    await gh(token, `/repos/${owner}/${repo}/pulls/${row.number}`, { method: 'PATCH', body: { state: 'closed' } });
  } else if (action.type === 'rerunJob') {
    const job = jobUrl.match(/\/job\/(\d+)/)?.[1];
    if (!job) throw new Error('Not an Actions job, so it cannot be re-run from here.');
    await gh(token, `/repos/${owner}/${repo}/actions/jobs/${job}/rerun`, { method: 'POST' });
  } else throw new Error(`Unknown action ${action.type}`);
}

// Downloads through github.com's own artifact link rather than the API's
// signed-URL redirect: the browser's GitHub login authorizes it, so the token
// only needs Actions read to list the run's artifacts.
async function download({ row, extractor }) {
  const { config, token } = await settings();
  const ex = config.extractors.find((e) => e.name === extractor);
  const run = row.artifactRuns?.[extractor];
  if (!ex?.artifacts || !run) throw new Error(`No Actions run linked from ${extractor}.`);
  const { artifacts } = await gh(token, `/repos/${row.repo}/actions/runs/${run}/artifacts?per_page=100`);
  const re = new RegExp(ex.artifacts);
  const hits = artifacts.filter((a) => re.test(a.name));
  const live = hits.filter((a) => !a.expired);
  if (!live.length) throw new Error(hits.length ? 'That artifact has expired.' : `Run ${run} has no artifact matching ${ex.artifacts}.`);
  for (const a of live) await chrome.downloads.download({ url: `https://github.com/${row.repo}/actions/runs/${run}/artifacts/${a.id}`, filename: `${a.name}.zip` });
  return live.length;
}

async function schedule() {
  const { config } = await settings();
  await chrome.alarms.clear('poll');
  chrome.alarms.create('poll', { periodInMinutes: Math.max(0.5, Number(config.pollMinutes) || 2) });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  schedule();
  refresh();
});
chrome.runtime.onStartup.addListener(() => {
  schedule();
  refresh();
});
chrome.alarms.onAlarm.addListener((a) => a.name === 'poll' && refresh());
chrome.notifications.onClicked.addListener((url) => {
  chrome.tabs.create({ url });
  chrome.notifications.clear(url);
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.config || changes.token) {
    schedule();
    refresh();
  }
});
async function match(url) {
  const [{ snapshot }, { config }] = await Promise.all([chrome.storage.local.get('snapshot'), settings()]);
  return rowsForUrl(snapshot?.rows || [], url, config);
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === 'match') {
    match(msg.url).then((rows) => reply({ ok: true, rows }));
    return true;
  }
  const run = msg.type === 'refresh' ? refresh() : msg.type === 'act' ? act(msg).then(refresh) : msg.type === 'download' ? download(msg) : null;
  if (!run) return false;
  run.then(() => reply({ ok: true })).catch((e) => reply({ ok: false, error: String(e.message || e) }));
  return true;
});
