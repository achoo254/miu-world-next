import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as t from '../db/schema';
import { createTestApp, type TestApp } from '../../test/test-app';
import { FAKE_ISSUER, FakeIdp, IDP_ENV, MOBILE_CLIENT } from '../../test/fake-idp';
import { APP_ORIGINS } from './app-cors';
import { hashToken } from './session-store';

const idp = new FakeIdp();
const [APP_ORIGIN = ''] = APP_ORIGINS;
let app: TestApp;
beforeAll(async () => {
  app = await createTestApp(IDP_ENV, {}, idp.fetch);
});
afterAll(async () => {
  await app.handle.close();
});

let seq = 0;
const person = (over: Record<string, unknown> = {}) => {
  seq += 1;
  return { sub: `app-sub-${seq}-${Date.now()}`, email: `app${seq}-${Date.now()}@example.vn`, email_verified: true, ...over };
};

/** What the app does after the system browser returns the code: the exchange, with its verifier and nonce. */
async function exchange(claims: Record<string, unknown>, over: Record<string, unknown> = {}, bearer?: string) {
  const verifier = randomBytes(32).toString('base64url');
  const nonce = randomBytes(16).toString('base64url');
  idp.claims = { nonce, ...claims };
  const req = app.request().post('/api/auth/native/exchange').set('Origin', APP_ORIGIN);
  if (bearer) req.set('Authorization', `Bearer ${bearer}`);
  const res = await req.send({ code: 'app-code', codeVerifier: verifier, redirectUri: MOBILE_CLIENT.redirect, nonce, ...over });
  return { res, verifier };
}

const me = (token: string) => app.request().get('/api/auth/me').set('Origin', APP_ORIGIN).set('Authorization', `Bearer ${token}`);

