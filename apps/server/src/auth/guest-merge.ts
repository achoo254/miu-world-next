// A guest signs in with an identity that already has a Miu account (they played signed in before, elsewhere): what they
// earned as a guest moves into that account, then the guest account goes. Only rows the server itself wrote are moved,
// server to server; nothing the client says is read. The rules keep the account's books balanced:
//
// - Ledger rows move to the account's primary player. A quest run is renamed to the account's next run of that quest
//   (every run pays, owner 03/10/2026); any other source is paid once per player, so a source the account already has
//   is dropped, and so is what it added to the aggregates.
// - Aggregates (items, skill XP, owned shop things) are the guest's minus what the dropped rows added; coins and XP are
//   ledger sums, so they follow by themselves.
// - A quest's progress row moves when the account has none, or has it unfinished while the guest finished it.
// - Weekly play time adds up. Pets, village friends, mail, home and positions move only where the account has none.
// - The account's character, players and switches stay as they are.
//
// An account without a primary player yet (it signed in but never accepted the policy) simply takes the guest's player.
import { randomUUID } from 'node:crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  childProfiles,
  consents,
  homeDecor,
  homeObjects,
  inventoryItems,
  mail,
  npcFriendships,
  parents,
  petBonds,
  playerPositions,
  playTime,
  questProgress,
  rewardLedger,
  shopInventory,
  skillProgress,
  stepAttempts,
  timetables,
} from '../db/schema';
import { paidRuns, questOfSource, questSource, type Tx } from '../reward/reward-ledger';

/** What the moved rows added up to on the guest's side and must not count twice. */
type Counts = Map<string, number>;

const add = (counts: Counts, values: Readonly<Record<string, number>>): void => {
  for (const [key, n] of Object.entries(values)) counts.set(key, (counts.get(key) ?? 0) + n);
};

async function primaryOf(tx: Tx, parentId: string): Promise<string | null> {
  const [row] = await tx
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(and(eq(childProfiles.parentId, parentId), eq(childProfiles.isPrimary, true)));
  return row?.id ?? null;
}

/** Moves the guest's ledger to `to`; returns the items and skill XP of the rows dropped as already paid. */
async function moveLedger(tx: Tx, from: string, to: string): Promise<{ items: Counts; skillXp: Counts }> {
  const dropped = { items: new Map<string, number>(), skillXp: new Map<string, number>() };
  const rows = await tx.select().from(rewardLedger).where(eq(rewardLedger.childId, from)).orderBy(asc(rewardLedger.createdAt), asc(rewardLedger.source));
  const nextRun = new Map<string, number>();
  for (const row of rows) {
    const quest = questOfSource(row.source);
    let source = row.source;
    if (quest) {
      const run = nextRun.get(quest) ?? (await paidRuns(tx, to, quest)) + 1;
      nextRun.set(quest, run + 1);
      source = questSource(quest, run);
    }
    const inserted = await tx
      .insert(rewardLedger)
      .values({ id: randomUUID(), childId: to, source, xp: row.xp, coins: row.coins, skillXp: row.skillXp, items: row.items, createdAt: row.createdAt })
      .onConflictDoNothing()
      .returning({ id: rewardLedger.id });
    if (inserted.length === 0) {
      add(dropped.items, row.items);
      add(dropped.skillXp, row.skillXp);
    }
  }
  return dropped;
}

/** Adds the guest's aggregate quantities, less what dropped rows added, to the account's (sorted: same lock order as grants). */
async function mergeCounts(
  rows: readonly { key: string; n: number }[],
  dropped: Counts,
  upsert: (key: string, n: number) => Promise<void>,
): Promise<void> {
  for (const { key, n } of [...rows].sort((a, b) => a.key.localeCompare(b.key))) {
    const kept = n - (dropped.get(key) ?? 0);
    if (kept > 0) await upsert(key, kept);
  }
}

async function mergeAggregates(tx: Tx, from: string, to: string, dropped: { items: Counts; skillXp: Counts }): Promise<void> {
  const items = await tx.select().from(inventoryItems).where(eq(inventoryItems.childId, from));
  await mergeCounts(
    items.map((r) => ({ key: r.itemId, n: r.qty })),
    dropped.items,
    async (itemId, qty) => {
      await tx
        .insert(inventoryItems)
        .values({ childId: to, itemId, qty })
        .onConflictDoUpdate({ target: [inventoryItems.childId, inventoryItems.itemId], set: { qty: sql`${inventoryItems.qty} + ${qty}` } });
    },
  );
  const owned = await tx.select().from(shopInventory).where(eq(shopInventory.childId, from));
  await mergeCounts(
    owned.map((r) => ({ key: r.itemId, n: r.qty })),
    dropped.items,
    async (itemId, qty) => {
      await tx
        .insert(shopInventory)
        .values({ childId: to, itemId, qty })
        .onConflictDoUpdate({ target: [shopInventory.childId, shopInventory.itemId], set: { qty: sql`${shopInventory.qty} + ${qty}` } });
    },
  );
  const skills = await tx.select().from(skillProgress).where(eq(skillProgress.childId, from));
  await mergeCounts(
    skills.map((r) => ({ key: r.skillId, n: r.xp })),
    dropped.skillXp,
    async (skillId, xp) => {
      await tx
        .insert(skillProgress)
        .values({ childId: to, skillId, xp })
        .onConflictDoUpdate({ target: [skillProgress.childId, skillProgress.skillId], set: { xp: sql`${skillProgress.xp} + ${xp}` } });
    },
  );
}

