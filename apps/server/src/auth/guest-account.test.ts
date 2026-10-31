import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as t from '../db/schema';
import { createTestApp, FIXTURE_CONTENT, parentWithChild, type Agent, type TestApp } from '../../test/test-app';
import { FakeIdp, IDP_ENV } from '../../test/fake-idp';
import { pruneGuestAccounts } from './guest-account';
import { GUEST_SESSION_MS, SESSION_ABSOLUTE_MS } from './session-store';

const idp = new FakeIdp();
let app: TestApp;
beforeAll(async () => {
  app = await createTestApp(IDP_ENV, {}, idp.fetch);
});
afterAll(async () => {
  await app.handle.close();
});

let seq = 0;
function person(over: Record<string, unknown> = {}): Record<string, unknown> {
  seq += 1;
  return { sub: `guest-sub-${seq}-${Date.now()}`, email: `g${seq}-${Date.now()}@example.vn`, email_verified: true, sid: `guest-sid-${seq}`, ...over };
}

/** The web sign-in round trip with the fake IdP (see idp-web-routes.test.ts). */
async function signIn(agent: Agent, claims: Record<string, unknown>): Promise<void> {
  const res = await agent.get('/api/auth/start').expect(303);
  const authorize = new URL(res.headers.location ?? '');
  idp.claims = { nonce: authorize.searchParams.get('nonce'), ...claims };
  const query = new URLSearchParams({ state: authorize.searchParams.get('state') ?? '', code: 'auth-code' });
  const back = await agent.get(`/api/auth/callback?${query.toString()}`).expect(303);
  expect(back.headers.location).toBe('/');
}

interface Me {
  parent: { id: string; email: string; guest: boolean };
  activePlayerId: string;
}

/** A guest on a new device who accepted the policy: playing as the guest account's own player. */
async function guest(): Promise<{ agent: Agent; me: Me }> {
  const agent = app.agent();
  const started = await agent.post('/api/auth/guest').expect(201);
  expect(started.body).toMatchObject({ parent: { guest: true }, consentAccepted: false, players: [] });
  await agent.post('/api/consents').send({ policyVersion: FIXTURE_CONTENT.consent.version }).expect(201);
  const me = (await agent.get('/api/auth/me').expect(200)).body as Me;
  return { agent, me };
}

const PLAY_A: Array<[string, object]> = [['meet-vet', {}], ['find-letter', { target: 'clue-letter' }], ['solve-tree', { answer: { value: 5 } }]];
async function finishQuestA(agent: Agent): Promise<void> {
  for (const [stepId, body] of PLAY_A) await agent.post(`/api/quests/quest-a/steps/${stepId}/complete`).send(body).expect(200);
}

const progress = async (agent: Agent) => (await agent.get('/api/progress').expect(200)).body as { coins: number; xp: number; quests: Array<{ questId: string; completed: boolean }> };
const ledger = async (childId: string) => (await app.db.select().from(t.rewardLedger).where(eq(t.rewardLedger.childId, childId))).map((r) => r.source).sort();

