// English twins of the game's names: characters, places, things, wearables, home decor, verbs on labels and
// titles. The English lives in the name glossary (content/i18n/names/*.json, see names-glossary.ts), keyed by the
// exact Vietnamese name. A name that carries its own English (an item's `en.name`, an event character's `nameEn`,
// the interaction registry's `nameEn`, a quest step's `en` twin) keeps it: the glossary only fills the gaps.
//
// The glossary is downloaded only when the display mode is English or Song ngữ (a dynamic import, so its own
// chunk). Until it arrives, and in Tiếng Việt, a name reads in Vietnamese. When it arrives the name listeners run
// (React screens re-render through `useLangMode`; game labels read the name each time they are shown, and the
// name boards painted on the map wait for the glossary when the map loads).
// React-free, so the game runtime uses it too: `nameText(vi)` gives the name as one string in the current mode.
import { getLangMode, inline, onLangModeChange, type Bilingual } from './i18n';

/** A glossary key with `{placeholders}` ("Nhà của {name}"), matched against names already filled in. */
interface TemplatedName {
  pattern: RegExp;
  holes: readonly string[];
  en: string;
}

interface LoadedNames {
  exact: ReadonlyMap<string, string>;
  templated: readonly TemplatedName[];
}

/** Joins the parts of a label built in code ("Koala Ghép Tranh · Nói chuyện"): each part has its own twin. */
const PART_SEPARATOR = ' · ';
const HOLE = /\{(\w+)\}/g;

let loaded: LoadedNames | null = null;
let loading: Promise<void> | null = null;
let revision = 0;
const listeners = new Set<() => void>();

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(glossary: ReadonlyMap<string, string>): LoadedNames {
  const templated: TemplatedName[] = [];
  for (const [vi, en] of glossary) {
    const holes = [...vi.matchAll(HOLE)].map((m) => m[1] ?? '');
    // A key that is only a hole ("{name}") would match every name: it has nothing to recognise it by.
    if (holes.length === 0 || vi.replace(HOLE, '').trim() === '') continue;
    // Each `{hole}` matches any non-empty text; the literal parts around it must match exactly.
    const source = vi
      .split(HOLE)
      .map((part, i) => (i % 2 === 1 ? '(.+?)' : escapeRegExp(part)))
      .join('');
    templated.push({ pattern: new RegExp(`^${source}$`, 'u'), holes, en });
  }
  return { exact: glossary, templated };
}

function notify(): void {
  revision += 1;
  for (const listener of listeners) listener();
}

/**
 * Downloads the glossary (once). Resolves when it is in use; a failed download leaves names in Vietnamese and is
 * tried again on the next mode change.
 */
export function loadNames(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= import('./names-glossary')
    .then(({ mergedGlossary }) => {
      loaded = compile(mergedGlossary());
      notify();
    })
    .catch((error: unknown) => {
      loading = null;
      console.warn('English names could not be loaded; names stay in Vietnamese.', error);
    });
  return loading;
}

/** Loads the glossary when the mode shows English (English or Song ngữ). */
function followMode(): void {
  if (getLangMode() !== 'vi') void loadNames();
}

let following = false;
/** Starts following the display mode (on first use, so importing this file does nothing by itself). */
function ensureFollowing(): void {
  if (following) return;
  following = true;
  onLangModeChange(followMode);
  followMode();
}

function lookup(vi: string): string | null {
  if (!loaded) return null;
  const exact = loaded.exact.get(vi);
  if (exact !== undefined) return exact;
  for (const { pattern, holes, en } of loaded.templated) {
    const match = pattern.exec(vi);
    if (!match) continue;
    // The filled-in values (a player's name) stay as they are.
    return en.replace(HOLE, (whole, hole: string) => {
      const at = holes.indexOf(hole);
      return at >= 0 ? (match[at + 1] ?? whole) : whole;
    });
  }
  if (vi.includes(PART_SEPARATOR)) {
    const parts = vi.split(PART_SEPARATOR);
    const english = parts.map((part) => lookup(part) ?? part);
    return english.some((en, i) => en !== parts[i]) ? english.join(PART_SEPARATOR) : null;
  }
  return null;
}

/**
 * A name in both languages: its own English first (`ownEnglish`), then the glossary, else the Vietnamese on both
 * sides (shown once). Never use it for a player's own name, another player's name or text a player typed.
 */
export function nameOf(vi: string, ownEnglish?: string | null): Bilingual {
  if (ownEnglish && ownEnglish.trim() !== '') return { vi, en: ownEnglish };
  ensureFollowing();
  return { vi, en: lookup(vi.trim()) ?? vi };
}

/** A name as one string in the current mode (game runtime, aria labels). */
export const nameText = (vi: string, ownEnglish?: string | null): string => inline(nameOf(vi, ownEnglish), getLangMode());

/** Changes every time the glossary arrives, so a cached label knows to be rebuilt. */
export const namesRevision = (): number => revision;

/** Calls `listener` when the glossary arrives. React screens get this through `useLangMode`. */
export function onNamesChange(listener: () => void): () => void {
  ensureFollowing();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Calls `listener` whenever a name may read differently: the mode changed or the glossary arrived (game labels). */
export function onNameDisplayChange(listener: () => void): () => void {
  const stopMode = onLangModeChange(listener);
  const stopNames = onNamesChange(listener);
  return () => {
    stopMode();
    stopNames();
  };
}

/** Tests only: forgets the glossary. */
export function resetNamesForTest(): void {
  loaded = null;
  loading = null;
  revision = 0;
}
