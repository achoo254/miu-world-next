import { describe, expect, it } from 'vitest';
import type { QuestDefinition } from '../../../packages/schema/src/content';
import type { Interactable } from '../../../packages/voxel/src/world-entities';
import { hashSeed } from '../noise';
import { cellsIn, placeQuestTargets, questStream, readQuests, targetUses, type PlacementMap } from './place-quest-targets';

/** A real region's quests (the market's), placed on open flat ground: every cell standable, one field for every chapter. */
const REGION = 'cho-phien';
const FIELD = cellsIn(0, 0, 159, 159);

const flatMap: PlacementMap = {
  canStand: () => true,
  stand: (x, z) => [x + 0.5, 5, z + 0.5],
  chapterCells: () => FIELD,
  residentCells: FIELD,
  keepClear: [],
  // The renamed places below are landmarks of the map: their targets now stand round it, a different draw from before.
  placeNamed: (name) => (name.endsWith(' mới') ? [80, 80] : undefined),
  // Givers each have a fixed spot of their own along the field's edge (the real ones shift only when a target lands on theirs).
  sideSpot: (id) => [hashSeed(id) % 160, 159],
};

const place = async (quests: readonly QuestDefinition[]): Promise<Map<string, Interactable>> => {
  const { placed } = await placeQuestTargets({ uses: targetUses(quests, REGION), map: flatMap, existing: [], seed: 2210 });
  return new Map(placed.map((t) => [t.id, t]));
};

/** A lesson quest of the region with at least two named places: the one renamed below. */
const renamedQuest = (quests: readonly QuestDefinition[]): QuestDefinition & { places: Record<string, string> } => {
  const found = quests
    .filter((q) => q.region === REGION && 'category' in q && q.category === 'main')
    .sort((a, b) => a.id.localeCompare(b.id))
    .find((q): q is QuestDefinition & { places: Record<string, string> } => 'places' in q && new Set(Object.values(q.places ?? {})).size >= 2);
  if (!found) throw new Error(`no lesson quest of ${REGION} names two places`);
  return found;
};

describe('placing quest targets', () => {
  it('gives each part of the placement its own stream: same parts, same draws; other parts, other draws', () => {
    const draws = (rng: () => number): number[] => [rng(), rng(), rng()];
    expect(draws(questStream(7, 'quest', 'a'))).toEqual(draws(questStream(7, 'quest', 'a')));
    expect(draws(questStream(7, 'quest', 'a'))).not.toEqual(draws(questStream(7, 'quest', 'b')));
    expect(draws(questStream(7, 'quest', 'a'))).not.toEqual(draws(questStream(8, 'quest', 'a')));
    expect(draws(questStream(7, 'quest', 'a'))).not.toEqual(draws(questStream(7, 'quest', 'a', 't')));
  });

  it('places the same input the same way every time', async () => {
    const quests = await readQuests();
    expect([...(await place(quests)).values()]).toEqual([...(await place(quests)).values()]);
  });

  it("renaming one quest's places moves only that quest's targets", async () => {
    const quests = await readQuests();
    const quest = renamedQuest(quests);
    const renamed = quests.map((q) =>
      q.id === quest.id ? { ...quest, places: Object.fromEntries(Object.entries(quest.places).map(([id, name]) => [id, `${name} mới`])) } : q,
    );
    const before = await place(quests);
    const after = await place(renamed);
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());

    const own = [...before.values()].filter((t) => t.quest === quest.id);
    const others = [...before.values()].filter((t) => t.quest !== quest.id);
    // The rename did move the quest's own targets (to the landmark), so the check below is not vacuous.
    expect(own.some((t) => JSON.stringify(after.get(t.id)?.position) !== JSON.stringify(t.position))).toBe(true);
    // Plenty of other quests' targets to keep still: the shared-stream placement moved every one placed after the renamed quest.
    expect(others.length).toBeGreaterThan(20);
    for (const t of others) expect({ id: t.id, at: after.get(t.id)?.position, yaw: after.get(t.id)?.yaw }).toEqual({ id: t.id, at: t.position, yaw: t.yaw });
  });
});
