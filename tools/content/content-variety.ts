// Content must never feel repeated: no quest reuses another quest's lines (dialogue, prompts, support,
// feedback, rewards…), and no two learning quests are built from the same sequence of mechanics.
import path from 'node:path';
import type { QuestDefinition } from '../../packages/schema/src/content';
import { stepMechanic } from './mechanic-rules';

/** Shorter strings are labels (a choice "5", a title "Đọc bài"), not lines of content. */
const MIN_LINE_LENGTH = 16;
/**
 * Keys whose values are ids, enums or machine data, not something a child reads or hears, and the speaker of a
 * line or a boss's name (a character's name: a character who gives several games says its name in each, and keeps it
 * in English).
 */
const NOT_TEXT = new Set(['speaker', 'bossName', 'id', 'kind', 'mechanic', 'trigger', 'target', 'targets', 'skill', 'status', 'region', 'review', 'textRef', 'topic', 'objective', 'expression', 'source', 'phases', 'type', 'mode', 'display', 'sevenQuestions', 'category', 'game', 'params']);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const labelsOf = (choices: unknown): string[] =>
  Array.isArray(choices) ? choices.flatMap((c) => (typeof c === 'string' ? [c] : isRecord(c) && typeof c.text === 'string' ? [c.text] : [])) : [];

/**
 * A boss question's support with its answer layer's text left out where that text is one of the question's own
 * choices (in its language): the answer layer names the right choice as it reads, a label shown again, not a new line.
 */
function withoutChoiceAnswers(turn: Record<string, unknown>): Record<string, unknown> {
  const support = turn.support;
  if (!isRecord(support) || !isRecord(support.answer)) return turn;
  const vi = labelsOf(turn.choices);
  const en = isRecord(turn.en) ? labelsOf(turn.en.choices) : [];
  const answer = { ...support.answer };
  if (typeof answer.text === 'string' && vi.includes(answer.text)) delete answer.text;
  let english = support.en;
  if (isRecord(english) && isRecord(english.answer) && typeof english.answer.text === 'string' && en.includes(english.answer.text)) {
    const { text: _text, ...rest } = english.answer;
    english = { ...english, answer: rest };
  }
  return { ...turn, support: { ...support, answer, en: english } };
}

/** Every line of a quest a player reads or hears, with where it is; the passages (`texts`) are left out. */
export function playerLines(quest: QuestDefinition): Array<{ where: string; text: string }> {
  const lines: Array<{ where: string; text: string }> = [];
  const visit = (value: unknown, where: string): void => {
    if (typeof value === 'string') lines.push({ where, text: value });
    else if (Array.isArray(value)) value.forEach((v, i) => visit(v, `${where}[${i}]`));
    else if (isRecord(value)) {
      // A step's `answer` is graded data; the support layer's `answer` is text the child reads.
      const isStep = 'kind' in value;
      const entries = Object.entries(!isStep && 'support' in value && 'choices' in value ? withoutChoiceAnswers(value) : value);
      for (const [k, v] of entries) {
        if (!NOT_TEXT.has(k) && !(isStep && k === 'answer')) visit(v, where ? `${where}.${k}` : k);
      }
    }
  };
  if (quest.status === 'stub') return lines;
  // Passages are read whole and checked on their own (their source, the copy check), not line by line.
  const { texts: _texts, ...rest } = quest;
  visit(rest, '');
  return lines;
}

// Lines are compared after only two layout-level normalisations: runs of spaces/line breaks become one space, and
// every blank mark (?, …, ..., □, ■, ◻, ___ and the template's {{blank}}) becomes "?". Letters, diacritics, digits
// and punctuation must match exactly.
const BLANK = /\{\{[a-z0-9-]+\}\}|…|\.{3,}|[□■◻◼]|_{2,}/g;
export function normaliseWording(text: string): string {
  return text.normalize('NFC').replace(BLANK, '?').replace(/\s+/g, ' ').trim();
}

/**
 * The Vietnamese line an English twin may keep as it is: only a step's own `title` or `goTo`, where a proper name
 * naturally stays (a folk game, "Chi chi chành chành"). `steps[1].en.title` → `steps[1].title`; any other line of the
 * twin (a prompt, a choice, a line of dialogue) left in Vietnamese is untranslated, and reported.
 */
function nameTwinOf(where: string): string | null {
  const match = /^(.* steps\[\d+\])\.en\.(title|goTo)$/.exec(where);
  return match ? `${match[1]}.${match[2]}` : null;
}

/**
 * The Vietnamese line an English twin repeats on purpose when the line holds no word at all, only numbers and signs
 * ("26 + 3 = 29; 41 + 56 = 97"): `…en.choices[1]` / `…en.answer.text` / `…en.right[0]` twin the same place without
 * `en` (a choice's own `text` included).
 */
function numberTwinOf(where: string, text: string): string[] {
  if (/\p{L}/u.test(text) || !where.includes('.en.')) return [];
  const vi = where.replace('.en.', '.');
  return [vi, `${vi}.text`];
}

export function varietyIssues(quests: readonly QuestDefinition[]): string[] {
  const issues: string[] = [];
  const firstUse = new Map<string, string>();
  for (const quest of quests) {
    for (const { where, text } of playerLines(quest)) {
      const line = normaliseWording(text).toLowerCase();
      if (line.length < MIN_LINE_LENGTH) continue;
      const here = `quest ${quest.id} ${where}`;
      const first = firstUse.get(line);
      if (first !== undefined && first === nameTwinOf(here)) continue;
      if (first !== undefined && numberTwinOf(here, text).includes(first)) continue;
      if (first) issues.push(`${here} repeats "${text}" (already used by ${first}): write a new line`);
      else firstUse.set(line, here);
    }
  }
  const sequences = new Map<string, string>();
  for (const quest of quests) {
    if (quest.status === 'stub' || !(quest.id.startsWith('toan2-') || quest.id.startsWith('tv2-'))) continue;
    const sequence = quest.steps.map(stepMechanic).join(' → ');
    const other = sequences.get(sequence);
    if (other) issues.push(`quest ${quest.id} plays exactly like ${other} (${sequence}): vary the mechanics or their order`);
    else sequences.set(sequence, quest.id);
  }
  return issues;
}

// `pnpm content:variety [<quest id> …]`: the repeated lines (and look-alike quests), optionally only those of the
// given quests, without the rest of content:check.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const { readQuestDefinitions } = await import('../../apps/server/src/content/content-catalog');
  const questDir = path.resolve(import.meta.dirname, '../../content/quests');
  const ids = process.argv.slice(2);
  const issues = varietyIssues(readQuestDefinitions(questDir)).filter((i) => ids.length === 0 || ids.some((id) => i.startsWith(`quest ${id} `)));
  for (const issue of issues) console.log(issue);
  console.log(`content:variety: ${issues.length} issue(s)`);
}
