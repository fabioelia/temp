// Pure logic shared by the service worker, the side panel and the tests:
// config defaults, the GitHub query, PR normalization, attention rules and
// change detection. No chrome.* calls here, so `node --test` can load it.

// Claude Code session links, from the PR body's "## Agent session" section
// or any comment.
const SESSIONS = { name: 'Sessions', source: 'all', regex: 'https://claude\\.ai/code/session_[A-Za-z0-9]+', all: true, kind: 'link' };

// The settings for the Newton monorepo: its QA labels, preview and
// Playwright checks, QA and AI-review verdicts and review buttons.
const NEWTON = {
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
  // artifacts: regex on artifact names; clicking the chip downloads the
  // matching artifacts of the Actions run linked from the same text.
  // show: {raw: display} renames values. alert: regex on the shown value
  // that puts the PR in "needs you".
  // Raw bodies are never stored, only what these extract, so keep them off
  // secrets (the preview block in a Newton PR body carries an MCP token).
  extractors: [
    SESSIONS,
    { name: 'Preview', source: 'body', regex: '<!-- pr-preview:start -->[\\s\\S]*?:link: (https://\\S+)', kind: 'link' },
    {
      name: 'QA verdict',
      source: 'comments',
      contains: '<!-- qa-tester:results -->',
      regex: '> \\[!(?:CAUTION|WARNING|TIP)\\]\\s*\\r?\\n> \\*\\*(.+?)\\*\\*',
      kind: 'text',
      notify: true,
      artifacts: '^qa-screenshots',
    },
    // The AI review ledger's state block records each cycle's verdict; the
    // last one is the current review. Same source review/gate reads, so it
    // works without the Checks API.
    {
      name: 'AI verdict',
      source: 'all',
      contains: '<!-- ledger-state v1',
      regex: '"verdict":"(block|advisory|clean)"',
      kind: 'text',
      notify: true,
      show: { block: '⛔ Not recommended', advisory: '🟡 Advisory', clean: '🟢 Clean' },
      alert: '⛔',
    },
  ],
  // Buttons on each PR. type: addLabel | removeLabel | toggleLabel | markReady |
  // convertToDraft | close.
  // when: draft | ready (omit for always). Writes need a token with write access.
  actions: [
    { title: 'Request QA', type: 'addLabel', label: 'qa-review', when: 'ready' },
    { title: 'Request AI review', type: 'addLabel', label: 'cursor-review' },
    { title: 'Mark ready', type: 'markReady', when: 'draft' },
    { title: 'Convert to draft', type: 'convertToDraft', when: 'ready' },
    { title: 'Close PR', type: 'close' },
    { title: 'skip-qa', type: 'toggleLabel', label: 'skip-qa' },
  ],
};

// A profile is the per-repo part of the config: labels, checks, extractors
// and actions. Only repos with a profile in `repos` are tracked: searches are
// limited to them, and PRs from any other repo are ignored.
export const PROFILE_KEYS = ['labels', 'checks', 'extractors', 'actions'];

// What a newly added repo starts with. rollup: one chip summing every
// matching check (the worst state wins) instead of the newest one.
export const NEW_REPO_PROFILE = {
  labels: [],
  checks: [{ label: 'All checks', match: '.', rollup: true, showTitle: true, notify: true }],
  extractors: [SESSIONS],
  actions: [
    { title: 'Mark ready', type: 'markReady', when: 'draft' },
    { title: 'Convert to draft', type: 'convertToDraft', when: 'ready' },
    { title: 'Close PR', type: 'close' },
  ],
};

export const DEFAULT_CONFIG = {
  // Minutes between polls while a check is running, and once everything has
  // settled. No polling at all while the computer is locked or idle.
  pollMinutes: 2,
  quietPollMinutes: 10,
  // Where check results come from. checks: GitHub's Checks API (classic
  // token). actions: the Actions jobs API, which fine-grained tokens can
  // read but which only knows Actions jobs. auto: Checks API, falling back
  // to Actions for any PR whose check runs come back hidden.
  checksSource: 'auto',
  // GitHub search syntax. Each query is one section in the panel; a PR that
  // matches several shows once, under the first. Each is limited to `repos`.
  queries: [
    { title: 'My PRs', q: 'is:pr is:open author:@me archived:false' },
    { title: 'Review requested', q: 'is:pr is:open review-requested:@me archived:false' },
  ],
  showOtherLabels: false,
  attention: { failedChecks: true, changesRequested: true, conflicts: true },
  repos: { 'Newton-Research-Inc/newton': NEWTON },
};

