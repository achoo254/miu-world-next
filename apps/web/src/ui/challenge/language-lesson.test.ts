import { describe, expect, it } from 'vitest';
import { teachesLanguage } from './language-lesson';

describe('language lessons', () => {
  it('reads the quest’s topic first', () => {
    expect(teachesLanguage({ topic: { subject: 'tieng-viet' } }, {})).toBe(true);
    expect(teachesLanguage({ topic: { subject: 'english' } }, {})).toBe(true);
    expect(teachesLanguage({ topic: { subject: 'toan' } }, { skill: 'phep-cong' })).toBe(false);
  });

  it('falls back on the step’s skill when the quest has no topic (a boss, a guardian)', () => {
    expect(teachesLanguage({}, { skill: 'chinh-ta' })).toBe(true);
    expect(teachesLanguage({}, { skill: 'phep-cong' })).toBe(false);
    expect(teachesLanguage({}, { skill: 'logic' })).toBe(false);
  });

  it('treats a step with no skill (a story choice, a minigame) as no language lesson', () => {
    expect(teachesLanguage({}, {})).toBe(false);
  });
});
