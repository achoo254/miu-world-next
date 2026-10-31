import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DailyQuestResponse } from '@miu/schema/daily-quest';
import * as t from '../db/schema';
import { paidRuns } from '../reward/reward-ledger';
import { createTestApp, FIXTURE_CONTENT, parentWithChild, type Agent, type TestApp } from '../../test/test-app';

// The fixture quests teach no topic: here quest A and quest B are lessons (both away from home), so there is a pick.
const LESSONS = new Set(['quest-a', 'quest-b']);
const CONTENT = {
  ...FIXTURE_CONTENT,
  quests: new Map([...FIXTURE_CONTENT.quests].map(([id, quest]) => [id, LESSONS.has(id) && quest.status === 'active' ? { ...quest, topic: 'phep-cong' } : quest])),
};

/** 2026-10-31 10:00 in Vietnam. */
const MORNING = Date.parse('2026-10-31T03:00:00Z');
const DAY_MS = 86_400_000;

let app: TestApp;
beforeAll(async () => {
  app = await createTestApp(undefined, {}, undefined, CONTENT);
  app.advance(MORNING - Date.now());
});
afterAll(async () => {
  await app.handle.close();
});

const PLAY: Record<string, Array<[string, object]>> = {
  'quest-a': [['meet-vet', {}], ['find-letter', { target: 'clue-letter' }], ['solve-tree', { answer: { value: 5 } }]],
  'quest-b': [['open-gate', { target: 'gate-ch2' }], ['count-apples', { answer: { placed: ['apple-1', 'apple-3'] } }], ['solve-tree', { answer: { value: 8 } }]],
};
/** Plays the quest's next run through (a finished quest is played again by naming the next run). */
async function finish(agent: Agent, childId: string, quest: string): Promise<void> {
  const run = (await paidRuns(app.db, childId, quest)) + 1;
  for (const [stepId, body] of PLAY[quest] ?? []) await agent.post(`/api/quests/${quest}/steps/${stepId}/complete`).send({ ...body, run }).expect(200);
}
const daily = async (agent: Agent): Promise<DailyQuestResponse> => DailyQuestResponse.parse((await agent.get('/api/daily-quest').expect(200)).body);

describe('daily quest and streak', () => {
  it('pins one lesson for the day, which finishing does not move, and counts the day once', async () => {
    const { agent, childId } = await parentWithChild(app);
    const today = await daily(agent);
    expect(today).toMatchObject({ day: '2026-10-31', done: false, streak: 0, best: 0 });
    expect(LESSONS.has(today.questId ?? '')).toBe(true);
    const other = [...LESSONS].find((id) => id !== today.questId) ?? '';
    // Another quest finished: not the day's.
    await finish(agent, childId, other);
    expect(await daily(agent)).toMatchObject({ questId: today.questId, done: false, streak: 0 });
    await finish(agent, childId, today.questId ?? '');
    expect(await daily(agent)).toEqual({ ...today, done: true, streak: 1, best: 1 });
    // A replay the same day changes nothing.
    await finish(agent, childId, today.questId ?? '');
    expect(await daily(agent)).toMatchObject({ done: true, streak: 1 });
  });

  it('adds a day for the next day, shows zero after a missed day, and starts again at one', async () => {
    const { agent, childId } = await parentWithChild(app);
    const day1 = await daily(agent);
    await finish(agent, childId, day1.questId ?? '');
    app.advance(DAY_MS);
    try {
      const day2 = await daily(agent);
      expect(day2).toMatchObject({ day: '2026-11-01', done: false, streak: 1 });
      // Every lesson is finished now or soon: the pick still offers one to play again.
      await finish(agent, childId, day2.questId ?? '');
      expect(await daily(agent)).toMatchObject({ done: true, streak: 2, best: 2 });
      app.advance(2 * DAY_MS);
      const day4 = await daily(agent);
      expect(day4).toMatchObject({ day: '2026-11-03', streak: 0, best: 2 });
      await finish(agent, childId, day4.questId ?? '');
      expect(await daily(agent)).toMatchObject({ done: true, streak: 1, best: 2 });
      const [row] = await app.db.select().from(t.dailyQuests).where(eq(t.dailyQuests.childId, childId));
      expect(row).toMatchObject({ doneDay: '2026-11-03', streak: 1, best: 2 });
    } finally {
      app.advance(-3 * DAY_MS);
    }
  });

  it('counts nothing for a player who never asked for the day (nothing was pinned)', async () => {
    const { agent, childId } = await parentWithChild(app);
    await finish(agent, childId, 'quest-a');
    expect(await app.db.select().from(t.dailyQuests).where(eq(t.dailyQuests.childId, childId))).toEqual([]);
  });

  it('needs a player of the account (no session: 401)', async () => {
    await app.agent().get('/api/daily-quest').expect(401);
  });
});
