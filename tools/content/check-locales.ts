// The multilingual display's dictionaries (apps/web/src/ui/i18n/locales, Master Plan §8c): every Vietnamese key has
// an English line and a Simplified Chinese line with the same `{placeholders}` (a pool has as many lines), and neither
// has a key of its own. A pool never says the same line twice, and the pools shown again and again (the loading tips)
// are big enough to stay fresh.
// The web app falls back to Vietnamese (English for Chinese) at run time; this gate keeps that fallback from hiding a gap.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const LOCALES_DIR = path.resolve(import.meta.dirname, '../../apps/web/src/ui/i18n/locales');

type Locale = Readonly<Record<string, unknown>>;

/** The dictionaries checked against the Vietnamese one: file name and the language's name in a report. */
export const TRANSLATIONS = [
  { file: 'en', name: 'English' },
  { file: 'zh-CN', name: 'Chinese' },
] as const;
export type Translation = (typeof TRANSLATIONS)[number];

/** Pools that must hold at least this many lines (owner, 05/10/2026: the loading tips never changed). */
export const POOL_MINIMUMS: Readonly<Record<string, number>> = { 'loading.tips': 20 };

const placeholders = (text: string): string => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

function lineIssues(key: string, vi: unknown, other: unknown, lang: Translation): string[] {
  if (typeof vi === 'string') {
    if (typeof other !== 'string' || other.trim() === '') return [`${key}: no ${lang.name} line`];
    return placeholders(vi) === placeholders(other) ? [] : [`${key}: placeholders differ ({${placeholders(vi)}} vs {${placeholders(other)}})`];
  }
  if (Array.isArray(vi) && vi.every((line) => typeof line === 'string')) {
    if (!Array.isArray(other) || other.length !== vi.length) return [`${key}: ${lang.name} pool needs ${vi.length} lines`];
    const pool: string[] = [];
    const minimum = POOL_MINIMUMS[key] ?? 0;
    // The Vietnamese pool's own size and repeats are reported once, with the English.
    if (lang.file === 'en' && vi.length < minimum) pool.push(`${key}: pool needs at least ${minimum} lines (has ${vi.length})`);
    const sides: ReadonlyArray<readonly [string, readonly unknown[]]> = lang.file === 'en' ? [['vi', vi], [lang.file, other]] : [[lang.file, other]];
    for (const [side, lines] of sides) {
      const repeated = lines.filter((line, i) => lines.indexOf(line) !== i);
      if (repeated.length > 0) pool.push(`${key}: ${side} pool repeats ${JSON.stringify(repeated[0])}`);
    }
    return [...pool, ...vi.flatMap((line: string, i) => lineIssues(`${key}[${i}]`, line, other[i], lang))];
  }
  // A malformed Vietnamese value is reported once, with the English.
  return lang.file === 'en' ? [`${key}: a value must be a line or a list of lines`] : [];
}

/** Problems between the Vietnamese dictionary and one translation, English by default (empty: they match). */
export function localeIssues(vi: Locale, other: Locale, lang: Translation = TRANSLATIONS[0]): string[] {
  const issues = Object.entries(vi).flatMap(([key, value]) => lineIssues(key, value, other[key], lang));
  for (const key of Object.keys(other)) if (!(key in vi)) issues.push(`${key}: in ${lang.file}.json only`);
  return issues.map((issue) => `locales: ${issue}`);
}

export function checkLocales(dir = LOCALES_DIR): string[] {
  const read = (name: string): Locale => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8')) as Locale;
  try {
    const vi = read('vi');
    return TRANSLATIONS.flatMap((lang) => localeIssues(vi, read(lang.file), lang));
  } catch (error) {
    return [`locales: ${error instanceof Error ? error.message : String(error)}`];
  }
}
