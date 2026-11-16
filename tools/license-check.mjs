// Fails if any installed package has a licence outside the allow-list in CLAUDE.md section 4.
// Packages that ship inside the app (dependencies) are held to the strict list; build-only tools
// may additionally use a few permissive licences that never reach users.
import { readFileSync } from 'node:fs';

const SHIPPED_OK = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'CC0-1.0']);
const TOOL_OK = new Set([...SHIPPED_OK, 'BlueOak-1.0.0', 'Python-2.0', 'CC-BY-4.0', 'MPL-2.0', 'Unlicense']);
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const bad = [];
let shipped = 0,
  tools = 0;
for (const [path, pkg] of Object.entries(lock.packages)) {
  if (!path) continue;
  const isTool = pkg.dev === true || pkg.devOptional === true;
  let licence = pkg.license;
  if (!licence) {
    try {
      licence = JSON.parse(readFileSync(`${path}/package.json`, 'utf8')).license;
    } catch {
      /* optional package for another platform, not installed */ continue;
    }
  }
  const parts = String(licence)
    .replace(/[()]/g, '')
    .split(/\s+(?:OR|AND)\s+/);
  const allowed = isTool ? TOOL_OK : SHIPPED_OK;
  // "A OR B" is fine if one option is allowed; "A AND B" needs all of them.
  const ok = /\bAND\b/.test(String(licence)) ? parts.every((p) => allowed.has(p)) : parts.some((p) => allowed.has(p));
  if (isTool) tools++;
  else shipped++;
  if (!ok) bad.push(`${path.replace(/^node_modules\//, '')}: ${licence} (${isTool ? 'build tool' : 'SHIPPED'})`);
}
if (bad.length) {
  for (const b of bad) console.log('FAIL ' + b);
  console.log('LICENCE CHECK FAILED');
  process.exit(1);
}
console.log(`licences ok: ${shipped} shipped packages, ${tools} build-only packages`);
