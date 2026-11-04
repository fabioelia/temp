// The community dataset: reviewed JSON files in the repo → static files served from GitHub Pages.
//
//   community/titles/<platform>/*.json   { title: {platform, platformId, series?, season?, episode?, name?, duration?},
//                                          segments: [{start, end, category, severity, action?, note?}] }
//   community/lists/*.json               { name, description?, author?, settings: {preset, ...},
//                                          title?: {platform, platformId}, canonicalKey?, overrides?: {include, exclude} }
//
// buildDataset() validates every file and returns the published files as { path: object }:
//   index.json                      what exists (the extension reads only this, plus files it needs)
//   titles/<platform>/<hash>.json   merged, de-duplicated segments for one title
//
// Pure functions: no file access here, so they are unit-tested directly (see scripts/build-data.mjs for the CLI).

import { createHash } from 'node:crypto';
import { PLATFORMS, canonicalKey as makeCanonical, titleKey } from './identity.js';
import { PRESETS, resolveProfile } from './ratings.js';
import { validateSegment } from './validate.js';

export const MAX_SEGMENTS_PER_FILE = 500;
const sha = (s, n) => createHash('sha1').update(s).digest('hex').slice(0, n);
const str = (v, max) => (v == null || v === '' ? null : String(v).slice(0, max));
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export const segmentId = (key, s) => `s_${sha(`${key}|${s.start}|${s.end}|${s.category}|${s.severity}`, 8)}`;
export const titleFile = (platform, platformId) => `${platform}/${sha(platformId, 16)}.json`;

function parseTitle(t, errors, where) {
  if (!t || typeof t !== 'object') return errors.push(`${where}: "title" is required`), null;
  if (!PLATFORMS.includes(t.platform)) return errors.push(`${where}: title.platform must be one of ${PLATFORMS.join(', ')}`), null;
  const platformId = str(t.platformId, 300);
  if (!platformId) return errors.push(`${where}: title.platformId is required`), null;
  const meta = { series: str(t.series, 200), season: num(t.season), episode: num(t.episode), name: str(t.name, 200), year: num(t.year) };
  return {
    platform: t.platform,
    platformId,
    ...meta,
    duration: num(t.duration),
    canonicalKey: str(t.canonicalKey, 200) || makeCanonical(meta),
  };
}

/**
 * @param {{ titles: {path: string, json: any}[], lists: {path: string, json: any}[] }} input
 * @returns {{ files: Record<string, object>, errors: string[], stats: object }}
 */
export function buildDataset({ titles = [], lists = [] }, { now = new Date() } = {}) {
  const errors = [];
  const byTitle = new Map(); // titleKey → { title, segments: Map<id, segment> }

  for (const { path, json } of titles) {
    const title = parseTitle(json?.title, errors, path);
    if (!title) continue;
    const dir = /titles\/([^/]+)\//.exec(path.replace(/\\/g, '/'))?.[1];
    if (dir && dir !== title.platform) errors.push(`${path}: lives in titles/${dir}/ but title.platform is "${title.platform}"`);
    const list = Array.isArray(json.segments) ? json.segments : [];
    if (!list.length) errors.push(`${path}: "segments" must be a non-empty array`);
    if (list.length > MAX_SEGMENTS_PER_FILE) errors.push(`${path}: at most ${MAX_SEGMENTS_PER_FILE} segments per file`);
    const key = titleKey(title.platform, title.platformId);
    const entry = byTitle.get(key) || { title, segments: new Map() };
    // Fill any metadata an earlier file left empty.
    for (const [k, v] of Object.entries(title)) if (entry.title[k] == null && v != null) entry.title[k] = v;
    list.slice(0, MAX_SEGMENTS_PER_FILE).forEach((s, i) => {
      const v = validateSegment({ ...s, source: 'community' });
      if (!v.ok) return errors.push(`${path}: segments[${i}]: ${v.error}`);
      const seg = { ...v.segment, id: segmentId(key, v.segment) };
      entry.segments.set(seg.id, seg);
    });
    byTitle.set(key, entry);
  }

  const files = {};
  const index = { version: 1, generatedAt: now.toISOString(), titles: {}, canonical: {}, lists: [] };

  for (const [key, { title, segments }] of byTitle) {
    const sorted = [...segments.values()].sort((a, b) => a.start - b.start || a.end - b.end);
    if (!sorted.length) continue;
    const f = titleFile(title.platform, title.platformId);
    files[`titles/${f}`] = { title, segments: sorted };
    index.titles[key] = { f, canonicalKey: title.canonicalKey, segmentCount: sorted.length, title };
    if (title.canonicalKey) (index.canonical[title.canonicalKey] ||= []).push(key);
  }
  for (const keys of Object.values(index.canonical)) keys.sort((a, b) => index.titles[b].segmentCount - index.titles[a].segmentCount || (a < b ? -1 : 1));

  const seen = new Set();
  for (const { path, json } of lists) {
    const id = path.replace(/\\/g, '/').split('/').pop().replace(/\.json$/, '');
    const err = (m) => errors.push(`${path}: ${m}`);
    if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(id)) { err('file name must be lowercase letters, digits and dashes'); continue; }
    if (seen.has(id)) { err('duplicate list id'); continue; }
    seen.add(id);
    const name = str(json?.name, 80);
    if (!name || name.length < 3) { err('"name" must be 3–80 characters'); continue; }
    const settings = json.settings;
    if (!settings || typeof settings !== 'object' || (settings.preset && !PRESETS[settings.preset] && settings.preset !== 'custom')) {
      err(`"settings.preset" must be one of ${[...Object.keys(PRESETS), 'custom'].join(', ')}`);
      continue;
    }
    try { resolveProfile(settings); } catch (e) { err(`settings are not valid: ${e.message}`); continue; }
    let scopeKey = null;
    if (json.title) {
      const t = parseTitle({ ...json.title }, errors, path);
      if (!t) continue;
      scopeKey = titleKey(t.platform, t.platformId);
    }
    const ids = (v) => (Array.isArray(v) ? v.map(String).filter((s) => /^s_[0-9a-f]{8}$/.test(s)).slice(0, 2000) : []);
    index.lists.push({
      id,
      name,
      description: str(json.description, 1000) || '',
      author: str(json.author, 39) || 'community',
      settings,
      titleKey: scopeKey,
      canonicalKey: str(json.canonicalKey, 200),
      overrides: { include: ids(json.overrides?.include), exclude: ids(json.overrides?.exclude) },
      subscribers: 0,
    });
  }
  index.lists.sort((a, b) => (a.id < b.id ? -1 : 1));

  files['index.json'] = index;
  return { files, errors, stats: { titles: Object.keys(index.titles).length, segments: [...byTitle.values()].reduce((n, e) => n + e.segments.size, 0), lists: index.lists.length } };
}
