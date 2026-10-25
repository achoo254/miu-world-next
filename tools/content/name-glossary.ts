// English names for everything the game names in Vietnamese: characters, places (maps, landmarks, streets,
// gates), things (items, quest objects, food), clothes, home decor, interaction verbs and titles.
//
// The English lives in one glossary per group, `content/i18n/names/<group>.json`, keyed by the exact
// Vietnamese name ("Koala Ghép Tranh": "Puzzle Koala"), so a name gets one English twin wherever it shows:
// the label over a head, the minimap, the dialogue, the backpack. Names that already carry their own English
// (an item's `en.name`, an event character's `nameEn`) keep it and are not repeated here.
//
//   pnpm content:names            lists the names still missing English, by group
//   pnpm content:names --todo DIR writes them as `<group>.json` ({"Vietnamese": ""}) to fill in
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const NAME_GROUPS = ['character', 'place', 'thing', 'wearable', 'home', 'action', 'title'] as const;
export type NameGroup = (typeof NAME_GROUPS)[number];

const ROOT = path.resolve(import.meta.dirname, '../..');
export const GLOSSARY_DIR = path.join(ROOT, 'content/i18n/names');
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (v: Json | undefined): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);
const readJson = (file: string): Json => JSON.parse(readFileSync(file, 'utf8')) as Json;

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    if (statSync(full).isDirectory()) return jsonFiles(full);
    return f.endsWith('.json') ? [full] : [];
  });
}

/** A Vietnamese name worth an English twin (plain ASCII names such as "Koala" read the same in both). */
const needsEnglish = (text: string): boolean => VIETNAMESE.test(text) && text.length <= 80;

/** Whether the object already gives `key` its own English (`en.name`, `nameEn`, `{vi, en}`). */
function hasOwnEnglish(obj: JsonObject, key: string): boolean {
  const en = obj.en;
  if (isObject(en) && typeof en[key] === 'string' && en[key] !== '') return true;
  const twin = obj[`${key}En`];
  return typeof twin === 'string' && twin !== '';
}

/** Every name the game shows in Vietnamese, with the group whose glossary owns it (first group wins). */
export function harvestNames(): Map<string, NameGroup> {
  const found = new Map<string, NameGroup>();
  const add = (text: Json | undefined, group: NameGroup) => {
    if (typeof text === 'string' && needsEnglish(text) && !found.has(text)) found.set(text, group);
  };
  /** Walks a JSON tree adding the values of `keys` that lack their own English. */
  const walk = (node: Json, keys: readonly string[], group: NameGroup) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, keys, group));
    if (!isObject(node)) return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'en') continue;
      if (typeof v === 'string') {
        if (keys.includes(k) && !hasOwnEnglish(node, k)) add(v, group);
      } else walk(v, keys, group);
    }
  };
  const content = (rel: string) => path.join(ROOT, 'content', rel);

  // Characters first, so a character whose name is also a place keeps the character's twin.
  for (const file of jsonFiles(content('npcs'))) walk(readJson(file), ['name'], 'character');
  for (const file of jsonFiles(content('events'))) walk(readJson(file), ['name'], 'character');
  const maps = jsonFiles(path.join(ROOT, 'assets/generated/world')).filter((f) => f.endsWith('entities.json'));
  const mapData = maps.map((f) => readJson(f)).filter(isObject);
  for (const map of mapData) {
    for (const x of asArray(map.interactables)) if (isObject(x) && x.kind === 'npc') add(x.name, 'character');
    for (const x of asArray(map.ambients)) if (isObject(x)) add(x.name, 'character');
  }
  const targets = readJson(content('world/targets.json'));
  if (isObject(targets) && isObject(targets.targets)) {
    for (const t of Object.values(targets.targets)) {
      if (isObject(t) && typeof t.look === 'string' && /^(person|animal)-/.test(t.look)) add(t.name, 'character');
    }
  }
  walk(readJson(content('pets.json')), ['name'], 'character');
  walk(readJson(content('species.json')), ['name'], 'character');

  // Places: maps, landmarks, gates and buses, the places quests send the child to.
  walk(readJson(content('world/regions.json')), ['name'], 'place');
  for (const map of mapData) {
    for (const x of asArray(map.landmarks)) if (isObject(x)) add(x.name, 'place');
    for (const x of asArray(map.interactables)) if (isObject(x) && x.kind === 'gate') add(x.name, 'place');
    for (const x of asArray(map.interactables)) if (isObject(x)) add(x.board, 'place');
  }
  for (const file of jsonFiles(content('quests'))) {
    const quest = readJson(file);
    if (isObject(quest) && isObject(quest.places)) for (const p of Object.values(quest.places)) add(p, 'place');
  }

  // Things: items, collectibles, food, quest objects, what lies about on the maps.
  for (const file of [...jsonFiles(content('items')), content('collectibles.json'), content('recipes.json'), content('pet-gear.json')]) {
    walk(readJson(file), ['name'], 'thing');
  }
  if (isObject(targets) && isObject(targets.targets)) for (const t of Object.values(targets.targets)) if (isObject(t)) add(t.name, 'thing');
  for (const map of mapData) for (const x of asArray(map.interactables)) if (isObject(x) && x.kind !== 'gate') add(x.name, 'thing');
  for (const file of jsonFiles(content('quests'))) walk(readJson(file), ['name', 'label'], 'thing');

  for (const file of [...jsonFiles(content('accessories')), ...jsonFiles(content('outfits'))]) walk(readJson(file), ['name'], 'wearable');
  for (const file of jsonFiles(content('home'))) walk(readJson(file), ['name'], 'home');

  // Verbs on the labels ("Nói chuyện", "Mở rương").
  walk(readJson(content('world/looks.json')), ['label'], 'action');
  if (isObject(targets)) walk(targets, ['label'], 'action');
  for (const map of mapData) for (const x of asArray(map.interactables)) if (isObject(x)) add(x.label, 'action');
  for (const file of jsonFiles(content('events'))) walk(readJson(file), ['label'], 'action');

  // Titles: badges, achievements, subjects and topics.
  for (const file of [...jsonFiles(content('progression')), content('collectibles.json'), content('region-rewards.json')]) {
    walk(readJson(file), ['name', 'title'], 'title');
  }
  for (const file of jsonFiles(content('learning'))) walk(readJson(file), ['name', 'title'], 'title');
  return found;
}

