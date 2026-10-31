import { asc, eq } from 'drizzle-orm';
import { MeResponse, ParentDto } from '@miu/schema/account';
import type { Db } from '../db/client';
import { childProfiles } from '../db/schema';
import type { AuthContext } from './auth-context';
import { hasCurrentConsent } from './consent-store';

/** Everything the web app needs to route the account: consent, players and the active player. */
export async function accountSummary(db: Db, ctx: AuthContext, policyVersion: string): Promise<MeResponse> {
  return MeResponse.parse({
    parent: ParentDto.parse({ id: ctx.parent.id, email: ctx.parent.email, guest: ctx.parent.isGuest }),
    consentAccepted: await hasCurrentConsent(db, ctx.parent.id, policyVersion),
    activePlayerId: ctx.session.activeChildId,
    players: await db
      .select({ id: childProfiles.id, displayName: childProfiles.displayName, primary: childProfiles.isPrimary })
      .from(childProfiles)
      .where(eq(childProfiles.parentId, ctx.parent.id))
      .orderBy(asc(childProfiles.createdAt), asc(childProfiles.id))
      .then((rows) => [...rows].sort((a, b) => Number(b.primary) - Number(a.primary))),
  });
}
