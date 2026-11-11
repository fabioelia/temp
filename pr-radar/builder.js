// The settings form: one editable list per config section, generated from
// SECTIONS. It edits a plain config object and calls onChange after every
// edit; options.js keeps the JSON tab in step.
import { h } from './dom.js';
import { DEFAULT_CONFIG as D, nameToRegex, regexToName } from './lib.js';

const byTitle = (items, key) => items.map((it) => [it[key], it]);

export const SECTIONS = [
  {
    key: 'queries',
    title: 'Searches',
    help: 'Each search is one section of the panel, in GitHub search syntax. @me means you.',
    fields: [
      { k: 'title', label: 'Section name', ph: 'My PRs' },
      { k: 'q', label: 'GitHub search', ph: 'is:pr is:open author:@me', wide: true },
    ],
    presets: [
      ...byTitle(D.queries, 'title'),
      ['PRs I’m involved in', { title: 'Involved', q: 'is:pr is:open involves:@me archived:false' }],
      ['Bot PRs in a repo', { title: 'Bot PRs', q: 'is:pr is:open repo:OWNER/REPO author:app/the-newton-bot' }],
      ['Everything open in a repo', { title: 'Repo', q: 'is:pr is:open repo:OWNER/REPO' }],
    ],
  },
  {
    key: 'labels',
    title: 'Labels to watch',
    help: 'Cards show these labels. "Needs me" labels flag the PR and count on the toolbar badge.',
    fields: [
      { k: 'name', label: 'Label', list: 'dl-labels' },
      { k: 'kind', label: 'Means', type: 'select', options: [['alert', 'Needs me'], ['ok', 'Good'], ['pending', 'In progress'], ['info', 'Info']] },
      { k: 'notify', label: 'Notify when added', type: 'checkbox' },
    ],
    presets: byTitle(D.labels, 'name'),
    blank: { name: '', kind: 'info' },
  },
  {
    key: 'checks',
    title: 'Checks to show',
    help: 'Type a check name exactly as GitHub shows it (load suggestions above), or /a pattern/.',
    fields: [
      { k: 'label', label: 'Short name', ph: 'CI' },
      { k: 'match', label: 'Check name', list: 'dl-checks', wide: true, toUi: regexToName, fromUi: nameToRegex },
      { k: 'notify', label: 'Notify when it finishes', type: 'checkbox' },
      { k: 'showTitle', label: 'Show its result text', type: 'checkbox' },
      { k: 'alertTitle', label: 'Needs me if the text matches', ph: 'Not recommended', optional: true, showIf: (r) => r.showTitle },
    ],
    presets: byTitle(D.checks, 'label'),
    blank: { label: '', match: '' },
  },
  {
    key: 'extractors',
    title: 'Pull out of PR text',
    help: 'Finds links or text in the PR description and comments, using a regex. Start from a preset.',
    fields: [
      { k: 'name', label: 'Name' },
      { k: 'source', label: 'Look in', type: 'select', options: [['all', 'Description + comments'], ['body', 'Description'], ['comments', 'Comments']] },
      { k: 'regex', label: 'Pattern (regex; group 1 is kept)', wide: true },
      { k: 'contains', label: 'Only in texts containing', optional: true },
      { k: 'kind', label: 'Show as', type: 'select', options: [['link', 'Link'], ['text', 'Text']] },
      { k: 'all', label: 'Every match', type: 'checkbox' },
      { k: 'notify', label: 'Notify on change', type: 'checkbox' },
      { k: 'artifacts', label: 'Click downloads artifacts named', ph: '^qa-screenshots', optional: true },
    ],
    presets: [
      ...byTitle(D.extractors, 'name'),
      ['Jira keys', { name: 'Jira', source: 'body', regex: '\\[([A-Z][A-Z0-9]+-\\d+)\\]', all: true, kind: 'text' }],
      ['Links to a site…', 'site'],
    ],
    blank: { name: '', source: 'all', regex: '', kind: 'text' },
  },
  {
    key: 'actions',
    title: 'Buttons',
    help: 'Buttons on each card. Every one asks for a second click before it writes to GitHub.',
    fields: [
      { k: 'title', label: 'Button text' },
      {
        k: 'type',
        label: 'Does',
        type: 'select',
        options: [['toggleLabel', 'Toggle a label'], ['addLabel', 'Add a label'], ['removeLabel', 'Remove a label'], ['markReady', 'Mark ready'], ['convertToDraft', 'Convert to draft'], ['close', 'Close the PR']],
      },
      { k: 'label', label: 'Label', list: 'dl-labels', showIf: (r) => r.type?.endsWith('Label') },
      { k: 'when', label: 'Show on', type: 'select', options: [['', 'Any PR'], ['draft', 'Drafts'], ['ready', 'Ready PRs']] },
    ],
    presets: byTitle(D.actions, 'title'),
    blank: { title: '', type: 'toggleLabel', label: '' },
  },
];

