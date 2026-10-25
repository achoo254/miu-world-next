import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AchievementCategory, achievementSource, type AchievementEntry } from '@miu/schema/achievement';
import { collectionSource } from '@miu/schema/collectible';
import { METRIC_PLACES, PLAQUE_STARS, TrophyNextResponse, TrophyRoomResponse, earnedTrophyKeys, plaqueGoTo, plaqueStars, trophyKey } from '@miu/schema/trophy-room';
import { createTestApp, parentWithChild, type Agent, type TestApp } from '../../test/test-app';
import { inventoryItems, rewardLedger } from '../db/schema';

let app: TestApp;
beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => {
  await app.handle.close();
});

async function playingChild(): Promise<{ agent: Agent; childId: string }> {
  const { agent, childId } = await parentWithChild(app);
  await agent.post(`/api/players/${childId}/select`).expect(200);
  return { agent, childId };
}

const room = async (agent: Agent): Promise<TrophyRoomResponse> => TrophyRoomResponse.parse((await agent.get('/api/trophies').expect(200)).body);
const next = async (agent: Agent): Promise<TrophyNextResponse> => TrophyNextResponse.parse((await agent.get('/api/trophies/next').expect(200)).body);

/**
 * `GET /trophies` as the apps already released parse it: strictly, any other key an error. Their web bundle stays on
 * the phone (and in a tab left open) while the server moves on, so this shape must keep parsing.
 */
const EarnedAt = z.iso.datetime({ offset: true }).nullable();
const ReleasedTrophyRoom = z.strictObject({
  badges: z.array(z.strictObject({ itemId: z.string(), earnedAt: EarnedAt })),
  cups: z.array(z.strictObject({ mapId: z.string(), earnedAt: EarnedAt })),
  plaques: z.array(
    z.strictObject({
      category: AchievementCategory,
      claimed: z.number().int().min(0),
      total: z.number().int().min(0),
      stars: z.number().int().min(0).max(PLAQUE_STARS),
      lastAt: EarnedAt,
    }),
  ),
});

/** A ledger row at a fixed time, as the routes that pay would have written it. */
async function paid(childId: string, source: string, createdAt: Date, items: Record<string, number> = {}): Promise<void> {
  await app.db.insert(rewardLedger).values({ id: randomUUID(), childId, source, items, createdAt });
}

