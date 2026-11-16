// Validates the content and writes the single file the app loads.
// Drafts are left out: only entries that are at least "sourced" may reach users (CLAUDE.md 5.3).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, loadModelCatalogs, validate } from './lib.mjs';

const content = loadContent();
const errors = validate(content, loadModelCatalogs());
if (errors.length) { for (const e of errors) console.log('FAIL ' + e); process.exit(1); }

const shippable = (x) => x.status !== 'draft';
const injuries = content.injuries.filter(shippable);
const shippedInjuries = new Set(injuries.map((i) => i.id));
const movements = content.movements.filter(shippable).map((m) => ({ ...m, injuries: m.injuries.filter((i) => shippedInjuries.has(i.id)) }));
const cited = new Set(JSON.stringify([injuries, movements]).match(/"sources":\[[^\]]*\]/g)?.flatMap((s) => JSON.parse(`{${s}}`).sources) ?? []);
const meshIndex = {};
for (const s of content.structures) for (const m of s.meshes) meshIndex[m.id] = s.id;

const bundle = {
  structures: Object.fromEntries(content.structures.map((s) => [s.id, s])),
  meshIndex,
  sports: content.sports,
  injuries: Object.fromEntries(injuries.map((i) => [i.id, i])),
  movements: Object.fromEntries(movements.map((m) => [m.id, m])),
  sources: Object.fromEntries(content.sources.filter((s) => cited.has(s.id)).map((s) => [s.id, s])),
};
const out = join(ROOT, 'apps/app/public/content');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'bundle.json'), JSON.stringify(bundle));
console.log(`content bundle: ${Object.keys(bundle.structures).length} structures, ${injuries.length} injuries, ${movements.length} movements (drafts left out: ${content.injuries.length + content.movements.length - injuries.length - movements.length})`);
