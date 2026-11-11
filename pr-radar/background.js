import { gh, graphql } from './github.js';
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
  if (action.type === 'addLabel') await gh(token, `${issue}/labels`, { method: 'POST', body: { labels: [action.label] } });
  else if (action.type === 'removeLabel') await gh(token, `${issue}/labels/${encodeURIComponent(action.label)}`, { method: 'DELETE' });
  else if (action.type === 'markReady') {
    const { errors } = await graphql(token, 'mutation($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { clientMutationId } }', { id: row.id });
    if (errors?.length) throw new Error(summarizeErrors(errors));
  }
  else if (action.type === 'rerunJob') {
    const job = jobUrl.match(/\/job\/(\d+)/)?.[1];
    if (!job) throw new Error('Not an Actions job, so it cannot be re-run from here.');
    await gh(token, `/repos/${owner}/${repo}/actions/jobs/${job}/rerun`, { method: 'POST' });
  } else throw new Error(`Unknown action ${action.type}`);
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
  const run = msg.type === 'refresh' ? refresh() : msg.type === 'act' ? act(msg).then(refresh) : null;
  if (!run) return false;
  run.then(() => reply({ ok: true })).catch((e) => reply({ ok: false, error: String(e.message || e) }));
  return true;
});
