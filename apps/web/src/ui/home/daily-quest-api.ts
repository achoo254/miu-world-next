// The daily quest and streak of a signed-in player, from the server (`GET /api/daily-quest`): the server pins the day's
// quest and counts the streak. A guest has no streak (the server refuses: 403 `guest-account`), and the pick then falls
// back to the page's own `todaysLesson`, as does a failed call.
import { useEffect, useState } from 'react';
import { DailyQuestResponse } from '@miu/schema/daily-quest';
import { api } from '../api-client';
import { useIsGuest } from '../account/guest-invite';

/** `undefined`: no server pick (a guest, or the call failed): use the page's own; `null`: still loading. */
export type DailyQuestState = DailyQuestResponse | null | undefined;

export function useDailyQuest(): DailyQuestState {
  const guest = useIsGuest();
  const [daily, setDaily] = useState<DailyQuestState>(null);
  useEffect(() => {
    if (guest) return;
    let alive = true;
    api('GET', '/daily-quest', DailyQuestResponse)
      .then((res) => {
        if (alive) setDaily(res);
      })
      .catch(() => {
        if (alive) setDaily(undefined);
      });
    return () => {
      alive = false;
    };
  }, [guest]);
  return guest ? undefined : daily;
}
