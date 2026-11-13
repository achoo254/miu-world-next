/**
 * `POST /api/idp/account-deleted` (auth-next ADR 0018): an account was deleted at auth.hoandat.com/account, the only
 * place an account is deleted, so the Miu account linked to it goes too, at once. Deleting the parent row cascades to
 * its sessions (web and app), consents, the account-service link, every player and every child table, so nothing is
 * left to restore (backups age out on their own schedule). Nothing in Miu is owned by one family and shared with
 * another (friendships, requests, blocks and reports go with either side), so there is nothing to hand over.
 * The IdP calls it server to server with a signed SET as the body (`Content-Type: application/secevent+jwt`), without
 * an Origin, so app.ts mounts it ahead of the CSRF check.
 *
 * Answers 202 once the account is deleted, or when no account here is linked to that `sub` (never signed in, or
 * already deleted: a retried notice is a no-op); 400 when the body is not a SET; 401 when the SET is not a valid one
 * from our IdP for this URL (alg, signature, iss, aud, exp, event); 503 when sign-in is off here, the IdP's keys
 * cannot be read or the deletion failed, so the IdP retries. Neither the SET nor the `sub` is logged, only the
 * account's internal id and the outcome.
 */
import express, { type Router } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { and, eq, inArray } from 'drizzle-orm';
import type { ServerConfig } from '../config';
import type { Db } from '../db/client';
import { parentIdpLinks, parents } from '../db/schema';
import { deletedSub, isSecurityEventToken } from './account-deleted-token';
import type { IdpClient } from './idp-client';
import { BACKCHANNEL_LIMIT_PER_15_MIN, idpFailure } from './idp-web-routes';
import { decodeJws } from './jws-verify';

/** Relative to `/api`, where app.ts mounts it. */
export const ACCOUNT_DELETED_PATH = '/idp/account-deleted';
const SET_MEDIA_TYPE = 'application/secevent+jwt';

export interface AccountDeletedDeps {
  db: Db;
  config: ServerConfig;
  idp: IdpClient | null;
  clock: () => Date;
}

/**
 * The exact `aud` the IdP signs for this receiver: the public origin of the web (the one its sign-in callback is
 * registered on, `OIDC_REDIRECT_URI`) plus the path.
 */
export function accountDeletedAudience(redirectUri: string): string {
  return `${new URL(redirectUri).origin}/api${ACCOUNT_DELETED_PATH}`;
}

export function accountDeletedRoute({ db, config, idp, clock }: AccountDeletedDeps): Router {
  const router = express.Router();
  // The IdP calls from one address, like the back-channel logout: the same budget, its own counter.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: BACKCHANNEL_LIMIT_PER_15_MIN,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => `account-deleted|${ipKeyGenerator(req.ip ?? 'unknown')}`,
    handler: (_req, res) => res.status(429).end(),
  });

  router.post(ACCOUNT_DELETED_PATH, limiter, express.text({ type: SET_MEDIA_TYPE, limit: '8kb' }), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const body: unknown = req.body;
    const jws = typeof body === 'string' ? decodeJws(body.trim()) : null;
    if (typeof body !== 'string' || !jws || !isSecurityEventToken(jws)) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const web = config.idp?.web;
    if (!idp || !web) {
      // Sign-in is off here: no IdP to check the signature against. The IdP keeps the notice and retries.
      res.status(503).end();
      return;
    }
    // The IdP signs these with ES256 only; checked before the signature so no other accepted algorithm is tried.
    if (jws.header.alg !== 'ES256') {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    let sub: string | null;
    try {
      const payload = await idp.verifiedPayload(body.trim());
      sub = payload ? deletedSub(payload, { issuer: idp.issuer, audience: accountDeletedAudience(web.redirectUri) }, clock().getTime()) : null;
    } catch (err) {
      console.warn('account deletion notice: IdP keys unavailable', idpFailure(err));
      res.status(503).end();
      return;
    }
    if (!sub) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    try {
      const linked = await db
        .select({ parentId: parentIdpLinks.parentId })
        .from(parentIdpLinks)
        .where(and(eq(parentIdpLinks.issuer, idp.issuer), eq(parentIdpLinks.subject, sub)));
      if (linked.length === 0) {
        console.info('account deletion notice: no account here');
        res.status(202).end();
        return;
      }
      const ids = linked.map((link) => link.parentId);
      await db.delete(parents).where(inArray(parents.id, ids));
      console.info('account deletion notice: account deleted', ids.join(','));
    } catch (err) {
      console.error('account deletion notice: deletion failed', err instanceof Error ? err.name : typeof err);
      res.status(503).end();
      return;
    }
    res.status(202).end();
  });

  return router;
}
