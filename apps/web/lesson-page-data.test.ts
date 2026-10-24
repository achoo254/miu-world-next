import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { leaksIn, questSecrets } from '../../tools/security/scan-dist';
import { fillPlayerName, pickQuestPageFields, readQuestPageFields, readTopicPageData } from './lesson-page-data';

const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../content');
const readQuest = (id: string): unknown => JSON.parse(readFileSync(path.join(CONTENT_DIR, 'quests', `${id}.json`), 'utf8'));

describe('fillPlayerName', () => {
  it('writes "Bé" where a sentence starts and "bé" inside one', () => {
    expect(fillPlayerName('{name} nhặt đồ. {name} chạy; cả lớp chờ {name}! Rồi {name} về.')).toBe('Bé nhặt đồ. Bé chạy; cả lớp chờ bé! Rồi bé về.');
    expect(fillPlayerName('Nhà của {name}')).toBe('Nhà của bé');
    expect(fillPlayerName('Không có tên')).toBe('Không có tên');
  });
});

describe('the quest field picker', () => {
  it('returns exactly the allowlisted keys of a quest that has answers', () => {
    const quest = readQuest('toan2-cd1-b01');
    // The file really holds what must not leave it.
    expect(Object.keys(quest as object)).toEqual(expect.arrayContaining(['steps', 'texts', 'reward']));
    const picked = pickQuestPageFields(quest);
    expect(Object.keys(picked ?? {}).sort()).toEqual(['id', 'region', 'summary', 'title', 'topic']);
    expect(picked).toMatchObject({ id: 'toan2-cd1-b01', topic: 'so-den-100', region: 'truong-hoc' });
    expect(picked?.title).not.toContain('{name}');
  });

  it('leaves out everything else, whatever a quest file holds', () => {
    const quest = {
      id: 'q',
      status: 'active',
      topic: 'so-den-100',
      lesson: 'toan2-t1-b01',
      title: 'Tên {name}',
      summary: '{name} đi chơi.',
      region: 'truong-hoc',
      steps: [{ support: { answer: { text: 'ĐÁP-ÁN-BÍ-MẬT', explanation: 'GIẢI-THÍCH-BÍ-MẬT' } } }],
      review: 'teacher-pending',
      sevenQuestions: { reward: 'PHẦN-THƯỞNG' },
      texts: [{ body: 'BÀI-ĐỌC' }],
      reward: { xp: 100 },
      places: { a: 'ĐỊA-ĐIỂM' },
    };
    const picked = pickQuestPageFields(quest);
    expect(picked).toEqual({ id: 'q', topic: 'so-den-100', region: 'truong-hoc', title: 'Tên bé', summary: 'Bé đi chơi.' });
    expect(JSON.stringify(picked)).not.toMatch(/BÍ-MẬT|PHẦN-THƯỞNG|BÀI-ĐỌC|ĐỊA-ĐIỂM|toan2-t1/);
  });

  it('skips what is not an active quest teaching a topic', () => {
    const base = { id: 'q', status: 'active', topic: 't', title: 't', summary: 's', region: 'r' };
    expect(pickQuestPageFields(base)).not.toBeNull();
    for (const bad of [{ ...base, status: 'draft' }, { ...base, status: 'stub' }, { ...base, topic: undefined }, { ...base, title: 5 }, { ...base, summary: undefined }, null, 'x', []]) {
      expect(pickQuestPageFields(bad)).toBeNull();
    }
  });
});

describe('the topic pages of the shipped content', () => {
  const pages = readTopicPageData(CONTENT_DIR);

  it('has a page for every topic an active quest teaches, in subject then topic order', () => {
    const topics = new Set(readQuestPageFields(path.join(CONTENT_DIR, 'quests')).map((quest) => quest.topic));
    expect(pages.map((page) => page.topic.id).sort()).toEqual([...topics].sort());
    expect(pages[0]?.topic.id).toBe('so-den-100');
    expect(pages.map((page) => page.subject.id).filter((id, i, all) => all.indexOf(id) === i)).toEqual(['toan', 'tieng-viet']);
    for (const page of pages) expect(page.activities.length, page.topic.id).toBeGreaterThan(0);
  });

  it('lists each activity with its region name and no placeholder left', () => {
    const first = pages[0]?.activities[0];
    expect(first).toMatchObject({ id: 'toan2-cd1-b01', region: 'truong-hoc' });
    expect(first?.regionName).toBeTruthy();
    expect(JSON.stringify(pages)).not.toContain('{name}');
  });

  it("keeps the topics' curriculum alignment out", () => {
    const text = JSON.stringify(pages);
    expect(text).not.toMatch(/"gdpt"|"grade"|"requirements"|"strand"/);
    expect(pages[0]?.topic.objectives.length).toBeGreaterThan(0);
  });

  it('carries no answer text of any quest', () => {
    const quests = readdirSync(path.join(CONTENT_DIR, 'quests')).map((file) => JSON.parse(readFileSync(path.join(CONTENT_DIR, 'quests', file), 'utf8')) as unknown);
    const secrets = questSecrets(quests);
    expect(secrets.length).toBeGreaterThan(100);
    expect(leaksIn(JSON.stringify(pages), secrets)).toEqual([]);
  });
});
