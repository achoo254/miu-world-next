// The daily quest and its streak (signed-in players). Each Vietnam day one lesson quest is pinned for the player the
// first time the day's quest is asked for (`dailyQuest` of packages/quest: deterministic from the content and her
// progress, no AI), so finishing it never moves the day's pick to another quest. Finishing a run of the pinned quest on
// its day (`markDailyQuestDone`, in the transaction that pays the run) adds a day to the streak, once per day. One row
// per player: no history of days is kept.
import { and, eq, sql } from 'drizzle-orm';
import { Router } from 'express';
import { DailyQuestResponse } from '@miu/schema/daily-quest';
import { currentStreak, dailyQuest, streakAfterDone, type DailyLessonCandidate } from '@miu/quest/daily-lesson';
import { vietnamDay } from '@miu/quest/live-event';
import { activePlayerId, auth, requireParent } from '../auth/auth-context';
import type { ContentCatalog } from '../content/content-catalog';
import type { Db } from '../db/client';
import { dailyQuests, questProgress } from '../db/schema';
import { HttpError } from '../http-error';
import { questState } from '../quest/quest-access';
import type { Tx } from '../reward/reward-ledger';

/** The player's home region (the web's `HOME_REGION`): the daily quest always sends her somewhere else. */
const HOME_REGION = 'nha-cua-be';

type DailyRow = typeof dailyQuests.$inferSelect;

/** Her lesson quests (active quests that teach a topic) in catalogue order, with her progress on each. */
async function lessonsOf(db: Db, content: ContentCatalog, childId: string): Promise<DailyLessonCandidate[]> {
  const rows = new Map((await db.select().from(questProgress).where(eq(questProgress.childId, childId))).map((r) => [r.questId, r]));
  const lessons: DailyLessonCandidate[] = [];
  for (const quest of content.quests.values()) {
    if (quest.status !== 'active' || !quest.topic) continue;
    lessons.push({ id: quest.id, region: quest.region, state: questState(rows.get(quest.id)) });
  }
  return lessons;
}

/** Today's row of the player, pinning today's quest on the day's first ask; null when there is no lesson to pin. */
export async function todaysDailyQuest(db: Db, content: ContentCatalog, childId: string, now: Date): Promise<DailyRow | null> {
  const day = vietnamDay(now.getTime());
  const [row] = await db.select().from(dailyQuests).where(eq(dailyQuests.childId, childId));
  if (row?.day === day) return row;
  const pick = dailyQuest(await lessonsOf(db, content, childId), day, HOME_REGION);
  if (!pick) return null;
  // Two first asks at once: the first pin of the day stands, the other reads it.
  await db
    .insert(dailyQuests)
    .values({ childId, day, questId: pick.id })
    .onConflictDoUpdate({ target: dailyQuests.childId, set: { day, questId: pick.id }, setWhere: and(eq(dailyQuests.childId, childId), sql`${dailyQuests.day} <> ${day}`) });
  const [pinned] = await db.select().from(dailyQuests).where(eq(dailyQuests.childId, childId));
  return pinned ?? null;
}

/**
 * A run of `questId` was just paid: when it is the player's pinned quest of today, the day counts for the streak (once
 * a day). Runs in the paying transaction, the row locked so two finishes at once count the day once.
 */
export async function markDailyQuestDone(tx: Tx, childId: string, questId: string, now: Date): Promise<void> {
  const day = vietnamDay(now.getTime());
  const [row] = await tx.select().from(dailyQuests).where(eq(dailyQuests.childId, childId)).for('update');
  if (!row || row.day !== day || row.questId !== questId || row.doneDay === day) return;
  const next = streakAfterDone({ doneDay: row.doneDay, streak: row.streak, best: row.best }, day);
  await tx.update(dailyQuests).set(next).where(eq(dailyQuests.childId, childId));
}

export function dailyQuestRoutes({ db, content, clock }: { db: Db; content: ContentCatalog; clock: () => Date }): Router {
  const router = Router();

  router.get('/daily-quest', requireParent, async (_req, res) => {
    // The streak is kept with an account: a guest is invited to sign in instead.
    if (auth(res).parent.isGuest) throw new HttpError(403, 'guest-account');
    const childId = await activePlayerId(db, res, content.consent.version);
    const now = clock();
    const today = vietnamDay(now.getTime());
    const row = await todaysDailyQuest(db, content, childId, now);
    const [kept] = row ? [row] : await db.select().from(dailyQuests).where(eq(dailyQuests.childId, childId));
    const streak = { doneDay: kept?.doneDay ?? null, streak: kept?.streak ?? 0, best: kept?.best ?? 0 };
    res.json(
      DailyQuestResponse.parse({
        day: today,
        questId: row?.questId ?? null,
        done: row?.doneDay === today,
        streak: currentStreak(streak, today),
        best: streak.best,
      }),
    );
  });

  return router;
}
