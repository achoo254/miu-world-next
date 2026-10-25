import { describe, expect, it } from 'vitest';
import type { QuestSummary } from '@miu/schema/game';
import { questList } from '../player/test-fixtures';
import { arrivalTarget, badgeTrip, collectionTrip, plaqueTrip, tripMove, type PlaceTrip, type TripEvent, type TripSources } from './place-trips';

const base = questList(0).quests[0];
if (!base || base.quest.status !== 'active') throw new Error('fixture has no active quest');
const active = base.quest;

/** A quest of the list: the fixture's lesson (steps `meet-parrot` at `parrot-guide`, then `find-clues`) elsewhere. */
const quest = (id: string, region: string, extra: Partial<typeof active> = {}, state: QuestSummary['state'] = 'open'): QuestSummary => ({
  ...base,
  state,
  quest: { ...active, id, region, ...extra },
  progress: { ...base.progress, questId: id },
});
const lesson = quest('lesson-song', 'lang-ven-song');
const forestLesson = quest('lesson-rung', 'khu-rung-bi-mat');
const gate = quest('wonder-olympic-logic', 'khu-rung-bi-mat', { category: 'event' });
const side = (id: string, region: string, state: QuestSummary['state']): QuestSummary => quest(id, region, { category: 'side' }, state);

const olympic: TripEvent = {
  state: 'live',
  region: 'khu-rung-bi-mat',
  quests: [{ id: 'wonder-olympic-logic', title: { vi: 'Ngăn', en: 'Room' }, keeper: { vi: 'Cáo', en: 'Fox' }, keeperId: 'ev-olympic-cao', done: false }],
  rewards: [{ item: 'huy-hieu-olympic-vang' }],
};

const sources = (over: Partial<TripSources> = {}): TripSources => ({
  quests: [forestLesson, lesson, gate],
  events: [olympic],
  sideQuests: [side('side-a', 'nong-trai', 'completed'), side('side-b', 'nong-trai', 'open')],
  cups: [
    { mapId: 'khu-rung-bi-mat', earnedAt: '2026-10-05T09:30:00.000Z' },
    { mapId: 'lang-ven-song', earnedAt: null },
  ],
  ...over,
});

