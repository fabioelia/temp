// Pure logic shared by the service worker, the side panel and the tests:
// config defaults, the GitHub query, PR normalization, attention rules and
// change detection. No chrome.* calls here, so `node --test` can load it.

export const DEFAULT_CONFIG = {
  pollMinutes: 2,
  // GitHub search syntax. Each query is one section in the panel; a PR that
  // matches several shows once, under the first.
  queries: [
    { title: 'My PRs', q: 'is:pr is:open author:@me archived:false' },
    { title: 'Review requested', q: 'is:pr is:open review-requested:@me archived:false' },
  ],
  // kind: alert | ok | pending | info. An `alert` label puts the PR in
  // "needs you". notify: desktop notification when the label is added.
  labels: [
    { name: 'QA Reviewed - Failed', kind: 'alert', notify: true },
    { name: 'QA Reviewed - Error', kind: 'alert', notify: true },
    { name: 'QA Reviewed - Passed', kind: 'ok', notify: true },
    { name: 'qa-review', kind: 'pending' },
    { name: 'cursor-review', kind: 'pending' },
    { name: 'skip-qa', kind: 'info' },
  ],
  showOtherLabels: false,
  // match: regex on the check run / status context name. showTitle: show the
  // check's output title (review/gate puts its verdict there, and its
  // conclusion is only ever neutral or success). alertTitle: regex on that
  // title that puts the PR in "needs you".
  checks: [
    { label: 'CI', match: '^CI Success$', notify: true },
    { label: 'Preview', match: '^preview / Build, deploy, comment$', notify: true },
    { label: 'E2E', match: '^playwright / Resolve Playwright gate status$', notify: true },
    { label: 'QA run', match: '^qa-test$' },
    { label: 'AI gate', match: '^review/gate$', showTitle: true, notify: true, alertTitle: '⛔|🔴|Not recommended' },
  ],
  // Pull values out of the PR body, its comments and review bodies.
  // source: body | comments | all. contains: only read texts holding this
  // marker. regex: capture group 1 if present, else the whole match.
  // all: collect every match (else the newest one). kind: link | text.
  // Raw bodies are never stored, only what these extract, so keep them off
  // secrets (the preview block in a Newton PR body carries an MCP token).
  extractors: [
    { name: 'Sessions', source: 'all', regex: 'https://claude\\.ai/code/session_[A-Za-z0-9]+', all: true, kind: 'link' },
    { name: 'Preview', source: 'body', regex: '<!-- pr-preview:start -->[\\s\\S]*?:link: (https://\\S+)', kind: 'link' },
    {
      name: 'QA verdict',
      source: 'comments',
      contains: '<!-- qa-tester:results -->',
      regex: '> \\[!(?:CAUTION|WARNING|TIP)\\]\\s*\\r?\\n> \\*\\*(.+?)\\*\\*',
      kind: 'text',
      notify: true,
    },
  ],
  // Buttons on each PR. type: addLabel | removeLabel | markReady.
  // when: draft | ready (omit for always). Writes need a token with write access.
  actions: [
    { title: 'Request QA', type: 'addLabel', label: 'qa-review', when: 'ready' },
    { title: 'Request AI review', type: 'addLabel', label: 'cursor-review' },
    { title: 'Mark ready', type: 'markReady', when: 'draft' },
  ],
  attention: { failedChecks: true, changesRequested: true, conflicts: true },
};

