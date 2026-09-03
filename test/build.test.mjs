import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

let outDir;

before(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'isoblocks-build-'));
  await build(outDir);
});

const exists = async (path) => stat(path).then(() => true, () => false);

test('build copies the player page and the game SWF', async () => {
  assert.ok(await exists(join(outDir, 'index.html')), 'index.html missing');
  assert.ok(await exists(join(outDir, '3DTetris.swf')), '3DTetris.swf missing');
});

test('build copies the Ruffle runtime (loader, core chunks and wasm)', async () => {
  const files = await readdir(join(outDir, 'ruffle'));
  assert.ok(files.includes('ruffle.js'), 'ruffle.js missing');
  assert.ok(files.some((f) => /^core\.ruffle\..+\.js$/.test(f)), 'core.ruffle.*.js chunk missing');
  assert.ok(files.some((f) => f.endsWith('.wasm')), '.wasm binary missing');
  assert.ok(!files.some((f) => f.endsWith('.map')), 'source maps should not be deployed');
});

test('player page loads Ruffle from the self-hosted copy, not a CDN', async () => {
  const html = await readFile(join(outDir, 'index.html'), 'utf8');
  assert.match(html, /<script[^>]+src="ruffle\/ruffle\.js"/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:\/\//);
  assert.match(html, /3DTetris\.swf/);
});
