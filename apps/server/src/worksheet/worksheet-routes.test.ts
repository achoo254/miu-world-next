import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PIN, createTestApp, parentWithChild, type TestApp } from '../../test/test-app';

let app: TestApp;
beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => {
  await app.handle.close();
});

describe('worksheet routes', () => {
  it('lists and returns worksheets only behind the parent PIN', async () => {
    const { agent } = await parentWithChild(app, false);
    const list = await agent.get('/api/worksheets').expect(200);
    expect(list.body.worksheets.map((w: { id: string }) => w.id)).toEqual(['quest-viet-chu-a', 'quest-hom-qua', 'quest-bi-bong', 'quest-can-gao']);
    expect(list.body.worksheets[3]).toEqual({ id: 'quest-can-gao', subject: { id: 'toan', name: 'Toán' }, topic: { id: 'khoi-luong-dung-tich', title: 'Ki-lô-gam và lít' }, title: 'Cân túi gạo', blockCount: 1 });
    const tv = await agent.get('/api/worksheets?subject=tieng-viet').expect(200);
    expect(tv.body.worksheets).toHaveLength(3);
    const sheet = await agent.get('/api/worksheets/quest-hom-qua').expect(200);
    expect(sheet.body.blocks[0]).toMatchObject({ kind: 'dictation', curriculumRef: ['tv2-t1-b02-nghe-viet-1'] });

    await agent.post('/api/parent-gate/lock').expect(200);
    await agent.get('/api/worksheets').expect(403, { error: 'parent-gate-closed' });
    await agent.get('/api/worksheets/quest-hom-qua').expect(403, { error: 'parent-gate-closed' });
    await agent.post('/api/parent-gate/unlock').send({ pin: TEST_PIN }).expect(200);
    await agent.get('/api/worksheets/quest-hom-qua').expect(200);
  });

  it('answers 404 for a quest without a sheet, 400 for a malformed subject, 401 when signed out', async () => {
    const { agent } = await parentWithChild(app, false);
    await agent.get('/api/worksheets/quest-khong-phieu').expect(404, { error: 'worksheet-not-found' });
    await agent.get('/api/worksheets/Bài 1').expect(404, { error: 'worksheet-not-found' });
    await agent.get('/api/worksheets?subject=Toán 3').expect(400, { error: 'invalid-subject' });
    await app.agent().get('/api/worksheets').expect(401);
  });

  it('has no way to write', async () => {
    const { agent } = await parentWithChild(app, false);
    await agent.post('/api/worksheets/quest-hom-qua').send({ text: 'bài viết' }).expect(404);
  });
});
