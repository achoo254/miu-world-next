import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { completeStep, emptyProgress, type QuestProgress } from '@miu/quest/quest-progress';
import { CONTENT_DIR, readQuestDefinitions } from '../content/content-catalog';
import { solution } from '../../test/quest-solution';

// The Vietnamese learning quests keep their first ids (`tv2-t<week>-<n>`), so saved progress still matches them; the
// two digits after `t` give the week, which sets the map and chapter it plays in.
const quests = readQuestDefinitions(path.join(CONTENT_DIR, 'quests')).filter((q) => q.id.startsWith('tv2-'));

const weekOf = (id: string): number => Number(/^tv2-t(\d{2})-/.exec(id)?.[1] ?? Number.NaN);

/**
 * Where each week plays (story-map.md, "Chia lại 8 map"): the map's region and its chapter, one chapter per week;
 * the forest's chapter 1 is its opening quest.
 */
function placeOfWeek(week: number): { region: string; chapter: number } {
  if (week <= 4) return { region: 'lang-ven-song', chapter: week };
  if (week <= 7) return { region: 'truong-hoc', chapter: week - 3 };
  if (week <= 9) return { region: 'thu-vien', chapter: week - 7 };
  if (week <= 13) return { region: 'khu-rung-bi-mat', chapter: week - 8 };
  if (week <= 17) return { region: 'xom-mai-am', chapter: week - 13 };
  return { region: 'lau-dai', chapter: 3 };
}

describe('Vietnamese learning quests', () => {
  it('are all there, over 18 weeks', () => {
    expect(quests).toHaveLength(34);
    expect(new Set(quests.map((q) => weekOf(q.id))).size).toBe(18);
  });

  for (const quest of quests) {
    const week = weekOf(quest.id);
    it(`${quest.id} plays in the chapter of week ${week} on its map, waiting for a teacher's review`, () => {
      if (quest.status === 'stub') throw new Error(`${quest.id} is not written in full`);
      expect({ region: quest.region, chapter: quest.chapter }).toEqual(placeOfWeek(week));
      expect(quest.review).toBe('teacher-pending');
    });

    it(`${quest.id} plays from first step to reward with its own answers`, () => {
      if (quest.status === 'stub') throw new Error('learning quests are written in full');
      // Drafts are played as they will run once switched on.
      const playable = { ...quest, status: 'active' as const };
      let progress: QuestProgress = emptyProgress();
      let reward = null;
      for (const [stepId, body] of solution(quest)) {
        const result = completeStep(playable, progress, stepId, body);
        if (!result.ok) throw new Error(`${quest.id} step ${stepId}: ${result.error}`);
        progress = result.progress;
        reward = result.reward;
      }
      expect(progress.completed).toBe(true);
      expect(reward).toEqual(quest.reward);
    });
  }
});
