// Background service worker: reads the published community dataset (static files on GitHub Pages),
// keeps an offline cache and the viewer's own tags, and builds contribution links (GitHub pull requests).

import { validateSegment } from '../../shared/validate.js';
import { titleKey } from '../../shared/identity.js';
import { defaultProfile } from '../../shared/ratings.js';
import { CONTRIBUTE_BRANCH, CONTRIBUTE_REPO, DATA_BASE } from './config.js';
import { listContribution, newFileLink, titleContribution } from '../../shared/contribute.js';
import { emptyIndex, lookupStatic } from '../../shared/lookup.js';

const TIMEOUT_MS = 6000;
const INDEX_TTL_MS = 6 * 60 * 60 * 1000;

async function getJson(url, { allow404 = false } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
    if (res.status === 404 && allow404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'community data did not respond' : e.message);
  } finally {
    clearTimeout(timer);
  }
}

/** The dataset index: a few KB, cached for hours. A missing index means no community data has been published yet. */
async function getIndex() {
  const { dataIndex } = await chrome.storage.local.get('dataIndex');
  if (dataIndex && Date.now() - dataIndex.at < INDEX_TTL_MS) return dataIndex.data;
  try {
    const data = (await getJson(`${DATA_BASE}/index.json`, { allow404: true })) || emptyIndex();
    await chrome.storage.local.set({ dataIndex: { at: Date.now(), data } });
    return data;
  } catch (e) {
    if (dataIndex) return dataIndex.data; // stale beats nothing
    throw e;
  }
}

const titleBody = (t) => ({
  platform: t.platform,
  platformId: t.platformId,
  series: t.series,
  season: t.season,
  episode: t.episode,
  name: t.name,
  duration: t.duration,
  canonicalKey: t.canonicalKey,
});

async function getLocal(key) {
  const { localTags = {} } = await chrome.storage.local.get('localTags');
  return localTags[key]?.segments || [];
}

async function lookup(title) {
  const key = titleKey(title.platform, title.platformId);
  const local = await getLocal(key);
  let data;
  let online = false;
  let error = null;
  const { lookupCache = {} } = await chrome.storage.local.get('lookupCache');
  try {
    const index = await getIndex();
    data = await lookupStatic({ index, title, loadTitle: (f) => getJson(`${DATA_BASE}/titles/${f}`) });
    online = true;
    lookupCache[key] = { at: Date.now(), data };
    // Keep the cache bounded.
    const keys = Object.keys(lookupCache);
    if (keys.length > 200) {
      keys.sort((a, b) => lookupCache[a].at - lookupCache[b].at);
      for (const k of keys.slice(0, keys.length - 200)) delete lookupCache[k];
    }
    await chrome.storage.local.set({ lookupCache });
  } catch (e) {
    error = e.message;
    data = lookupCache[key]?.data || null;
  }
  return {
    remote: data?.segments || [],
    local,
    profiles: data?.profiles || [],
    borrowedFrom: data?.borrowedFrom || null,
    online,
    cached: !online && !!data,
    error,
  };
}

async function saveTag({ title, segment }) {
  const v = validateSegment({ ...segment, source: 'local' });
  if (!v.ok) return { error: v.error };
  const key = titleKey(title.platform, title.platformId);
  const seg = { ...v.segment, id: `local:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now() };
  const { localTags = {} } = await chrome.storage.local.get('localTags');
  const entry = localTags[key] || { title: titleBody(title), segments: [] };
  entry.title = { ...entry.title, ...titleBody(title) };
  entry.segments.push(seg);
  localTags[key] = entry;
  await chrome.storage.local.set({ localTags });
  return { segment: seg };
}

/**
 * Build the contribution file for one title's local tags and the GitHub link that turns it into a pull request.
 * The caller (popup/options) opens the link, and copies `content` first when `needsPaste` is set.
 */
async function contributeTags({ key }) {
  const { localTags = {} } = await chrome.storage.local.get('localTags');
  const entry = localTags[key];
  if (!entry?.segments.length) return { error: 'no tags for this title' };
  const c = titleContribution(entry.title, entry.segments);
  if (!c.count) return { error: 'none of the tags are valid' };
  return { ...newFileLink({ repo: CONTRIBUTE_REPO, branch: CONTRIBUTE_BRANCH, path: c.path, json: c.json }), count: c.count };
}

/** Same idea for a skip list: your rating settings become a file in the community repo. */
async function contributeList({ name, description, title, overrides }) {
  const { settings = {} } = await chrome.storage.sync.get('settings');
  const profile = { ...defaultProfile(), ...(settings.profile || {}) };
  const c = listContribution({ name, description, settings: profile, title, canonicalKey: title?.canonicalKey, overrides });
  return newFileLink({ repo: CONTRIBUTE_REPO, branch: CONTRIBUTE_BRANCH, path: c.path, json: c.json });
}

async function useList({ profile, scopeKey }) {
  const { activeLists = {} } = await chrome.storage.local.get('activeLists');
  activeLists[scopeKey] = {
    id: profile.id,
    name: profile.name,
    author: profile.author,
    settings: profile.settings,
    overrides: profile.overrides,
    scope: scopeKey === '*' ? 'everything' : 'this title',
  };
  await chrome.storage.local.set({ activeLists });
  return { ok: true };
}

async function stopList({ scopeKeys }) {
  const { activeLists = {} } = await chrome.storage.local.get('activeLists');
  for (const k of scopeKeys) delete activeLists[k];
  await chrome.storage.local.set({ activeLists });
  return { ok: true };
}

const handlers = {
  lookup: (m) => lookup(m.title),
  saveTag: (m) => saveTag(m),
  contributeTags: (m) => contributeTags(m),
  contributeList: (m) => contributeList(m),
  useList: (m) => useList(m),
  stopList: (m) => stopList(m),
  status: async (m, sender) => {
    const tabId = sender.tab?.id;
    if (tabId == null) return {};
    await chrome.action.setBadgeBackgroundColor({ tabId, color: m.enabled ? '#4f7cff' : '#777' });
    await chrome.action.setBadgeText({ tabId, text: m.enabled ? (m.count ? String(m.count) : '') : 'off' });
    return {};
  },
  inject: async (m) => {
    await chrome.scripting.executeScript({ target: { tabId: m.tabId }, files: ['content.js'] });
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = handlers[msg?.type];
  if (!handler) return false;
  Promise.resolve()
    .then(() => handler(msg, sender))
    .then(sendResponse, (e) => sendResponse({ error: e.message || String(e) }));
  return true;
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings) await chrome.storage.sync.set({ settings: { enabled: true, profile: defaultProfile() } });
  if (reason === 'install') chrome.runtime.openOptionsPage?.();
});
