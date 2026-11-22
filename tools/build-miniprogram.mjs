// Builds everything the mini program shell needs from the shared sources (decision 0012) and checks the package size.
// The outputs are committed so the project opens in WeChat DevTools without a Node toolchain.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mp = join(root, 'apps/miniprogram');
const LIMIT = 2 * 1024 * 1024; // main package limit, WeChat docs, checked 2026-11-15

mkdirSync(join(mp, 'libs'), { recursive: true });
mkdirSync(join(mp, 'models'), { recursive: true });
mkdirSync(join(mp, 'content'), { recursive: true });

for (const [entry, out] of [
  ['packages/viewer-core/src/index.ts', 'libs/viewer-core.js'],
  ['packages/shared/src/index.ts', 'libs/shared.js'],
]) {
  await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    format: 'cjs',
    target: 'es2018',
    minify: true,
    legalComments: 'none',
    outfile: join(mp, out),
    logLevel: 'warning',
  });
}

// .glb is not on the mini-program upload whitelist; .br is, and readCompressedFile unpacks it on the device.
for (const model of ['body_overview', 'hand_right']) {
  const glb = readFileSync(join(root, `models/generated/${model}.glb`));
  writeFileSync(join(mp, `models/${model}.glb.br`), brotliCompressSync(glb, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
}
copyFileSync(join(root, 'models/generated/hand_right.catalog.json'), join(mp, 'models/hand_right.catalog.json'));
copyFileSync(join(root, 'models/generated/body_overview.regions.json'), join(mp, 'models/body_overview.regions.json'));
copyFileSync(join(root, 'apps/app/public/content/bundle.json'), join(mp, 'content/bundle.json'));

// Rough package size: every file the DevTools would upload (TypeScript compiles to similar-sized JS).
const SKIP = new Set(['node_modules', 'README.md', 'project.private.config.json']);
const size = (dir) =>
  readdirSync(dir).reduce((n, f) => {
    if (SKIP.has(f)) return n;
    const p = join(dir, f);
    return n + (statSync(p).isDirectory() ? size(p) : statSync(p).size);
  }, 0);
const total = size(mp);
console.log(`mini program package: ${(total / 1024 / 1024).toFixed(2)} MB (limit 2 MB)`);
if (total > LIMIT) {
  console.log('PACKAGE TOO LARGE');
  process.exit(1);
}
