import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { completeStep, emptyProgress, type QuestProgress } from '@miu/quest/quest-progress';
import { CONTENT_DIR, readQuestDefinitions } from '../content/content-catalog';
import { solution } from '../../test/quest-solution';

// The math learning quests keep their first ids (`toan2-cd<group>-b<n>`), so saved progress still matches them.
const quests = readQuestDefinitions(path.join(CONTENT_DIR, 'quests')).filter((q) => q.id.startsWith('toan2-'));

/** Where each group of math quests plays (story-map.md, "Chia lại 8 map"): the map's region and its chapter. */
const PLACE_OF_GROUP: Record<number, { region: string; chapter: number }> = {
  1: { region: 'truong-hoc', chapter: 1 },
  2: { region: 'cho-phien', chapter: 1 },
  3: { region: 'cho-phien', chapter: 2 },
  4: { region: 'nong-trai', chapter: 1 },
  5: { region: 'lau-dai', chapter: 1 },
  6: { region: 'thu-vien', chapter: 3 },
  7: { region: 'lau-dai', chapter: 2 },
};

describe('math learning quests', () => {
  it('are all there, each in the chapter of its group on its map', () => {
    expect(quests).toHaveLength(36);
    for (const quest of quests) {
      const group = Number(/^toan2-cd(\d+)-/.exec(quest.id)?.[1]);
      expect({ region: quest.region, chapter: quest.chapter }, quest.id).toEqual(PLACE_OF_GROUP[group]);
    }
  });

  for (const quest of quests) {
    it(`${quest.id} plays from first step to reward with its own answers`, () => {
      if (quest.status === 'stub') throw new Error('learning quests are written in full');
      // Drafts are played as they will run once switched on; lessons open in any order, so each plays alone.
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

    it(`${quest.id} ties every graded step to the objective it practises`, () => {
      if (quest.status === 'stub') throw new Error('learning quests are written in full');
      const tied = (s: (typeof quest.steps)[number]) => 'objective' in s && s.objective !== undefined;
      expect(quest.steps.filter((s) => 'support' in s && !tied(s)).map((s) => s.id)).toEqual([]);
    });
  }
});
