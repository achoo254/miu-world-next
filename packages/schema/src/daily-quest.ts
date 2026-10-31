import { z } from 'zod';
import { ContentId } from './content';

/**
 * `GET /api/daily-quest`: today's quest of a signed-in player and her streak. `day` is the Vietnam calendar day the quest
 * belongs to; `questId` null when there is no lesson to offer; `done` she finished it today; `streak` the consecutive
 * days with the day's quest finished, up to today or yesterday (zero once a day was missed); `best` her longest run.
 */
export const DailyQuestResponse = z.object({
  day: z.iso.date(),
  questId: ContentId.nullable(),
  done: z.boolean(),
  streak: z.number().int().min(0),
  best: z.number().int().min(0),
});
export type DailyQuestResponse = z.infer<typeof DailyQuestResponse>;
