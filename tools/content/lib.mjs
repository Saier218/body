// Loads and validates the content data. Used by the CLI (validate.mjs), the bundler (build.mjs)
// and the tests. All rules that keep the content honest and compliant live here.
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const readDir = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => ({ file: f, data: readJson(join(dir, f)) }))
    : [];

/** Words the product must not use (CLAUDE.md 3.1): we describe, we never assess or advise an individual. */
export const BANNED_ZH = ['诊断', '确诊', '治疗', '治愈', '疗效', '处方', '用药剂量', '你得了', '无需就医'];
export const BANNED_EN = [
  /\bdiagnos/i,
  /\btreat(?!ise)/i,
  /\bcure[ds]?\b/i,
  /\bprescri/i,
  /\bdosage\b/i,
  /\byou have (a|an|the)\b/i,
  /\bno need to see\b/i,
];

export function loadContent(root = ROOT) {
  const c = join(root, 'content');
  return {
    sources: readJson(join(c, 'sources.json')),
    sports: readJson(join(c, 'sports.json')),
    structures: readJson(join(c, 'structures.json')),
    injuries: readDir(join(c, 'injuries')).map((x) => x.data),
    movements: readDir(join(c, 'movements')).map((x) => x.data),
  };
}

export function loadModelCatalogs(root = ROOT) {
  const dir = join(root, 'models/generated');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.catalog.json'))
    .flatMap((f) => readJson(join(dir, f)));
}

function compileSchemas(root) {
  const dir = join(root, 'content/schema');
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  for (const f of readdirSync(dir)) ajv.addSchema(readJson(join(dir, f)));
  return (name) => ajv.getSchema(`${name}.schema.json`);
}

/** Every user-facing string in an entry, with a path for error messages. */
function* texts(node, path) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* texts(node[i], `${path}[${i}]`);
    return;
  }
  if (node && typeof node === 'object') {
    if (typeof node.zh === 'string' && typeof node.en === 'string') yield { path, zh: node.zh, en: node.en };
    for (const [k, v] of Object.entries(node)) if (k !== 'zh' && k !== 'en') yield* texts(v, `${path}.${k}`);
  }
}

/** Every {sources: [...]} block in an entry. */
function* sourced(node, path) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* sourced(node[i], `${path}[${i}]`);
    return;
  }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.sources)) yield { path, sources: node.sources };
    for (const [k, v] of Object.entries(node)) if (k !== 'sources') yield* sourced(v, `${path}.${k}`);
  }
}

/** Returns a list of human-readable problems; empty means the content may ship. */
export function validate(content, modelCatalog, root = ROOT) {
  const errors = [];
  const schema = compileSchemas(root);
  const check = (kind, list) => {
    const v = schema(kind);
    const seen = new Set();
    for (const item of list) {
      const label = `${kind} "${item && item.id}"`;
      if (!v(item)) for (const e of v.errors) errors.push(`${label}: ${e.instancePath || '/'} ${e.message}`);
      if (item && seen.has(item.id)) errors.push(`${label}: duplicate id`);
      if (item) seen.add(item.id);
    }
    return seen;
  };
  const sourceIds = check('source', content.sources);
  const sportIds = check('sport', content.sports);
  const structureIds = check('structure', content.structures);
  const injuryIds = check('injury', content.injuries);
  check('movement', content.movements);

  // Model <-> content: each mesh in the shipped model belongs to exactly one structure, and every listed mesh exists.
  const meshOwner = new Map();
  for (const s of content.structures)
    for (const m of s.meshes || []) {
      if (meshOwner.has(m.id)) errors.push(`structure "${s.id}": mesh ${m.id} is already owned by "${meshOwner.get(m.id)}"`);
      meshOwner.set(m.id, s.id);
    }
  const modelIds = new Set(modelCatalog.map((m) => m.id));
  // The viewer zooms by model group and the app lists by structure region; they must agree.
  const modelGroup = new Map(modelCatalog.map((m) => [m.id, m.group]));
  for (const s of content.structures)
    for (const m of s.meshes || []) {
      const g = modelGroup.get(m.id);
      if (g !== undefined && g !== s.region)
        errors.push(`structure "${s.id}": region "${s.region}" but mesh ${m.id} is in model group "${g}"`);
    }
  for (const id of modelIds) if (!meshOwner.has(id)) errors.push(`model mesh ${id} has no structure entry (it would show without a name)`);
  for (const [id, owner] of meshOwner) if (!modelIds.has(id)) errors.push(`structure "${owner}": mesh ${id} is not in any model catalog`);
  for (const s of content.structures) if (s.part_of && s.part_of === s.id) errors.push(`structure "${s.id}": part_of points to itself`);

  const categories = new Map(content.sports.map((s) => [s.id, new Set((s.categories || []).map((c) => c.id))]));
  const refs = (label, ids, known, what) => {
    for (const id of ids) if (!known.has(id)) errors.push(`${label}: unknown ${what} "${id}"`);
  };

  for (const [kind, list] of [
    ['injury', content.injuries],
    ['movement', content.movements],
  ]) {
    for (const item of list) {
      const label = `${kind} "${item.id}"`;
      for (const b of sourced(item, '')) {
        refs(`${label}${b.path}`, b.sources, sourceIds, 'source');
        // Anything beyond a draft must be traceable, block by block.
        if (item.status !== 'draft' && b.sources.length === 0)
          errors.push(`${label}${b.path}: status "${item.status}" requires at least one source`);
      }
      if (item.status !== 'draft' && !item.reviewed_at) errors.push(`${label}: status "${item.status}" requires reviewed_at`);
      if (item.status === 'expert-reviewed' && !item.reviewed_by) errors.push(`${label}: expert-reviewed requires reviewed_by`);
      for (const t of texts(item, '')) {
        for (const w of BANNED_ZH) if (t.zh.includes(w)) errors.push(`${label}${t.path}.zh: contains banned wording "${w}"`);
        for (const re of BANNED_EN) if (re.test(t.en)) errors.push(`${label}${t.path}.en: contains banned wording ${re}`);
      }
      refs(
        label,
        (item.structures || []).map((s) => s.id),
        structureIds,
        'structure',
      );
    }
  }
  for (const i of content.injuries) refs(`injury "${i.id}"`, i.sports || [], sportIds, 'sport');
  for (const m of content.movements) {
    const label = `movement "${m.id}"`;
    if (!sportIds.has(m.sport)) errors.push(`${label}: unknown sport "${m.sport}"`);
    else if (!categories.get(m.sport).has(m.category)) errors.push(`${label}: unknown category "${m.category}" for sport "${m.sport}"`);
    refs(
      label,
      (m.injuries || []).map((x) => x.id),
      injuryIds,
      'injury',
    );
  }
  // A source nobody cites is either dead weight or a sign that a citation was dropped.
  const cited = new Set();
  for (const item of [...content.injuries, ...content.movements]) for (const b of sourced(item, '')) b.sources.forEach((s) => cited.add(s));
  for (const id of sourceIds) if (!cited.has(id)) errors.push(`source "${id}": not cited by any entry`);
  return errors;
}
