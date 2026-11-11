import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CONFIG as cfg, actionButton, diff, normalize, rowsForUrl, summarizeErrors, validateConfig } from '../lib.js';

const run = (name, status, conclusion, startedAt, extra = {}) => ({
  __typename: 'CheckRun',
  name,
  status,
  conclusion,
  title: '',
  detailsUrl: `https://github.com/o/r/actions/runs/1/job/${startedAt.replace(/\D/g, '')}`,
  startedAt,
  ...extra,
});

function pr(overrides = {}) {
  return {
    id: 'PR_1',
    number: 4977,
    title: 'fix(mdx): stop agent-authored MDX from running script',
    url: 'https://github.com/Newton-Research-Inc/newton/pull/4977',
    isDraft: false,
    state: 'OPEN',
    mergeable: 'MERGEABLE',
    reviewDecision: null,
    updatedAt: '2026-11-11T18:27:00Z',
    author: { login: 'the-newton-bot' },
    repository: { nameWithOwner: 'Newton-Research-Inc/newton' },
    body: [
      '## Agent session',
      'https://claude.ai/code/session_01AbCdEf',
      '<!-- pr-preview:start -->',
      '### Preview deployed',
      '',
      ':link: https://pr-4977.preview.newtonresearch.ai',
      '<!-- pr-preview-mcp-token: nmcp_SECRET -->',
      '<!-- pr-preview:end -->',
    ].join('\n'),
    labels: { nodes: [{ name: 'QA Reviewed - Failed', color: 'd73a4a' }, { name: 'jira-ticket', color: 'ccc' }] },
    comments: {
      nodes: [
        { body: 'pushed a fix, see https://claude.ai/code/session_01AbCdEf and https://claude.ai/code/session_02XyZ', url: 'c1' },
        {
          body: '<!-- qa-tester:results -->\r\n> [!CAUTION]\r\n> **🐞 1 defect in 7 checks.** Step 7 fails on QA-1.\r\n> develop · head a09439d',
          url: 'c2',
        },
      ],
    },
    reviews: { nodes: [] },
    commits: {
      nodes: [
        {
          commit: {
            statusCheckRollup: {
              contexts: {
                nodes: [
                  run('CI Success', 'COMPLETED', 'FAILURE', '2026-11-11T18:11:27Z'),
                  run('qa-test', 'COMPLETED', 'SUCCESS', '2026-11-11T18:00:21Z'),
                  // A newer skipped re-trigger of the same job must not mask the real result.
                  run('qa-test', 'COMPLETED', 'SKIPPED', '2026-11-11T18:30:00Z'),
                  run('preview / Build, deploy, comment', 'IN_PROGRESS', null, '2026-11-11T17:46:34Z'),
                  run('review/gate', 'COMPLETED', 'NEUTRAL', '2026-11-11T17:46:15Z', { title: '🔴 ⛔ Not recommended' }),
                ],
              },
            },
          },
        },
      ],
    },
    ...overrides,
  };
}

test('normalize maps checks, labels and extracted values', () => {
  const row = normalize(pr(), cfg);
  const byLabel = Object.fromEntries(row.checks.map((c) => [c.label, c]));
  assert.equal(byLabel.CI.state, 'fail');
  assert.equal(byLabel.Preview.state, 'pending');
  assert.equal(byLabel.E2E.state, 'missing');
  assert.equal(byLabel['QA run'].state, 'pass');
  assert.equal(byLabel['AI gate'].title, '🔴 ⛔ Not recommended');
  assert.deepEqual(row.labels.map((l) => l.name), ['QA Reviewed - Failed']);
  assert.deepEqual(row.allLabels, ['QA Reviewed - Failed', 'jira-ticket']);
  assert.deepEqual(row.extracted.Sessions, ['https://claude.ai/code/session_01AbCdEf', 'https://claude.ai/code/session_02XyZ']);
  assert.deepEqual(row.extracted.Preview, ['https://pr-4977.preview.newtonresearch.ai']);
  assert.deepEqual(row.extracted['QA verdict'], ['🐞 1 defect in 7 checks.']);
  assert.ok(!JSON.stringify(row).includes('nmcp_SECRET'), 'raw body must not be stored');
});

test('attention collects every reason', () => {
  const row = normalize(pr({ mergeable: 'CONFLICTING', reviewDecision: 'CHANGES_REQUESTED' }), cfg);
  assert.deepEqual(row.attention, ['QA Reviewed - Failed', 'CI failed', 'AI gate: 🔴 ⛔ Not recommended', 'Changes requested', 'Merge conflict']);
  const clean = normalize(pr({ labels: { nodes: [] }, commits: { nodes: [] } }), cfg);
  assert.deepEqual(clean.attention, []);
});

