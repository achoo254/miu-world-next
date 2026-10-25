// What the review page shows about the learning content (assets/generated/review/learning-content.json, written by
// `pnpm content:gaps --review`): learning quests per subject, where each reading comes from, and the result of the
// textbook copy check. Only counts and the titles of folk readings: never a fingerprint, the key or the wording a
// match was found in.
import type { QuestDefinition, TextSource } from '../../packages/schema/src/content';
import type { Topic } from '../../packages/schema/src/learning';

export interface SubjectQuests {
  subject: string;
  subjectName: string;
  /** Active quests whose topic belongs to the subject. */
  quests: number;
}

export interface ReadingSources {
  /** Readings (quest texts) of every quest that is not a stub. */
  total: number;
  /** Readings per `source.kind`; `none` counts readings that name no source. */
  byKind: Record<TextSource['kind'] | 'none', number>;
  /** Folk readings in title order: the traditional work (`source.title`) and the reading's own title. */
  folk: Array<{ title: string; reading: string }>;
}

/** The copy check as `pnpm content:check` runs it; null when it could not run (no key on this machine). */
export interface CopyCheckResult {
  quests: number;
  topics: number;
  /** Problems the check reported (copied wording, a missing or wrong source); 0 when the content passes. */
  matches: number;
}

export interface LearningReviewSummary {
  subjects: SubjectQuests[];
  readings: ReadingSources;
  copyCheck: CopyCheckResult | null;
}

/** Totals for the review page, from the quests and topics as they are on disk. */
export function learningReviewSummary(
  quests: readonly QuestDefinition[],
  topics: readonly Topic[],
  subjectNames: ReadonlyMap<string, string>,
  copyCheck: CopyCheckResult | null,
): LearningReviewSummary {
  const subjectOf = new Map(topics.map((t) => [t.id, t.subject]));
  const perSubject = new Map<string, number>();
  for (const subject of new Set(topics.map((t) => t.subject))) perSubject.set(subject, 0);
  const byKind: ReadingSources['byKind'] = { original: 0, folk: 0, 'public-domain': 0, none: 0 };
  const folk: ReadingSources['folk'] = [];
  let total = 0;
  for (const quest of quests) {
    if (quest.status === 'stub') continue;
    const subject = quest.status === 'active' && quest.topic !== undefined ? subjectOf.get(quest.topic) : undefined;
    if (subject !== undefined) perSubject.set(subject, (perSubject.get(subject) ?? 0) + 1);
    for (const text of Object.values(quest.texts)) {
      total += 1;
      byKind[text.source?.kind ?? 'none'] += 1;
      if (text.source?.kind === 'folk') folk.push({ title: text.source.title, reading: text.title });
    }
  }
  return {
    subjects: [...perSubject].map(([subject, count]) => ({ subject, subjectName: subjectNames.get(subject) ?? subject, quests: count })),
    readings: {
      total,
      byKind,
      folk: folk.sort((a, b) => a.title.localeCompare(b.title, 'vi') || a.reading.localeCompare(b.reading, 'vi')),
    },
    copyCheck,
  };
}
