// The minimap's and the full map's words in the display language: a marker's lines (minimap-model.ts) turned into
// both languages when the map draws, names through the name glossary (ui/i18n/names), UI lines through the locales.
import { getLangMode, inline, joinBoth, pairOf, type Bilingual } from '../../ui/i18n/i18n';
import { nameOf } from '../../ui/i18n/names';
import type { MarkerLine, MarkerParam, MinimapMarker } from './minimap-model';

/** A value in both languages; `untranslated` when a word written in lower case ("xe buýt") has no English yet. */
function paramOf(value: MarkerParam): { pair: Bilingual; untranslated: boolean } {
  if (typeof value === 'string') return { pair: nameOf(value), untranslated: false };
  if ('name' in value) {
    const pair = nameOf(value.name);
    return { pair: { vi: pair.vi.toLocaleLowerCase('vi'), en: pair.en }, untranslated: pair.en === pair.vi };
  }
  return { pair: value, untranslated: false };
}

/** One line of a marker in both languages. */
export function markerLine(line: MarkerLine): Bilingual {
  if (typeof line === 'string') return nameOf(line);
  if ('key' in line) {
    const values = Object.entries(line.params ?? {}).map(([k, v]) => [k, paramOf(v)] as const);
    const text = pairOf(line.key, Object.fromEntries(values.map(([k, v]) => [k, v.pair])));
    // "xe buýt stop" reads worse than the Vietnamese line: until the word has its English, the line stays Vietnamese.
    return values.some(([, v]) => v.untranslated) ? { vi: text.vi, en: text.vi } : text;
  }
  return line;
}

/** A marker's name as one string in the current mode. */
export const markerLabel = (marker: Pick<MinimapMarker, 'label'>): string => inline(markerLine(marker.label), getLangMode());

/** A marker's second line in both languages, its parts joined by " · " (null when it has none). */
export const markerDetailLine = (marker: Pick<MinimapMarker, 'detail'>): Bilingual | null =>
  marker.detail?.length ? joinBoth(marker.detail.map(markerLine), ' · ') : null;

/** A marker's second line as one string in the current mode ('' when it has none). */
export const markerDetail = (marker: Pick<MinimapMarker, 'detail'>): string => {
  const line = markerDetailLine(marker);
  return line ? inline(line, getLangMode()) : '';
};
