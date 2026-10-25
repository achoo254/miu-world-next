import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { QuestDefinition } from '../../packages/schema/src/content';
import { readTopicFiles } from '../../apps/server/src/content/learning-topics';
import { learningReviewSummary } from './learning-review-summary';

const FIXTURE = path.join(import.meta.dirname, '../../apps/server/test/fixtures/learning-grade3');
const raw = JSON.parse(readFileSync(path.join(FIXTURE, 'quests/bang-tin-cho.json'), 'utf8')) as Record<string, unknown>;
const { topics } = readTopicFiles(path.join(FIXTURE, 'topics'));
const names = new Map([['tieng-viet', 'Tiếng Việt']]);
const reading = (title: string, source: unknown): Record<string, unknown> => ({ title, body: 'Một đoạn văn.', source });

describe('learning review summary', () => {
  it('counts active learning quests per subject and readings by source kind, listing the folk ones by title', () => {
    const quest = QuestDefinition.parse({
      ...raw,
      texts: {
        ...(raw.texts as Record<string, unknown>),
        'bai-mot': reading('Cây khế', { kind: 'folk', title: 'Truyện cổ tích Cây khế' }),
        'bai-hai': reading('Chi chi chành chành', { kind: 'folk', title: 'Đồng dao Chi chi chành chành' }),
        'bai-ba': reading('Bảng tin', { kind: 'original' }),
        'bai-bon': reading('Không nguồn', undefined),
      },
    });
    const draft = QuestDefinition.parse({ ...raw, id: 'ban-nhap', status: 'draft' });
    const summary = learningReviewSummary([quest, draft], topics, names, { quests: 2, topics: 1, matches: 0 });
    expect(summary.subjects).toEqual([{ subject: 'tieng-viet', subjectName: 'Tiếng Việt', quests: 1 }]);
    expect(summary.readings).toEqual({
      // The fixture's own notice (original), the four above, and the draft's notice: a draft is not a stub.
      total: 6,
      byKind: { original: 3, folk: 2, 'public-domain': 0, none: 1 },
      folk: [
        { title: 'Đồng dao Chi chi chành chành', reading: 'Chi chi chành chành' },
        { title: 'Truyện cổ tích Cây khế', reading: 'Cây khế' },
      ],
    });
    expect(summary.copyCheck).toEqual({ quests: 2, topics: 1, matches: 0 });
  });

  it('keeps the copy check empty when it could not run', () => {
    expect(learningReviewSummary([], topics, names, null)).toMatchObject({ subjects: [{ subject: 'tieng-viet', quests: 0 }], copyCheck: null });
  });
});