export const QUERY = `
query Radar($q: String!, $n: Int!) {
  rateLimit { remaining resetAt }
  search(query: $q, type: ISSUE, first: $n) {
    nodes {
      ... on PullRequest {
        id number title url isDraft state mergeable reviewDecision updatedAt body headRefOid
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

export const CONCLUSION = {
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

// A config saved before per-repo profiles has its profile at the top level
// and no `repos`. That profile was tuned for the Newton monorepo, so it moves
// there rather than being dropped.
export function mergeConfig(user) {
  if (!user) return structuredClone(DEFAULT_CONFIG);
  const { labels, checks, extractors, actions, ...rest } = user;
  const legacy = !user.repos && Array.isArray(checks);
  const repos = user.repos || (legacy ? { 'Newton-Research-Inc/newton': { labels, checks, extractors, actions } } : {});
  return { ...structuredClone(DEFAULT_CONFIG), ...rest, repos };
}

// The settings that apply to a PR in `repo`. A repo that isn't set up gets
// NEW_REPO_PROFILE; the service worker doesn't show those PRs at all.
export function profileFor(config, repo) {
  return { ...config, ...(config.repos?.[repo] || NEW_REPO_PROFILE) };
}

// GitHub ORs repeated repo: qualifiers, so this limits a search to the repos
// that are set up.
export function scopedQuery(q, config) {
  return `${q} ${Object.keys(config.repos || {}).map((r) => `repo:${r}`).join(' ')}`;
}

// A connection's nodes without the nulls GitHub puts in place of entries the
// token may not read (a partial-permission response).
export const nodes = (conn) => (conn?.nodes || []).filter(Boolean);

export function flattenContexts(pr) {
  const head = nodes(pr.commits)[0];
  return nodes(head?.commit?.statusCheckRollup?.contexts).map((c) =>
    c.__typename === 'CheckRun'
      ? {
          name: c.name,
          state: c.status !== 'COMPLETED' ? 'pending' : CONCLUSION[c.conclusion] || 'neutral',
          title: c.title || '',
          url: c.detailsUrl,
          at: c.startedAt || '',
          // Only CHECKS_QUERY (the details pane) asks for these.
          summary: c.summary || '',
          workflow: c.checkSuite?.workflowRun?.workflow?.name || '',
          annotations: nodes(c.annotations).map((a) => ({
            level: a.annotationLevel,
            path: a.path,
            line: a.location?.start?.line,
            message: a.message,
          })),
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

const STATE_ORDER = ['fail', 'cancelled', 'pending', 'neutral', 'pass', 'skipped'];

// One summary for many checks: the worst state among them (one run per
// name), linking to the first check in that state.
function rollup(runs) {
  const latest = [...Map.groupBy(runs, (r) => r.name).values()].map(pickCheck);
  const worst = latest.reduce((a, b) => (STATE_ORDER.indexOf(b.state) < STATE_ORDER.indexOf(a.state) ? b : a));
  const n = latest.filter((r) => r.state === worst.state).length;
  return { ...worst, title: `${n} of ${latest.length} ${worst.state}` };
}

// Every check on the head commit, one per name, failures first.
// True when GitHub hid check runs from this token: it returns null in their
// place (fine-grained tokens can't call the Checks API).
export function checksHidden(pr) {
  const head = nodes(pr.commits)[0];
  return (head?.commit?.statusCheckRollup?.contexts?.nodes || []).some((n) => n === null);
}

export function allChecks(contexts) {
  const byName = Map.groupBy(contexts, (c) => c.name);
  return [...byName.values()]
    .map(pickCheck)
    .map((c) => ({ ...c, jobId: c.url?.match(/\/job\/(\d+)/)?.[1] || '' }))
    .sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) || a.name.localeCompare(b.name));
}

// The lines that name the failure and the last `n` lines of an Actions job
// log, with the runner's timestamp prefix removed. ponytail: "names the
// failure" is a heuristic (##[error], pytest FAILED/ERROR, "SomeError:"),
// capped at 20 lines.
export function logTail(text, n = 60) {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z /, ''));
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return {
    errors: lines
      .filter((l) => /^##\[error\]|^(FAILED|ERROR) |\b[A-Z]\w*Error:/.test(l))
      .map((l) => l.replace(/^##\[error\]/, ''))
      .slice(0, 20),
    tail: lines.slice(-n).join('\n'),
  };
}

// A workflow re-triggered by a label event often re-reports the same job name
// as skipped, so the newest non-skipped run wins; skipped only if all are.
function pickCheck(runs) {
  const byNewest = [...runs].sort((a, b) => (a.at < b.at ? 1 : -1));
  return byNewest.find((r) => r.state !== 'skipped') || byNewest[0];
}

function texts(pr, source, contains) {
  const comments = [...nodes(pr.comments), ...nodes(pr.reviews)].map((c) => c.body || '');
  const list = source === 'body' ? [pr.body || ''] : source === 'comments' ? comments : [pr.body || '', ...comments];
  return contains ? list.filter((t) => t.includes(contains)) : list;
}

function extract(pr, ex) {
  const re = new RegExp(ex.regex, 'g');
  const found = [];
  let source = '';
  for (const t of texts(pr, ex.source || 'all', ex.contains)) {
    for (const m of t.matchAll(re)) {
      found.push((m[1] ?? m[0]).trim());
      source = t;
    }
  }
  // The Actions run linked from the text the newest value came from (the QA
  // comment's "workflow run" footer), whose artifacts the chip downloads.
  // The footer comes last, so the last run link wins over any in the body.
  const run = ex.artifacts ? [...source.matchAll(/\/actions\/runs\/(\d+)/g)].pop()?.[1] || '' : '';
  const shown = found.map((v) => ex.show?.[v] ?? v);
  if (ex.all) return { values: [...new Set(shown)], run };
  return { values: shown.length ? [shown[shown.length - 1]] : [], run };
}

// `contexts` defaults to the check runs in the GraphQL response; the service
// worker passes Actions jobs instead when those runs are hidden.
export function normalize(pr, config, contexts = flattenContexts(pr)) {
  config = profileFor(config, pr.repository.nameWithOwner);
  const labelCfg = Object.fromEntries(config.labels.map((l) => [l.name, l]));
  const labels = nodes(pr.labels)
    .filter((l) => labelCfg[l.name] || config.showOtherLabels)
    .map((l) => ({ name: l.name, color: l.color, kind: labelCfg[l.name]?.kind || 'info' }));
  const checks = config.checks.map((c) => {
    const re = new RegExp(c.match);
    const runs = contexts.filter((x) => re.test(x.name));
    const hit = !runs.length ? null : c.rollup ? rollup(runs) : pickCheck(runs);
    return {
      label: c.label,
      state: hit ? hit.state : 'missing',
      title: c.showTitle && hit ? hit.title : '',
      url: hit?.url || '',
    };
  });
  const results = config.extractors.map((ex) => [ex.name, extract(pr, ex)]);
  const extracted = Object.fromEntries(results.map(([n, r]) => [n, r.values]));
  const artifactRuns = Object.fromEntries(results.filter(([, r]) => r.run).map(([n, r]) => [n, r.run]));
  const row = {
    key: `${pr.repository.nameWithOwner}#${pr.number}`,
    id: pr.id,
    sha: pr.headRefOid || '',
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
    allLabels: nodes(pr.labels).map((l) => l.name),
    checks,
    extracted,
    artifactRuns,
  };
  row.attention = attention(row, config);
  return row;
}

