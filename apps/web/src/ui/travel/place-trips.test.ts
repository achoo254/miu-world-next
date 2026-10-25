import { describe, expect, it } from 'vitest';
import type { QuestSummary } from '@miu/schema/game';
import { questList } from '../player/test-fixtures';
import { arrivalTarget, badgeTrip, collectionTrip, plaqueTrip, type TripEvent, type TripSources } from './place-trips';

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

  it('takes a badge to the event on now that gives it, never to one closed or giving another item', () => {
    expect(badgeTrip('huy-hieu-olympic-vang', sources())).toEqual({ region: 'khu-rung-bi-mat', quest: gate, target: 'parrot-guide', questBound: true });
    // The keepsake edition is given only in the event's commemorative window.
    expect(badgeTrip('huy-hieu-olympic-vang-ky-niem', sources())).toBeNull();
    expect(badgeTrip('huy-hieu-olympic-vang', sources({ events: [{ ...olympic, state: 'upcoming' }] }))).toBeNull();
    expect(badgeTrip('huy-hieu-olympic-vang', sources({ events: [] }))).toBeNull();
  });

  it("takes a cup, or a thing of its set, to the region's lesson (any run there drops one)", () => {
    expect(collectionTrip('lang-ven-song', sources().quests)).toMatchObject({ region: 'lang-ven-song', quest: { quest: { id: 'lesson-song' } }, target: 'parrot-guide', questBound: true });
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
    expect(trip).toEqual({ region: 'nong-trai', quest: farm, target: 'parrot-guide', questBound: false });
    // No lesson on that map to build it for, or no game there: no trip.
    expect(plaqueTrip({ place: 'minigame', region: null }, sources())).toBeNull();
    expect(plaqueTrip({ place: 'minigame', region: 'thu-vien' }, sources({ quests: [farm] }))).toBeNull();
  });
});
