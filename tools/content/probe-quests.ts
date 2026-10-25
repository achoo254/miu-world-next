// `pnpm content:probe <quest id> [<quest id> …]`: the content checks a writer needs while writing learning quests,
// for the given quests only: topics and objectives, the textbook copy check, objectives practised and expressions, and
// repeated lines. Exits 1 when any list is not empty. `pnpm content:check` stays the full gate.
import path from 'node:path';
import { CONTENT_DIR, readQuestDefinitions } from '../../apps/server/src/content/content-catalog';
import { readTopicFiles, learningQuestIssues, indexTopics } from '../../apps/server/src/content/learning-topics';
import { checkRepoTextbookCopy } from './no-textbook-copy';
import { checkLearningLinks } from './learning-links';
import { varietyIssues } from './content-variety';
const ids = process.argv.slice(2);
const quests = readQuestDefinitions(path.join(CONTENT_DIR, 'quests'));
const { topics } = readTopicFiles(path.join(CONTENT_DIR, 'learning/topics'));
const pick = (xs: string[]) => xs.filter((x) => ids.some((id) => x.includes(id)));
const report = {
  learning: pick(learningQuestIssues(quests, indexTopics(topics))),
  copy: pick(checkRepoTextbookCopy(quests, topics).issues),
  links: pick(checkLearningLinks(topics, quests).issues),
  variety: pick(varietyIssues(quests)),
};
console.log(JSON.stringify(report, null, 2));
if (Object.values(report).some((list) => list.length > 0)) process.exitCode = 1;