describe('trips to where something is earned', () => {
  it('meets a quest at its next step, or where it starts again once finished', () => {
    expect(arrivalTarget(lesson)).toBe('parrot-guide');
    expect(arrivalTarget({ ...lesson, progress: { ...lesson.progress, completedSteps: ['meet-parrot'] } })).toBe('clue-box');
    expect(arrivalTarget({ ...lesson, state: 'completed', progress: { ...lesson.progress, completedSteps: ['meet-parrot', 'find-clues'], completed: true } })).toBe('parrot-guide');
  });

  it('says when the quest is finished, so a walk goes to where it starts again instead of following no arrow', () => {
    const finished = { ...lesson, state: 'completed' as const, progress: { ...lesson.progress, completedSteps: ['meet-parrot', 'find-clues'], completed: true } };
    expect(collectionTrip('lang-ven-song', [finished])).toEqual({ region: 'lang-ven-song', quest: finished, target: 'parrot-guide', questBound: true, hinted: false });
    // An event whose every quest is done in this window: its first, at the place it starts.
    const doneGate = { ...gate, state: 'completed' as const, progress: { ...gate.progress, completedSteps: ['meet-parrot', 'find-clues'], completed: true } };
    const doneEvent = { ...olympic, quests: olympic.quests.map((q) => ({ ...q, done: true })) };
    expect(badgeTrip('huy-hieu-olympic-vang', sources({ quests: [doneGate], events: [doneEvent] }))).toMatchObject({ quest: doneGate, target: 'parrot-guide', hinted: false });
  });

  it('starts a quest whose first step is a search at the first place to search', () => {
    const search = quest('lesson-search', 'cho-phien', { steps: active.steps.slice(1) });
    expect(arrivalTarget(search)).toBe('clue-box');
    expect(collectionTrip('cho-phien', [{ ...search, state: 'completed', progress: { ...search.progress, completedSteps: ['find-clues'], completed: true } }])?.target).toBe('clue-box');
  });

  it('takes a badge to the event on now that gives it, never to one closed or giving another item', () => {
    expect(badgeTrip('huy-hieu-olympic-vang', sources())).toEqual({ region: 'khu-rung-bi-mat', quest: gate, target: 'parrot-guide', questBound: true, hinted: true });
    // The keepsake edition is given only in the event's commemorative window.
    expect(badgeTrip('huy-hieu-olympic-vang-ky-niem', sources())).toBeNull();
    expect(badgeTrip('huy-hieu-olympic-vang', sources({ events: [{ ...olympic, state: 'upcoming' }] }))).toBeNull();
    expect(badgeTrip('huy-hieu-olympic-vang', sources({ events: [] }))).toBeNull();
  });

  it("takes a cup, or a thing of its set, to the region's lesson (any run there drops one)", () => {
    expect(collectionTrip('lang-ven-song', sources().quests)).toMatchObject({ region: 'lang-ven-song', quest: { quest: { id: 'lesson-song' } }, target: 'parrot-guide', questBound: true, hinted: true });
    // Never an event's quest, which is no lesson of the region.
    expect(collectionTrip('khu-rung-bi-mat', sources().quests)?.quest).toBe(forestLesson);
    expect(collectionTrip('nui-tuyet', sources().quests)).toBeNull();
  });

  it('takes a plaque to where the server says its next star is earned', () => {
    const src = sources();
    expect(plaqueTrip({ place: 'lesson', region: null }, src)?.quest.quest.id).toBe('lesson-rung');
    expect(plaqueTrip({ place: 'lesson', region: 'lang-ven-song' }, src)?.quest.quest.id).toBe('lesson-song');
    // Collecting: the first set not complete yet.
    expect(plaqueTrip({ place: 'collection', region: null }, src)?.region).toBe('lang-ven-song');
    expect(plaqueTrip({ place: 'event', region: null }, src)?.quest).toBe(gate);
    expect(plaqueTrip(null, src)).toBeNull();
  });

  it("takes a minigame plaque beside the one offering a game not played yet, the map built for its region's lesson", () => {
    const farm = quest('lesson-farm', 'nong-trai');
    const trip = plaqueTrip({ place: 'minigame', region: null }, sources({ quests: [forestLesson, farm] }));
    expect(trip).toEqual({ region: 'nong-trai', quest: farm, target: 'parrot-guide', questBound: false, hinted: false });
    // No lesson on that map to build it for, or no game there: no trip.
    expect(plaqueTrip({ place: 'minigame', region: null }, sources())).toBeNull();
    expect(plaqueTrip({ place: 'minigame', region: 'thu-vien' }, sources({ quests: [farm] }))).toBeNull();
  });
});

describe('what the play screen does with a trip', () => {
  const trip = (over: Partial<PlaceTrip> = {}): PlaceTrip => ({ region: 'khu-rung-bi-mat', quest: forestLesson, target: 'parrot-guide', questBound: true, hinted: true, ...over });

  it('follows the quest on this map while its arrow points there', () => {
    expect(tripMove(trip(), 'khu-rung-bi-mat', 'lesson-rung')).toEqual({ kind: 'walk', to: { quest: 'lesson-rung' } });
    expect(tripMove(trip(), 'khu-rung-bi-mat', 'other')).toEqual({ kind: 'walk', to: { quest: 'lesson-rung' } });
  });

  it('walks straight to the place of a finished quest, building the map for it first when another is played', () => {
    expect(tripMove(trip({ hinted: false }), 'khu-rung-bi-mat', 'lesson-rung')).toEqual({ kind: 'walk', to: { targetId: 'parrot-guide' } });
    expect(tripMove(trip({ hinted: false }), 'khu-rung-bi-mat', 'wonder-olympic-logic')).toEqual({ kind: 'switch', throughGate: false, then: 'walk' });
    // A minigame's giver stands whatever the quest: walked to at once.
    expect(tripMove(trip({ questBound: false, hinted: false }), 'khu-rung-bi-mat', 'other')).toEqual({ kind: 'walk', to: { targetId: 'parrot-guide' } });
  });

  it('travels through the portal to another map and starts beside the place', () => {
    expect(tripMove(trip(), 'nha-cua-be', 'nha-cua-be-ch1')).toEqual({ kind: 'switch', throughGate: true, then: 'beside' });
  });

  it('does nothing when no switch would happen or there is no place, so nothing is left waiting for a later build', () => {
    expect(tripMove(trip(), 'nha-cua-be', 'lesson-rung')).toBeNull();
    expect(tripMove(trip({ hinted: false, target: null }), 'khu-rung-bi-mat', 'lesson-rung')).toBeNull();
  });
});
