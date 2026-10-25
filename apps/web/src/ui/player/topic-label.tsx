// The topic a learning quest teaches ("Toán · Số đến 100"): every place that names such a quest (the region's quest
// list, Home, today's lesson, the HUD tracker) says what it practises, by subject and topic.
import type { QuestSummary, QuestTopic } from '@miu/schema/game';
import { Name } from '../i18n/use-t';
import { Icon } from '../kit/art';
import './player.css';

/** The topic of a quest, or null for a quest that teaches none (a story, a minigame) and "coming soon" stubs. */
export function topicOf(summary: QuestSummary): QuestTopic | null {
  return summary.quest.status === 'active' ? (summary.quest.topic ?? null) : null;
}

/** "📚 Toán · Số đến 100"; `compact` (the narrow HUD tracker) drops the subject. */
export function TopicLabel({ topic, dataId, compact = false }: { topic: QuestTopic; dataId: string; compact?: boolean }) {
  return (
    <span className={`topic-label${compact ? ' topic-label--compact' : ''}`} data-id={dataId}>
      <Icon name="books" size={compact ? 20 : 24} />
      {compact ? null : (
        <span className="topic-label-subject">
          <Name vi={topic.subjectName} />
        </span>
      )}
      <span className="topic-label-title">
        <Name vi={topic.title} />
      </span>
    </span>
  );
}
