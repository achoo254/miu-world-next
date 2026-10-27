import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ORIGIN, createTestApp, parentWithChild, type Agent, type TestApp } from '../../test/test-app';
import { reviewAccountEmail } from '../auth/idp-account-link';
import * as t from '../db/schema';
import { PlayerEvents, type PlayerEvent } from './player-events';

let app: TestApp;
const events: PlayerEvent[] = [];
beforeAll(async () => {
  const playerEvents = new PlayerEvents();
  playerEvents.on((event) => events.push(event));
  app = await createTestApp(undefined, undefined, undefined, undefined, { playerEvents });
});
afterAll(async () => {
  await app.handle.close();
});

describe('a player’s own bot switch', () => {
  it('is on by default, and she changes it herself', async () => {
    const { agent, childId } = await parentWithChild(app);
    await agent.post(`/api/players/${childId}/select`).expect(200);
    await agent.get('/api/player-settings').expect(200, { botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false });
    await agent.put('/api/player-settings').send({ botsEnabled: false }).expect(200, { ...{ botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false }, botsEnabled: false });
    await agent.get('/api/player-settings').expect(200, { ...{ botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false }, botsEnabled: false });
    expect(events.at(-1)).toEqual({ type: 'settings', childId, settings: { botsEnabled: false } });
  });

  it('refuses an empty change, the account owner’s switches (not hers to change) or anything else', async () => {
    const { agent } = await parentWithChild(app);
    await agent.put('/api/player-settings').send({}).expect(400);
    await agent.put('/api/player-settings').send({ onlineEnabled: false }).expect(400);
    await agent.put('/api/player-settings').send({ voiceChatAllowed: true }).expect(400);
    await agent.put('/api/player-settings').send({ botsEnabled: true, onlineAllowed: true }).expect(400);
    await agent.put('/api/player-settings').send({ botsEnabled: 'yes' }).expect(400);
    await agent.put('/api/player-settings').send({ botsEnabled: true, chat: true }).expect(400);
  });

  it('is listed with each player for the account owner', async () => {
    const { agent } = await parentWithChild(app);
    await agent.put('/api/player-settings').send({ botsEnabled: false }).expect(200);
    const [player] = (await agent.get('/api/players').expect(200)).body as Array<Record<string, unknown>>;
    expect(player).toMatchObject({ botsEnabled: false, voiceChatAllowed: true, onlineAllowed: true });
    expect(player).not.toHaveProperty('voiceSafetySeenAt');
  });
});

describe('the account owner changes a player’s bot switch', () => {
  it('for an extra player of the account', async () => {
    const { agent } = await parentWithChild(app);
    const extra = ((await agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string }).id;
    await agent.patch(`/api/players/${extra}/settings`).send({ botsEnabled: false }).expect(200, { botsEnabled: false, voiceChatAllowed: false, onlineAllowed: true });
    expect(events.at(-1)).toEqual({ type: 'settings', childId: extra, settings: { botsEnabled: false } });
    await agent.post(`/api/players/${extra}/select`).expect(200);
    await agent.get('/api/player-settings').expect(200, { botsEnabled: false, voiceChatAllowed: false, onlineAllowed: true, voiceSafetySeen: false });
  });

  it('changes on the account once a player is chosen', async () => {
    const { agent, childId } = await parentWithChild(app);
    await agent.post(`/api/players/${childId}/select`).expect(200);
    await agent.patch(`/api/players/${childId}/settings`).send({ botsEnabled: false }).expect(200);
  });

  it('never for another account’s player (404)', async () => {
    const a = await parentWithChild(app);
    const b = await parentWithChild(app);
    const before = events.length;
    await b.agent.patch(`/api/players/${a.childId}/settings`).send({ botsEnabled: false }).expect(404);
    expect(events.length).toBe(before);
    await a.agent.get('/api/player-settings').expect(200, { botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false });
  });
});

