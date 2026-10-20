import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const sw = await readFile(join(ROOT, 'sw.js'), 'utf8');
const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

test('the offline cache lists every file the game loads', async () => {
  const need = ['./', './index.html', './manifest.webmanifest'];
  for (const dir of ['js', 'css', 'fonts', 'icons']){
    for (const f of await readdir(join(ROOT, dir))) if (!f.endsWith('.txt')) need.push(`./${dir}/${f}`);
  }
  for (const f of need) assert.ok(shell.includes(f), `sw.js SHELL is missing ${f}`);
});

test('every cached file exists', async () => {
  for (const f of shell.filter(f => f !== './')) await access(join(ROOT, f));
});

test('the cache has a version number', () => {
  assert.match(sw, /const VERSION = \d+;/);
});
