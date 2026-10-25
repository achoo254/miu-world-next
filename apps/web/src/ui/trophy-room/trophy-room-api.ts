// The selected child's trophy room on the server (`GET /api/trophies`): her badges, cups and plaques, and when.
import { QuestListResponse, type QuestSummary } from '@miu/schema/game';
import { TrophyNextResponse, TrophyRoomResponse } from '@miu/schema/trophy-room';
import { api } from '../api-client';

/** The interactable before the trophy cabinet in her home (tools/world/structures/nha-cua-be-trophy-hall.ts). */
export const TROPHY_TARGET = 'nha-truyen-thong';

export function loadTrophies(): Promise<TrophyRoomResponse> {
  return api('GET', '/trophies', TrophyRoomResponse);
}

/** Where her next star of each achievement category is earned, for the room's "Đi tới". */
export function loadTrophyNext(): Promise<TrophyNextResponse> {
  return api('GET', '/trophies/next', TrophyNextResponse);
}

/** The minigame side quests, for a plaque earned by minigames: who offers each on which map. */
export async function loadSideQuests(): Promise<QuestSummary[]> {
  return (await api('GET', '/quests?category=side', QuestListResponse)).quests;
}