describe('the account owner’s voice chat and online switches', () => {
  it('turn voice chat and online play off for one player, tell the online rooms, and show in her settings', async () => {
    const { agent } = await parentWithChild(app);
    const extra = ((await agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string }).id;
    await agent.patch(`/api/players/${extra}/settings`).send({ voiceChatAllowed: false }).expect(200, { botsEnabled: true, voiceChatAllowed: false, onlineAllowed: true });
    expect(events.at(-1)).toEqual({ type: 'controls', childId: extra, controls: { voiceChatAllowed: false, onlineAllowed: true } });
    await agent.patch(`/api/players/${extra}/settings`).send({ onlineAllowed: false }).expect(200, { botsEnabled: true, voiceChatAllowed: false, onlineAllowed: false });
    expect(events.at(-1)).toEqual({ type: 'controls', childId: extra, controls: { voiceChatAllowed: false, onlineAllowed: false } });
    const players = (await agent.get('/api/players').expect(200)).body as Array<{ id: string; voiceChatAllowed: boolean; onlineAllowed: boolean }>;
    expect(players.find((p) => p.id === extra)).toMatchObject({ voiceChatAllowed: false, onlineAllowed: false });
    await agent.post(`/api/players/${extra}/select`).expect(200);
    await agent.get('/api/player-settings').expect(200, { ...{ botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false }, voiceChatAllowed: false, onlineAllowed: false });
  });

  it('refuse an empty or unknown change, and another account’s player (404)', async () => {
    const a = await parentWithChild(app);
    const b = await parentWithChild(app);
    await a.agent.patch(`/api/players/${a.childId}/settings`).send({}).expect(400);
    await a.agent.patch(`/api/players/${a.childId}/settings`).send({ chatAllowed: false }).expect(400);
    await b.agent.patch(`/api/players/${a.childId}/settings`).send({ onlineAllowed: false }).expect(404);
    await a.agent.get('/api/player-settings').expect(200, { botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false });
  });

  it('online off: no ticket for the multiplayer connection, with the reason; on again, a ticket', async () => {
    const { agent, childId } = await parentWithChild(app);
    await agent.post('/api/online-ticket').expect(200);
    await agent.patch(`/api/players/${childId}/settings`).send({ onlineAllowed: false }).expect(200);
    await agent.post('/api/online-ticket').expect(403, { error: 'online-off' });
    await agent.patch(`/api/players/${childId}/settings`).send({ onlineAllowed: true }).expect(200);
    await agent.post('/api/online-ticket').expect(200);
  });
});

describe('voice chat for an extra player needs the account owner to sign in again', () => {
  const MINUTE = 60 * 1000;
  /** What a proven re-authentication leaves on the account's sessions (the sign-in itself: idp-*-routes.test.ts). */
  async function reauthenticatedAt(agent: Agent, at: Date | null): Promise<void> {
    const me = (await agent.get('/api/auth/me').expect(200)).body as { parent: { id: string } };
    await app.db.update(t.sessions).set({ reauthAt: at }).where(eq(t.sessions.parentId, me.parent.id));
  }
  async function withExtra() {
    const owner = await parentWithChild(app);
    const extra = ((await owner.agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string; voiceChatAllowed: boolean });
    return { ...owner, extra };
  }

  it('starts off for an extra player and on for the primary one', async () => {
    const { agent, childId, extra } = await withExtra();
    expect(extra.voiceChatAllowed).toBe(false);
    const players = (await agent.get('/api/players').expect(200)).body as Array<{ id: string; voiceChatAllowed: boolean }>;
    expect(players.find((p) => p.id === childId)?.voiceChatAllowed).toBe(true);
    expect(players.find((p) => p.id === extra.id)?.voiceChatAllowed).toBe(false);
  });

  it('is refused (403 reauth-required) without a recent re-authentication, and changes nothing', async () => {
    const { agent, extra } = await withExtra();
    const before = events.length;
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: true }).expect(403, { error: 'reauth-required' });
    // Together with another switch, the whole change is refused.
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: true, botsEnabled: false }).expect(403, { error: 'reauth-required' });
    expect(events.length).toBe(before);
    const [row] = await app.db.select().from(t.childProfiles).where(eq(t.childProfiles.id, extra.id));
    expect(row).toMatchObject({ voiceChatAllowed: false, botsEnabled: true });
  });

  it('is turned on within ten minutes of a re-authentication, and off again at any time without one', async () => {
    const { agent, extra } = await withExtra();
    await reauthenticatedAt(agent, new Date(Date.now() - 9 * MINUTE));
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: true }).expect(200, { botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true });
    expect(events.at(-1)).toEqual({ type: 'controls', childId: extra.id, controls: { voiceChatAllowed: true, onlineAllowed: true } });
    await reauthenticatedAt(agent, null);
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: false }).expect(200, { botsEnabled: true, voiceChatAllowed: false, onlineAllowed: true });
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: true }).expect(403, { error: 'reauth-required' });
  });

  it('is refused once the re-authentication is more than ten minutes old', async () => {
    const { agent, extra } = await withExtra();
    await reauthenticatedAt(agent, new Date(Date.now() - 11 * MINUTE));
    await agent.patch(`/api/players/${extra.id}/settings`).send({ voiceChatAllowed: true }).expect(403, { error: 'reauth-required' });
  });

  it('needs no re-authentication for the primary player', async () => {
    const { agent, childId } = await parentWithChild(app);
    await agent.patch(`/api/players/${childId}/settings`).send({ voiceChatAllowed: false }).expect(200);
    await agent.patch(`/api/players/${childId}/settings`).send({ voiceChatAllowed: true }).expect(200, { botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true });
  });

  it('leaves the other switches of an extra player free to change', async () => {
    const { agent, extra } = await withExtra();
    await agent.patch(`/api/players/${extra.id}/settings`).send({ onlineAllowed: false }).expect(200, { botsEnabled: true, voiceChatAllowed: false, onlineAllowed: false });
    await agent.patch(`/api/players/${extra.id}/settings`).send({ onlineAllowed: true }).expect(200);
  });

  it('a re-authentication of one account opens nothing for another account’s player (404)', async () => {
    const a = await withExtra();
    const b = await parentWithChild(app);
    await reauthenticatedAt(b.agent, new Date());
    await b.agent.patch(`/api/players/${a.extra.id}/settings`).send({ voiceChatAllowed: true }).expect(404);
  });
});