export const QUERY = `
query Radar($q: String!, $n: Int!) {
  rateLimit { remaining resetAt }
  search(query: $q, type: ISSUE, first: $n) {
    nodes {
      ... on PullRequest {
        id number title url isDraft state mergeable reviewDecision updatedAt body
        author { login }
        repository { nameWithOwner }
        labels(first: 30) { nodes { name color } }
        comments(last: 30) { nodes { body url } }
        reviews(last: 10) { nodes { body url } }
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                contexts(first: 100) {
                  nodes {
                    __typename
                    ... on CheckRun { name status conclusion title detailsUrl startedAt }
                    ... on StatusContext { context state description targetUrl createdAt }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const CONCLUSION = {
  SUCCESS: 'pass',
  FAILURE: 'fail',
  TIMED_OUT: 'fail',
  STARTUP_FAILURE: 'fail',
  ACTION_REQUIRED: 'fail',
  CANCELLED: 'cancelled',
  NEUTRAL: 'neutral',
  STALE: 'neutral',
  SKIPPED: 'skipped',
};
const STATUS_STATE = { SUCCESS: 'pass', FAILURE: 'fail', ERROR: 'fail', PENDING: 'pending', EXPECTED: 'pending' };

export function mergeConfig(user) {
  return { ...DEFAULT_CONFIG, ...(user || {}) };
}

function flattenContexts(pr) {
  const nodes = pr.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts?.nodes || [];
  return nodes.map((c) =>
    c.__typename === 'CheckRun'
      ? {
          name: c.name,
          state: c.status !== 'COMPLETED' ? 'pending' : CONCLUSION[c.conclusion] || 'neutral',
          title: c.title || '',
          url: c.detailsUrl,
          at: c.startedAt || '',
        }
      : {
          name: c.context,
          state: STATUS_STATE[c.state] || 'neutral',
          title: c.description || '',
          url: c.targetUrl,
          at: c.createdAt || '',
        },
  );
}

// A workflow re-triggered by a label event often re-reports the same job name
// as skipped, so the newest non-skipped run wins; skipped only if all are.
function pickCheck(runs) {
  const byNewest = [...runs].sort((a, b) => (a.at < b.at ? 1 : -1));
  return byNewest.find((r) => r.state !== 'skipped') || byNewest[0];
}

function texts(pr, source, contains) {
  const comments = [...(pr.comments?.nodes || []), ...(pr.reviews?.nodes || [])].map((c) => c.body || '');
  const list = source === 'body' ? [pr.body || ''] : source === 'comments' ? comments : [pr.body || '', ...comments];
  return contains ? list.filter((t) => t.includes(contains)) : list;
}

function extract(pr, ex) {
  const re = new RegExp(ex.regex, 'g');
  const found = [];
  for (const t of texts(pr, ex.source || 'all', ex.contains)) {
    for (const m of t.matchAll(re)) found.push((m[1] ?? m[0]).trim());
  }
  if (ex.all) return [...new Set(found)];
  return found.length ? [found[found.length - 1]] : [];
}

export function normalize(pr, config) {
  const contexts = flattenContexts(pr);
  const labelCfg = Object.fromEntries(config.labels.map((l) => [l.name, l]));
  const labels = (pr.labels?.nodes || [])
    .filter((l) => labelCfg[l.name] || config.showOtherLabels)
    .map((l) => ({ name: l.name, color: l.color, kind: labelCfg[l.name]?.kind || 'info' }));
  const checks = config.checks.map((c) => {
    const re = new RegExp(c.match);
    const runs = contexts.filter((x) => re.test(x.name));
    const hit = runs.length ? pickCheck(runs) : null;
    return {
      label: c.label,
      state: hit ? hit.state : 'missing',
      title: c.showTitle && hit ? hit.title : '',
      url: hit?.url || '',
    };
  });
  const extracted = Object.fromEntries(config.extractors.map((ex) => [ex.name, extract(pr, ex)]));
  const row = {
    key: `${pr.repository.nameWithOwner}#${pr.number}`,
    id: pr.id,
    repo: pr.repository.nameWithOwner,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author: pr.author?.login || '',
    isDraft: pr.isDraft,
    mergeable: pr.mergeable,
    reviewDecision: pr.reviewDecision,
    updatedAt: pr.updatedAt,
    labels,
    allLabels: (pr.labels?.nodes || []).map((l) => l.name),
    checks,
    extracted,
  };
  row.attention = attention(row, config);
  return row;
}