describe('playing as a guest', () => {
  it('starts a guest account with a long sliding cookie, never a second one over a live session', async () => {
    const agent = app.agent();
    const res = await agent.post('/api/auth/guest').expect(201);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(new RegExp(`Max-Age=${GUEST_SESSION_MS / 1000}`));
    expect(res.body.parent.email).toMatch(/@guest\.invalid$/);
    await agent.post('/api/auth/guest').expect(409, { error: 'signed-in' });
    // The app never starts a guest (it has no cookie to keep one in).
    await app.agent().post('/api/auth/guest').set('Authorization', 'Bearer abcdefghijklmnopqrstuvwxyz').expect(404);
  });

  it('plays and is paid like anyone, but alone: no online play, voice, extra players or daily streak', async () => {
    const { agent, me } = await guest();
    await finishQuestA(agent);
    expect((await progress(agent)).quests.find((q) => q.questId === 'quest-a')?.completed).toBe(true);
    const [player] = await app.db.select().from(t.childProfiles).where(eq(t.childProfiles.id, me.activePlayerId));
    expect(player).toMatchObject({ onlineAllowed: false, voiceChatAllowed: false });
    await agent.patch(`/api/players/${me.activePlayerId}/settings`).send({ onlineAllowed: true }).expect(403, { error: 'guest-account' });
    await agent.patch(`/api/players/${me.activePlayerId}/settings`).send({ botsEnabled: false }).expect(200);
    await agent.post('/api/players').send({ displayName: [...FIXTURE_CONTENT.childDisplayNames][1] }).expect(403, { error: 'guest-account' });
    await agent.get('/api/daily-quest').expect(403, { error: 'guest-account' });
  });

  it('keeps the guest account and its progress as the new account when a new identity signs in', async () => {
    const { agent, me } = await guest();
    await finishQuestA(agent);
    const before = await progress(agent);
    const user = person();
    await signIn(agent, user);
    const after = (await agent.get('/api/auth/me').expect(200)).body as Me;
    expect(after.parent).toEqual({ id: me.parent.id, email: user.email, guest: false });
    expect(after.activePlayerId).toBe(me.activePlayerId);
    expect(await progress(agent)).toEqual(before);
    const [player] = await app.db.select().from(t.childProfiles).where(eq(t.childProfiles.id, me.activePlayerId));
    expect(player).toMatchObject({ onlineAllowed: true, voiceChatAllowed: true });
    // A normal session now, with a normal cookie.
    const [session] = await app.db.select().from(t.sessions).where(eq(t.sessions.parentId, me.parent.id));
    expect((session?.expiresAt.getTime() ?? 0) - (session?.createdAt.getTime() ?? 0)).toBe(SESSION_ABSOLUTE_MS);
  });

  it("merges the guest's progress into the account the identity already has, paying nothing twice", async () => {
    // The account: signed in elsewhere, finished quest A once.
    const user = person();
    const elsewhere = app.agent();
    await signIn(elsewhere, user);
    await elsewhere.post('/api/consents').send({ policyVersion: FIXTURE_CONTENT.consent.version }).expect(201);
    await finishQuestA(elsewhere);
    const account = (await elsewhere.get('/api/auth/me').expect(200)).body as Me;
    const accountBefore = await progress(elsewhere);

    // The guest on another device: finished quest A too (a second run for the account).
    const { agent, me } = await guest();
    await finishQuestA(agent);
    const guestBefore = await progress(agent);

    await signIn(agent, user);
    const after = (await agent.get('/api/auth/me').expect(200)).body as Me;
    expect(after.parent.id).toBe(account.parent.id);
    expect(after.activePlayerId).toBe(account.activePlayerId);
    const merged = await progress(agent);
    expect(merged.coins).toBe(accountBefore.coins + guestBefore.coins);
    expect(merged.xp).toBe(accountBefore.xp + guestBefore.xp);
    expect(await ledger(account.activePlayerId)).toEqual(expect.arrayContaining(['quest:quest-a', 'quest:quest-a#2']));
    // The guest account and everything of its player are gone.
    expect(await app.db.select().from(t.parents).where(eq(t.parents.id, me.parent.id))).toEqual([]);
    expect(await app.db.select().from(t.rewardLedger).where(eq(t.rewardLedger.childId, me.activePlayerId))).toEqual([]);
  });

  it('drops a one-time award the account already has, with what it added', async () => {
    const user = person();
    const elsewhere = app.agent();
    await signIn(elsewhere, user);
    await elsewhere.post('/api/consents').send({ policyVersion: FIXTURE_CONTENT.consent.version }).expect(201);
    const account = (await elsewhere.get('/api/auth/me').expect(200)).body as Me;
    const { agent, me } = await guest();
    const award = { xp: 7, coins: 3, skillXp: {}, items: { 'la-than': 1 } };
    await app.db.insert(t.rewardLedger).values({ id: crypto.randomUUID(), childId: account.activePlayerId, source: 'achievement:x', ...award });
    await app.db.insert(t.inventoryItems).values({ childId: account.activePlayerId, itemId: 'la-than', qty: 1 });
    await app.db.insert(t.rewardLedger).values({ id: crypto.randomUUID(), childId: me.activePlayerId, source: 'achievement:x', ...award });
    await app.db.insert(t.rewardLedger).values({ id: crypto.randomUUID(), childId: me.activePlayerId, source: 'achievement:y', ...award });
    await app.db.insert(t.inventoryItems).values({ childId: me.activePlayerId, itemId: 'la-than', qty: 2 });
    await signIn(agent, user);
    expect(await ledger(account.activePlayerId)).toEqual(['achievement:x', 'achievement:y']);
    const [items] = await app.db.select().from(t.inventoryItems).where(eq(t.inventoryItems.childId, account.activePlayerId));
    expect(items?.qty).toBe(2);
    expect((await progress(agent)).coins).toBe(6);
  });

  it('prunes guest accounts no session can reach any more, and only those', async () => {
    const stale = await guest();
    const live = await guest();
    await app.db.update(t.sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(t.sessions.parentId, stale.me.parent.id));
    const signedIn = await parentWithChild(app);
    await app.db.update(t.sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(t.sessions.parentId, (await signedIn.agent.get('/api/auth/me')).body.parent.id));
    // Younger than a day: kept whatever the sessions say.
    expect(await pruneGuestAccounts(app.db, new Date())).toBe(0);
    const later = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await app.db.update(t.sessions).set({ expiresAt: new Date(later.getTime() + 60_000), lastSeenAt: later }).where(eq(t.sessions.parentId, live.me.parent.id));
    await pruneGuestAccounts(app.db, later);
    const left = await app.db.select({ id: t.parents.id }).from(t.parents);
    const ids = left.map((p) => p.id);
    expect(ids).not.toContain(stale.me.parent.id);
    expect(ids).toContain(live.me.parent.id);
  });
});
