// `pnpm content:gaps [--missing] [--review]`: which objectives of each topic (content/learning/topics) the active
// quests practise, and which exercise kinds are still missing. `--missing` lists every objective, not only the ones
// short of a kind; `--review` also writes the totals per topic and the learning content summary for the review page
// (assets/generated/review/objective-coverage.json and learning-content.json; run `pnpm assets:manifest` after it).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { SkillCatalog } from '../../packages/schema/src/content';
import type { Topic } from '../../packages/schema/src/learning';
import { CONTENT_DIR, readContentJson, readQuestDefinitions } from '../../apps/server/src/content/content-catalog';
import { readTopicFiles } from '../../apps/server/src/content/learning-topics';
import { ASSETS_DIR } from '../assets/asset-lib';
import { checkLearningLinks, type ObjectiveCoverage } from './learning-links';
import { learningReviewSummary, type CopyCheckResult } from './learning-review-summary';
import { checkRepoTextbookCopy } from './no-textbook-copy';

export const COVERAGE_FILE = path.join(ASSETS_DIR, 'generated/review/objective-coverage.json');
export const LEARNING_CONTENT_FILE = path.join(ASSETS_DIR, 'generated/review/learning-content.json');

/** One line per topic (objectives practised in full / all), then its objectives that miss a kind (all with `showAll`). */
export function objectiveTable(coverage: readonly ObjectiveCoverage[], showAll: boolean): string[] {
  const lines = [`${'topic / objective'.padEnd(48)} ${'steps'.padStart(5)} ${'phủ'.padStart(5)}`];
  for (const topic of [...new Set(coverage.map((c) => c.topic))]) {
    const rows = coverage.filter((c) => c.topic === topic);
    const done = rows.filter((c) => c.missing.length === 0).length;
    lines.push(`${topic.padEnd(48)} ${''.padStart(5)} ${`${done}/${rows.length}`.padStart(5)}`);
    for (const row of rows) {
      if (!showAll && row.missing.length === 0) continue;
      lines.push(`  ${row.objective.padEnd(46)} ${String(row.steps).padStart(5)} ${(row.missing.length === 0 ? 'ok' : 'thiếu').padStart(5)}${row.missing.length > 0 ? `  ${row.missing.join(', ')}` : ''}`);
    }
  }
  return lines;
}

export interface TopicCoverage {
  subject: string;
  subjectName: string;
  topic: string;
  title: string;
  objectives: number;
  /** Objectives practised with every exercise kind they need. */
  covered: number;
  /** Learning steps of active quests that name an objective of the topic. */
  steps: number;
  percent: number;
}

/** Share of objectives covered, one decimal; only a topic with every objective covered shows 100. */
export function percentCovered(covered: number, objectives: number): number {
  if (objectives === 0) return 100;
  const percent = Math.round((covered / objectives) * 1000) / 10;
  return covered < objectives ? Math.min(percent, 99.9) : percent;
}

/** Totals per topic, in topic order, as the review page shows them. */
export function coverageSummary(
  topics: readonly Topic[],
  coverage: readonly ObjectiveCoverage[],
  subjectNames: ReadonlyMap<string, string> = new Map(),
): { topics: TopicCoverage[] } {
  return {
    topics: topics.map((topic) => {
      const rows = coverage.filter((c) => c.topic === topic.id);
      const covered = rows.filter((c) => c.missing.length === 0).length;
      return {
        subject: topic.subject,
        subjectName: subjectNames.get(topic.subject) ?? topic.subject,
        topic: topic.id,
        title: topic.title,
        objectives: rows.length,
        covered,
        steps: rows.reduce((n, c) => n + c.steps, 0),
        percent: percentCovered(covered, rows.length),
      };
    }),
  };
}

function main(): void {
  const { values } = parseArgs({ options: { missing: { type: 'boolean' }, review: { type: 'boolean' } } });
  const quests = readQuestDefinitions(path.join(CONTENT_DIR, 'quests'));
  const { topics, issues } = readTopicFiles(path.join(CONTENT_DIR, 'learning/topics'));
  const report = checkLearningLinks(topics, quests);
  for (const line of objectiveTable(report.coverage, values.missing ?? false)) console.log(line);
  if (values.review) {
    const { subjects } = readContentJson(SkillCatalog, path.join(CONTENT_DIR, 'learning/skills.json'));
    const names = new Map(subjects.map((s) => [s.id, s.name]));
    writeFileSync(COVERAGE_FILE, `${JSON.stringify(coverageSummary(topics, report.coverage, names), null, 2)}\n`);
    // The copy check as content:check runs it; only its counts reach the page, never what matched.
    const copy = checkRepoTextbookCopy(quests, topics);
    for (const warning of copy.warnings) console.warn(`warning: ${warning}`);
    const copyCheck: CopyCheckResult | null = copy.warnings.length > 0 ? null : { quests: quests.length, topics: topics.length, matches: copy.issues.length };
    writeFileSync(LEARNING_CONTENT_FILE, `${JSON.stringify(learningReviewSummary(quests, topics, names, copyCheck), null, 2)}\n`);
    for (const file of [COVERAGE_FILE, LEARNING_CONTENT_FILE]) console.log(`review totals written to ${path.relative(process.cwd(), file)}`);
    console.log('run pnpm assets:manifest');
  }
  const problems = [...issues, ...report.issues];
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) to fix first:`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