export function attention(row, config) {
  const reasons = [];
  for (const l of row.labels) if (l.kind === 'alert') reasons.push(l.name);
  const a = config.attention || {};
  config.checks.forEach((c, i) => {
    const got = row.checks[i];
    if (a.failedChecks && got.state === 'fail') reasons.push(`${c.label} failed`);
    if (c.alertTitle && got.title && new RegExp(c.alertTitle).test(got.title)) reasons.push(`${c.label}: ${got.title}`);
  });
  if (a.changesRequested && row.reviewDecision === 'CHANGES_REQUESTED') reasons.push('Changes requested');
  if (a.conflicts && row.mergeable === 'CONFLICTING') reasons.push('Merge conflict');
  return reasons;
}

const STATE_WORD = { pass: 'passed', fail: 'failed', cancelled: 'cancelled', neutral: 'finished' };

// Returns one {key, title, message, url} per PR that changed in a way the
// config marks notify. An empty `prev` (first run, fresh install) yields
// nothing, so installing doesn't fire a notification per open PR.
export function diff(prev, next, config) {
  if (!prev || !prev.length) return [];
  const before = Object.fromEntries(prev.map((r) => [r.key, r]));
  const after = new Set(next.map((r) => r.key));
  const notifyLabels = new Set(config.labels.filter((l) => l.notify).map((l) => l.name));
  const events = [];
  for (const row of next) {
    const old = before[row.key];
    const lines = [];
    if (!old) {
      lines.push('New in your list');
    } else {
      for (const name of row.allLabels) {
        if (notifyLabels.has(name) && !old.allLabels.includes(name)) lines.push(`Label: ${name}`);
      }
      config.checks.forEach((c, i) => {
        const a = old.checks[i];
        const b = row.checks[i];
        if (!c.notify || !a || !b) return;
        if (a.state !== b.state && STATE_WORD[b.state]) lines.push(`${c.label} ${STATE_WORD[b.state]}${b.title ? `: ${b.title}` : ''}`);
        else if (b.title && a.title !== b.title) lines.push(`${c.label}: ${b.title}`);
      });
      for (const ex of config.extractors) {
        if (!ex.notify) continue;
        const a = (old.extracted[ex.name] || []).join('\n');
        const b = (row.extracted[ex.name] || []).join('\n');
        if (b && a !== b) lines.push(`${ex.name}: ${b}`);
      }
      if (old.isDraft && !row.isDraft) lines.push('Marked ready for review');
    }
    if (lines.length) events.push({ key: row.key, title: `${row.key} ${row.title}`, message: lines.join('\n'), url: row.url });
  }
  for (const old of prev) {
    if (!after.has(old.key)) {
      events.push({ key: old.key, title: `${old.key} ${old.title}`, message: 'Left your list (merged or closed?)', url: old.url });
    }
  }
  return events;
}

// True when `url` is `base` or a page under it: a PR's /files tab matches
// its PR, but .../pull/49 never matches .../pull/4977.
function within(url, base) {
  return url === base || (url.startsWith(base) && '/?#'.includes(url[base.length]));
}

// The PRs a tab belongs to: the PR page itself, or a page linked from the PR
// by a link extractor (a Claude session, the preview).
export function rowsForUrl(rows, url, config) {
  if (!url) return [];
  const linkNames = config.extractors.filter((e) => e.kind === 'link').map((e) => e.name);
  return rows.filter(
    (r) => within(url, r.url) || linkNames.some((n) => (r.extracted[n] || []).some((v) => within(url, v))),
  );
}

export function validateConfig(cfg) {
  const errors = [];
  for (const k of ['queries', 'labels', 'checks', 'extractors', 'actions']) {
    if (!Array.isArray(cfg[k])) errors.push(`"${k}" must be an array`);
  }
  for (const c of cfg.checks || []) {
    try {
      new RegExp(c.match);
    } catch (e) {
      errors.push(`check "${c.label}": bad regex (${e.message})`);
    }
  }
  for (const ex of cfg.extractors || []) {
    try {
      new RegExp(ex.regex);
    } catch (e) {
      errors.push(`extractor "${ex.name}": bad regex (${e.message})`);
    }
  }
  for (const a of cfg.actions || []) {
    if (!['addLabel', 'removeLabel', 'markReady'].includes(a.type)) errors.push(`action "${a.title}": unknown type ${a.type}`);
  }
  return errors;
}
