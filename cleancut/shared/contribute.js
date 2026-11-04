// Turn local tags or settings into a contribution file, and a GitHub link that opens it as a pull request.
// GitHub's "new file" page takes ?filename= and ?value=; for someone without write access it forks the
// repo and opens a PR automatically, so contributors never need git.

import { validateSegment } from './validate.js';

const MAX_URL = 7000; // stay under what browsers and GitHub accept

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${Math.random().toString(36).slice(2, 8)}`;
};

export function titleContribution(title, localSegments) {
  const segments = localSegments
    .map((s) => validateSegment({ ...s, source: 'community' }))
    .filter((v) => v.ok)
    .map(({ segment: s }) => ({ start: s.start, end: s.end, category: s.category, severity: s.severity, ...(s.action ? { action: s.action } : {}), ...(s.note ? { note: s.note } : {}) }));
  const { platform, platformId, series, season, episode, name, duration, canonicalKey } = title;
  const json = { title: Object.fromEntries(Object.entries({ platform, platformId, series, season, episode, name, duration, canonicalKey }).filter(([, v]) => v != null && v !== '')), segments };
  return { path: `community/titles/${platform}/${stamp()}.json`, json, count: segments.length };
}

export function listContribution({ name, description, author, settings, title, canonicalKey, overrides }) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'list';
  const json = {
    name,
    ...(description ? { description } : {}),
    ...(author ? { author } : {}),
    settings,
    ...(title ? { title: { platform: title.platform, platformId: title.platformId } } : {}),
    ...(canonicalKey ? { canonicalKey } : {}),
    ...(overrides?.exclude?.length ? { overrides: { exclude: overrides.exclude } } : {}),
  };
  return { path: `community/lists/${slug}-${stamp().split('-')[1]}.json`, json };
}

/**
 * @returns {{url: string, content: string, needsPaste: boolean}}
 * needsPaste: the file is too large for a link, so the page opens empty and the caller should copy `content` to the clipboard.
 */
export function newFileLink({ repo, branch, path, json }) {
  const content = `${JSON.stringify(json, null, 2)}\n`;
  const base = `https://github.com/${repo}/new/${encodeURIComponent(branch)}?filename=${encodeURIComponent(path)}`;
  const full = `${base}&value=${encodeURIComponent(content)}`;
  return full.length <= MAX_URL ? { url: full, content, needsPaste: false } : { url: base, content, needsPaste: true };
}