describe('signing in on the app', () => {
  it('gives the app what it needs to build its own sign-in request', async () => {
    const res = await app.request().get('/api/auth/native/config').set('Origin', APP_ORIGIN).expect(200);
    expect(res.body).toEqual({ authorizationEndpoint: `${FAKE_ISSUER}/auth`, clientId: MOBILE_CLIENT.id, redirectUri: MOBILE_CLIENT.redirect, scope: 'openid email' });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['access-control-allow-origin']).toBe(APP_ORIGIN);
  });

  it('redeems the code with the public client and answers with an app session used as a Bearer token', async () => {
    const user = person();
    const { res, verifier } = await exchange(user);
    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(res.headers['cache-control']).toBe('no-store');
    const sent = idp.lastTokenRequest;
    expect(sent?.authorization).toBeNull();
    expect(Object.fromEntries(sent?.body ?? [])).toMatchObject({ client_id: MOBILE_CLIENT.id, code_verifier: verifier, redirect_uri: MOBILE_CLIENT.redirect, grant_type: 'authorization_code' });
    const token = (res.body as { token: string }).token;
    expect((await me(token).expect(200)).body).toMatchObject({ parent: { email: user.email } });
    const [session] = await app.db.select().from(t.sessions).where(eq(t.sessions.id, hashToken(token)));
    expect(session).toMatchObject({ kind: 'native', idpSid: null });
    expect(createHash('sha256').update(token).digest('hex')).toBe(session?.id);
  });

  it('accepts the app token only as a Bearer token, and a web cookie never as one', async () => {
    const token = ((await exchange(person())).res.body as { token: string }).token;
    await app.request().get('/api/auth/me').set('Cookie', `miu_session=${token}`).expect(401);
    const web = app.agent();
    const reg = await web.post('/api/auth/register').send({ email: `web-${Date.now()}@example.vn`, ['password']: 'test-password-web' }).expect(201);
    const cookie = ([] as string[]).concat(reg.headers['set-cookie'] ?? [])[0]?.split(';')[0]?.split('=')[1] ?? '';
    await me(cookie).expect(401);
    // With an Authorization header the cookie is not looked at, even a valid one.
    await web.get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token-value').expect(401);
    await web.get('/api/auth/me').expect(200);
  });

  it('links the same identity the web uses, and signs out only the app session', async () => {
    const user = person();
    const first = ((await exchange(user)).res.body as { token: string }).token;
    const second = ((await exchange(user)).res.body as { token: string }).token;
    const ids = await Promise.all([first, second].map(async (tk) => (await me(tk).expect(200)).body.parent.id as string));
    expect(ids[0]).toBe(ids[1]);
    await app.request().post('/api/auth/logout').set('Origin', APP_ORIGIN).set('Authorization', `Bearer ${first}`).expect(204);
    await me(first).expect(401);
    await me(second).expect(200);
  });

  it('replaces the session the app signed in again from', async () => {
    const user = person();
    const old = ((await exchange(user)).res.body as { token: string }).token;
    const fresh = ((await exchange(user, {}, old)).res.body as { token: string }).token;
    await me(old).expect(401);
    await me(fresh).expect(200);
  });

  it('records a re-authentication only when the app asked for one and the token proves it; then voice chat for an extra player turns on', async () => {
    const user = person();
    const nowS = Math.floor(Date.now() / 1000);
    const reauthAt = async (token: string) => (await app.db.select().from(t.sessions).where(eq(t.sessions.id, hashToken(token))))[0]?.reauthAt ?? null;
    const call = (token: string) => app.request().patch(`/api/players/${extra}/settings`).set('Origin', APP_ORIGIN).set('Authorization', `Bearer ${token}`);
    const first = ((await exchange(user)).res.body as { token: string }).token;
    await app.request().post('/api/consents').set('Origin', APP_ORIGIN).set('Authorization', `Bearer ${first}`).send({ policyVersion: app.content.consent.version }).expect(201);
    const extra = ((await app.request().post('/api/players').set('Origin', APP_ORIGIN).set('Authorization', `Bearer ${first}`).send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string }).id;
    await call(first).send({ voiceChatAllowed: true }).expect(403, { error: 'reauth-required' });
    // A "reauth" the app did not ask for is not recorded.
    const unasked = ((await exchange({ ...user, auth_time: nowS - 5, amr: ['fed', 'google', 'reauth'] }, {}, first)).res.body as { token: string }).token;
    expect(await reauthAt(unasked)).toBeNull();
    await call(unasked).send({ voiceChatAllowed: true }).expect(403, { error: 'reauth-required' });
    const proven = ((await exchange({ ...user, auth_time: nowS - 5, amr: ['fed', 'google', 'reauth'] }, { reauth: true }, unasked)).res.body as { token: string }).token;
    expect((await reauthAt(proven))?.getTime()).toBe((nowS - 5) * 1000);
    await call(proven).send({ voiceChatAllowed: true }).expect(200);
  });

  it('refuses a re-authentication the token does not prove', async () => {
    const nowS = Math.floor(Date.now() / 1000);
    const stale = await exchange({ ...person(), auth_time: nowS - 3600, amr: ['fed', 'google', 'reauth'] }, { reauth: true });
    expect([stale.res.status, stale.res.body]).toEqual([401, { error: 'idp-reauth' }]);
    // The app saying "reauth" is not enough: the token must prove it (amr "reauth").
    const unproven = await exchange({ ...person(), auth_time: nowS - 5, amr: ['fed', 'github'] }, { reauth: true });
    expect([unproven.res.status, unproven.res.body]).toEqual([401, { error: 'idp-reauth' }]);
    const noTime = await exchange({ ...person(), amr: ['fed', 'google', 'reauth'] }, { reauth: true });
    expect([noTime.res.status, noTime.res.body]).toEqual([401, { error: 'idp-reauth' }]);
  });

  it.each([
    ['another redirect', { redirectUri: 'com.evil.app:/auth/callback' }, 400],
    ['a short verifier', { codeVerifier: 'short' }, 400],
    ['another nonce', { nonce: 'n'.repeat(22) }, 401],
  ])('refuses an exchange with %s', async (_name, over, status) => {
    const user = person();
    const verifierNonce = randomBytes(16).toString('base64url');
    idp.claims = { nonce: verifierNonce, ...user };
    const res = await app.request().post('/api/auth/native/exchange').set('Origin', APP_ORIGIN)
      .send({ code: 'c', codeVerifier: randomBytes(32).toString('base64url'), redirectUri: MOBILE_CLIENT.redirect, nonce: verifierNonce, ...over });
    expect(res.status).toBe(status);
    expect(res.body).not.toHaveProperty('token');
  });

  it('refuses an unverified email and a failed exchange', async () => {
    expect((await exchange(person({ email_verified: false }))).res.status).toBe(401);
    idp.status = 400;
    try {
      expect((await exchange(person())).res.status).toBe(401);
    } finally {
      idp.status = 200;
    }
  });

  it('refuses a cross-site exchange and reports sign-in as unavailable when not configured', async () => {
    await app.request().post('/api/auth/native/exchange').set('Origin', 'https://evil.example').send({}).expect(403);
    const bare = await createTestApp();
    try {
      await bare.request().get('/api/auth/native/config').expect(503, { error: 'idp-unavailable' });
    } finally {
      await bare.handle.close();
    }
  });
});
