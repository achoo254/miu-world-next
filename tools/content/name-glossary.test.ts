import { describe, expect, it } from 'vitest';
import { glossaryIssues, harvestNames, readGlossary, type NameGroup } from './name-glossary';

describe('name glossary', () => {
  it('reports names without English by group, and placeholders that differ', () => {
    const names = new Map<string, NameGroup>([
      ['Koala Ghép Tranh', 'character'],
      ['Nhà của {name}', 'place'],
      ['Quả táo', 'thing'],
    ]);
    const glossary = new Map([
      ['Koala Ghép Tranh', 'Puzzle Koala'],
      ['Nhà của {name}', 'Home'],
    ]);
    const { missing, broken } = glossaryIssues(names, glossary);
    expect(missing.get('thing')).toEqual(['Quả táo']);
    expect(missing.has('character')).toBe(false);
    expect(broken).toEqual(['"Nhà của {name}" → "Home": placeholders differ']);
  });

  it('accepts a name kept as it is in English (a personal name, a letter taught as spelling)', () => {
    const { missing, broken } = glossaryIssues(new Map<string, NameGroup>([['Tí', 'character']]), new Map([['Tí', 'Tí']]));
    expect(missing.size).toBe(0);
    expect(broken).toEqual([]);
  });

  it('every name the game shows has English in the committed glossary', () => {
    const { missing, broken } = glossaryIssues(harvestNames(), readGlossary());
    expect([...missing.values()].flat()).toEqual([]);
    expect(broken).toEqual([]);
  });
});
