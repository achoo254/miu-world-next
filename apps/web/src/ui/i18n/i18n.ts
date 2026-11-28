// Multilingual display (Master Plan §8c): every UI string lives in `locales/vi.json` with its English twin in
// `locales/en.json` and its Simplified Chinese one in `locales/zh-CN.json` (the three languages of the shared shell).
// Four display modes: Tiếng Việt, English, 中文, Song ngữ (the Vietnamese line with a smaller English line under it).
// Missing English falls back to the Vietnamese, missing Chinese to the English (game content and names carry an
// English twin but no Chinese one); `pnpm content:check` and a unit test report gaps in the dictionaries. Textbook
// wording never goes through here: it stays the book's Vietnamese in every mode.
// React-free, so the game runtime can label its own buttons with `t()`; React screens use `useT()` / `<Bi>`.
import { type LocalePreferenceOptions, readPreferences, writePreference } from '@achoo254/app-shell/preferences';
import enJson from './locales/en.json';
import viJson from './locales/vi.json';
import zhJson from './locales/zh-CN.json';
import { apiUrl } from '../../platform/endpoints';
import { authHeaders } from '../../platform/session-token';

/** The languages of the shared shell (`@achoo254/app-shell` SHELL_LOCALES), the values of the `hd_lang` cookie. */
export const LANGS = ['vi', 'en', 'zh-CN'] as const;
export type Lang = (typeof LANGS)[number];
export type LangMode = Lang | 'both';
export const LANG_MODES: readonly LangMode[] = ['vi', 'en', 'zh-CN', 'both'];

type Locale = typeof viJson;
/** A key whose value is one line. */
export type TextKey = { [K in keyof Locale]: Locale[K] extends string ? K : never }[keyof Locale];
/** A key whose value is a pool of lines (said in turn, never back-to-back). */
export type LinesKey = { [K in keyof Locale]: Locale[K] extends readonly string[] ? K : never }[keyof Locale];

/**
 * One line in every language: `en` equals `vi` for text that has no translation (textbook wording), and `zh` equals
 * `en` for text that has no Chinese of its own (game content, names). Build one with `pairOf`, `linesOf`, `same` or
 * `twin`, so the Chinese side is never left out.
 */
export interface Bilingual {
  vi: string;
  en: string;
  zh: string;
}

/** Values of `{param}` placeholders; a bilingual value fills each language with its own side. */
export type Params = Readonly<Record<string, string | number | Bilingual>>;

const VI: Readonly<Record<string, string | readonly string[]>> = viJson;
const EN: Readonly<Record<string, string | readonly string[] | undefined>> = enJson;
const ZH: Readonly<Record<string, string | readonly string[] | undefined>> = zhJson;

/** The side of a line written in `lang`. */
export const sideOf = (text: Bilingual, lang: Lang): string => (lang === 'vi' ? text.vi : lang === 'en' ? text.en : text.zh);

/**
 * Fills `{param}` placeholders given in `params` with their `lang` side; others (`{name}` filled later by `say`)
 * are left as they are.
 */
export function format(text: string, params?: Params, lang: Lang = 'vi'): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = params[key];
    if (value === undefined) return whole;
    return typeof value === 'object' ? sideOf(value, lang) : String(value);
  });
}

/** Untranslated text (textbook wording, a server message): the same line in every language, shown once. */
export const same = (text: string): Bilingual => ({ vi: text, en: text, zh: text });

/**
 * A line with its own English but no Chinese (game content, a name): the Chinese side reads the English. A missing
 * or blank English reads the Vietnamese, as untranslated text does.
 */
export function twin(vi: string, en?: string | null): Bilingual {
  const english = en && en.trim() !== '' ? en : vi;
  return { vi, en: english, zh: english };
}

/** A line the content or the server carries in Vietnamese and English only (`{ vi, en }`): 中文 reads its English. */
export const contentText = (text: Readonly<{ vi: string; en: string }>): Bilingual => twin(text.vi, text.en);

