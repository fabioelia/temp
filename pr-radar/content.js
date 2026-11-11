// On a claude.ai/code session page, pins a small badge showing the PR(s)
// that link this session and their check states. It reads only
// location.href, never claude.ai's DOM, so claude.ai UI changes can't break it.
// Drag it anywhere; the spot is remembered across pages.
(() => {
  const COLOR = { pass: '#3fb950', fail: '#ff6b6b', cancelled: '#ff6b6b', pending: '#e5a23b', neutral: '#8b949e', skipped: '#8b949e' };
  const MARGIN = 8;
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .wrap { position: fixed; z-index: 2147483647; display: flex; flex-direction: column; gap: 4px; font: 500 12px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; touch-action: none; }
    .badge { user-select: none; display: flex; align-items: center; gap: 8px; max-width: 420px; padding: 5px 12px 5px 6px; border-radius: 999px; background: rgba(22, 27, 34, 0.94); color: #e6edf3; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); backdrop-filter: blur(6px); }
    .badge.needs { background: rgba(130, 20, 32, 0.95); }
    .grip { cursor: grab; color: #8b949e; padding: 2px 3px; letter-spacing: -2px; user-select: none; }
    .wrap.dragging .grip, .wrap.dragging .badge { cursor: grabbing; }
    a { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 8px; min-width: 0; }
    a:hover .num { text-decoration: underline; }
    .num { font-weight: 700; }
    .reason { color: #ffb4b4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .checks { display: flex; gap: 7px; white-space: nowrap; overflow: hidden; }
    .check { display: inline-flex; align-items: center; gap: 4px; color: #c9d1d9; }
    .dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  </style><div class="wrap"></div>`;
  const wrap = root.querySelector('.wrap');
  let pos = { right: 16, bottom: 88 };
  let lastUrl = '';

  const place = () => {
    const w = wrap.offsetWidth || 200;
    const h = wrap.offsetHeight || 30;
    pos.right = Math.min(Math.max(MARGIN, pos.right), Math.max(MARGIN, innerWidth - w - MARGIN));
    pos.bottom = Math.min(Math.max(MARGIN, pos.bottom), Math.max(MARGIN, innerHeight - h - MARGIN));
    wrap.style.right = `${pos.right}px`;
    wrap.style.bottom = `${pos.bottom}px`;
  };

  // A press that moves more than a few pixels is a drag, and the click it
  // ends in must not open the link.
  let drag = null;
  let dragged = false;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom };
    dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!dragged && Math.hypot(dx, dy) < 4) return;
    dragged = true;
    wrap.classList.add('dragging');
    pos = { right: drag.right - dx, bottom: drag.bottom - dy };
    place();
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    wrap.classList.remove('dragging');
    if (dragged) chrome.storage.local.set({ badgePosition: pos }).catch(() => {});
  });
  addEventListener('resize', place);
  wrap.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (dragged) {
      e.preventDefault();
      dragged = false;
      return;
    }
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'open', url: a.href }).catch(() => open(a.href, '_blank'));
  });

  const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text ? { textContent: text } : {});

  function badge(r) {
    const row = el('div', `badge${r.attention.length ? ' needs' : ''}`);
    row.append(el('span', 'grip', '⋮⋮'));
    const a = el('a');
    a.href = r.url;
    a.draggable = false;
    a.title = [r.title, ...r.attention].join('\n');
    a.append(el('span', 'num', `#${r.number}${r.isDraft ? ' draft' : ''}`));
    if (r.attention.length) a.append(el('span', 'reason', r.attention.join(' · ')));
    const checks = el('span', 'checks');
    for (const c of r.checks.filter((c) => c.state !== 'missing')) {
      const item = el('span', 'check');
      const dot = el('span', 'dot');
      dot.style.background = COLOR[c.state] || COLOR.neutral;
      item.append(dot, c.label);
      checks.append(item);
    }
    a.append(checks);
    row.append(a);
    return row;
  }

  async function update() {
    const url = location.href.split(/[?#]/)[0];
    lastUrl = url;
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'match', url });
    } catch {
      return; // extension reloaded; this page's script is orphaned
    }
    wrap.replaceChildren(...(res?.rows || []).map(badge));
    if (!host.isConnected) document.documentElement.append(host);
    place();
  }

  // claude.ai is a single-page app: watch for client-side navigation.
  setInterval(() => location.href.split(/[?#]/)[0] !== lastUrl && update(), 1500);
  chrome.storage.onChanged.addListener((c) => {
    if (c.snapshot) update();
    if (c.badgePosition?.newValue && !drag) {
      pos = c.badgePosition.newValue;
      place();
    }
  });
  chrome.storage.local
    .get('badgePosition')
    .then(({ badgePosition }) => badgePosition && (pos = badgePosition))
    .catch(() => {})
    .finally(update);
})();
