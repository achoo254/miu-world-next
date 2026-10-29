import { describe, expect, it } from 'vitest';
import characters from '../../../content/characters.json';
import { TOWNSFOLK_LETTERS, TOWNSFOLK_MODELS, townsfolk } from './townsfolk';

describe('townsfolk', () => {
  it('are the animal characters of the library, every one of them', () => {
    const npcs = Object.values(characters as Record<string, { output: string; role?: string }>)
      .filter((c) => c.role === 'npc')
      .map((c) => c.output);
    expect([...TOWNSFOLK_MODELS].sort()).toEqual(npcs.sort());
  });

  it('gives each look letter its own character, neighbouring letters of another kind', () => {
    const models = TOWNSFOLK_LETTERS.split('').map(townsfolk);
    expect(new Set(models).size).toBe(models.length);
    const kind = (model: string): string => model.split('/').pop()?.split('-')[1] ?? '';
    for (let i = 1; i < models.length; i++) expect(kind(models[i] ?? ''), models[i]).not.toBe(kind(models[i - 1] ?? ''));
  });

  it('refuses a letter it has no character for', () => {
    expect(() => townsfolk('z')).toThrow(/no townsfolk look/);
    expect(() => townsfolk('ab')).toThrow(/no townsfolk look/);
  });
});
