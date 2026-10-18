// The Mentor's side of the line: a salvaged protocol manual (tabbed paper pages)
// beside the Halcyon's status panel. The status panel is flavour with a purpose —
// it makes the shared clock and every mistake felt without carrying puzzle data.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createMentorShell(root, { audio, solo = false }) {
  root.innerHTML = `
    <div class="manual">
      <div class="manual-tabs" role="tablist" aria-label="Protocol pages"></div>
      <div class="paper" role="tabpanel"></div>
    </div>
    <aside class="ship" aria-label="Halcyon status">
      <div class="card">
        <h4>HALCYON // STATUS</h4>
        <div class="meter" data-m="hull"><div class="row"><span>HULL</span><b>100%</b></div><div class="bar"><i style="width:100%"></i></div></div>
        <div class="meter" data-m="power"><div class="row"><span>REACTOR</span><b>100%</b></div><div class="bar"><i style="width:100%"></i></div></div>
        <div class="meter" data-m="trace"><div class="row"><span>AGENT TRACE</span><b>0%</b></div><div class="bar"><i style="width:0%"></i></div></div>
      </div>
      <div class="card">
        <h4>UPLINK</h4>
        <div class="row" style="display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;letter-spacing:.14em">
          <span data-m="sigtext">SIGNAL STRONG</span><div class="sigbars"><i style="height:6px"></i><i style="height:10px"></i><i style="height:14px"></i><i style="height:18px"></i><i style="height:22px"></i></div>
        </div>
      </div>
      <div class="card logcard"><h4>SHIP LOG</h4><div class="log" data-m="log"></div></div>
    </aside>`;

  const tabsEl = root.querySelector('.manual-tabs');
  const paper = root.querySelector('.paper');
  const q = (m) => root.querySelector(`[data-m="${m}"]`);
  const t0 = performance.now();
  let pages = [];
  let active = null;
  let lastBars = -1;

  // a scratch pad that lives for the whole room: the deeper rooms need somewhere to jot things down
  const notesEl = document.createElement('div');
  notesEl.innerHTML = `
    <div class="folio"><span>RED PILL PROTOCOL</span><span>margin</span></div>
    <h2>Notes</h2>
    <p>Your own scribbles. Nobody else sees this page.</p>
    <textarea class="notes" spellcheck="false" placeholder="Write down what the Operator tells you — clues, numbers, sequences…"></textarea>`;

  // a lone player is the Operator *and* the reader: say so at the top of every page
  const soloBanner = () => {
    const el = document.createElement('p');
    el.className = 'solo-banner';
    el.innerHTML = '<b>SOLO RUN</b> — wherever these pages say <i>"the Operator"</i>, that is you. Look at the room, read here, then act. <kbd>M</kbd> closes the manual.';
    return el;
  };

  function renderTabs() {
    tabsEl.innerHTML = '';
    for (const p of pages) {
      const b = document.createElement('button');
      b.textContent = p.title;
      b.setAttribute('role', 'tab');
      b.className = p.id === active ? 'on' : '';
      b.onclick = () => select(p.id, true);
      tabsEl.appendChild(b);
    }
  }

  function select(id, sound = false) {
    const page = pages.find((p) => p.id === id) ?? pages[0];
    if (!page) return;
    if (sound && page.id !== active) audio.pageFlip();
    active = page.id;
    paper.replaceChildren(...(solo ? [soloBanner(), page.el] : [page.el]));
    paper.scrollTop = 0;
    renderTabs();
  }

  function meter(name, pct, label) {
    const el = q(name);
    el.querySelector('b').textContent = label ?? `${Math.round(pct)}%`;
    el.querySelector('i').style.width = `${clamp(pct, 0, 100)}%`;
    el.classList.toggle('warn', pct < 55 && name !== 'trace');
    el.classList.toggle('crit', pct < 28 && name !== 'trace');
    if (name === 'trace') {
      el.classList.toggle('warn', pct > 45);
      el.classList.toggle('crit', pct > 75);
    }
  }

  return {
    paper,

    /** pages: [{ id, title, el }]. Keeps the open tab if its id still exists. */
    setPages(next) {
      pages = [...next, { id: 'notes', title: 'NOTES', el: notesEl }];
      select(pages.some((p) => p.id === active) ? active : pages[0]?.id);
    },

    select,

    setStatus({ strikes = 0, frac = 1, running = true }) {
      meter('hull', 100 - strikes * 14);
      meter('power', 28 + frac * 72);
      meter('trace', (1 - frac) * 100);
      const quality = clamp(0.3 + frac * 0.7 - strikes * 0.05, 0, 1);
      const bars = Math.max(1, Math.round(quality * 5 + (running ? Math.sin(performance.now() / 700) * 0.4 : -1)));
      if (bars !== lastBars) {
        lastBars = bars;
        root.querySelectorAll('.sigbars i').forEach((el, i) => el.classList.toggle('on', i < bars));
        q('sigtext').textContent = !running ? 'SIGNAL LOST' : bars >= 4 ? 'SIGNAL STRONG' : bars >= 2 ? 'SIGNAL THIN' : 'SIGNAL FAILING';
      }
    },

    log(text, bad = false) {
      const el = q('log');
      const s = Math.floor((performance.now() - t0) / 1000);
      const p = document.createElement('p');
      if (bad) p.className = 'bad';
      p.textContent = `[${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}] ${text}`;
      el.prepend(p);
      while (el.children.length > 7) el.lastChild.remove();
    },

    dispose() {
      root.innerHTML = '';
    },
  };
}

/** Small helper for building DOM with classes + innerHTML. */
export function h(tag, cls = '', html = '') {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
}