describe('the reminder before her first voice chat', () => {
  it('is confirmed once per player and kept, by her', async () => {
    const { agent, childId } = await parentWithChild(app);
    const extra = ((await agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string }).id;
    await agent.post(`/api/players/${childId}/select`).expect(200);
    await agent.post('/api/player-settings/voice-safety').expect(200, { ...{ botsEnabled: true, voiceChatAllowed: true, onlineAllowed: true, voiceSafetySeen: false }, voiceSafetySeen: true });
    const [first] = await app.db.select({ at: t.childProfiles.voiceSafetySeenAt }).from(t.childProfiles).where(eq(t.childProfiles.id, childId));
    expect(first?.at).toBeInstanceOf(Date);
    await agent.post('/api/player-settings/voice-safety').expect(200);
    const [again] = await app.db.select({ at: t.childProfiles.voiceSafetySeenAt }).from(t.childProfiles).where(eq(t.childProfiles.id, childId));
    expect(again?.at?.getTime()).toBe(first?.at?.getTime());
    // Another player of the account has not seen it.
    await agent.post(`/api/players/${extra}/select`).expect(200);
    await agent.get('/api/player-settings').expect(200, { botsEnabled: true, voiceChatAllowed: false, onlineAllowed: true, voiceSafetySeen: false });
  });

  it('needs a signed-in player', async () => {
    await app.request().post('/api/player-settings/voice-safety').set('Origin', ORIGIN).expect(401);
  });
});

describe('a store reviewer’s account', () => {
  it('gets its players with online play and voice chat off', async () => {
    const { agent } = await parentWithChild(app, false);
    const me = (await agent.get('/api/auth/me').expect(200)).body as { parent: { id: string } };
    await app.db.update(t.parents).set({ email: reviewAccountEmail('https://auth.example', `sub-${me.parent.id}`) }).where(eq(t.parents.id, me.parent.id));
    const extra = ((await agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body as { id: string; onlineAllowed: boolean; voiceChatAllowed: boolean });
    expect(extra).toMatchObject({ onlineAllowed: false, voiceChatAllowed: false });
    // Any other account's new extra player plays online; its voice chat waits for the owner's confirmation.
    const other = await parentWithChild(app, false);
    expect((await other.agent.post('/api/players').send({ displayName: 'Thỏ Bông' }).expect(201)).body).toMatchObject({ onlineAllowed: true, voiceChatAllowed: false });
  });
});