async function mergeQuestProgress(tx: Tx, from: string, to: string): Promise<void> {
  const theirs = new Map((await tx.select().from(questProgress).where(eq(questProgress.childId, to))).map((r) => [r.questId, r]));
  for (const row of await tx.select().from(questProgress).where(eq(questProgress.childId, from))) {
    const existing = theirs.get(row.questId);
    if (existing && (existing.completedAt !== null || row.completedAt === null)) continue;
    const values = { ...row, childId: to };
    await tx
      .insert(questProgress)
      .values(values)
      .onConflictDoUpdate({
        target: [questProgress.childId, questProgress.questId],
        set: { completedSteps: row.completedSteps, found: row.found, completedAt: row.completedAt, stars: row.stars, xpAwarded: row.xpAwarded },
      });
    // The step counters belong to the run in the row: they come with it.
    await tx.delete(stepAttempts).where(and(eq(stepAttempts.childId, to), eq(stepAttempts.questId, row.questId)));
    const attempts = await tx.select().from(stepAttempts).where(and(eq(stepAttempts.childId, from), eq(stepAttempts.questId, row.questId)));
    if (attempts.length > 0) await tx.insert(stepAttempts).values(attempts.map((a) => ({ ...a, childId: to })));
  }
}

/** The rest of the guest's things, where the account has none of its own (and weekly play time, which adds up). */
async function mergeRest(tx: Tx, from: string, to: string): Promise<void> {
  for (const row of await tx.select().from(playTime).where(eq(playTime.childId, from))) {
    await tx
      .insert(playTime)
      .values({ ...row, childId: to })
      .onConflictDoUpdate({ target: [playTime.childId, playTime.weekStart], set: { seconds: sql`${playTime.seconds} + ${row.seconds}` } });
  }
  const friends = await tx.select().from(npcFriendships).where(eq(npcFriendships.childId, from));
  if (friends.length > 0) await tx.insert(npcFriendships).values(friends.map((r) => ({ ...r, childId: to }))).onConflictDoNothing();
  const pets = await tx.select().from(petBonds).where(eq(petBonds.childId, from));
  if (pets.length > 0) await tx.insert(petBonds).values(pets.map((r) => ({ ...r, childId: to }))).onConflictDoNothing();
  const letters = await tx.select().from(mail).where(eq(mail.childId, from));
  if (letters.length > 0) await tx.insert(mail).values(letters.map((r) => ({ ...r, id: randomUUID(), childId: to }))).onConflictDoNothing();
  const positions = await tx.select().from(playerPositions).where(eq(playerPositions.childId, from));
  if (positions.length > 0) await tx.insert(playerPositions).values(positions.map((r) => ({ ...r, childId: to }))).onConflictDoNothing();
  const [decor] = await tx.select().from(homeDecor).where(eq(homeDecor.childId, from));
  if (decor) await tx.insert(homeDecor).values({ ...decor, childId: to }).onConflictDoNothing();
  const [objects] = await tx.select().from(homeObjects).where(eq(homeObjects.childId, from));
  if (objects) await tx.insert(homeObjects).values({ ...objects, childId: to }).onConflictDoNothing();
  const [timetable] = await tx.select().from(timetables).where(eq(timetables.childId, from));
  if (timetable) await tx.insert(timetables).values({ ...timetable, childId: to }).onConflictDoNothing();
}

/**
 * Moves guest account `guestId`'s progress into account `targetId`, then deletes the guest account (its sessions and
 * every row of its player go with it), in one transaction. Does nothing unless `guestId` is still a guest account.
 */
export async function mergeGuestInto(db: Db, guestId: string, targetId: string): Promise<void> {
  if (guestId === targetId) return;
  await db.transaction(async (tx) => {
    // Both accounts locked in id order: two sign-ins at once never deadlock, and never merge one guest twice.
    for (const id of [guestId, targetId].sort()) await tx.select({ id: parents.id }).from(parents).where(eq(parents.id, id)).for('update');
    const [guest] = await tx.select({ isGuest: parents.isGuest }).from(parents).where(eq(parents.id, guestId));
    if (!guest?.isGuest) return;
    const from = await primaryOf(tx, guestId);
    const to = await primaryOf(tx, targetId);
    if (from && !to) {
      // The account never got a player: the guest's own player (with its consent) becomes the account's.
      await tx.update(childProfiles).set({ parentId: targetId, onlineAllowed: true, voiceChatAllowed: true }).where(eq(childProfiles.id, from));
      const accepted = await tx.select().from(consents).where(eq(consents.parentId, guestId));
      if (accepted.length > 0) await tx.insert(consents).values(accepted.map((c) => ({ ...c, id: randomUUID(), parentId: targetId }))).onConflictDoNothing();
    } else if (from && to) {
      const dropped = await moveLedger(tx, from, to);
      await mergeAggregates(tx, from, to, dropped);
      await mergeQuestProgress(tx, from, to);
      await mergeRest(tx, from, to);
    }
    await tx.delete(parents).where(eq(parents.id, guestId));
  });
  console.info('guest account merged', guestId, targetId);
}
