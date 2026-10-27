import { and, eq, lt } from 'drizzle-orm';
import type { Response } from 'express';
import type { ServerConfig } from '../config';
import type { Db } from '../db/client';
import { parents, sessions, type SessionKind } from '../db/schema';
import { optionalAuth, type AuthContext } from './auth-context';
import { setSessionCookie } from './session-cookie';
import { createSession, deleteSession } from './session-store';

export interface SignInDeps {
  db: Db;
  config: ServerConfig;
  clock: () => Date;
}

export interface SignInOptions {
  /** `web` sets the session cookie; `native` (the app) gets the token back to send as a Bearer token. */
  kind: SessionKind;
  /** The IdP session the web sign-in came through (its back-channel logout ends this session). */
  idpSid?: string | null;
  /** When the IdP proved a re-authentication for this sign-in (idp-sign-in.ts); null or absent otherwise. */
  reauthAt?: Date | null;
}

export interface SignedIn extends AuthContext {
  /** The new session's token: already set as the cookie for `web`; the app keeps it for `native`. */
  token: string;
}

/**
 * Starts a fresh session for a parent who just signed in: drops the session the request came with
 * and prunes expired ones.
 */
export function createSignIn({ db, config, clock }: SignInDeps) {
  return async function signIn(res: Response, parentId: string, options: SignInOptions): Promise<SignedIn> {
    const current = optionalAuth(res);
    if (current) await deleteSession(db, current.session.id);
    await db.delete(sessions).where(and(eq(sessions.parentId, parentId), lt(sessions.expiresAt, clock())));
    const [parent] = await db.select().from(parents).where(eq(parents.id, parentId));
    if (!parent) throw new Error('signed-in parent vanished');
    const { token, session } = await createSession(db, parent.id, clock(), { kind: options.kind, idpSid: options.idpSid, reauthAt: options.reauthAt });
    if (options.kind === 'web') setSessionCookie(res, config, token);
    return { parent, session, token };
  };
}
