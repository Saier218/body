// Performance budget (docs/decisions/0008). Fails the build when a limit is exceeded, so growth is a
// decision someone makes on purpose rather than something that creeps in.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET = {
  appJsGzipKB: 250, // all JavaScript the app loads at start, gzip
  modelFileMB: 3.0, // one region's model file
  sceneTriangles: 150_000, // triangles on screen at once
  sceneDrawCalls: 150, // one per structure today
  contentBundleKB: 500,
};
const rows = [];
const add = (name, value, limit, unit) => rows.push({ name, value, limit, unit, ok: value <= limit });

const assets = 'apps/app/dist/assets';
const js = readdirSync(assets)
  .filter((f) => f.endsWith('.js'))
  .reduce((n, f) => n + gzipSync(readFileSync(join(assets, f))).length, 0);
add('app JavaScript (gzip)', +(js / 1024).toFixed(1), BUDGET.appJsGzipKB, 'KB');
add('content bundle', +(statSync('apps/app/dist/content/bundle.json').size / 1024).toFixed(1), BUDGET.contentBundleKB, 'KB');
for (const f of readdirSync('apps/app/dist/models').filter((x) => x.endsWith('.glb'))) {
  const buf = readFileSync(join('apps/app/dist/models', f));
  add(`model ${f}`, +(buf.length / 1e6).toFixed(2), BUDGET.modelFileMB, 'MB');
  const gltf = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
  const tris = gltf.meshes.reduce((n, m) => n + gltf.accessors[m.primitives[0].indices].count / 3, 0);
  add(`triangles in ${f}`, tris, BUDGET.sceneTriangles, '');
  add(`draw calls in ${f}`, gltf.nodes.length, BUDGET.sceneDrawCalls, '');
}
for (const r of rows)
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}: ${r.value}${r.unit && ' ' + r.unit} (limit ${r.limit}${r.unit && ' ' + r.unit})`);
if (rows.some((r) => !r.ok)) {
  console.log('BUDGET EXCEEDED');
  process.exit(1);
}
