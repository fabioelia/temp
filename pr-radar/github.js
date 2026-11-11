// GitHub API calls shared by the service worker and the settings page.
import { QUERY, summarizeErrors } from './lib.js';

const API = 'https://api.github.com';

export async function gh(token, path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
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
    await probe('Check runs', 'Checks: read. Fine-grained tokens may not offer it; use a classic token with repo', async () => {
      const c = await gh(token, `/repos/${repo}/commits/${sha}/check-runs?per_page=1`);
      return `${c.total_count} on #${pr.number}`;
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