// Empty strings and false checkboxes are left out, so the saved JSON stays
// as short as the hand-written defaults.
function setField(row, f, raw) {
  const v = f.type === 'checkbox' ? raw : f.fromUi && raw ? f.fromUi(raw) : raw;
  if (v === '' || v === false) delete row[f.k];
  else row[f.k] = v;
}

function control(row, f, onChange, rerender) {
  const shown = f.toUi && row[f.k] ? f.toUi(row[f.k]) : row[f.k] ?? '';
  if (f.type === 'checkbox') {
    const change = (e) => {
      setField(row, f, e.target.checked);
      onChange();
      rerender(); // a checkbox can show or hide another field (showIf)
    };
    return h('label', { class: 'cb' }, h('input', { type: 'checkbox', checked: !!row[f.k], onchange: change }), ` ${f.label}`);
  }
  const input =
    f.type === 'select'
      ? h('select', {}, f.options.map(([v, t]) => h('option', { value: v }, t)))
      : h('input', { type: 'text', placeholder: f.optional ? `optional${f.ph ? `, e.g. ${f.ph}` : ''}` : f.ph || '', list: f.list });
  input.value = shown;
  input.addEventListener(f.type === 'select' ? 'change' : 'input', () => {
    setField(row, f, input.value);
    onChange();
    if (f.type === 'select') rerender();
  });
  return h('label', { class: `field${f.wide ? ' wide' : ''}` }, h('span', { class: 'muted' }, f.label), input);
}

function siteExtractor() {
  const site = prompt('Collect links to which site? (e.g. jira.example.com)');
  if (!site) return null;
  const host = site.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return { name: host, source: 'all', regex: `https://${host.replace(/\./g, '\\.')}/[^\\s)>\\]"']+`, all: true, kind: 'link' };
}

export function renderBuilder(root, cfg, onChange) {
  const rerender = () => renderBuilder(root, cfg, onChange);
  const changed = () => onChange(cfg);
  cfg.attention ||= {};
  const general = h(
    'fieldset',
    {},
    h('legend', {}, 'General'),
    h('div', { class: 'items' },
      h('label', { class: 'field' }, h('span', { class: 'muted' }, 'Refresh every (minutes)'),
        h('input', { type: 'number', min: '0.5', step: '0.5', value: String(cfg.pollMinutes ?? 2), oninput: (e) => ((cfg.pollMinutes = Number(e.target.value) || 2), changed()) })),
      h('label', { class: 'cb' }, h('input', { type: 'checkbox', checked: !!cfg.showOtherLabels, onchange: (e) => ((cfg.showOtherLabels = e.target.checked), changed()) }), ' Show all labels, not only watched ones'),
      ...[['failedChecks', 'A watched check failed'], ['changesRequested', 'Changes requested'], ['conflicts', 'Merge conflict']].map(([k, t]) =>
        h('label', { class: 'cb' }, h('input', { type: 'checkbox', checked: !!cfg.attention[k], onchange: (e) => ((cfg.attention[k] = e.target.checked), changed()) }), ` Needs me: ${t}`),
      ),
    ),
  );
  const sections = SECTIONS.map((sec) => {
    const list = (cfg[sec.key] ||= []);
    const move = (i, d) => {
      [list[i], list[i + d]] = [list[i + d], list[i]];
      changed();
      rerender();
    };
    const rows = list.map((row, i) =>
      h(
        'div',
        { class: 'item' },
        h('div', { class: 'items' }, sec.fields.filter((f) => !f.showIf || f.showIf(row)).map((f) => control(row, f, changed, rerender))),
        h('div', { class: 'item-tools' },
          h('button', { title: 'Move up', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
          h('button', { title: 'Move down', disabled: i === list.length - 1, onclick: () => move(i, 1) }, '↓'),
          h('button', { title: 'Remove', onclick: () => (list.splice(i, 1), changed(), rerender()) }, '✕'),
        ),
      ),
    );
    const add = (item) => {
      if (!item) return;
      list.push(structuredClone(item));
      changed();
      rerender();
    };
    const preset = h('select', {}, h('option', { value: '' }, 'Add from preset…'), sec.presets.map(([t], i) => h('option', { value: String(i) }, t)));
    preset.addEventListener('change', () => {
      const p = sec.presets[Number(preset.value)]?.[1];
      add(p === 'site' ? siteExtractor() : p);
    });
    return h(
      'fieldset',
      {},
      h('legend', {}, sec.title),
      h('p', { class: 'muted' }, sec.help),
      rows.length ? rows : h('p', { class: 'muted' }, 'None yet.'),
      h('div', { class: 'row' }, h('button', { onclick: () => add(sec.blank || Object.fromEntries(sec.fields.map((f) => [f.k, '']))) }, '+ Add'), preset),
    );
  });
  root.replaceChildren(general, ...sections);
}

export function fillSuggestions(labels, checks) {
  for (const [id, values] of [['dl-labels', labels], ['dl-checks', checks]]) {
    document.getElementById(id).replaceChildren(...values.map((v) => h('option', { value: v })));
  }
}
