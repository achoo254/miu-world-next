import type { WorksheetSheet } from '@miu/schema/content';
import type { Worksheet, WorksheetBlock } from '@miu/schema/worksheet';
import type { ContentCatalog } from '../content/content-catalog';

/** What one quest's worksheet is made from: the sheets of its worksheet steps, in step order. */
export interface WorksheetSource {
  id: string;
  title: string;
  subject: Worksheet['subject'];
  topic: Worksheet['topic'];
  sheets: WorksheetSheet[];
}

/** Blocks of a sheet written for the quest, defaults filled. */
function sheetBlocks(sheet: WorksheetSheet): WorksheetBlock[] {
  return sheet.blocks.map((block) => ({ ...block }));
}

/**
 * The quests that hand out a worksheet, in topic order (subject, then topic, then quest file order). All of a quest's
 * worksheet steps make its one sheet; a quest without a topic hands out none.
 */
export function worksheetSources(content: Pick<ContentCatalog, 'quests' | 'learning' | 'subjects'>): WorksheetSource[] {
  const subjectNames = new Map(content.subjects.map((s) => [s.id, s.name]));
  const topicOrder = [...content.learning.topics.keys()];
  const sources: WorksheetSource[] = [];
  for (const quest of content.quests.values()) {
    if (quest.status !== 'active' || quest.topic === undefined) continue;
    const topic = content.learning.topics.get(quest.topic);
    const sheets = quest.steps.flatMap((s) => (s.kind === 'worksheet' ? [s.sheet] : []));
    if (!topic || sheets.length === 0) continue;
    sources.push({
      id: quest.id,
      title: sheets[0]?.title ?? quest.title,
      subject: { id: topic.subject, name: subjectNames.get(topic.subject) ?? topic.subject },
      topic: { id: topic.id, title: topic.title },
      sheets,
    });
  }
  return sources.sort((a, b) => topicOrder.indexOf(a.topic.id) - topicOrder.indexOf(b.topic.id));
}

/** One worksheet per source that has something to write; every worksheet step adds its blocks in step order. */
export function buildWorksheets(sources: readonly WorksheetSource[]): Map<string, Worksheet> {
  const sheets = new Map<string, Worksheet>();
  for (const source of sources) {
    const blocks = source.sheets.flatMap(sheetBlocks);
    if (blocks.length === 0) continue;
    sheets.set(source.id, { id: source.id, subject: source.subject, topic: source.topic, title: source.title, blocks });
  }
  return sheets;
}

/** Built once at startup from the loaded content. */
export function loadWorksheets(content: Pick<ContentCatalog, 'quests' | 'learning' | 'subjects'>): Map<string, Worksheet> {
  return buildWorksheets(worksheetSources(content));
}
