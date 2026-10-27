import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Router, type Request, type RequestHandler } from 'express';
import { ConsentRequest, LoginRequest, RegisterRequest } from '@miu/schema/account';
import type { ServerConfig } from '../config';
import type { ContentCatalog } from '../content/content-catalog';
import type { Db } from '../db/client';
import { parents, sessions } from '../db/schema';
import { HttpError, parseInput } from '../http-error';
import { ipKey, limiter } from '../rate-limit';
import { accountSummary } from './account-summary';
import { auth, optionalAuth, requireParent, type AuthContext } from './auth-context';
import { decoyHash, hashSecret, verifySecret } from './secret-hashing';
import { clearSessionCookie, setSessionCookie } from './session-cookie';
import { createSession, deleteSession } from './session-store';
import { createSignIn } from './sign-in';
import { acceptPolicy } from '../player/player-routes';

export interface AuthRouteDeps {
  db: Db;
  config: ServerConfig;
  content: ContentCatalog;
  clock: () => Date;
}

const FIFTEEN_MIN = 15 * 60 * 1000;

function bodyEmail(req: Request): string {
  const body: unknown = req.body;
  const email = typeof body === 'object' && body !== null && 'email' in body ? body.email : '';
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 254) : '';
}

export function authRoutes({ db, config, content, clock }: AuthRouteDeps): Router {
  const router = Router();
  const policyVersion = content.consent.version;
  let decoy: Promise<string> | undefined;

  const registerLimit = limiter(60 * 60 * 1000, config.registerLimitPerHour, ipKey);
  // Keyed by IP + email so one attacker cannot lock every account, and one account cannot be sprayed.
  const loginLimit = limiter(FIFTEEN_MIN, 10, (req) => `${ipKey(req)}|${bodyEmail(req)}`);
  // Per IP across all emails: stops spraying one password over many accounts.
  const loginIpLimit = limiter(FIFTEEN_MIN, 50, ipKey);

  const summary = (ctx: AuthContext) => accountSummary(db, ctx, policyVersion);

  /** Drops the session the request came with, so every login starts from a fresh token. */
  async function rotateOut(res: Parameters<typeof optionalAuth>[0]): Promise<void> {
    const current = optionalAuth(res);
    if (current) await deleteSession(db, current.session.id);
  }

  const signIn = createSignIn({ db, config, clock });

  /** Email+password is dev/test tooling only (the account service is the sign-in); in production the routes do not exist. */
  const passwordRoutes: RequestHandler = (_req, _res, next) => {
    if (!config.passwordLogin) throw new HttpError(404, 'not-found');
    next();
  };

  router.post('/auth/register', passwordRoutes, registerLimit, async (req, res) => {
    const input = parseInput(RegisterRequest, req.body);
    const [existing] = await db.select({ id: parents.id }).from(parents).where(eq(parents.email, input.email));
    if (existing) throw new HttpError(409, 'email-taken');
    const parentId = randomUUID();
    const [parent] = await db
      .insert(parents)
      .values({
        id: parentId,
        email: input.email,
        passwordHash: await hashSecret(input.password, config.scrypt),
      })
      .onConflictDoNothing()
      .returning();
    if (!parent) throw new HttpError(409, 'email-taken');
    await rotateOut(res);
    const { token, session } = await createSession(db, parent.id, clock(), { kind: 'web' });
    setSessionCookie(res, config, token);
    console.info('parent registered', parent.id);
    res.status(201).json(await summary({ session, parent }));
  });

  router.post('/auth/login', passwordRoutes, loginIpLimit, loginLimit, async (req, res) => {
    const input = parseInput(LoginRequest, req.body);
    const [parent] = await db.select().from(parents).where(eq(parents.email, input.email));
    if (!parent?.passwordHash) {
      // Unknown email, or an account-service account (no password): same answer and same cost as a wrong password.
      decoy ??= decoyHash(config.scrypt).catch((err: unknown) => {
        decoy = undefined; // never cache a failure: retry on the next unknown-email login
        throw err;
      });
      await verifySecret(input.password, await decoy);
      throw new HttpError(401, 'invalid-credentials');
    }
    if (!(await verifySecret(input.password, parent.passwordHash))) throw new HttpError(401, 'invalid-credentials');
    const signedIn = await signIn(res, parent.id, { kind: 'web' });
    res.json(await summary({ session: signedIn.session, parent: signedIn.parent }));
  });

  /** Ends the session the request came with: the web's cookie or the app's Bearer token alike. */
  router.post('/auth/logout', async (_req, res) => {
    await rotateOut(res);
    clearSessionCookie(res, config);
    res.status(204).end();
  });

  router.get('/auth/me', requireParent, async (_req, res) => {
    res.json(await summary(auth(res)));
  });

  router.get('/consents/policy', (_req, res) => {
    res.json(content.consent);
  });

  router.post('/consents', requireParent, async (req, res) => {
    const { policyVersion: accepted } = parseInput(ConsentRequest, req.body);
    if (accepted !== policyVersion) throw new HttpError(400, 'policy-version-mismatch');
    const ctx = auth(res);
    // Accepting the policy makes the owner's own player (once) and plays as it unless someone is chosen.
    const primaryId = await acceptPolicy(db, content, ctx.parent.id, clock());
    let session = ctx.session;
    if (!session.activeChildId) {
      const [updated] = await db.update(sessions).set({ activeChildId: primaryId }).where(eq(sessions.id, session.id)).returning();
      session = updated ?? session;
    }
    res.status(201).json(await summary({ parent: ctx.parent, session }));
  });

  return router;
}
