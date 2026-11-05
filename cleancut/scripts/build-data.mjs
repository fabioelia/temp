// Validate the community dataset and publish it as static files.
//   node scripts/build-data.mjs --check                 validate only (used by CI on pull requests)
//   node scripts/build-data.mjs --out _site/data/v1     validate and write the published files
//   --src <dir>                                         dataset folder (default: community)
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDataset } from '../shared/dataset.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const src = arg('--src', join(root, 'community'));
const out = arg('--out', null);
const check = process.argv.includes('--check');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

const errors = [];
const load = (dir) =>
  walk(join(src, dir)).flatMap((file) => {
    const path = relative(root, file) || file;
    try {
      return [{ path: relative(src, file), json: JSON.parse(readFileSync(file, 'utf8')) }];
    } catch (e) {
      errors.push(`${path}: not valid JSON (${e.message})`);
      return [];
    }
  });

const { files, errors: dataErrors, stats } = buildDataset({ titles: load('titles'), lists: load('lists') });
errors.push(...dataErrors);

if (errors.length) {
  console.error(`✗ ${errors.length} problem${errors.length === 1 ? '' : 's'} in the community data:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`✓ ${stats.titles} title${stats.titles === 1 ? '' : 's'}, ${stats.segments} segment${stats.segments === 1 ? '' : 's'}, ${stats.lists} skip list${stats.lists === 1 ? '' : 's'}`);

if (out && !check) {
  rmSync(out, { recursive: true, force: true });
  for (const [path, json] of Object.entries(files)) {
    const dest = join(out, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, JSON.stringify(json));
  }
  console.log(`  wrote ${Object.keys(files).length} files → ${out}`);
}
