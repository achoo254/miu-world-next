import { describe, expect, it } from 'vitest';
import { inviteLink, resultLink, weeklyLink } from './share-links';

const ORIGIN = 'https://miu.hoandat.com';
const CODE = 'AbCdEfGhIjKlMnOpQrStUv';

describe('share links', () => {
  it('makes an invite link of the code alone, with how it was shared', () => {
    expect(inviteLink(ORIGIN, CODE)).toBe(`${ORIGIN}/moi/${CODE}?utm_source=share&utm_medium=share&utm_campaign=invite`);
  });

  it('points a result at the topic page, with an invite code only when asked', () => {
    const topic = { subject: 'toan', id: 'so-den-100' };
    expect(resultLink(ORIGIN, topic)).toBe(`${ORIGIN}/hoc/toan/so-den-100/?utm_source=share&utm_medium=share&utm_campaign=result`);
    expect(resultLink(ORIGIN, topic, CODE)).toBe(`${ORIGIN}/hoc/toan/so-den-100/?utm_source=share&utm_medium=share&utm_campaign=result&moi=${CODE}`);
  });

  it('points a result with no topic at the home page, or at the invite page with an invite', () => {
    expect(resultLink(ORIGIN, null)).toBe(`${ORIGIN}/?utm_source=share&utm_medium=share&utm_campaign=result`);
    expect(resultLink(ORIGIN, null, CODE)).toBe(`${ORIGIN}/moi/${CODE}?utm_source=share&utm_medium=share&utm_campaign=result`);
  });

  it('points the week’s card at the home page', () => {
    expect(weeklyLink(ORIGIN)).toBe(`${ORIGIN}/?utm_source=share&utm_medium=share&utm_campaign=weekly`);
  });
});