export function attention(row, config) {
  config = profileFor(config, row.repo);
  const reasons = [];
  for (const l of row.labels) if (l.kind === 'alert') reasons.push(l.name);
  const a = config.attention || {};
  config.checks.forEach((c, i) => {
    const got = row.checks[i];
    if (a.failedChecks && got.state === 'fail') reasons.push(`${c.label} failed`);
    if (c.alertTitle && got.title && new RegExp(c.alertTitle).test(got.title)) reasons.push(`${c.label}: ${got.title}`);
  });
  for (const ex of config.extractors) {
    if (!ex.alert) continue;
    for (const v of row.extracted[ex.name] || []) if (new RegExp(ex.alert).test(v)) reasons.push(`${ex.name}: ${v}`);
  }
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
  const events = [];
  const base = config;
  for (const row of next) {
    const old = before[row.key];
    config = profileFor(base, row.repo);
    const notifyLabels = new Set(config.labels.filter((l) => l.notify).map((l) => l.name));
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

const FIELD_HINT = {
  commits: 'needs Contents: read on a fine-grained token',
  statusCheckRollup: "fine-grained tokens can't read check runs; with checksSource auto the panel reads Actions jobs instead",
  comments: 'needs Issues + Pull requests read',
  reviews: 'needs Pull requests read',
  labels: 'needs Issues + Pull requests read',
};

// Collapses GraphQL's one-error-per-PR into one line per blocked field, e.g.
// "Can't read statusCheckRollup on 20 PRs (…hint): Resource not accessible…".
export function summarizeErrors(errors) {
  const groups = new Map();
  for (const e of errors) {
    const field = (e.path || []).filter((p) => typeof p === 'string' && p !== 'nodes').pop() || 'query';
    const key = `${field}\u0000${e.message}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return [...groups]
    .map(([key, n]) => {
      const [field, message] = key.split('\u0000');
      const hint = FIELD_HINT[field] ? ` (${FIELD_HINT[field]})` : '';
      return `Can't read ${field} on ${n} PR${n === 1 ? '' : 's'}${hint}: ${message}`;
    })
    .join('\n');
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
  const linkNames = (r) => profileFor(config, r.repo).extractors.filter((e) => e.kind === 'link').map((e) => e.name);
  return rows.filter(
    (r) => within(url, r.url) || linkNames(r).some((n) => (r.extracted[n] || []).some((v) => within(url, v))),
  );
}

// Turns a configured action into {title, action}; label actions become one
// setLabels write, and null hides a button whose label is already in the
// state it would set.
export function actionButton(a, has) {
  if (!a.type.endsWith('Label')) return { title: a.title, action: a };
  const adding = a.type === 'addLabel' || (a.type === 'toggleLabel' && !has(a.label));
  if (a.type === 'addLabel' && has(a.label)) return null;
  if (a.type === 'removeLabel' && !has(a.label)) return null;
  const title = a.type === 'toggleLabel' ? `${adding ? '+' : '−'} ${a.title}` : a.title;
  return { title, action: { type: 'setLabels', [adding ? 'add' : 'remove']: [a.label] } };
}

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The settings form shows a check's `match` regex as the plain check name
// when it is an exact-name match, * for every check, and /pattern/ otherwise.
export function regexToName(re) {
  if (re === '.') return '*';
  const exact = re.match(/^\^(.*)\$$/);
  if (exact) {
    const name = exact[1].replace(/\\(.)/g, '$1');
    if (escapeRe(name) === exact[1]) return name;
  }
  return `/${re}/`;
}

export function nameToRegex(text) {
  const t = text.trim();
  if (t === '*') return '.';
  return t.length > 1 && t.startsWith('/') && t.endsWith('/') ? t.slice(1, -1) : `^${escapeRe(t)}$`;
}

// Runs `fn` over `items` with at most `limit` in flight, keeping order.
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export function validateConfig(cfg) {
  const errors = [];
  if (!Array.isArray(cfg.queries)) errors.push('"queries" must be an array');
  if (cfg.checksSource && !['auto', 'checks', 'actions'].includes(cfg.checksSource)) errors.push('checksSource must be auto, checks or actions');
  for (const q of cfg.queries || []) if (!q.q?.trim()) errors.push(`search "${q.title || '(untitled)'}" has no GitHub search`);
  const repos = Object.entries(cfg.repos || {});
  if (!repos.length) errors.push('Add at least one repo: only repos that are set up are tracked.');
  for (const [repo, p] of repos) {
    const bad = (msg) => errors.push(`${repo}: ${msg}`);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) bad('not an owner/name repo');
    for (const k of PROFILE_KEYS) if (!Array.isArray(p[k])) bad(`"${k}" must be an array`);
    for (const l of p.labels || []) if (!l.name?.trim()) bad('a watched label has no name');
    for (const c of p.checks || []) {
      if (!c.match) bad(`check "${c.label || '(unnamed)'}" has no check name`);
      try {
        new RegExp(c.match);
      } catch (e) {
        bad(`check "${c.label}": bad regex (${e.message})`);
      }
    }
    for (const ex of p.extractors || []) {
      try {
        new RegExp(ex.regex);
        if (ex.alert) new RegExp(ex.alert);
      } catch (e) {
        bad(`extractor "${ex.name}": bad regex (${e.message})`);
      }
    }
    for (const a of p.actions || []) {
      if (!['addLabel', 'removeLabel', 'toggleLabel', 'markReady', 'convertToDraft', 'close'].includes(a.type)) bad(`action "${a.title}": unknown type ${a.type}`);
    }
  }
  return errors;
}
