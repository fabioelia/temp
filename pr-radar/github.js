// GitHub API calls shared by the service worker and the settings page.
import { CONCLUSION, QUERY, allChecks, checksHidden, flattenContexts, logTail, mapLimit, summarizeErrors } from './lib.js';

const API = 'https://api.github.com';

// GET responses kept with their ETag. Re-asking with If-None-Match gets a 304
// when nothing changed, and GitHub doesn't count a 304 against the hourly
// limit, which is what makes polling the Actions API for every PR affordable.
// ponytail: in memory only, so a service-worker restart refetches once.
const etags = new Map();

// The REST limit as of the last response: GitHub sends it on every one.
let restLimit = null;
export const restRate = () => restLimit;

// GitHub's jobs endpoint answers 502/503/504 now and then, most often on big
// runs; a GET is safe to repeat, so it gets two more tries.
const RETRY_DELAYS = [1000, 3000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function gh(token, path, { method = 'GET', body } = {}) {
  const cached = method === 'GET' ? etags.get(path) : null;
  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(cached ? { 'If-None-Match': cached.etag } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (method !== 'GET' || ![502, 503, 504].includes(res.status) || attempt >= RETRY_DELAYS.length) break;
    await sleep(RETRY_DELAYS[attempt]);
  }
  if (res.headers.get('x-ratelimit-resource') === 'core') {
    restLimit = {
      remaining: Number(res.headers.get('x-ratelimit-remaining')),
      limit: Number(res.headers.get('x-ratelimit-limit')),
      reset: Number(res.headers.get('x-ratelimit-reset')) * 1000,
    };
  }
  if (res.status === 304 && cached) return cached.data;
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok && method === 'GET' && res.headers.get('etag')) {
    if (etags.size > 3000) etags.clear();
    etags.set(path, { etag: res.headers.get('etag'), data });
  }
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]}: ${res.status} ${data?.message || ''}`.trim());
  // GraphQL answers 200 with partial data when the token can't read some
  // fields (a fine-grained token missing a permission); only fail outright
  // when nothing came back.
  if (data?.errors?.length && !data.data) throw new Error(summarizeErrors(data.errors));
  return data;
}

export const DRAFT_MUTATIONS = {
  markReady: 'mutation($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { clientMutationId } }',
  convertToDraft: 'mutation($id: ID!) { convertPullRequestToDraft(input: {pullRequestId: $id}) { clientMutationId } }',
};

export const graphql = (token, query, variables) => gh(token, '/graphql', { method: 'POST', body: { query, variables } });

// Classic tokens report their scopes in a header; fine-grained ones don't.
export async function whoami(token) {
  const res = await fetch(`${API}/user`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token rejected: ${res.status} ${body.message || ''}`.trim());
  const scopes = res.headers.get('x-oauth-scopes');
  return {
    login: body.login,
    kind: scopes === null ? 'fine-grained' : 'classic',
    scopes: scopes || '',
    expires: res.headers.get('github-authentication-token-expiration') || '',
  };
}

// Every repo the token can see, most recently pushed first. ponytail: stops
// at 500; past that the list is for eyeballing, not completeness.
export async function listRepos(token) {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(token, `/user/repos?per_page=100&sort=pushed&page=${page}`);
    repos.push(...batch.map((r) => r.full_name));
    if (batch.length < 100) break;
  }
  return repos;
}

// Read-only probes of what the panel needs from one repo, so a missing
// permission shows up by name instead of as "Resource not accessible".
// Write access can't be probed without writing, so it isn't.
export async function diagnose(token, repo) {
  const results = [];
  const probe = async (name, need, fn) => {
    try {
      results.push({ name, ok: true, detail: await fn() });
    } catch (e) {
      results.push({ name, ok: false, detail: e.message, need });
    }
  };
  let pr = null;
  await probe('Pull requests', 'Pull requests: read', async () => {
    [pr] = await gh(token, `/repos/${repo}/pulls?state=all&per_page=1`);
    return pr ? `latest is #${pr.number}` : 'repo has no PRs, so the probes below are skipped';
  });
  if (pr) {
    const sha = pr.head.sha;
    await probe('Comments', 'Issues: read (or Pull requests: read)', async () => {
      await gh(token, `/repos/${repo}/issues/${pr.number}/comments?per_page=1`);
      return 'readable';
    });
    await probe('Commit statuses', 'Commit statuses: read', async () => {
      const s = await gh(token, `/repos/${repo}/commits/${sha}/status`);
      return `${s.total_count} on #${pr.number}`;
    });
    await probe('Check runs', "Checks: read, which fine-grained tokens can't have. Not required: the panel reads Actions jobs instead (next row)", async () => {
      const c = await gh(token, `/repos/${repo}/commits/${sha}/check-runs?per_page=1`);
      return `${c.total_count} on #${pr.number}`;
    });
    await probe('Actions jobs', 'Actions: read', async () => {
      const r = await gh(token, `/repos/${repo}/actions/runs?head_sha=${sha}&per_page=1`);
      return `${r.total_count} workflow runs on #${pr.number}`;
    });
  }
  await probe('Panel query', '', async () => {
    const { errors } = await graphql(token, QUERY, { q: `repo:${repo} is:pr`, n: 1 });
    if (errors?.length) throw new Error(summarizeErrors(errors));
    return 'every field readable';
  });
  return results;
}

