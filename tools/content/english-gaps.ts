// What every quest still lacks in English: its title and summary, a step's twin (`en`), its support layers and its
// feedback lines, by the same rules side quests and stories already meet (englishIssues with `complete`).
//
//   pnpm content:english            one line per quest with gaps, and the total
//   pnpm content:english <id> …     the gaps of those quests, one per line
//   pnpm content:english --json F   writes {questId: [gap, …]} to F
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { readQuestDefinitions } from '../../apps/server/src/content/content-catalog';
import { englishIssues, type QuestDefinition } from '../../packages/schema/src/content';

const QUEST_DIR = path.resolve(import.meta.dirname, '../../content/quests');

/** The English a quest still lacks (empty when it reads in both languages). */
export function englishGaps(quest: QuestDefinition): string[] {
  if (quest.status !== 'active') return [];
  return englishIssues(quest, true);
}

/** Every quest with gaps, by id. */
export function allEnglishGaps(quests = readQuestDefinitions(QUEST_DIR)): Map<string, string[]> {
  const gaps = new Map<string, string[]>();
  for (const quest of quests) {
    const list = englishGaps(quest);
    if (list.length) gaps.set(quest.id, list);
  }
  return gaps;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const args = process.argv.slice(2);
  const jsonAt = args.indexOf('--json');
  const jsonFile = jsonAt >= 0 ? args[jsonAt + 1] : undefined;
  const ids = args.filter((a, i) => !a.startsWith('--') && (jsonAt < 0 || i !== jsonAt + 1));
  const gaps = allEnglishGaps();
  if (jsonFile) writeFileSync(jsonFile, `${JSON.stringify(Object.fromEntries(gaps), null, 2)}\n`);
  if (ids.length) {
    for (const id of ids) {
      const list = gaps.get(id) ?? [];
      console.log(`${id}: ${list.length ? '' : 'complete'}`);
      for (const gap of list) console.log(`  - ${gap}`);
    }
  } else {
    let total = 0;
    for (const [id, list] of gaps) {
      total += list.length;
      console.log(`${id.padEnd(40)} ${list.length}`);
    }
    console.log(`content:english: ${gaps.size} quests, ${total} gaps`);
  }
  if (args.includes('--strict') && gaps.size > 0) process.exit(1);
}
