// Copies the model files the app ships from models/generated into the app's static folder.
// The copies are build inputs, not sources: edit the pipeline in tools/modeling instead.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'apps/app/public/models');
mkdirSync(out, { recursive: true });
for (const f of ['hand_right.glb', 'hand_right.catalog.json']) {
  cpSync(resolve(root, 'models/generated', f), resolve(out, f));
}
console.log('models synced to apps/app/public/models');
