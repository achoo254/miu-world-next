// What the public topic pages (`/hoc/<subject>/<topic>/`) say, read from the repo for the build and the share-card
// generator: the topics from `content/learning/topics`, the quests from `content/quests`, the region names.
//
// Quest files hold the answers, so a page may take nothing from one but the fields `pickQuestPageFields` names. It is
// the only code here that reads a quest, and it reads those keys and no others (never `steps`, `review`, `texts`,
// `sevenQuestions`, `reward`); `pnpm security:dist` is only the second net. A topic's curriculum alignment (`gdpt`)
// is internal: `pickTopicPageFields` leaves it out.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Topic } from '../../packages/schema/src/learning.ts';
import { RegionCatalog } from '../../packages/schema/src/region.ts';
import { topicPages, type TopicPage, type TopicPageTopic } from '../../packages/schema/src/topic-pages.ts';

/** How a page calls the player where quest text says `{name}`. */
const PLAYER_WORD = 'bạn';

/**
 * Quest text with `{name}` filled for a reader who is nobody in particular: "Bạn" where a sentence starts, "bạn" in
 * the middle of one.
 */
export function fillPlayerName(text: string): string {
  const capital = PLAYER_WORD.charAt(0).toUpperCase() + PLAYER_WORD.slice(1);
  return text.replace(/(^|[.!?…]\s+)\{name\}/g, `$1${capital}`).replaceAll('{name}', PLAYER_WORD);
}

/** The one view of a quest a public page gets. */
export interface QuestPageFields {
  /** Names the quest in the page's "play this topic" link. */
  id: string;
  /** The topic the quest teaches: which page lists it. */
  topic: string;
  title: string;
  summary: string;
  /** Region id (the page shows the region's name). */
  region: string;
}

/**
 * The allowlisted fields of a quest file, or null for one that is not an active quest teaching a topic. Anything not
 * named here stays unread: add a key only for text that is safe to show every visitor.
 */
export function pickQuestPageFields(raw: unknown): QuestPageFields | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { id, status, topic, title, summary, region } = raw as Record<string, unknown>;
  if (status !== 'active') return null;
  if (typeof id !== 'string' || typeof topic !== 'string' || typeof title !== 'string' || typeof summary !== 'string' || typeof region !== 'string') return null;
  return { id, topic, title: fillPlayerName(title), summary: fillPlayerName(summary), region };
}

/** The topic-bearing, active quests of a quest folder, by file name. */
export function readQuestPageFields(questDir: string): QuestPageFields[] {
  return readdirSync(questDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      const picked = pickQuestPageFields(JSON.parse(readFileSync(path.join(questDir, file), 'utf8')) as unknown);
      return picked ? [picked] : [];
    });
}

/** What a page shows of a topic: no curriculum alignment, objectives by their text only. */
export function pickTopicPageFields(topic: Topic): TopicPageTopic {
  return {
    id: topic.id,
    subject: topic.subject,
    title: topic.title,
    summary: topic.summary,
    order: topic.order,
    objectives: topic.objectives.map((objective) => ({ text: objective.text })),
  };
}

/** Every topic file of `<dir>/<subject>/<topic>.json`, schema-checked (the content gate checks the rest). */
export function readTopicPageFields(topicsDir: string): TopicPageTopic[] {
  return readdirSync(topicsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .flatMap((subject) =>
      readdirSync(path.join(topicsDir, subject))
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => pickTopicPageFields(Topic.parse(JSON.parse(readFileSync(path.join(topicsDir, subject, file), 'utf8'))))),
    );
}

/** What one topic page lists: an activity of the game that teaches the topic. */
export interface TopicActivity extends QuestPageFields {
  regionName: string;
}

export interface TopicPageData extends TopicPage {
  /** The game's quests that teach this topic (at least one), by file name. */
  activities: TopicActivity[];
}

/** The topic pages the repo's content gives, in subject then topic order (the pages' previous/next order). */
export function readTopicPageData(contentDir: string): TopicPageData[] {
  const regions = new Map(RegionCatalog.parse(JSON.parse(readFileSync(path.join(contentDir, 'world/regions.json'), 'utf8'))).regions.map((r) => [r.id, fillPlayerName(r.name)]));
  const quests = readQuestPageFields(path.join(contentDir, 'quests'));
  const topics = readTopicPageFields(path.join(contentDir, 'learning/topics'));
  return topicPages(topics, new Set(quests.map((q) => q.topic))).map((page) => ({
    ...page,
    activities: quests
      .filter((q) => q.topic === page.topic.id)
      .map((q) => ({ ...q, regionName: regions.get(q.region) ?? q.region })),
  }));
}
