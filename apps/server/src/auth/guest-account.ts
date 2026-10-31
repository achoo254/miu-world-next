// Playing as a guest: a newcomer starts without signing in. `POST /api/auth/guest` makes a guest account (no email of
// their own, no account-service link) with a web session, and from there it is an account like any other: the policy
// to accept, the character to make, quests graded and paid by the server. A guest plays alone (online play, voice,
// friends, invites and extra players stay off until they sign in), and the progress lives on the server under the
// session cookie of this one device. Signing in keeps it (idp-sign-in.ts, guest-merge.ts). Guest accounts whose
// session ended long ago are pruned now and then, since nobody can ever reach them again.
import { randomUUID } from 'node:crypto';
import { and, eq, exists, gt, lt, not, sql } from 'drizzle-orm';
import { Router } from 'express';
import type { ServerConfig } from '../config';
import type { Db } from '../db/client';
import { parents, sessions } from '../db/schema';
import { HttpError } from '../http-error';
import { ipKey, limiter } from '../rate-limit';
import { accountSummary } from './account-summary';
import { optionalAuth } from './auth-context';
import { setSessionCookie } from './session-cookie';
import { createSession, GUEST_SESSION_MS } from './session-store';

/** The stored email of a guest account: unique, in the reserved `.invalid` domain, never a real inbox. */
export const guestEmail = (parentId: string): string => `guest-${parentId}@guest.invalid`;

/** Guest accounts younger than this are never pruned, whatever their sessions say (one just being made). */
const PRUNE_MIN_AGE_MS = 24 * 60 * 60 * 1000;
/** Pruning runs at most this often per server process. */
const PRUNE_EVERY_MS = 60 * 60 * 1000;

/**
 * Deletes the guest accounts no live session can reach any more (everything of theirs goes with them, by cascade).
 * A session counts as live until its end and while it was seen within GUEST_SESSION_MS. Returns how many went.
 */
export async function pruneGuestAccounts(db: Db, now: Date): Promise<number> {
  const live = db
    .select({ one: sql`1` })
    .from(sessions)
    .where(and(eq(sessions.parentId, parents.id), gt(sessions.expiresAt, now), gt(sessions.lastSeenAt, new Date(now.getTime() - GUEST_SESSION_MS))));
  const removed = await db
    .delete(parents)
    .where(and(eq(parents.isGuest, true), lt(parents.createdAt, new Date(now.getTime() - PRUNE_MIN_AGE_MS)), not(exists(live))))
    .returning({ id: parents.id });
  return removed.length;
}

export interface GuestRouteDeps {
  db: Db;
  config: ServerConfig;
  clock: () => Date;
  policyVersion: string;
}

export function guestRoutes({ db, config, clock, policyVersion }: GuestRouteDeps): Router {
  const router = Router();
  // Per IP, wider than sign-ups: a school or a family shares one address. Tests raise it with the sign-up limit.
  const guestLimit = limiter(60 * 60 * 1000, config.registerLimitPerHour * 3, ipKey);
  let lastPrune = 0;

  router.post('/auth/guest', guestLimit, async (req, res) => {
    // The web only: the app signs in through the account service and has no cookie to keep a guest in.
    if (req.headers.authorization !== undefined) throw new HttpError(404, 'not-found');
    if (optionalAuth(res)) throw new HttpError(409, 'signed-in');
    const now = clock();
    if (now.getTime() - lastPrune >= PRUNE_EVERY_MS) {
      lastPrune = now.getTime();
      try {
        const pruned = await pruneGuestAccounts(db, now);
        if (pruned > 0) console.info('guest accounts pruned', pruned);
      } catch (err) {
        // Pruning is housekeeping: a failure never stops a guest from starting.
        console.warn('guest prune failed', err instanceof Error ? err.name : typeof err);
      }
    }
    const parentId = randomUUID();
    const [parent] = await db.insert(parents).values({ id: parentId, email: guestEmail(parentId), isGuest: true, createdAt: now }).returning();
    if (!parent) throw new Error('guest insert returned no row');
    const { token, session } = await createSession(db, parent.id, now, { kind: 'web', lifetimeMs: GUEST_SESSION_MS });
    setSessionCookie(res, config, token, GUEST_SESSION_MS);
    console.info('guest account started', parent.id);
    res.status(201).json(await accountSummary(db, { session, parent }, policyVersion));
  });

  return router;
}
