import type { WorksheetSheet } from '@miu/schema/content';
import type { CurriculumItem, CurriculumLesson, CurriculumSection } from '@miu/schema/curriculum';
import type { Worksheet, WorksheetBlock } from '@miu/schema/worksheet';
import type { ContentCatalog } from '../content/content-catalog';
import { readCurriculum, type LoadedBook } from './curriculum-books';

/** Ruled lines left under a paragraph prompt. */
const PARAGRAPH_LINES = 6;

/** One worksheet step: the quest's own sheet, or the inventory lesson of a quest still played from the book. */
export interface WorksheetPart {
  sheet?: WorksheetSheet;
  lessonId?: string;
}

/** What one quest's worksheet is made from: its worksheet steps, in step order. */
export interface WorksheetSource {
  id: string;
  title: string;
  subject: Worksheet['subject'];
  topic: Worksheet['topic'];
  parts: WorksheetPart[];
}

/** "G:" hint lines of a paragraph prompt go under it. */
function splitHints(prompt: string): { prompt: string; hints: string[] } {
  const lines = prompt.split('\n');
  const hints = lines.filter((l) => /^\s*G:/.test(l)).map((l) => l.trim());
  return { prompt: lines.filter((l) => !/^\s*G:/.test(l)).join('\n').trim() || prompt, hints };
}

/**
 * Capitals a "Viết chữ hoa" item models: listed after the colon ("Viết chữ hoa: I, K"), or, where the
 * book shows them only as a picture, named in its description ("mẫu chữ hoa Đ cỡ vừa …").
 */
export function lettersOf(item: CurriculumItem): string[] {
  const after = /^Viết chữ hoa:?\s*(.*?)\.?$/.exec(item.prompt.trim())?.[1] ?? '';
  const listed = after.split(',').map((l) => l.trim()).filter(Boolean);
  if (listed.length > 0) return listed;
  const pictured = (item.media ?? []).flatMap((m) => [...m.matchAll(/mẫu chữ hoa (\p{Lu})(?!\p{L})/gu)].map((match) => match[1] ?? ''));
  return [...new Set(pictured.filter(Boolean))];
}

/** The sentence to copy in a "Viết ứng dụng" section, line by line, without the "Viết ứng dụng:" lead-in. */
export function modelOf(prompt: string): string[] {
  const sentence = /^Viết ứng dụng:\s*([\s\S]+)$/.exec(prompt)?.[1] ?? prompt;
  return sentence.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** A block of an inventory item (quests still played from the book only; removed with the inventory). */
function inventoryBlock(item: CurriculumItem, section: CurriculumSection): WorksheetBlock | null {
  const base = { curriculumRef: [item.id] };
  const paragraph = () => ({ kind: 'paragraph-prompt' as const, ...splitHints(item.prompt), lines: PARAGRAPH_LINES, ...base });
  switch (section.kind) {
    case 'viet-chu-hoa':
      return { kind: 'letter', prompt: item.prompt, letters: lettersOf(item), ...base };
    case 'viet-ung-dung':
      return { kind: 'copy-line', text: item.prompt, model: modelOf(item.prompt), ...base };
    case 'nghe-viet':
      return { kind: 'dictation', prompt: item.prompt, title: section.text?.title, text: section.text?.body, ...base };
    case 'viet-doan':
      return paragraph();
    case 'van-dung':
      return { kind: 'activity', prompt: item.prompt, media: item.media ?? [], ...base };
  }
  switch (item.exerciseType) {
    case 'viet-chu':
      return { kind: 'copy-line', text: item.prompt, ...base };
    case 'nghe-viet':
      return { kind: 'dictation', prompt: item.prompt, ...base };
    case 'viet-doan':
      return paragraph();
    case 'do-luong-thuc-hanh':
    case 've-hinh':
      return { kind: 'activity', prompt: item.prompt, media: item.media ?? [], ...base };
    default:
      return null;
  }
}

function inventoryBlocks(lesson: CurriculumLesson): WorksheetBlock[] {
  return lesson.sections.flatMap((section) => section.items.map((item) => inventoryBlock(item, section)).filter((b) => b !== null));
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
    const parts = quest.steps.flatMap((s) => (s.kind === 'worksheet' ? [{ ...(s.sheet ? { sheet: s.sheet } : {}), ...(s.lessonId ? { lessonId: s.lessonId } : {}) }] : []));
    if (!topic || parts.length === 0) continue;
    sources.push({
      id: quest.id,
      title: parts.find((p) => p.sheet)?.sheet?.title ?? quest.title,
      subject: { id: topic.subject, name: subjectNames.get(topic.subject) ?? topic.subject },
      topic: { id: topic.id, title: topic.title },
      parts,
    });
  }
  return sources.sort((a, b) => topicOrder.indexOf(a.topic.id) - topicOrder.indexOf(b.topic.id));
}

/** One worksheet per source that has something to write; inventory lessons come from `books`. */
export function buildWorksheets(sources: readonly WorksheetSource[], books: readonly LoadedBook[] = []): Map<string, Worksheet> {
  const lessons = new Map(books.flatMap(({ units }) => units.flatMap((u) => u.lessons.map((l) => [l.id, l] as const))));
  const sheets = new Map<string, Worksheet>();
  for (const source of sources) {
    // Every worksheet step adds its blocks in step order; two steps handing out the same lesson add it once.
    const seen = new Set<string>();
    const blocks = source.parts.flatMap((part) => {
      if (part.sheet) return sheetBlocks(part.sheet);
      if (part.lessonId === undefined || seen.has(part.lessonId)) return [];
      seen.add(part.lessonId);
      const lesson = lessons.get(part.lessonId);
      return lesson ? inventoryBlocks(lesson) : [];
    });
    if (blocks.length === 0) continue;
    sheets.set(source.id, { id: source.id, subject: source.subject, topic: source.topic, title: source.title, blocks });
  }
  return sheets;
}

/** Built once at startup from the loaded content; a broken inventory file fails the boot, not a request. */
export function loadWorksheets(content: Pick<ContentCatalog, 'quests' | 'learning' | 'subjects'>, curriculumDir?: string): Map<string, Worksheet> {
  const sources = worksheetSources(content);
  const needsBook = sources.some((s) => s.parts.some((p) => p.lessonId !== undefined));
  const { books, issues } = needsBook ? readCurriculum(curriculumDir) : { books: [], issues: [] };
  if (issues.length > 0) throw new Error(`invalid textbook inventory: ${issues.join('; ')}`);
  return buildWorksheets(sources, books);
}
