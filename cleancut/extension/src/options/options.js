import { CONTRIBUTE_BRANCH, CONTRIBUTE_REPO, DATA_BASE } from '../config.js';

const $ = (id) => document.getElementById(id);
const say = (id, text, ok = true) => {
  $(id).textContent = text;
  $(id).style.color = ok ? 'var(--ok)' : 'var(--bad)';
};

async function showData() {
  const { dataIndex } = await chrome.storage.local.get('dataIndex');
  if (!dataIndex) return say('data-status', 'Not downloaded yet. It loads the first time you watch something.');
  const t = Object.keys(dataIndex.data.titles || {}).length;
  const l = (dataIndex.data.lists || []).length;
  say('data-status', `${t} title${t === 1 ? '' : 's'} and ${l} skip list${l === 1 ? '' : 's'} available. Checked ${new Date(dataIndex.at).toLocaleString()}.`);
}

$('refresh').addEventListener('click', async () => {
  await chrome.storage.local.remove(['dataIndex', 'lookupCache']);
  try {
    const res = await fetch(`${DATA_BASE}/index.json`, { cache: 'no-cache', credentials: 'omit' });
    if (res.status === 404) await chrome.storage.local.set({ dataIndex: { at: Date.now(), data: { version: 1, titles: {}, canonical: {}, lists: [] } } });
    else if (!res.ok) throw new Error(`HTTP ${res.status}`);
    else await chrome.storage.local.set({ dataIndex: { at: Date.now(), data: await res.json() } });
    showData();
  } catch (e) {
    say('data-status', `Could not reach the community data (${e.message}). Your own tags and the subtitle scan still work.`, false);
  }
});

$('repo-open').addEventListener('click', () => chrome.tabs.create({ url: `https://github.com/${CONTRIBUTE_REPO}/tree/${CONTRIBUTE_BRANCH}/cleancut/community` }));

async function renderTags() {
  const { localTags = {} } = await chrome.storage.local.get('localTags');
  const entries = Object.entries(localTags).filter(([, e]) => e.segments.length);
  const total = entries.reduce((n, [, e]) => n + e.segments.length, 0);
  $('tag-count').textContent = `${total} tag${total === 1 ? '' : 's'} across ${entries.length} title${entries.length === 1 ? '' : 's'}.`;
  const ul = $('tag-titles');
  ul.replaceChildren();
  for (const [key, entry] of entries) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    const t = entry.title;
    label.textContent = `${t.series ? `${t.series}${t.season != null ? ` S${t.season}:E${t.episode}` : ''}` : t.name || key} — ${entry.segments.length} tag${entry.segments.length === 1 ? '' : 's'}`;
    const btn = document.createElement('button');
    btn.textContent = 'Submit on GitHub…';
    btn.addEventListener('click', async () => {
      const res = await chrome.runtime.sendMessage({ type: 'contributeTags', key });
      if (res?.error) return say('tag-status', res.error, false);
      if (res.needsPaste) await navigator.clipboard.writeText(res.content).catch(() => {});
      chrome.tabs.create({ url: res.url });
      say('tag-status', res.needsPaste ? 'Too long for a link, so the file is on your clipboard: paste it into the GitHub page.' : 'Opened GitHub. Review the file and choose "Propose new file".');
    });
    li.append(label, btn);
    ul.append(li);
  }
}

$('export').addEventListener('click', async () => {
  const { localTags = {} } = await chrome.storage.local.get('localTags');
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), localTags }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cleancut-tags.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('import-btn').addEventListener('click', () => $('import').click());
$('import').addEventListener('change', async (e) => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    if (!data.localTags || typeof data.localTags !== 'object') throw new Error('not a CleanCut export');
    const { localTags = {} } = await chrome.storage.local.get('localTags');
    let added = 0;
    for (const [key, entry] of Object.entries(data.localTags)) {
      const cur = localTags[key] || { title: entry.title, segments: [] };
      const seen = new Set(cur.segments.map((s) => s.id));
      for (const s of entry.segments || []) if (!seen.has(s.id)) (cur.segments.push(s), added++);
      localTags[key] = cur;
    }
    await chrome.storage.local.set({ localTags });
    say('tag-status', `Imported ${added} tag${added === 1 ? '' : 's'}.`);
    renderTags();
  } catch (err) {
    say('tag-status', `Import failed: ${err.message}`, false);
  }
});

$('clear-cache').addEventListener('click', async () => {
  await chrome.storage.local.remove('lookupCache');
  say('tag-status', 'Cache cleared.');
});

showData();
renderTags();
