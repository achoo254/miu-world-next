// The trophy room of the child's home (Phòng truyền thống): what she has earned, as the server keeps it, and the
// keys of the display spots the home map writes for each piece (world-entities.ts `trophies`). The server says
// what is hers (`GET /api/trophies`); the game shows a spot's piece only when its key is among hers, its empty
// stand otherwise.
import { z } from 'zod';
import { AchievementCategory, type AchievementEntry, type AchievementMetricKind } from './achievement';
import { ContentId } from './content';

/** Stars on an achievement category's plaque. */
export const PLAQUE_STARS = 3;

/**
 * Stars a category's plaque shows for the achievements claimed of it: one for the first, two from half of them,
 * all three once every one is claimed.
 */
export function plaqueStars(claimed: number, total: number): number {
  if (claimed <= 0 || total <= 0) return 0;
  if (claimed >= total) return PLAQUE_STARS;
  return claimed * 2 >= total ? 2 : 1;
}

/** Display spot keys: an event badge (item id), a collection set's cup (its map id), a plaque's nth star. */
export const trophyKey = {
  badge: (itemId: string): string => `badge:${itemId}`,
  cup: (mapId: string): string => `cup:${mapId}`,
  star: (category: AchievementCategory, n: number): string => `star:${category}:${n}`,
};

/**
 * Where a plaque's next star is earned, for the trophy room's "Đi tới" (navigation only: the server still pays every
 * claim). `lesson`: the next lesson (in `region` when given); `minigame`: a minigame side quest (in `region` when
 * given); `collection`: a region whose collection set is not complete yet; `event`: an event on now.
 */
export const TROPHY_PLACES = ['lesson', 'minigame', 'collection', 'event'] as const;
export const TrophyPlace = z.enum(TROPHY_PLACES);
export type TrophyPlace = z.infer<typeof TrophyPlace>;

/**
 * The place each kind of achievement goal is worked toward; null where no map place leads to it (the shop, mail,
 * wearables, co-op play, knowledge gates). Every metric kind is listed, so a new kind must say where it is earned.
 */
export const METRIC_PLACES: Readonly<Record<AchievementMetricKind, TrophyPlace | null>> = {
  lessons: 'lesson',
  'regions-started': 'lesson',
  'regions-complete': 'lesson',
  'three-stars': 'lesson',
  'quest-runs': 'lesson',
  'minigame-runs': 'minigame',
  'minigames-tried': 'minigame',
  'boss-wins': 'lesson',
  'player-level': 'lesson',
  'skill-level': 'lesson',
  'skills-at-level': 'lesson',
  'subject-level': 'lesson',
  'coins-earned': 'lesson',
  collectibles: 'collection',
  'collection-sets': 'collection',
  'region-chests': 'lesson',
  'region-tiers': 'lesson',
  'wearables-owned': null,
  'shop-purchases': null,
  'olympiad-runs': 'event',
  'olympiad-awards': 'event',
  'mail-gifts': null,
  'gates-opened': null,
  'skill-gifts': 'lesson',
  'coop-runs': null,
  'coop-challenges': null,
};

export const TrophyGoTo = z.strictObject({ place: TrophyPlace, region: ContentId.nullable() });
export type TrophyGoTo = z.infer<typeof TrophyGoTo>;

/**
 * Where a category's next star is earned: the place of its first achievement in catalogue order that she has not
 * claimed and that a map place leads to (its region when the goal names one); null when none is left.
 */
export function plaqueGoTo(entries: readonly AchievementEntry[], claimed: ReadonlySet<string>): TrophyGoTo | null {
  for (const entry of entries) {
    if (claimed.has(entry.id)) continue;
    const place = METRIC_PLACES[entry.metric.kind];
    if (place) return { place, region: 'region' in entry.metric ? (entry.metric.region ?? null) : null };
  }
  return null;
}

/** When it was earned, ISO; null while not earned yet. */
const EarnedAt = z.iso.datetime({ offset: true }).nullable();

export const TrophyRoomResponse = z.strictObject({
  /** Every event badge of the catalogue (content/items, kind `badge`), hers or not. */
  badges: z.array(z.strictObject({ itemId: ContentId, earnedAt: EarnedAt })),
  /** Every collection set: its cup is hers once she claimed the full set. */
  cups: z.array(z.strictObject({ mapId: ContentId, earnedAt: EarnedAt })),
  /** One plaque per achievement category: how many she claimed of how many, its stars, the latest claim. */
  plaques: z.array(
    z.strictObject({
      category: AchievementCategory,
      claimed: z.number().int().min(0),
      total: z.number().int().min(0),
      stars: z.number().int().min(0).max(PLAQUE_STARS),
      lastAt: EarnedAt,
      /** Where her next star of this category is earned (null: no map place leads to one). */
      goTo: TrophyGoTo.nullable(),
    }),
  ),
});
export type TrophyRoomResponse = z.infer<typeof TrophyRoomResponse>;

/** The display keys of everything she has: the spots whose pieces stand in her trophy room. */
export function earnedTrophyKeys(room: TrophyRoomResponse): Set<string> {
  const keys = new Set<string>();
  for (const b of room.badges) if (b.earnedAt) keys.add(trophyKey.badge(b.itemId));
  for (const c of room.cups) if (c.earnedAt) keys.add(trophyKey.cup(c.mapId));
  for (const p of room.plaques) for (let n = 1; n <= p.stars; n++) keys.add(trophyKey.star(p.category, n));
  return keys;
}