describe('trophy room', () => {
  it('lists every badge, set and achievement category, none earned at first', async () => {
    const { agent } = await playingChild();
    const body = await room(agent);
    const badges = [...app.content.items.values()].filter((item) => item.kind === 'badge').map((item) => item.id);
    expect(badges.length).toBeGreaterThan(0);
    expect(body.badges.map((b) => b.itemId)).toEqual(badges);
    expect(body.cups.map((c) => c.mapId)).toEqual([...app.content.collectibles.keys()]);
    expect(body.plaques.map((p) => p.category)).toEqual(['kham-pha', 'hoc-tap', 'minigame', 'suu-tam', 'su-kien']);
    expect(body.plaques.reduce((n, p) => n + p.total, 0)).toBe(app.content.achievements.size);
    expect(earnedTrophyKeys(body)).toEqual(new Set());
    // Every plaque has somewhere on a map its first star is earned.
    const places = await next(agent);
    expect(Object.fromEntries(places.plaques.map((p) => [p.category, p.goTo?.place]))).toEqual({ 'kham-pha': 'lesson', 'hoc-tap': 'lesson', minigame: 'minigame', 'suu-tam': 'collection', 'su-kien': 'event' });
  });

  it('keeps the shape the apps already released read strictly, whatever she has', async () => {
    const { agent, childId } = await playingChild();
    const [entry] = app.content.achievements.values();
    if (!entry) throw new Error('the catalogue has achievements');
    await paid(childId, achievementSource(entry.id), new Date('2026-10-02T08:00:00Z'));
    const body: unknown = (await agent.get('/api/trophies').expect(200)).body;
    expect(() => ReleasedTrophyRoom.parse(body)).not.toThrow();
    // And this client strips what a later server may add instead of failing on it.
    expect(TrophyRoomResponse.parse({ ...ReleasedTrophyRoom.parse(body), extra: 1 })).not.toHaveProperty('extra');
  });

  it('asks for a signed-in player for where to go next too', async () => {
    await app.agent().get('/api/trophies/next').expect(401);
  });

  it('shows what the ledger paid her, with the day each was first earned', async () => {
    const { agent, childId } = await playingChild();
    const [badge] = [...app.content.items.values()].filter((item) => item.kind === 'badge');
    const [set] = [...app.content.collectibles.keys()];
    const studies = [...app.content.achievements.values()].filter((a) => a.category === 'hoc-tap');
    if (!badge || !set || studies.length < 2) throw new Error('the catalogue has badges, sets and study achievements');
    await paid(childId, 'event:olympic-math-2026:badge', new Date('2026-10-06T08:00:00Z'), { [badge.id]: 1 });
    await paid(childId, 'event:olympic-math-2026:badge:commemorative', new Date('2026-10-07T08:00:00Z'), { [badge.id]: 1 });
    await app.db.insert(inventoryItems).values({ childId, itemId: badge.id, qty: 2 });
    await paid(childId, collectionSource(set), new Date('2026-10-05T09:30:00Z'));
    const half = studies.slice(0, Math.ceil(studies.length / 2));
    for (const [i, entry] of half.entries()) await paid(childId, achievementSource(entry.id), new Date(Date.UTC(2026, 9, 1 + i)));

    const body = await room(agent);
    expect(body.badges.find((b) => b.itemId === badge.id)?.earnedAt).toBe('2026-10-06T08:00:00.000Z');
    expect(body.cups.find((c) => c.mapId === set)?.earnedAt).toBe('2026-10-05T09:30:00.000Z');
    const plaque = body.plaques.find((p) => p.category === 'hoc-tap');
    expect(plaque).toMatchObject({ claimed: half.length, total: studies.length, stars: 2, lastAt: new Date(Date.UTC(2026, 9, half.length)).toISOString() });
    expect(earnedTrophyKeys(body)).toEqual(new Set([trophyKey.badge(badge.id), trophyKey.cup(set), trophyKey.star('hoc-tap', 1), trophyKey.star('hoc-tap', 2)]));
    // The next star of the study plaque is the first study achievement not claimed yet.
    const unclaimed = studies.find((a) => !half.includes(a));
    const places = await next(agent);
    expect(places.plaques.find((p) => p.category === 'hoc-tap')?.goTo).toEqual(unclaimed ? plaqueGoTo([unclaimed], new Set()) : null);
  });

  it('never shows another player what is not hers', async () => {
    const first = await playingChild();
    const [set] = [...app.content.collectibles.keys()];
    if (!set) throw new Error('the catalogue has sets');
    await paid(first.childId, collectionSource(set), new Date('2026-10-05T09:30:00Z'));
    const other = await playingChild();
    expect((await room(other.agent)).cups.every((c) => c.earnedAt === null)).toBe(true);
    expect((await room(first.agent)).cups.find((c) => c.mapId === set)?.earnedAt).not.toBeNull();
  });

  it('asks for a signed-in player', async () => {
    await app.agent().get('/api/trophies').expect(401);
  });
});

describe('where a plaque\'s next star is earned', () => {
  const entry = (id: string, metric: AchievementEntry['metric']): AchievementEntry => ({ id, category: 'su-kien', name: id, description: id, icon: 'trophy', metric, goal: 1, reward: { xp: 0, coin: 0 } });

  it('skips claimed ones and ones no map place leads to, and keeps the region a goal names', () => {
    const list = [entry('mail', { kind: 'mail-gifts' }), entry('farm', { kind: 'minigame-runs', region: 'nong-trai' }), entry('exam', { kind: 'olympiad-runs' })];
    expect(plaqueGoTo(list, new Set())).toEqual({ place: 'minigame', region: 'nong-trai' });
    expect(plaqueGoTo(list, new Set(['farm']))).toEqual({ place: 'event', region: null });
    expect(plaqueGoTo(list, new Set(['farm', 'exam']))).toBeNull();
  });

  it('knows a place, or none, for every kind of goal the catalogue uses', () => {
    for (const a of app.content.achievements.values()) expect(METRIC_PLACES[a.metric.kind]).not.toBeUndefined();
  });
});

describe('plaque stars', () => {
  it('gives one star for the first claim, two from half, three for all', () => {
    expect([0, 1, 6, 7, 13].map((n) => plaqueStars(n, 13))).toEqual([0, 1, 1, 2, 3]);
    expect(plaqueStars(0, 0)).toBe(0);
  });
});
