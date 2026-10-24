// The public topic pages (`/hoc/<subject>/<topic>/`): one per topic of content/learning/topics that an active quest
// teaches, plus one page per subject (`/hoc/toan/`, `/hoc/tieng-viet/`). The static pages the web build writes, the
// analytics route table and the web app's links all name a page through this module, so an address is spelled one
// way everywhere. A page is named by the ids of its subject and topic, which never change once a topic ships.
// Plain data and string work only, no file access.
import type { Topic } from './learning';

/**
 * The subjects that have pages, in the order the pages list them; `id` is the subject's id in
 * content/learning/skills.json and `name` its name there (a test holds the two in step).
 */
export const TOPIC_SUBJECTS = [
  { id: 'toan', name: 'Toán' },
  { id: 'tieng-viet', name: 'Tiếng Việt' },
] as const satisfies ReadonlyArray<{ id: string; name: string }>;
export type TopicSubject = (typeof TOPIC_SUBJECTS)[number];

/** Where the pages live. */
export const TOPIC_PAGES_ROOT = '/hoc';

/** `/hoc/toan/` */
export const subjectPagePath = (subject: { id: string }): string => `${TOPIC_PAGES_ROOT}/${subject.id}/`;

/** `/hoc/toan/so-den-100/` */
export const topicPagePath = (topic: { subject: string; id: string }): string => `${TOPIC_PAGES_ROOT}/${topic.subject}/${topic.id}/`;

/** The part of a topic a page shows (no curriculum alignment: that stays internal). */
export type TopicPageTopic = Pick<Topic, 'id' | 'subject' | 'title' | 'summary' | 'order'> & { objectives: ReadonlyArray<{ text: string }> };

export interface TopicPage {
  topic: TopicPageTopic;
  subject: TopicSubject;
}

/**
 * The topics that get a page: those of `topicsWithQuests` (the ids of the topics an active quest teaches) whose
 * subject has pages, in subject order, then each subject's topic order.
 */
export function topicPages(topics: readonly TopicPageTopic[], topicsWithQuests: ReadonlySet<string>): TopicPage[] {
  return TOPIC_SUBJECTS.flatMap((subject) =>
    topics
      .filter((topic) => topic.subject === subject.id && topicsWithQuests.has(topic.id))
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({ topic, subject })),
  );
}
