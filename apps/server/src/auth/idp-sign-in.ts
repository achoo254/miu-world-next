// The part of a sign-in through the account service the web and the app share, once the IdP's ID token is checked:
// which account the identity is (idp-account-link.ts), and the new Miu session.
import type { Response } from 'express';
import type { Db } from '../db/client';
import type { SessionKind } from '../db/schema';
import { accountForIdentity } from './idp-account-link';
import type { IdpIdentity } from './idp-client';
import type { createSignIn, SignedIn } from './sign-in';

/** Why a sign-in did not finish; the web shows it on /login?error=…, the app as the API error. */
export type IdpSignInFailure = 'idp' | 'idp-email-unverified' | 'idp-conflict' | 'idp-google-mismatch';

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
  options: { kind: SessionKind },
): Promise<{ ok: true; signedIn: SignedIn } | { ok: false; code: IdpSignInFailure }> {
  if (!identity) return { ok: false, code: 'idp' };
  const account = await accountForIdentity(db, issuer, identity, clock());
  if (!account.ok) return { ok: false, code: FAILURE_OF[account.reason] };
  const signedIn = await signIn(res, account.parentId, {
    kind: options.kind,
    idpSid: options.kind === 'web' ? identity.sid : null,
  });
  return { ok: true, signedIn };
}
