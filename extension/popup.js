const $ = (id) => document.getElementById(id);
const send = (msg) => new Promise((res, rej) => chrome.runtime.sendMessage({ target: 'background', ...msg }, (r) => (r?.error ? rej(new Error(r.error)) : res(r?.result))));
const status = (t, cls = '') => { $('status').textContent = t; $('status').className = 'hint ' + cls; };
let tab, videos = [], timer = null;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function fillTracks() {
  const v = videos[Number($('video').value)];
  $('track').replaceChildren(new Option('No captions', ''), ...(v?.tracks || []).map((t) => new Option(`${t.label || t.language || 'Track ' + (t.index + 1)} (${t.kind})`, String(t.index))));
  const pick = (v?.tracks || []).find((t) => t.kind === 'subtitles' || t.kind === 'captions'); if (pick) $('track').value = String(pick.index);
  $('start').disabled = !v || v.protected || !!timer;
  if (v?.protected) status('This video is DRM-protected, so it will not be recorded.', 'err');
}
async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const cur = await send({ type: 'status' });
  if (cur && cur.tabId === tab.id) { recording(cur.recStart); }
  try { videos = await send({ type: 'scan', tabId: tab.id }); } catch (e) { status(e.message, 'err'); return; }
  if (!videos.length) { status('No video found on this page.', 'err'); $('start').disabled = true; return; }
  $('video').replaceChildren(...videos.map((v, i) => new Option(`Video ${i + 1}${v.duration ? ' · ' + fmt(v.duration) : ''}${v.width ? ` · ${v.width}×${v.height}` : ''}${v.protected ? ' · protected' : ''}`, String(i))));
  fillTracks();
}
function recording(since) {
  $('start').disabled = true; $('stop').disabled = false;
  timer = setInterval(() => status(`Recording… ${fmt((Date.now() - since) / 1000)}`), 500);
}
$('video').addEventListener('change', fillTracks);
$('start').addEventListener('click', async () => {
  const v = videos[Number($('video').value)];
  try {
    await send({ type: 'start', tabId: tab.id, frameId: v.frameId, videoIndex: v.index, trackIndex: $('track').value === '' ? null : Number($('track').value) });
    recording(Date.now());
  } catch (e) { status(e.message, 'err'); }
});
$('stop').addEventListener('click', async () => {
  clearInterval(timer); timer = null; $('stop').disabled = true;
  try { const r = await send({ type: 'stop' }); status(`Saved ${fmt(r.seconds)} of audio and ${r.cues} caption lines to Downloads/${r.file}.*`, 'ok'); }
  catch (e) { status(e.message, 'err'); }
  fillTracks();
});
init();