// ponytail: stops at 300 labels.
export async function listLabels(token, repo) {
  const names = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await gh(token, `/repos/${repo}/labels?per_page=100&page=${page}`);
    names.push(...batch.map((l) => l.name));
    if (batch.length < 100) break;
  }
  return names;
}

export const CHECKS_QUERY = `
query Checks($id: ID!) {
  node(id: $id) {
    ... on PullRequest {
      commits(last: 1) {
        nodes {
          commit {
            statusCheckRollup {
              contexts(first: 100) {
                nodes {
                  __typename
                  ... on CheckRun {
                    name status conclusion title summary detailsUrl startedAt
                    checkSuite { workflowRun { workflow { name } } }
                    annotations(first: 5) { nodes { path message annotationLevel location { start { line } } } }
                  }
                  ... on StatusContext { context state description targetUrl createdAt }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

// The head commit's Actions jobs in the shape flattenContexts returns. Each
// Actions job is also a check run with the same name, so configured check
// names match either way. Fully skipped runs are not expanded: their jobs
// would only add skipped entries.
export async function actionsContexts(token, repo, sha) {
  if (!sha) return [];
  const { workflow_runs: runs } = await gh(token, `/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`);
  const live = runs.filter((r) => r.conclusion !== 'skipped');
  // Two at a time per PR (the poll runs four PRs at once): firing every
  // run's jobs request together is what draws GitHub's 502s.
  const perRun = await mapLimit(
    live,
    2,
    async (run) => {
      const { jobs } = await gh(token, `/repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`);
      return jobs.map((j) => {
        const failedStep = j.steps?.find((st) => st.conclusion === 'failure');
        return {
          name: j.name,
          state: j.status !== 'completed' ? 'pending' : CONCLUSION[(j.conclusion || '').toUpperCase()] || 'neutral',
          title: failedStep ? `Failed at: ${failedStep.name}` : '',
          url: j.html_url,
          at: j.started_at || '',
          summary: '',
          workflow: run.name,
          annotations: [],
        };
      });
    },
  );
  return perRun.flat();
}

export async function prChecks(token, row) {
  if (row.checksFrom !== 'actions') {
    const { data, errors } = await graphql(token, CHECKS_QUERY, { id: row.id });
    if (!data?.node) throw new Error(errors?.length ? summarizeErrors(errors) : 'PR not found');
    if (!checksHidden(data.node)) return { checks: allChecks(flattenContexts(data.node)), warning: errors?.length ? summarizeErrors(errors) : '' };
  }
  return {
    checks: allChecks(await actionsContexts(token, row.repo, row.sha)),
    warning: '',
    note: 'From the Actions API: Actions jobs only, no annotations. A classic token adds the rest.',
  };
}

// The API answers with a redirect to a signed log URL on Azure blob storage,
// which is why manifest.json lists those hosts.
export async function jobLog(token, repo, jobId) {
  const res = await fetch(`${API}/repos/${repo}/actions/jobs/${jobId}/logs`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Log unavailable: ${res.status}${res.status === 404 || res.status === 410 ? ' (expired or still running)' : ''}`);
  return logTail(await res.text());
}

// Check names seen on a repo's recent PRs, for the settings form to suggest.
// Falls back to the newest PR's Actions jobs when check runs are hidden.
export async function checkNames(token, repo) {
  const { data } = await graphql(token, QUERY, { q: `repo:${repo} is:pr sort:updated-desc`, n: 10 });
  const prs = data.search.nodes.filter(Boolean);
  let names = prs.flatMap((pr) => flattenContexts(pr).map((c) => c.name));
  if (!names.length && prs[0]?.headRefOid) names = (await actionsContexts(token, repo, prs[0].headRefOid)).map((c) => c.name);
  return [...new Set(names)].sort();
}
