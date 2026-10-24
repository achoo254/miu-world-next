import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SkillCatalog } from './content';
import { Topic } from './learning';
import { TOPIC_SUBJECTS, subjectPagePath, topicPagePath, topicPages, type TopicPageTopic } from './topic-pages';

const TOPICS_DIR = new URL('../../../content/learning/topics/', import.meta.url);
const readTopics = (): Topic[] =>
  readdirSync(TOPICS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(new URL(`${entry.name}/`, TOPICS_DIR))
        .filter((file) => file.endsWith('.json'))
        .map((file) => Topic.parse(JSON.parse(readFileSync(new URL(`${entry.name}/${file}`, TOPICS_DIR), 'utf8')))),
    );

const topic = (id: string, subject: string, order: number): TopicPageTopic => ({ id, subject, order, title: id, summary: id, objectives: [{ text: id }] });

describe('topic pages', () => {
  it('names the subjects as content/learning/skills.json does', () => {
    const catalog = SkillCatalog.parse(JSON.parse(readFileSync(new URL('../../../content/learning/skills.json', import.meta.url), 'utf8')));
    for (const subject of TOPIC_SUBJECTS) expect(catalog.subjects.find((s) => s.id === subject.id)?.name, subject.id).toBe(subject.name);
  });

  it('builds the page addresses from the subject and topic ids', () => {
    expect(subjectPagePath(TOPIC_SUBJECTS[0])).toBe('/hoc/toan/');
    expect(topicPagePath({ subject: 'toan', id: 'so-den-100' })).toBe('/hoc/toan/so-den-100/');
  });

  it('lists only topics a quest teaches, by subject then topic order', () => {
    const topics = [topic('b', 'tieng-viet', 1), topic('c', 'toan', 2), topic('a', 'toan', 1), topic('x', 'english', 1), topic('unused', 'toan', 3)];
    const pages = topicPages(topics, new Set(['a', 'b', 'c', 'x']));
    expect(pages.map((page) => page.topic.id)).toEqual(['a', 'c', 'b']);
    expect(pages[2]?.subject).toEqual({ id: 'tieng-viet', name: 'Tiếng Việt' });
  });

  it('gives every shipped topic a readable ASCII address', () => {
    const topics = readTopics();
    const pages = topicPages(topics, new Set(topics.map((t) => t.id)));
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(topicPagePath(page.topic)).toMatch(/^\/hoc\/[a-z0-9-]+\/[a-z0-9-]+\/$/);
  });
});
