// The English twins of the game's Vietnamese names (content/i18n/names/<group>.json, filled per
// `pnpm content:names`), merged into one table. Only `names.ts` imports this, and only through a dynamic
// `import()`, so the bundler puts the glossary in its own chunk: a player in Tiếng Việt never downloads it.
import action from '../../../../../content/i18n/names/action.json';
import character from '../../../../../content/i18n/names/character.json';
import home from '../../../../../content/i18n/names/home.json';
import place from '../../../../../content/i18n/names/place.json';
import thing from '../../../../../content/i18n/names/thing.json';
import title from '../../../../../content/i18n/names/title.json';
import wearable from '../../../../../content/i18n/names/wearable.json';

// Same order as the harvest tool's groups (tools/content/name-glossary.ts): the first group naming a word wins.
const GROUPS: ReadonlyArray<Readonly<Record<string, unknown>>> = [character, place, thing, wearable, home, action, title];

/** Vietnamese name → English name, over every group; blank entries (not translated yet) are left out. */
export function mergedGlossary(): Map<string, string> {
  const merged = new Map<string, string>();
  for (const group of GROUPS) {
    for (const [vi, en] of Object.entries(group)) {
      if (typeof en === 'string' && en.trim() !== '' && !merged.has(vi)) merged.set(vi, en.trim());
    }
  }
  return merged;
}
