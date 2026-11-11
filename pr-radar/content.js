// On a claude.ai/code session page, pins a small badge showing the PR(s)
// that link this session and their check states. It reads only
// location.href, never claude.ai's DOM, so claude.ai UI changes can't break it.
(() => {
  const ICON = { pass: '✅', fail: '❌', pending: '⏳', neutral: '➖', cancelled: '⊘', skipped: '⤼', missing: '·' };
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .wrap { position: fixed; right: 16px; bottom: 88px; z-index: 2147483647; display: flex; flex-direction: column; gap: 4px; font: 12px/1.4 system-ui, sans-serif; }
    a { display: block; max-width: 340px; padding: 4px 10px; border-radius: 12px; background: #1f2328; color: #f0f6fc; text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,.25); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    a.needs { background: #a40e26; }
  </style><div class="wrap"></div>`;
  const wrap = root.querySelector('.wrap');
  let lastUrl = '';

  async function update() {
    const url = location.href.split(/[?#]/)[0];
    lastUrl = url;
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'match', url });
    } catch {
      return; // extension reloaded; this page's script is orphaned
    }
    wrap.replaceChildren();
    for (const r of res?.rows || []) {
      const a = document.createElement('a');
      a.href = r.url;
      a.target = '_blank';
      a.className = r.attention.length ? 'needs' : '';
      a.title = [r.title, ...r.attention].join('\n');
      const reasons = r.attention.length ? ` ⚑ ${r.attention.join(' · ')} |` : '';
      a.textContent = `#${r.number}${r.isDraft ? ' (draft)' : ''}${reasons} ${r.checks.map((c) => `${c.label} ${ICON[c.state] || ''}`).join(' · ')}`;
      wrap.append(a);
    }
    if (!host.isConnected) document.documentElement.append(host);
  }

  // claude.ai is a single-page app: watch for client-side navigation.
  setInterval(() => location.href.split(/[?#]/)[0] !== lastUrl && update(), 1500);
  chrome.storage.onChanged.addListener((c) => c.snapshot && update());
  update();
})();
