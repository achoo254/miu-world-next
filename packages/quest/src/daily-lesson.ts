// "Bài hôm nay" (owner, 09/10/2026: the child plays only at home, every day): each Vietnam day the home points the
// player to one learning quest (one that teaches a topic) on another map, so the maps she loves less get their turn.
// Pure, so the web, a future app and the server word the same pick.

/** What the pick needs to know of one lesson quest of the player. */
export interface DailyLessonCandidate {
  id: string;
  region: string;
  /** Her progress on it: not started, some steps done, finished at least once. */
  state: 'open' | 'in-progress' | 'completed';
}

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 of a calendar day (`YYYY-MM-DD`), the rotation's counter. */
export function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

/**
 * Today's lesson, or null when every lesson away from `home` is finished. A lesson she left halfway comes first
 * (among several, one per day in turn), so nothing stays abandoned; otherwise the maps that still have a lesson to play take turns day by day, each offering its first
 * lesson not played yet in catalogue order. The same lessons and day always give the same pick.
 */
export function dailyLesson(lessons: readonly DailyLessonCandidate[], day: string, home: string): DailyLessonCandidate | null {
  const away = lessons.filter((lesson) => lesson.region !== home);
  const n = dayNumber(day);
  const started = away.filter((lesson) => lesson.state === 'in-progress');
  if (started.length > 0) return started[n % started.length] ?? null;
  const regions: string[] = [];
  for (const lesson of away) if (lesson.state === 'open' && !regions.includes(lesson.region)) regions.push(lesson.region);
  const region = regions[n % Math.max(regions.length, 1)];
  return away.find((lesson) => lesson.region === region && lesson.state === 'open') ?? null;
}

/**
 * The daily quest of a day (signed-in players finish it to keep their streak): today's lesson, or, once every lesson
 * away from `home` is finished, one of them to play again, in turn day by day. Null only when there is no lesson at all.
 */
export function dailyQuest(lessons: readonly DailyLessonCandidate[], day: string, home: string): DailyLessonCandidate | null {
  const pick = dailyLesson(lessons, day, home);
  if (pick) return pick;
  const away = lessons.filter((lesson) => lesson.region !== home);
  return away[dayNumber(day) % Math.max(away.length, 1)] ?? null;
}

/** A player's daily streak: the last day she finished the day's quest, the consecutive days up to it, the longest run. */
export interface DailyStreak {
  doneDay: string | null;
  streak: number;
  best: number;
}

/**
 * The streak once the day's quest is finished on `day`. A second finish the same day changes nothing; a finish the day
 * after the last one adds a day; after a gap the streak starts again at one.
 */
export function streakAfterDone(previous: DailyStreak, day: string): DailyStreak {
  if (previous.doneDay === day) return previous;
  const continued = previous.doneDay !== null && dayNumber(day) - dayNumber(previous.doneDay) === 1;
  const streak = continued ? previous.streak + 1 : 1;
  return { doneDay: day, streak, best: Math.max(previous.best, streak) };
}

/** The streak to show on `today`: still alive while the last finish was today or yesterday, otherwise zero. */
export function currentStreak(streak: DailyStreak, today: string): number {
  if (streak.doneDay === null) return 0;
  return dayNumber(today) - dayNumber(streak.doneDay) <= 1 ? streak.streak : 0;
}
