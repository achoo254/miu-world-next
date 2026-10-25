// No book, grade, lesson number or page on what the web shows. The game teaches by subject and topic: players and
// visitors never read a school grade ("lớp 2"), a textbook ("SGK", "sách giáo khoa", the series' name), a printed
// lesson number ("Bài 3.") or a page ("Trang 25"). This check reads the web-visible text that is not quest content (the
// UI dictionaries, the app shell, the region names, the topics shown on the public pages, the title and summary of
// every quest the public pages list) and the story the game tells (characters, map things, every string of every
// quest).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { readTopicPageData } from '../../apps/web/lesson-page-data';
import { LOCALES_DIR } from './check-locales';

/** What may not be said, each with the name a report gives it. */
export const FORBIDDEN_WORDING: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  // "lớp 2", "lớp 2A", "Lớp Hai": a grade, or a class of that grade.
  { name: 'a grade ("lớp 2")', pattern: /lớp (?:2|hai)(?![\d])/iu },
  { name: 'a grade ("Grade 2")', pattern: /\bgrade 2\b/i },
  { name: 'a textbook ("SGK")', pattern: /\bSGK\b/i },
  { name: 'a textbook ("sách giáo khoa")', pattern: /sách giáo khoa/iu },
  { name: 'the textbook series ("Kết nối tri thức")', pattern: /kết nối tri thức/iu },
  { name: 'a lesson number ("Bài 3.")', pattern: /\bBài \d+\./u },
  { name: 'a page ("Trang 25")', pattern: /\bTrang \d+/iu },
  { name: 'a grade ("lớp 1", "lớp Một")', pattern: /lớp (?:1|một)(?![\d])/iu },
  { name: 'a textbook title ("Toán 2", "Tiếng Việt 2")', pattern: /(?:toán|tiếng việt) 2(?![\d])/iu },
  { name: 'a textbook volume ("tập một")', pattern: /\btập (?:một|hai)\b/iu },
  { name: 'a school term ("học kì 1")', pattern: /học k[ìỳ] (?:1|2|i)\b/iu },
  { name: 'a grade ("second grade", "Year 2")', pattern: /\b(?:2nd|second) grade\b|\byear (?:2|two)\b/i },
];

/**
 * What story content (characters, map things, quests) may not say: a school grade or a textbook. A story may well
 * name a page of a book in the game ("trang 12") or "tập một mình", so pages, lesson numbers and volumes stay allowed
 * there.
 */
export const FORBIDDEN_IN_CONTENT: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  ...FORBIDDEN_WORDING.filter(({ name }) => /grade|textbook/.test(name) && !/volume|title/.test(name)),
  { name: 'a grade ("first grade", "Year One", "class 2A")', pattern: /\byear (?:one|1)\b|\b(?:1st|first) grade\b|\bclass [12][A-Z]\b/i },
];

/** Every forbidden wording in `text`, as "<where>: <what> in "<excerpt>"". */
export function wordingIssues(where: string, text: string, forbidden: ReadonlyArray<{ name: string; pattern: RegExp }> = FORBIDDEN_WORDING): string[] {
  return forbidden.flatMap(({ name, pattern }) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const start = Math.max(0, match.index - 20);
    return [`${where}: ${name} in "${text.slice(start, match.index + match[0].length + 20).replace(/\s+/g, ' ').trim()}"`];
  });
}

/** Every string of a JSON value, with its path (`"seo.title"`, `"loading.tips[3]"`, `regions[0].name`). */
export function jsonStrings(value: unknown, at = ''): Array<{ at: string; text: string }> {
  if (typeof value === 'string') return [{ at, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, i) => jsonStrings(item, `${at}[${i}]`));
  if (value !== null && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => jsonStrings(item, at ? `${at}.${key}` : key));
  return [];
}

/** The words of an HTML file without its tags, comments and scripts (what a visitor or a crawler reads). */
export function htmlText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

export interface WordingSources {
  repoRoot: string;
  contentDir: string;
}

/** JSON files of a folder, by name (none when the folder is missing). */
const jsonFilesOf = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);

/** The check as `pnpm content:check` runs it. */
export function checkBookOrGradeWording({ repoRoot, contentDir }: WordingSources): string[] {
  const rel = (file: string): string => path.relative(repoRoot, file).split(path.sep).join('/');
  const issues: string[] = [];
  for (const lang of ['vi', 'en']) {
    const file = path.join(LOCALES_DIR, `${lang}.json`);
    for (const { at, text } of jsonStrings(JSON.parse(readFileSync(file, 'utf8')) as unknown)) issues.push(...wordingIssues(`${rel(file)} ${at}`, text));
  }
  const shell = path.join(repoRoot, 'apps/web/index.html');
  issues.push(...wordingIssues(rel(shell), htmlText(readFileSync(shell, 'utf8'))));
  const regions = path.join(contentDir, 'world/regions.json');
  for (const { at, text } of jsonStrings(JSON.parse(readFileSync(regions, 'utf8')) as unknown)) issues.push(...wordingIssues(`content/world/regions.json ${at}`, text));
  for (const page of readTopicPageData(contentDir)) {
    const where = `topic page ${page.topic.subject}/${page.topic.id}`;
    for (const text of [page.subject.name, page.topic.title, page.topic.summary, ...page.topic.objectives.map((o) => o.text)]) issues.push(...wordingIssues(where, text));
    // Every quest a public page lists shows its title and summary there.
    for (const activity of page.activities) for (const text of [activity.title, activity.summary]) issues.push(...wordingIssues(`${where}, quest ${activity.id}`, text));
  }
  // The story the game tells: characters, the things on the maps, and every quest.
  const story = [
    ...jsonFilesOf(path.join(contentDir, 'npcs')).map((f) => `npcs/${f}`),
    'world/targets.json',
    ...jsonFilesOf(path.join(contentDir, 'quests')).map((f) => `quests/${f}`),
  ];
  for (const file of story) {
    const full = path.join(contentDir, file);
    if (!existsSync(full)) continue;
    for (const { at, text } of jsonStrings(JSON.parse(readFileSync(full, 'utf8')) as unknown)) issues.push(...wordingIssues(`content/${file} ${at}`, text, FORBIDDEN_IN_CONTENT));
  }
  return issues;
}
