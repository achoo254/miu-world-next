import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContentCatalog, loadQuests } from './content-catalog';

function questDir(quests: unknown[]): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'miu-quests-'));
  quests.forEach((q, i) => writeFileSync(path.join(dir, `q${i}.json`), JSON.stringify(q)));
  return dir;
}

const skills = new Set(['doc-hieu', 'phep-cong']);
/** A valid fixture quest; each test changes its id. */
const base = JSON.parse(
  readFileSync(new URL('../../test/fixtures/quests/quest-c.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

describe('content catalogue', () => {
  it('loads the shipped content: chapter 1 and every learning quest, all open from the start', () => {
    const catalog = loadContentCatalog();
    const ids = [...catalog.quests.keys()];
    expect(ids[0]).toBe('forest-ch1');
    expect(ids.filter((id) => id.startsWith('tv2-'))).toHaveLength(34);
    expect(ids.filter((id) => id.startsWith('toan2-'))).toHaveLength(36);
    for (const quest of catalog.quests.values()) expect(quest.status, quest.id).toBe('active');
    expect(catalog.accessories.get('hat-witch-pink')?.slot).toBe('hat');
    expect(catalog.accessories.get('backpack-brown')?.slot).toBe('back');
    expect(catalog.accessories.get('hat-witch-night')).toMatchObject({ slot: 'hat', variant: 'night', unlock: { level: 2 } });
    expect(catalog.accessories.get('hat-flower-crown')?.unlock).toEqual({ quest: 'forest-ch1' });
    expect(catalog.skillIds.has('doc-hieu')).toBe(true);
    expect(catalog.characterNames.has('Miu')).toBe(true);
  });

  it('refuses quests that reward unknown skills, duplicates, and the old "unlock" list (nothing is locked)', () => {
    expect(() => loadQuests(questDir([{ ...base, id: 'a', reward: { skillXp: { bay: 1 } } }]), skills)).toThrow(/unknown skill/);
    expect(() => loadQuests(questDir([{ ...base, id: 'a' }, { ...base, id: 'a' }]), skills)).toThrow(/duplicate/);
    expect(() => loadQuests(questDir([{ ...base, id: 'a', unlock: ['b'] }, { ...base, id: 'b' }]), skills)).toThrow(/invalid content file/);
  });

  it('refuses a quest file that breaks the schema', () => {
    expect(() => loadQuests(questDir([{ ...base, id: 'a', sevenQuestions: {} }]), skills)).toThrow(/invalid content file q0.json/);
  });

  it('validates drafts but never loads them', () => {
    const mechanics = JSON.parse(readFileSync(new URL('../../test/fixtures/quests/quest-mechanics.json', import.meta.url), 'utf8')) as Record<string, unknown>;
    // Learning quests need feedback lines on every learning step, none reused.
    const steps = (mechanics.steps as Array<Record<string, unknown>>).map((s) =>
      'support' in s ? { ...s, feedback: { right: [1, 2, 3].map((n) => `${String(s.id)} ${n}`), wrong: [4, 5, 6].map((n) => `${String(s.id)} ${n}`) } } : s,
    );
    // ...and say where to go: every step here happens at the ancient tree.
    const places = Object.fromEntries(steps.flatMap((s) => (s.kind === 'search' ? [[s.id, 'cây cổ thụ']] : s.target ? [[s.target, 'cây cổ thụ']] : [])));
    const walked = steps.map((s) => ({ ...s, goTo: 'Đến cây cổ thụ' }));
    const draft = { ...mechanics, id: 'tv2-t01-b01', status: 'draft', topic: 'doc-truyen', steps: walked, places };
    const loaded = loadQuests(questDir([{ ...base, id: 'a' }, draft]), new Set([...skills, 'phep-cong']));
    expect([...loaded.keys()]).toEqual(['a']);
    expect(() => loadQuests(questDir([{ ...draft, phases: {} }]), skills)).toThrow(/invalid content file/);
  });
});
