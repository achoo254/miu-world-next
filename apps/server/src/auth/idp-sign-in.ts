// The part of a sign-in through the account service the web and the app share, once the IdP's ID token is checked:
// the re-authentication rule, which account the identity is (idp-account-link.ts), and the new Miu session.
//
// A re-authentication is the account owner's confirmation that turning voice chat on for an extra player needs
// (player-settings-routes.ts). It counts only when this sign-in asked for one and the ID token proves it: a provider
// asked for the credentials again (`amr` "reauth"; the IdP only grants it to Google with prompt=login + max_age=0 and
// to Apple, never GitHub) and its `auth_time` is within REAUTH_MAX_AGE_S. Asking for one (`prompt=login`, `max_age=0`)
// is the client's part; whether it happened is read from the token alone, never from what the app says. The proven
// time is kept on the new session (`sessions.reauth_at`).
import type { Response } from 'express';
import type { Db } from '../db/client';
import type { SessionKind } from '../db/schema';
import { serverEvents } from '../analytics/server-events';
import { optionalAuth } from './auth-context';
import { mergeGuestInto } from './guest-merge';
import { accountForIdentity, REVIEW_SIGN_IN } from './idp-account-link';
import type { IdpIdentity } from './idp-client';
import type { createSignIn, SignedIn } from './sign-in';

/** A re-authentication must have happened at the IdP within this window. */
export const REAUTH_MAX_AGE_S = 5 * 60;

/** Why a sign-in did not finish; the web shows it on /login?error=…, the app as the API error. */
export type IdpSignInFailure = 'idp' | 'idp-reauth' | 'idp-email-unverified' | 'idp-conflict' | 'idp-google-mismatch';

/** Whether the ID token proves a fresh re-authentication at a provider that asked again. */
export function provesReauth(identity: Pick<IdpIdentity, 'amr' | 'authTime'>, now: Date): boolean {
  const nowS = Math.floor(now.getTime() / 1000);
  return identity.amr.includes('reauth') && identity.authTime !== null && identity.authTime <= nowS + 60 && nowS - identity.authTime <= REAUTH_MAX_AGE_S;
}

const FAILURE_OF = { 'email-unverified': 'idp-email-unverified', conflict: 'idp-conflict', 'google-mismatch': 'idp-google-mismatch' } as const;

export interface IdpSignInDeps {
  db: Db;
  issuer: string;
  clock: () => Date;
  signIn: ReturnType<typeof createSignIn>;
}

export async function signInWithIdentity(
  { db, issuer, clock, signIn }: IdpSignInDeps,
  res: Response,
  identity: IdpIdentity | null,
  options: { reauth: boolean; kind: SessionKind },
): Promise<{ ok: true; signedIn: SignedIn } | { ok: false; code: IdpSignInFailure }> {
  if (!identity) return { ok: false, code: 'idp' };
  const now = clock();
  // Counted only when this sign-in asked for one (the web: the server's own pending state; the app: its request) and
  // the token proves it; a "reauth" left in the IdP session from an earlier sign-in elsewhere is not recorded.
  const freshReauth = options.reauth && provesReauth(identity, now);
  if (options.reauth && !freshReauth) return { ok: false, code: 'idp-reauth' };
  // The guest this device played as: kept as the new account, or merged into the account the identity already has.
  const current = optionalAuth(res);
  const guestId = current?.parent.isGuest ? current.parent.id : null;
  const review = identity.amr.includes(REVIEW_SIGN_IN);
  const account = await accountForIdentity(db, issuer, identity, now, review ? null : guestId);
  if (!account.ok) return { ok: false, code: FAILURE_OF[account.reason] };
  if (account.outcome === 'upgraded') {
    // Its sign-up: the guest's first consent did not count as one.
    serverEvents()?.signUp(account.parentId, 'idp');
  } else if (guestId && !review) {
    await mergeGuestInto(db, guestId, account.parentId);
  }
  const signedIn = await signIn(res, account.parentId, {
    kind: options.kind,
    idpSid: options.kind === 'web' ? identity.sid : null,
    // The IdP's own sign-in time (proven above), never later than now: a clock a little ahead does not stretch it.
    reauthAt: freshReauth && identity.authTime !== null ? new Date(Math.min(identity.authTime * 1000, now.getTime())) : null,
  });
  return { ok: true, signedIn };
}
