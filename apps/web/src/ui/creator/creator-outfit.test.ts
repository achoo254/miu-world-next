import { describe, expect, it } from 'vitest';
import species from '../../../../../content/species.json';
import { ACCESSORIES } from '../../game/content/accessories';
import { outfitForSpecies } from './creator-outfit';

describe('outfit when the character becomes another animal', () => {
  it('takes off the clothes and items styled after another animal, and keeps the rest', () => {
    const worn = ['hat-cat-mint', 'hat-cap-yellow', 'clothes-overalls'].filter((id) => ACCESSORIES.has(id));
    expect(worn).toHaveLength(3);
    expect(outfitForSpecies(['hat-cat-mint', 'clothes-overalls'], 'fox')).toEqual([]);
    expect(outfitForSpecies(['hat-cap-yellow', 'clothes-overalls'], 'fox')).toEqual(['hat-cap-yellow']);
    // An item styled after the animal she becomes stays on.
    expect(outfitForSpecies(['hat-cat-mint'], 'cat')).toEqual(['hat-cat-mint']);
  });

  it('names a playable animal in every themed item', () => {
    const themes = [...ACCESSORIES.values()].flatMap((item) => (item.def.theme ? [item.def.theme] : []));
    expect(themes.length).toBeGreaterThan(0);
    for (const theme of themes) expect(Object.keys(species)).toContain(theme);
  });
});
