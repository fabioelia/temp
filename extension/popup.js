const $ = (id) => document.getElementById(id);
const send = (msg) => new Promise((res, rej) => chrome.runtime.sendMessage({ target: 'background', ...msg }, (r) => (r?.error ? rej(new Error(r.error)) : res(r?.result))));
const status = (t, cls = '') => { $('status').textContent = t; $('status').className = 'hint ' + cls; };
let tab, videos = [], net = [], timer = null;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function fillTracks() {
  const v = videos[Number($('video').value)];
  $('track').replaceChildren(new Option('No captions', ''),
    ...(v?.tracks || []).map((t) => new Option(`Track: ${t.label || t.language || 'Track ' + (t.index + 1)} (${t.kind})`, `t:${t.index}`)),
    ...net.map((g, i) => new Option(`Network: ${g.label} (${g.files} file${g.files === 1 ? '' : 's'})`, `n:${i}`)));
  const pick = (v?.tracks || []).find((t) => t.kind === 'subtitles' || t.kind === 'captions');
  if (pick) $('track').value = `t:${pick.index}`; else if (net.length) $('track').value = 'n:0';
  $('signoff').hidden = !(DEV && v?.protected);
  $('start').disabled = !v || (v.protected && !(DEV && signedOff())) || !!timer;
  const anyProt = videos.some((x) => x.protected);
  $('saveAll').hidden = !net.length;
  $('saveAll').disabled = anyProt && !(DEV && signedOff());
  if (anyProt && DEV) $('signoff').hidden = false;
  if (v?.protected && !DEV) status('This player uses DRM, so it is not recorded. Export the audio from your source files instead; the Voice Lab imports them with your captions.', 'err');
}
async function init() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const cur = await send({ type: 'status' });
  if (cur && cur.tabId === tab.id) { recording(cur.recStart); }
  let lastScan;
  try { lastScan = await send({ type: 'scan', tabId: tab.id }); ({ videos, net } = lastScan); } catch (e) { status(e.message, 'err'); return; }
  window.__lastScan = lastScan;
  if (net.length) status(`Found ${net.length} caption stream${net.length === 1 ? '' : 's'} loaded over the network. More segments are picked up while you record.`);
  if (!videos.length) {
    $('start').disabled = true;
    if (lastScan.blocked.length) {
      status(`No video in the parts of the page I can read. The player is probably inside a frame from ${lastScan.blocked.join(', ')}.`, 'err');
      const b = document.createElement('button'); b.textContent = `Allow access to ${lastScan.blocked.length === 1 ? lastScan.blocked[0].replace(/^https?:\/\//, '') : 'these sites'}`;
      b.style.marginTop = '8px';
      b.onclick = async () => {
        const ok = await chrome.permissions.request({ origins: lastScan.blocked.map((o) => o + '/*') });
        if (ok) { b.remove(); init(); } else status('Access was not granted.', 'err');
      };
      $('status').after(b);
    } else status(`No video found (scanned ${lastScan.frames} frame${lastScan.frames === 1 ? '' : 's'}). If the player draws video on a canvas or plays only audio, it can't be captured yet.`, 'err');
    return;
  }
  status(`Found ${videos.length} video${videos.length === 1 ? '' : 's'}${net.length ? ` and ${net.length} network caption stream${net.length === 1 ? '' : 's'}` : ''} in ${lastScan.frames} frame${lastScan.frames === 1 ? '' : 's'}.`);
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
    const sel = $('track').value, g = sel.startsWith('n:') ? net[Number(sel.slice(2))] : null;
    await send({ type: 'start', tabId: tab.id, frameId: v.frameId, videoIndex: v.index, trackIndex: sel.startsWith('t:') ? Number(sel.slice(2)) : null, net: g ? { frameId: g.frameId, key: g.key } : null, signoff: v.protected ? signoff() : null });
    recording(Date.now());
  } catch (e) { status(e.message, 'err'); }
});
$('saveAll').addEventListener('click', async () => {
  try {
    const r = await send({ type: 'saveAll', tabId: tab.id, signoff: videos.some((x) => x.protected) ? signoff() : null });
    status(`Saved ${r.tracks} caption track${r.tracks === 1 ? '' : 's'} (${r.cues} lines) to Downloads/${r.folder}/`, 'ok');
  } catch (e) { status(e.message, 'err'); }
});
$('stop').addEventListener('click', async () => {
  clearInterval(timer); timer = null; $('stop').disabled = true;
  try { const r = await send({ type: 'stop' }); status(`Saved ${fmt(r.seconds)} of audio and ${r.cues} caption lines to Downloads/${r.file}.*`, 'ok'); }
  catch (e) { status(e.message, 'err'); }
  fillTracks();
});
const DEV = !!DUB_CAPTURE_CONFIG.devBuild;
const signoff = () => ({ name: $('soName').value, reference: $('soRef').value, confirmed: $('soOk').checked });
const signedOff = () => { const s = signoff(); return s.confirmed && s.name.trim() && s.reference.trim(); };
chrome.storage.local.get('soName').then(({ soName }) => { if (soName) $('soName').value = soName; });
for (const id of ['soName', 'soRef', 'soOk']) $(id).addEventListener(id === 'soOk' ? 'change' : 'input', () => { chrome.storage.local.set({ soName: $('soName').value }); fillTracks(); });
init();
