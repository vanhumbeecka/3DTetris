// Assembles the static site served by GitHub Pages: the Ruffle player page,
// the compiled game SWF and a self-hosted copy of the Ruffle runtime.
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const rufflePkgDir = dirname(createRequire(import.meta.url).resolve('@ruffle-rs/ruffle/package.json'));

const isRuntimeFile = (name) =>
  name === 'ruffle.js' || /^core\.ruffle\..+\.js$/.test(name) || name.endsWith('.wasm') || name.startsWith('LICENSE');

export async function build(outDir) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'ruffle'), { recursive: true });

  await cp(join(repoRoot, 'site', 'index.html'), join(outDir, 'index.html'));
  await cp(join(repoRoot, '3DTetris.swf'), join(outDir, '3DTetris.swf'));

  const runtimeFiles = (await readdir(rufflePkgDir)).filter(isRuntimeFile);
  await Promise.all(runtimeFiles.map((f) => cp(join(rufflePkgDir, f), join(outDir, 'ruffle', f))));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = join(repoRoot, 'build');
  await build(outDir);
  console.log(`Built site in ${outDir}`);
}
