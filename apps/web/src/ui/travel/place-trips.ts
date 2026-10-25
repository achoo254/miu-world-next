// Where something not hers yet is earned, for its "Đi tới" / "Đi đến" button (the trophy room's pieces, the collection
// book's things): the map to go to, the quest the map is built for, and the place on it to stand beside. All from data
// she already has (her quest list, the events on now, the minigame side quests, the server's next place for each
// plaque); navigation only, nothing here pays.
import type { QuestSummary } from '@miu/schema/game';
import type { EventRewardDto, LiveEventDto } from '@miu/schema/live-event';
import type { TrophyGoTo, TrophyRoomResponse } from '@miu/schema/trophy-room';
import { isOpen, nextEventQuest } from '../event/event-api';
import { currentQuest, questForRegion } from '../player/player-data';
import { hintTarget } from '../quest/quest-flow';

export interface PlaceTrip {
  /** The region whose map the place is on. */
  region: string;
  /** The quest the map is built for there (a quest of her list). */
  quest: QuestSummary;
  /** The place to stand beside (an interactable of that map), or null: the map's starting point. */
  target: string | null;
  /** The place is the quest's own (its next step): on the same map, the quest is taken up and walked to. */
  questBound: boolean;
}

/** What of an event on now a trip reads: its state, region, quests and the items its window gives. */
export type TripEvent = Pick<LiveEventDto, 'state' | 'region' | 'quests'> & { rewards: readonly Pick<EventRewardDto, 'item'>[] };

export interface TripSources {
  /** Her quest list (`GET /quests`: lessons, stories, guardians and the quests of the events on now). */
  quests: readonly QuestSummary[];
  /** The events shown now (`GET /events`). */
  events: readonly TripEvent[];
  /** The minigame side quests (`GET /quests?category=side`). */
  sideQuests: readonly QuestSummary[];
  /** The room's cups, for a plaque earned by collecting. */
  cups: TrophyRoomResponse['cups'];
}

const firstStepTarget = (summary: QuestSummary): string | null => {
  if (summary.quest.status !== 'active') return null;
  const first = summary.quest.steps[0];
  return first && 'target' in first ? (first.target ?? null) : null;
};

/** Where she meets a quest: its next step's place (the arrow's), else, finished, the place its first step starts at. */
export function arrivalTarget(summary: QuestSummary): string | null {
  if (summary.quest.status !== 'active') return null;
  return hintTarget(summary.quest, summary.progress) ?? firstStepTarget(summary);
}

const questTrip = (quest: QuestSummary | null | undefined): PlaceTrip | null =>
  quest && quest.quest.status === 'active' ? { region: quest.quest.region, quest, target: arrivalTarget(quest), questBound: true } : null;

/** An event badge: the next quest of the event on now whose window gives that badge (its scene, e.g. the Olympic gate). */
export function badgeTrip(itemId: string, src: TripSources): PlaceTrip | null {
  const event = src.events.find((e) => isOpen(e) && e.rewards.some((r) => r.item === itemId));
  const next = event ? nextEventQuest(event) : null;
  return next ? questTrip(src.quests.find((q) => q.quest.id === next.id)) : null;
}

/**
 * A region's collection (its cup, or one thing of its set): every paid lesson or minigame run there drops one thing of
 * the set (the server's `dropCollectible`), none gives one thing in particular, so the trip is to the region's lesson
 * under way, else its first not finished (`questForRegion`), at that lesson's next place.
 */
export function collectionTrip(region: string, quests: readonly QuestSummary[]): PlaceTrip | null {
  return questTrip(questForRegion(quests, region));
}

/** A minigame side quest (in `region` when given), one never played first: she arrives beside the one offering it. */
function minigameTrip(region: string | null, src: TripSources): PlaceTrip | null {
  const offered = src.sideQuests.filter((q) => q.quest.status === 'active' && (!region || q.quest.region === region) && firstStepTarget(q));
  const side = offered.find((q) => q.state === 'open') ?? offered[0];
  if (!side) return null;
  const quest = questForRegion(src.quests, side.quest.region);
  return quest ? { region: side.quest.region, quest, target: firstStepTarget(side), questBound: false } : null;
}

/** A plaque's next star, from the place the server says it is earned at. */
export function plaqueTrip(goTo: TrophyGoTo | null, src: TripSources): PlaceTrip | null {
  if (!goTo) return null;
  switch (goTo.place) {
    case 'lesson':
      return questTrip(goTo.region ? questForRegion(src.quests, goTo.region) : currentQuest(src.quests));
    case 'minigame':
      return minigameTrip(goTo.region, src);
    case 'collection': {
      const cup = src.cups.find((c) => !c.earnedAt && (!goTo.region || c.mapId === goTo.region));
      return cup ? collectionTrip(cup.mapId, src.quests) : null;
    }
    case 'event': {
      const event = src.events.find((e) => isOpen(e) && (!goTo.region || e.region === goTo.region));
      const next = event ? nextEventQuest(event) : null;
      return next ? questTrip(src.quests.find((q) => q.quest.id === next.id)) : null;
    }
  }
}
