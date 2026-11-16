// Proves the validator actually rejects bad content: each test breaks one rule on a valid fixture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './lib.mjs';

const T = (zh, en, sources = ['src-one']) => ({ zh, en, sources });
const fixture = () => ({
  catalog: [{ id: 'MESH_A' }, { id: 'MESH_B' }],
  content: {
    sources: [{ id: 'src-one', citation: 'Author A. A study of things. Journal. 2020.', year: 2020, type: 'original', evidence_grade: 'B', pmid: '123', accessed: '2026-11-16', reuse: 'facts only' }],
    sports: [{ id: 'climbing', name: { zh: '攀岩', en: 'Climbing' }, categories: [{ id: 'grip', name: { zh: '抓握', en: 'Grip' } }] }],
    structures: [
      { id: 'thing-a', name: { zh: '甲', en: 'A' }, names_status: 'unverified', kind: 'pulley', region: 'ring', meshes: [{ id: 'MESH_A', side: 'right' }] },
      { id: 'thing-b', name: { zh: '乙', en: 'B' }, names_status: 'unverified', kind: 'bone', region: 'ring', meshes: [{ id: 'MESH_B', side: 'right' }] },
    ],
    injuries: [{
      id: 'injury-one', name: { zh: '甲损伤', en: 'A injury' }, sports: ['climbing'], structures: [{ id: 'thing-a', involvement: 'primary' }],
      status: 'sourced', reviewed_at: '2026-11-16',
      overview: T('概述。', 'Overview.'), mechanism: [T('机制。', 'Mechanism.')], reported_signs: [T('表现。', 'Signs.')],
      red_flags: [T('出现畸形请尽快就医。', 'Seek in-person care promptly if there is deformity.')],
      general_principles: [T('原则。', 'Principle.')], prevention: [T('预防。', 'Prevention.')], uncertainty: [T('证据有限。', 'Evidence is limited.')],
      disclaimer: 'general',
    }],
    movements: [{
      id: 'move-one', sport: 'climbing', category: 'grip', name: { zh: '动作', en: 'Move' }, summary: T('说明。', 'Summary.'), status: 'sourced', reviewed_at: '2026-11-16',
      structures: [{ id: 'thing-a', role: 'loaded-passive', sources: ['src-one'] }],
      injuries: [{ id: 'injury-one', note: { zh: '关联说明。', en: 'Why they are linked.' }, sources: ['src-one'] }],
    }],
  },
});
const problems = (mutate) => { const f = fixture(); mutate(f.content, f.catalog); return validate(f.content, f.catalog); };
const rejects = (name, mutate, pattern) => test(name, () => {
  const errs = problems(mutate);
  assert.ok(errs.some((e) => pattern.test(e)), `expected an error matching ${pattern}, got:\n${errs.join('\n') || '(none)'}`);
});

test('the valid fixture passes', () => assert.deepEqual(problems(() => {}), []));
rejects('a sourced injury block without a source', (c) => { c.injuries[0].mechanism[0].sources = []; }, /requires at least one source/);
rejects('a citation of an unknown source', (c) => { c.injuries[0].overview.sources = ['nope']; }, /unknown source "nope"/);
rejects('an injury without red flags', (c) => { c.injuries[0].red_flags = []; }, /red_flags/);
rejects('an injury without a disclaimer', (c) => { delete c.injuries[0].disclaimer; }, /disclaimer/);
rejects('missing English text', (c) => { c.injuries[0].overview.en = ''; }, /overview\/en/);
rejects('banned Chinese wording', (c) => { c.injuries[0].overview.zh = '这是一种需要治疗的情况。'; }, /banned wording "治疗"/);
rejects('banned English wording', (c) => { c.injuries[0].overview.en = 'This helps you diagnose it.'; }, /banned wording/);
rejects('sourced status without a review date', (c) => { delete c.injuries[0].reviewed_at; }, /requires reviewed_at/);
rejects('expert-reviewed without a named reviewer', (c) => { c.injuries[0].status = 'expert-reviewed'; }, /requires reviewed_by/);
rejects('an injury pointing at an unknown structure', (c) => { c.injuries[0].structures[0].id = 'ghost'; }, /unknown structure "ghost"/);
rejects('a model mesh with no structure entry', (c, cat) => { cat.push({ id: 'MESH_C' }); }, /MESH_C has no structure entry/);
rejects('a structure pointing at a mesh the model lacks', (c) => { c.structures[0].meshes.push({ id: 'MESH_GONE', side: 'right' }); }, /MESH_GONE is not in any model catalog/);
rejects('one mesh claimed by two structures', (c) => { c.structures[1].meshes.push({ id: 'MESH_A', side: 'right' }); }, /already owned/);
rejects('a movement in an unknown category', (c) => { c.movements[0].category = 'nonsense'; }, /unknown category/);
rejects('a movement linked to an unknown injury', (c) => { c.movements[0].injuries[0].id = 'ghost'; }, /unknown injury "ghost"/);
rejects('a duplicate id', (c) => { c.structures.push({ ...c.structures[0], meshes: [] }); }, /duplicate id|meshes/);
rejects('an uncited source', (c) => { c.sources.push({ ...c.sources[0], id: 'src-two' }); }, /"src-two": not cited/);
rejects('a risk score smuggled into a movement', (c) => { c.movements[0].injuries[0].risk = 8; }, /must NOT have additional properties/);
test('a draft may lack sources', () => assert.deepEqual(problems((c) => { c.injuries[0].status = 'draft'; delete c.injuries[0].reviewed_at; c.injuries[0].mechanism[0].sources = []; }), []));