function asArray(v: Json | undefined): Json[] {
  return Array.isArray(v) ? v : [];
}

/** The glossary: Vietnamese name → English, over every group file. */
export function readGlossary(): Map<string, string> {
  const glossary = new Map<string, string>();
  for (const group of NAME_GROUPS) {
    const file = path.join(GLOSSARY_DIR, `${group}.json`);
    if (!existsSync(file)) continue;
    const entries = readJson(file);
    if (!isObject(entries)) throw new Error(`${file}: expected an object of "Vietnamese": "English"`);
    for (const [vi, en] of Object.entries(entries)) {
      if (typeof en === 'string' && en.trim() !== '') glossary.set(vi, en);
    }
  }
  return glossary;
}

/**
 * Problems with the glossary: names still missing English and broken `{placeholders}`. An English twin equal to the
 * Vietnamese is allowed: a personal name ("Tí") or a letter taught as spelling ("Ê") reads the same in both.
 */
export function glossaryIssues(names = harvestNames(), glossary = readGlossary()): { missing: Map<NameGroup, string[]>; broken: string[] } {
  const missing = new Map<NameGroup, string[]>();
  for (const [vi, group] of names) {
    if (glossary.has(vi)) continue;
    missing.set(group, [...(missing.get(group) ?? []), vi]);
  }
  const broken: string[] = [];
  const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  for (const [vi, en] of glossary) {
    if (holes(vi) !== holes(en)) broken.push(`"${vi}" → "${en}": placeholders differ`);
  }
  return { missing, broken };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const { missing, broken } = glossaryIssues();
  const todo = process.argv.indexOf('--todo');
  if (todo > 0) {
    const dir = path.resolve(process.argv[todo + 1] ?? 'names-todo');
    mkdirSync(dir, { recursive: true });
    for (const [group, list] of missing) {
      writeFileSync(path.join(dir, `${group}.json`), `${JSON.stringify(Object.fromEntries(list.map((n) => [n, ''])), null, 2)}\n`);
    }
  }
  let total = 0;
  for (const group of NAME_GROUPS) {
    const list = missing.get(group) ?? [];
    total += list.length;
    console.log(`${group.padEnd(10)} ${String(list.length).padStart(5)} missing${list.length ? `  e.g. ${list.slice(0, 3).join(' · ')}` : ''}`);
  }
  for (const line of broken) console.log(`broken: ${line}`);
  console.log(total === 0 && broken.length === 0 ? 'content:names OK' : `content:names: ${total} names without English, ${broken.length} broken`);
  if (process.argv.includes('--strict') && (total > 0 || broken.length > 0)) process.exit(1);
}