const present = (line: unknown): line is string => typeof line === 'string' && line.trim() !== '';

/** A key in every language, English falling back to Vietnamese and Chinese to English. */
export function pairOf(key: TextKey, params?: Params): Bilingual {
  const vi = VI[key];
  const en = EN[key];
  const zh = ZH[key];
  const viText = typeof vi === 'string' ? vi : key;
  const enText = present(en) ? en : viText;
  const zhText = present(zh) ? zh : enText;
  return formatBoth({ vi: viText, en: enText, zh: zhText }, params);
}

/** Fills the `{param}` placeholders of every side of a line, each language with its own side of a bilingual value. */
export const formatBoth = (text: Bilingual, params?: Params): Bilingual => ({
  vi: format(text.vi, params, 'vi'),
  en: format(text.en, params, 'en'),
  zh: format(text.zh, params, 'zh-CN'),
});

/** A pool of lines in every language, paired by position, with the same fallbacks as `pairOf`. */
export function linesOf(key: LinesKey): Bilingual[] {
  const vi = VI[key];
  const en = EN[key];
  const zh = ZH[key];
  const viLines = Array.isArray(vi) ? vi : [];
  const enLines = Array.isArray(en) ? en : [];
  const zhLines = Array.isArray(zh) ? zh : [];
  return viLines.map((line, i) => {
    const english: unknown = enLines[i];
    const chinese: unknown = zhLines[i];
    const enText = present(english) ? english : line;
    return { vi: line, en: enText, zh: present(chinese) ? chinese : enText };
  });
}

/** Maps every side of a line (fills `{name}`, `{who}`…). */
export const mapBoth = (text: Bilingual, fn: (line: string) => string): Bilingual => ({ vi: fn(text.vi), en: fn(text.en), zh: fn(text.zh) });

/** Joins lines side by side ("Cần Lv.3 · Xong …"). */
export const joinBoth = (parts: readonly Bilingual[], separator = ''): Bilingual => ({
  vi: parts.map((p) => p.vi).join(separator),
  en: parts.map((p) => p.en).join(separator),
  zh: parts.map((p) => p.zh).join(separator),
});

/** The line as one string in `mode`: in Song ngữ "Việt / English" (once when they are the same). */
export function inline(text: Bilingual, mode: LangMode): string {
  if (mode === 'both') return text.vi === text.en ? text.vi : `${text.vi} / ${text.en}`;
  return sideOf(text, mode);
}

/** The `lang` attribute of text shown in `mode` (Song ngữ leads with the Vietnamese). */
export const htmlLangOf = (mode: LangMode): Lang => (mode === 'both' ? 'vi' : mode);

// The chosen mode, kept on this device for each child profile (Master Plan §8c: "lưu theo hồ sơ bé"), and as the
// device's choice for screens before a profile is picked. Storage can be blocked (private mode): reads fall back
// to Vietnamese and writes are skipped, so the setting never breaks the game.
const STORAGE_KEY = 'miu.lang';
const listeners = new Set<() => void>();

export const isLangMode = (value: unknown): value is LangMode => typeof value === 'string' && (LANG_MODES as readonly string[]).includes(value);

/** The child profile whose choice is read and written (null: the device's). */
let profile: string | null = null;
const profileKey = (id: string): string => `${STORAGE_KEY}.${id}`;

