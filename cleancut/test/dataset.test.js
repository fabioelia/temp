import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDataset, titleFile } from '../shared/dataset.js';
import { emptyIndex, lookupStatic } from '../shared/lookup.js';
import { listContribution, newFileLink, titleContribution } from '../shared/contribute.js';
import { validateSegment } from '../shared/validate.js';

const got = { platform: 'netflix', platformId: '70248288', series: 'Game of Thrones', season: 1, episode: 1, name: 'Winter Is Coming' };
const seg = (start, end, category = 'sex', severity = 3) => ({ start, end, category, severity });
const file = (path, json) => ({ path, json });

test('merges contributions for one title, de-duplicates and sorts', () => {
  const { files, errors, stats } = buildDataset({
    titles: [
      file('titles/netflix/a.json', { title: got, segments: [seg(100, 110), seg(10, 20, 'violence', 2)] }),
      file('titles/netflix/b.json', { title: { ...got, duration: 3720 }, segments: [seg(100, 110), seg(300, 310, 'gore')] }),
    ],
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(stats, { titles: 1, segments: 3, lists: 0 });
  const t = files[`titles/${titleFile('netflix', '70248288')}`];
  assert.deepEqual(t.segments.map((s) => s.start), [10, 100, 300]);
  assert.equal(t.title.duration, 3720, 'metadata missing from one file is filled from another');
  assert.equal(t.title.canonicalKey, 'game-of-thrones/s01e01');
  assert.match(t.segments[0].id, /^s_[0-9a-f]{8}$/);
  // ids are content-derived, so the same tag keeps its id when files are merged differently
  const again = buildDataset({ titles: [file('titles/netflix/z.json', { title: got, segments: [seg(100, 110)] })] });
  assert.ok(Object.values(again.files).some((f) => f.segments?.[0]?.id === t.segments[1].id));
});

test('reports every problem with the file it came from', () => {
  const { errors } = buildDataset({
    titles: [
      file('titles/netflix/bad1.json', { title: got, segments: [seg(5, 2), { ...seg(1, 2), category: 'nope' }] }),
      file('titles/prime/bad2.json', { title: got, segments: [seg(1, 2)] }),
      file('titles/web/bad3.json', { title: { platform: 'web' }, segments: [] }),
      file('titles/netflix/bad4.json', { segments: [seg(1, 2)] }),
    ],
    lists: [file('lists/Bad Name.json', { name: 'x', settings: {} }), file('lists/ok-name.json', { name: 'Fine', settings: { preset: 'PG-14' } })],
  });
  const text = errors.join('\n');
  assert.match(text, /bad1\.json: segments\[0\]: end must be after start/);
  assert.match(text, /bad1\.json: segments\[1\]: category must be one of/);
  assert.match(text, /bad2\.json: lives in titles\/prime\/ but title\.platform is "netflix"/);
  assert.match(text, /bad3\.json: title\.platformId is required/);
  assert.match(text, /bad4\.json: "title" is required/);
  assert.match(text, /Bad Name\.json: file name must be lowercase/);
  assert.match(text, /ok-name\.json: "settings\.preset" must be one of/);
});

test('skip lists are published in the index with their scope', () => {
  const { files, errors } = buildDataset({
    titles: [file('titles/netflix/a.json', { title: got, segments: [seg(10, 20)] })],
    lists: [
      file('lists/family-night.json', { name: 'Family night', author: 'ana', settings: { preset: 'PG' } }),
      file('lists/got-teens.json', { name: 'GoT for teens', settings: { preset: 'PG-13' }, title: { platform: 'netflix', platformId: '70248288' }, overrides: { exclude: ['s_deadbeef', 'junk'] } }),
    ],
  });
  assert.deepEqual(errors, []);
  const lists = files['index.json'].lists;
  assert.equal(lists.length, 2);
  const got13 = lists.find((l) => l.id === 'got-teens');
  assert.equal(got13.titleKey, 'netflix:70248288');
  assert.deepEqual(got13.overrides.exclude, ['s_deadbeef'], 'only well-formed segment ids survive');
  assert.equal(lists.find((l) => l.id === 'family-night').author, 'ana');
});

function lookupOver(titles) {
  const { files } = buildDataset({ titles, lists: [file('lists/all.json', { name: 'Everything', settings: { preset: 'unfiltered' } })] });
  return {
    index: files['index.json'],
    loadTitle: async (f) => {
      const hit = files[`titles/${f}`];
      if (!hit) throw new Error(`unexpected fetch ${f}`);
      return hit;
    },
  };
}

test('lookup: own tags, borrowed tags from another platform, and nothing', async () => {
  const env = lookupOver([file('titles/netflix/a.json', { title: got, segments: [seg(10, 20), seg(30, 40)] })]);
  const own = await lookupStatic({ ...env, title: { platform: 'netflix', platformId: '70248288' } });
  assert.equal(own.segments.length, 2);
  assert.equal(own.borrowedFrom, null);
  assert.equal(own.profiles.length, 1, 'global lists apply everywhere');

  const prime = await lookupStatic({ ...env, title: { platform: 'prime', platformId: 'B00XYZ', canonicalKey: 'game-of-thrones/s01e01' } });
  assert.equal(prime.segments.length, 2);
  assert.equal(prime.borrowedFrom.platform, 'netflix');
  assert.equal(prime.borrowedFrom.titleKey, 'netflix:70248288');

  let fetched = false;
  const none = await lookupStatic({ index: env.index, loadTitle: async () => ((fetched = true), { segments: [] }), title: { platform: 'netflix', platformId: 'nope' } });
  assert.deepEqual(none.segments, []);
  assert.equal(fetched, false, 'a title with no data costs no extra request');
});

test('lookup works against an empty index', async () => {
  const r = await lookupStatic({ index: emptyIndex(), loadTitle: async () => assert.fail('no fetch'), title: { platform: 'netflix', platformId: '1' } });
  assert.deepEqual(r.segments, []);
});

test('contributions round-trip through the builder', () => {
  const c = titleContribution({ ...got, duration: 3720 }, [
    { ...seg(10, 20), id: 'local:1', source: 'local', createdAt: 1, note: 'brothel' },
    { start: 5, end: 1, category: 'sex', severity: 2 }, // invalid → dropped
  ]);
  assert.equal(c.count, 1);
  assert.match(c.path, /^community\/titles\/netflix\/\d{8}-[a-z0-9]{6}\.json$/);
  assert.equal(c.json.segments[0].id, undefined, 'local ids and bookkeeping are stripped');
  const { errors, stats } = buildDataset({ titles: [{ path: c.path.replace('community/', ''), json: c.json }] });
  assert.deepEqual(errors, []);
  assert.equal(stats.segments, 1);

  const l = listContribution({ name: 'GoT for teens', settings: { preset: 'PG-13' }, title: got, overrides: { exclude: ['s_0123abcd'] } });
  assert.match(l.path, /^community\/lists\/got-for-teens-[a-z0-9]{6}\.json$/);
  assert.deepEqual(buildDataset({ lists: [{ path: l.path.replace('community/', ''), json: l.json }] }).errors, []);
});

test('GitHub new-file link carries the file, or asks for a paste when it is too long', () => {
  const small = newFileLink({ repo: 'o/r', branch: 'main', path: 'community/titles/netflix/x.json', json: { a: 1 } });
  assert.equal(small.needsPaste, false);
  const u = new URL(small.url);
  assert.equal(u.origin + u.pathname, 'https://github.com/o/r/new/main');
  assert.equal(u.searchParams.get('filename'), 'community/titles/netflix/x.json');
  assert.deepEqual(JSON.parse(u.searchParams.get('value')), { a: 1 });

  const big = newFileLink({ repo: 'o/r', branch: 'main', path: 'p.json', json: { segments: Array.from({ length: 400 }, (_, i) => validateSegment(seg(i, i + 1)).segment) } });
  assert.equal(big.needsPaste, true);
  assert.ok(!big.url.includes('value='));
  assert.ok(big.content.length > 7000);
});
