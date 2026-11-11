import { DRAFT_MUTATIONS, actionsContexts, emptyActionsCache, gh, graphql, pruneActionsCache, restRate } from './github.js';
import { QUERY, attention, checksHidden, tabFor, diff, mapLimit, mergeConfig, normalize, profileFor, rowsForUrl, scopedQuery, summarizeErrors } from './lib.js';

async function settings() {
  const { config, token } = await chrome.storage.local.get(['config', 'token']);
  return { config: mergeConfig(config), token };
}

const CHECK_FIELDS = ['commits', 'statusCheckRollup', 'contexts'];
const touchesChecks = (e) => e.path?.some((p) => CHECK_FIELDS.includes(p));

// Returns whether anything is still running, which sets the next interval.
async function poll() {
  const { config, token } = await settings();
  if (!token) {
    await chrome.storage.local.set({ snapshot: { rows: [], sections: [], error: 'Add a GitHub token in Settings.', fetchedAt: null } });
    chrome.action.setBadgeText({ text: '!' });
    return;
  }
  const { snapshot: prev } = await chrome.storage.local.get('snapshot');
  if (!Object.keys(config.repos).length) {
    await chrome.storage.local.set({ snapshot: { rows: [], sections: [], error: 'No repos set up yet. Add one in Settings: only repos you set up are tracked.', fetchedAt: null } });
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  const { actionsCache = emptyActionsCache() } = await chrome.storage.session.get('actionsCache');
  try {
    const seen = new Set();
    const sections = [];
    let rate = null;
    const errors = [];
    const pending = [];
    for (const { title, q } of config.queries) {
      const { data, errors: partial = [] } = await graphql(token, QUERY, { q: scopedQuery(q, config), n: 50 });
      rate = data.rateLimit;
      const blocked = new Set(partial.filter(touchesChecks).map((e) => e.path[2]));
      // The Actions fallback replaces exactly the fields these errors are about.
      errors.push(...(config.checksSource === 'checks' ? partial : partial.filter((e) => !touchesChecks(e))));
      const keys = [];
      data.search.nodes.forEach((node, i) => {
        // The search is limited to set-up repos; this also drops a PR that
        // matched while its repo was being removed from settings.
        if (!node?.number || !config.repos[node.repository.nameWithOwner]) return;
        const key = `${node.repository.nameWithOwner}#${node.number}`;
        if (seen.has(key)) return;
        seen.add(key);
        pending.push({ node, hidden: blocked.has(i) || checksHidden(node) });
        keys.push(key);
      });
      sections.push({ title, keys });
    }
    const viaActions = (p) => config.checksSource === 'actions' || (config.checksSource !== 'checks' && p.hidden);
    const before = Object.fromEntries((prev?.rows || []).map((r) => [r.key, r]));
    const actionFailures = [];
    const rows = await mapLimit(pending, 4, async (p) => {
      if (!viaActions(p)) return { ...normalize(p.node, config), checksFrom: 'checks' };
      try {
        const contexts = await actionsContexts(token, p.node.repository.nameWithOwner, p.node.headRefOid, actionsCache, p.node.updatedAt);
        return { ...normalize(p.node, config, contexts), checksFrom: 'actions' };
      } catch (e) {
        actionFailures.push(e.message);
        // Keep the last known checks rather than blanking the chips; the
        // next poll tries again.
        const row = { ...normalize(p.node, config, []), checksFrom: 'actions' };
        const old = before[row.key];
        if (old?.sha === row.sha) {
          row.checks = old.checks;
          row.attention = attention(row, config);
          row.stale = true;
        }
        return row;
      }
    });
    for (const e of diff(prev?.rows, rows, config)) {
      chrome.notifications.create(e.url, { type: 'basic', iconUrl: 'icon.png', title: e.title, message: e.message });
    }
    const needs = rows.filter((r) => r.attention.length).length;
    chrome.action.setBadgeText({ text: needs ? String(needs) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#d73a4a' });
    const warning =
      [
        errors.length ? summarizeErrors(errors) : '',
        actionFailures.length
          ? `GitHub's Actions API failed for ${actionFailures.length} PR${actionFailures.length === 1 ? '' : 's'} after retries (${actionFailures[0]}). Their last known checks are shown; the next refresh tries again.`
          : '',
      ]
        .filter(Boolean)
        .join('\n') || null;
    rate = { graphql: rate, rest: restRate() };
    const busy = rows.some((r) => r.stale || r.checks.some((c) => c.state === 'pending'));
    await chrome.storage.session.set({ actionsCache: pruneActionsCache(actionsCache) });
    await chrome.storage.local.set({ snapshot: { rows, sections, rate, error: null, warning, busy, fetchedAt: new Date().toISOString() } });
    return busy;
  } catch (err) {
    // Keep the last good rows on screen; only surface the error.
    await chrome.storage.local.set({ snapshot: { ...(prev || { rows: [], sections: [] }), error: String(err.message || err) } });
    chrome.action.setBadgeText({ text: '!' });
    return true;
  }
}

// One poll at a time, so two never write the Actions cache over each other.
// A refresh asked for mid-poll (a saved setting, a click) runs one more poll
// afterwards: the running one may have read the settings before the change.
let inFlight = null;
let again = false;
function refresh() {
  if (inFlight) {
    again = true;
    return inFlight;
  }
  inFlight = (async () => {
    let busy;
    do {
      again = false;
      busy = await poll();
    } while (again);
    await schedule(busy);
  })().finally(() => (inFlight = null));
  return inFlight;
}

// While a check is running, poll every pollMinutes; once everything has
// settled, every quietPollMinutes.
async function schedule(busy = true) {
  const { config } = await settings();
  const minutes = busy ? config.pollMinutes : config.quietPollMinutes;
  await chrome.alarms.clear('poll');
  chrome.alarms.create('poll', { delayInMinutes: Math.max(0.5, Number(minutes) || 2) });
}

// No polling while the computer is locked or nobody has touched it for
// IDLE_SECONDS; the first poll after they're back runs at once.
const IDLE_SECONDS = 600;
chrome.idle.setDetectionInterval(IDLE_SECONDS);
chrome.idle.onStateChanged.addListener((state) => state === 'active' && refresh());
async function onAlarm() {
  if ((await chrome.idle.queryState(IDLE_SECONDS)) !== 'active') return schedule(false);
  return refresh();
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
  const ex = profileFor(config, row.repo).extractors.find((e) => e.name === extractor);
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


chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  refresh();
});
chrome.runtime.onStartup.addListener(() => refresh());
chrome.alarms.onAlarm.addListener((a) => a.name === 'poll' && onAlarm());
// Switches to a tab already showing `url` (or a page under it) before
// opening a new one. Tab URLs are only visible for hosts in
// host_permissions, so a preview link always opens fresh.
async function openTab(url) {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: `${url.split(/[?#]/)[0]}*` });
  } catch {
    // not a valid match pattern (an odd scheme or host): just open it
  }
  const hit = tabFor(tabs, url);
  if (!hit) return chrome.tabs.create({ url });
  await chrome.tabs.update(hit.id, { active: true });
  await chrome.windows.update(hit.windowId, { focused: true });
}

chrome.notifications.onClicked.addListener((url) => {
  openTab(url);
  chrome.notifications.clear(url);
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.config || changes.token) refresh();
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
  if (msg.type === 'open') {
    openTab(msg.url).then(() => reply({ ok: true }), (e) => reply({ ok: false, error: String(e.message || e) }));
    return true;
  }
  const run = msg.type === 'refresh' ? refresh() : msg.type === 'act' ? act(msg).then(() => refresh()) : msg.type === 'download' ? download(msg) : null;
  if (!run) return false;
  run.then(() => reply({ ok: true })).catch((e) => reply({ ok: false, error: String(e.message || e) }));
  return true;
});