function readKey(key: string): LangMode | null {
  try {
    const stored = window.localStorage.getItem(key);
    return isLangMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeKey(key: string, mode: LangMode): void {
  try {
    window.localStorage.setItem(key, mode);
  } catch {
    // Blocked storage: the choice lasts until the page closes.
  }
}

// The device's language is the `hd_lang` cookie every hoandat.com app shares (vi, en or zh-CN), so a language picked
// in another app holds here too; a child profile's own choice still comes first. Song ngữ exists only in Miu: it stays
// in this device's key and is kept until changed here.
const SHARED_PREFERENCES: LocalePreferenceOptions<Lang> = { domain: 'hoandat.com', locales: LANGS };

function readDevice(): LangMode | null {
  const own = readKey(STORAGE_KEY);
  if (own === 'both') return own;
  return readPreferences(SHARED_PREFERENCES).lang ?? own;
}

const readStored = (): LangMode => (profile ? readKey(profileKey(profile)) : null) ?? readDevice() ?? 'vi';

let current: LangMode | null = null;

function apply(mode: LangMode): void {
  current = mode;
  if (typeof document !== 'undefined') document.documentElement.lang = htmlLangOf(mode);
  for (const listener of listeners) listener();
}

export function getLangMode(): LangMode {
  if (current === null) {
    // The first read labels the page too: index.html ships as Vietnamese, and a language saved in the shared cookie
    // (or this device) must reach `<html lang>` without waiting for a change.
    current = readStored();
    if (typeof document !== 'undefined') document.documentElement.lang = htmlLangOf(current);
  }
  return current;
}

/**
 * Keeps a profile's mode on the server too, so it follows her to another device. The server knows Tiếng Việt, English
 * and Song ngữ (it writes her mail in them); 中文 stays on this device and in the shared cookie.
 */
function syncLanguageToServer(childId: string, mode: LangMode): void {
  if (typeof fetch === 'undefined' || mode === 'zh-CN') return;
  void fetch(apiUrl(`/players/${childId}/language`), {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ language: mode }),
  }).catch(() => {
    // Best-effort server sync; local storage is the instant offline cache.
  });
}

export function setLangMode(mode: LangMode, sync = true): void {
  writeKey(STORAGE_KEY, mode);
  if (mode !== 'both') writePreference('lang', mode, SHARED_PREFERENCES);
  if (profile) {
    writeKey(profileKey(profile), mode);
    if (sync) syncLanguageToServer(profile, mode);
  }
  apply(mode);
}

/** The selected child profile changed: her own choice applies (the device's until she makes one). */
export function bindLangProfile(childId: string | null, serverLanguage?: LangMode | null): void {
  if (childId === profile) {
    if (childId && serverLanguage && isLangMode(serverLanguage) && !readKey(profileKey(childId))) {
      writeKey(profileKey(childId), serverLanguage);
      if (serverLanguage !== current) apply(serverLanguage);
    }
    return;
  }
  profile = childId;
  if (childId && serverLanguage && isLangMode(serverLanguage) && !readKey(profileKey(childId))) {
    writeKey(profileKey(childId), serverLanguage);
    if (serverLanguage !== current) apply(serverLanguage);
    return;
  }
  const mode = readStored();
  if (mode !== current) apply(mode);
}

/** Calls `listener` after every change of the mode (React screens re-render, the game relabels its buttons). */
export function onLangModeChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The game's own DOM (its buttons, not React): writes `key` into `el` in the current mode, in Song ngữ as the
 * same two lines as `<Bi>`. Call again after `onLangModeChange` to follow the setting.
 */
export function writeText(el: HTMLElement, key: TextKey): void {
  const text = pairOf(key);
  const mode = getLangMode();
  const stacked = mode === 'both' && text.vi !== text.en;
  el.classList.toggle('bi', stacked);
  if (!stacked) {
    el.textContent = inline(text, mode);
    return;
  }
  const vi = document.createElement('span');
  vi.className = 'bi-vi';
  vi.textContent = text.vi;
  const en = document.createElement('span');
  en.className = 'bi-en';
  en.lang = 'en';
  en.textContent = text.en;
  el.replaceChildren(vi, ' ', en);
}

/** A key as one string in the current mode (game code, aria labels). React screens use `useT()` to follow changes. */
export const t = (key: TextKey, params?: Params): string => inline(pairOf(key, params), getLangMode());
