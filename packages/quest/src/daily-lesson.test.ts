import { describe, expect, it } from 'vitest';
import { currentStreak, dailyLesson, dailyQuest, dayNumber, streakAfterDone, type DailyLessonCandidate } from './daily-lesson';

const HOME = 'nha-cua-be';
const lesson = (id: string, region: string, state: DailyLessonCandidate['state'] = 'open'): DailyLessonCandidate => ({ id, region, state });

describe('dailyLesson', () => {
  const lessons = [lesson('home-1', HOME), lesson('school-1', 'truong-hoc', 'completed'), lesson('school-2', 'truong-hoc'), lesson('river-1', 'lang-ven-song'), lesson('river-2', 'lang-ven-song'), lesson('market-1', 'cho-phien')];

  it('gives the same lesson all day, and the maps with a lesson left take turns day by day', () => {
    const picks = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12'].map((day) => dailyLesson(lessons, day, HOME)?.id);
    expect(dailyLesson(lessons, '2026-10-09', HOME)).toEqual(dailyLesson(lessons, '2026-10-09', HOME));
    // Three maps have lessons left: each comes once in three days, with its first lesson not played yet.
    expect(new Set(picks.slice(0, 3))).toEqual(new Set(['school-2', 'river-1', 'market-1']));
    expect(picks[3]).toBe(picks[0]);
  });

  it('never picks a lesson at home', () => {
    for (let d = 0; d < 10; d++) expect(dailyLesson([lesson('home-1', HOME), lesson('home-2', HOME, 'in-progress')], `2026-10-${String(10 + d)}`, HOME)).toBeNull();
  });

  it('takes a lesson she left halfway first, several in turn', () => {
    const started = [...lessons, lesson('river-3', 'lang-ven-song', 'in-progress'), lesson('market-2', 'cho-phien', 'in-progress')];
    const days = ['2026-10-09', '2026-10-10'].map((day) => dailyLesson(started, day, HOME)?.id);
    expect(new Set(days)).toEqual(new Set(['river-3', 'market-2']));
  });

  it('has nothing to offer once every lesson away from home is finished', () => {
    expect(dailyLesson([lesson('school-1', 'truong-hoc', 'completed')], '2026-10-09', HOME)).toBeNull();
    expect(dailyLesson([], '2026-10-09', HOME)).toBeNull();
  });

  it('counts calendar days', () => {
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(dayNumber('2026-10-10') - dayNumber('2026-10-09')).toBe(1);
  });
});

describe('dailyQuest', () => {
  it('is the day\'s lesson while one is left', () => {
    const lessons = [lesson('school-1', 'truong-hoc'), lesson('river-1', 'lang-ven-song', 'completed')];
    expect(dailyQuest(lessons, '2026-10-09', HOME)?.id).toBe('school-1');
  });

  it('offers a finished lesson again, in turn, once every lesson away from home is finished', () => {
    const done = [lesson('home-1', HOME, 'completed'), lesson('school-1', 'truong-hoc', 'completed'), lesson('river-1', 'lang-ven-song', 'completed')];
    const picks = ['2026-10-09', '2026-10-10'].map((day) => dailyQuest(done, day, HOME)?.id);
    expect(new Set(picks)).toEqual(new Set(['school-1', 'river-1']));
    expect(dailyQuest(done, '2026-10-09', HOME)).toEqual(dailyQuest(done, '2026-10-09', HOME));
  });

  it('has nothing only when there is no lesson away from home', () => {
    expect(dailyQuest([lesson('home-1', HOME, 'completed')], '2026-10-09', HOME)).toBeNull();
  });
});

describe('daily streak', () => {
  const none = { doneDay: null, streak: 0, best: 0 };

  it('starts at one, adds a day for each next day, and a second finish the same day changes nothing', () => {
    const first = streakAfterDone(none, '2026-10-30');
    expect(first).toEqual({ doneDay: '2026-10-30', streak: 1, best: 1 });
    expect(streakAfterDone(first, '2026-10-30')).toBe(first);
    // Across a month end.
    expect(streakAfterDone(first, '2026-10-31')).toEqual({ doneDay: '2026-10-31', streak: 2, best: 2 });
    expect(streakAfterDone({ doneDay: '2026-10-31', streak: 2, best: 2 }, '2026-11-01')).toEqual({ doneDay: '2026-11-01', streak: 3, best: 3 });
  });

  it('starts again at one after a missed day and keeps the best run', () => {
    expect(streakAfterDone({ doneDay: '2026-10-28', streak: 5, best: 7 }, '2026-10-30')).toEqual({ doneDay: '2026-10-30', streak: 1, best: 7 });
  });

  it('shows the streak while the last finish was today or yesterday, zero after that', () => {
    const s = { doneDay: '2026-10-30', streak: 4, best: 4 };
    expect(currentStreak(s, '2026-10-30')).toBe(4);
    expect(currentStreak(s, '2026-10-31')).toBe(4);
    expect(currentStreak(s, '2026-11-01')).toBe(0);
    expect(currentStreak(none, '2026-11-01')).toBe(0);
  });
});
