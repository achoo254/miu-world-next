// NEW SCREEN part (owner, 09/10/2026: the child plays only at home, every day): "Bài hôm nay", one learning quest
// on another map for each Vietnam day, with the way there. A card on Home and a chip over the game while she is
// at home. The pick is `dailyLesson` of packages/quest; nothing extra is paid for it. For a signed-in player the server
// pins the day's quest (`dailyQuest`, a finished lesson again once all are done) and counts her streak of days.
import { Link } from 'react-router';
import type { DailyQuestResponse } from '@miu/schema/daily-quest';
import type { QuestSummary } from '@miu/schema/game';
import { dailyLesson } from '@miu/quest/daily-lesson';
import { vietnamDay } from '@miu/quest/live-event';
import { T } from '../i18n/use-t';
import type { Bilingual } from '../i18n/i18n';
import { nameOf } from '../i18n/names';
import { Icon } from '../kit/art';
import { buttonClass } from '../kit/button';
import { playPath, say, type PlayerData } from '../player/player-data';
import { TopicLabel, topicOf } from '../player/topic-label';
import { Say, titleOf } from '../quest/content-text';
import { HOME_REGION, findRegion } from '../region/regions';
import type { DailyQuestState } from './daily-quest-api';
import './daily-lesson.css';

/** Today's lesson away from home among her quests (learning quests only: those that teach a topic), or null when all are finished. */
export function todaysLesson(quests: readonly QuestSummary[], now: number = Date.now()): QuestSummary | null {
  const lessons = quests.filter((q) => topicOf(q) !== null);
  const pick = dailyLesson(
    lessons.map((q) => ({ id: q.quest.id, region: q.quest.region, state: q.state })),
    vietnamDay(now),
    HOME_REGION,
  );
  return lessons.find((q) => q.quest.id === pick?.id) ?? null;
}

/** The name of the map a lesson is on. */
const mapOf = (summary: QuestSummary): Bilingual => nameOf(findRegion(summary.quest.region)?.name ?? summary.quest.region);

/**
 * The day's lesson: the server's pick for a signed-in player (`daily`), or the page's own (`todaysLesson`) when there
 * is none (`undefined`: a guest, or the call failed). Null while the server's pick is loading: nothing yet.
 */
export function dailyLessonOf(quests: readonly QuestSummary[], daily: DailyQuestState): QuestSummary | null {
  if (daily === undefined) return todaysLesson(quests);
  if (daily === null || daily.questId === null) return null;
  return quests.find((q) => q.quest.id === daily.questId) ?? null;
}

/** Her streak under the lesson: done today, or what keeps it, and her best run. */
function StreakLine({ daily }: { daily: DailyQuestResponse }) {
  return (
    <span className="home-daily-streak" data-id="home-daily-streak">
      {daily.done ? (
        <span data-id="home-daily-done">
          <Icon name="checkMark" size={20} />
          <T k="daily.doneToday" />
        </span>
      ) : null}
      {daily.streak > 0 ? (
        <span data-id="home-daily-streak-count">
          <Icon name="sparkles" size={20} />
          <T k="daily.streak" params={{ count: daily.streak }} />
        </span>
      ) : null}
      {!daily.done ? <T k="daily.keepStreak" /> : null}
      {daily.best > 1 ? (
        <span className="home-daily-best" data-id="home-daily-best">
          <Icon name="trophy" size={20} />
          <T k="daily.best" params={{ count: daily.best }} />
        </span>
      ) : null}
    </span>
  );
}

export function DailyLessonCard({ data, daily }: { data: PlayerData; daily?: DailyQuestState }) {
  const lesson = dailyLessonOf(data.quests, daily);
  if (!lesson) return null;
  const fill = (line: string): string => say(line, data.character);
  const topic = topicOf(lesson);
  return (
    <section className="panel home-daily" data-id="home-daily" aria-labelledby="home-daily-title">
      {/* One row: what and where on the left, the way there on the right (it wraps under on a narrow phone). */}
      <div className="home-daily-text">
        <h2 id="home-daily-title" className="home-daily-title">
          <Icon name="glowingStar" size={28} />
          <T k="daily.title" />
          <span className="home-daily-where" data-id="home-daily-map">
            <T k={lesson.state === 'in-progress' ? 'daily.resumeAt' : 'daily.at'} params={{ map: mapOf(lesson) }} />
          </span>
        </h2>
        <strong className="home-daily-lesson" data-id="home-daily-lesson">
          <Say text={titleOf(lesson.quest)} fill={fill} />
        </strong>
        {topic ? <TopicLabel topic={topic} dataId="home-daily-topic" /> : null}
        {daily ? <StreakLine daily={daily} /> : null}
      </div>
      <Link to={playPath(lesson)} className={buttonClass('primary')} data-id="home-daily-go">
        <T k="daily.go" params={{ map: mapOf(lesson) }} />
      </Link>
    </section>
  );
}

/**
 * The chip over the game while she is at home: today's lesson and its map; tapping it takes her there (`onGo`, the
 * play screen's own way to change quest and map).
 */
export function DailyLessonChip({ lesson, onGo }: { lesson: QuestSummary; onGo: (lesson: QuestSummary) => void }) {
  return (
    <button type="button" className="daily-chip" data-id="play-daily" onClick={() => onGo(lesson)}>
      <Icon name="glowingStar" size={28} />
      <span className="daily-chip-text">
        <span className="daily-chip-label">
          <T k="daily.title" />
        </span>
        <T k="daily.go" params={{ map: mapOf(lesson) }} />
      </span>
    </button>
  );
}