test('diff is silent on first load and reports configured changes after', () => {
  const before = normalize(pr({ labels: { nodes: [] }, isDraft: true, comments: { nodes: [] } }), cfg);
  const after = normalize(pr(), cfg);
  assert.deepEqual(diff([], [after], cfg), []);
  assert.deepEqual(diff(undefined, [after], cfg), []);
  const [e] = diff([before], [after], cfg);
  assert.equal(e.url, after.url);
  assert.match(e.message, /Label: QA Reviewed - Failed/);
  assert.match(e.message, /QA verdict: 🐞 1 defect in 7 checks\./);
  assert.match(e.message, /Marked ready for review/);
  assert.equal(diff([after], [after], cfg).length, 0);
});

test('diff reports check transitions and PRs leaving the list', () => {
  const pending = normalize(pr({ commits: { nodes: [{ commit: { statusCheckRollup: { contexts: { nodes: [run('CI Success', 'IN_PROGRESS', null, '2026-11-11T18:00:00Z')] } } } }] } }), cfg);
  const failed = normalize(pr(), cfg);
  const [e] = diff([pending], [failed], cfg);
  assert.match(e.message, /CI failed/);
  assert.match(e.message, /AI gate finished: 🔴 ⛔ Not recommended/);
  const other = normalize(pr({ number: 1, url: 'https://github.com/Newton-Research-Inc/newton/pull/1' }), cfg);
  const events = diff([failed, other], [failed], cfg);
  assert.deepEqual(events.map((x) => x.message), ['Left your list (merged or closed?)']);
});

test('rowsForUrl matches PR pages and linked sessions, not prefixes of other numbers', () => {
  const row = normalize(pr(), cfg);
  const short = normalize(pr({ number: 49, url: 'https://github.com/Newton-Research-Inc/newton/pull/49', body: '', comments: { nodes: [] } }), cfg);
  const rows = [row, short];
  const keys = (u) => rowsForUrl(rows, u, cfg).map((r) => r.number);
  assert.deepEqual(keys('https://github.com/Newton-Research-Inc/newton/pull/4977/files'), [4977]);
  assert.deepEqual(keys('https://github.com/Newton-Research-Inc/newton/pull/49'), [49]);
  assert.deepEqual(keys('https://claude.ai/code/session_02XyZ'), [4977]);
  assert.deepEqual(keys('https://claude.ai/code/session_02XyZextra'), []);
  assert.deepEqual(keys(''), []);
});

test('validateConfig rejects bad regexes and unknown actions', () => {
  assert.deepEqual(validateConfig(cfg), []);
  const bad = { ...cfg, checks: [{ label: 'x', match: '(' }], actions: [{ title: 'y', type: 'merge' }] };
  const errors = validateConfig(bad);
  assert.equal(errors.length, 2);
});

test('summarizeErrors collapses per-PR errors into one line per field', () => {
  const msg = 'Resource not accessible by personal access token';
  const errors = [0, 1, 2].flatMap((i) => [
    { message: msg, path: ['search', 'nodes', i, 'commits', 'nodes', 0, 'commit', 'statusCheckRollup'] },
    { message: msg, path: ['search', 'nodes', i, 'comments'] },
  ]);
  const lines = summarizeErrors(errors).split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^Can't read statusCheckRollup on 3 PRs \(checks: .*classic token.*\): Resource not accessible/);
  assert.match(lines[1], /^Can't read comments on 3 PRs \(needs Issues \+ Pull requests read\)/);
  assert.equal(summarizeErrors([{ message: 'Bad credentials' }]), "Can't read query on 1 PR: Bad credentials");
  assert.match(summarizeErrors([{ message: 'x', path: ['search', 'nodes', 0, 'commits'] }]), /Can't read commits on 1 PR \(needs Contents: read/);
});

test('QA verdict records the run linked from the same comment, footer last', () => {
  const body = '<!-- qa-tester:results -->\n> [!TIP]\n> **✅ 5 checks pass.**\nsee https://github.com/o/r/actions/runs/111 for the old run\n_[workflow run](https://github.com/o/r/actions/runs/222) · 2026-11-11_';
  const row = normalize(pr({ comments: { nodes: [{ body, url: 'c' }] } }), cfg);
  assert.deepEqual(row.extracted['QA verdict'], ['✅ 5 checks pass.']);
  assert.equal(row.artifactRuns['QA verdict'], '222');
  assert.equal(row.artifactRuns.Sessions, undefined, 'only extractors with `artifacts` record a run');
});

test('actionButton maps label actions to one setLabels write and hides no-ops', () => {
  const on = (l) => l === 'skip-qa';
  const off = () => false;
  const toggle = { title: 'skip-qa', type: 'toggleLabel', label: 'skip-qa' };
  assert.deepEqual(actionButton(toggle, off), { title: '+ skip-qa', action: { type: 'setLabels', add: ['skip-qa'] } });
  assert.deepEqual(actionButton(toggle, on), { title: '− skip-qa', action: { type: 'setLabels', remove: ['skip-qa'] } });
  assert.equal(actionButton({ title: 'x', type: 'addLabel', label: 'skip-qa' }, on), null);
  assert.equal(actionButton({ title: 'x', type: 'removeLabel', label: 'skip-qa' }, off), null);
  const close = { title: 'Close', type: 'close' };
  assert.deepEqual(actionButton(close, off), { title: 'Close', action: close });
});
