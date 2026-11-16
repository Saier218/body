// CLI: node tools/content/validate.mjs  -> exits 1 and lists problems if the content may not ship.
import { loadContent, loadModelCatalogs, validate } from './lib.mjs';

const content = loadContent();
const errors = validate(content, loadModelCatalogs());
if (errors.length) {
  for (const e of errors) console.log('FAIL ' + e);
  console.log(`CONTENT INVALID: ${errors.length} problem(s)`);
  process.exit(1);
}
const count = (s) => content.injuries.concat(content.movements).filter((x) => x.status === s).length;
console.log(
  `content ok: ${content.structures.length} structures, ${content.movements.length} movements, ${content.injuries.length} injuries, ${content.sources.length} sources (draft ${count('draft')}, sourced ${count('sourced')}, expert-reviewed ${count('expert-reviewed')})`,
);
