// Content text in every language (docs/i18n.md): a quest, a step, a minigame or a shop item carries its English
// twin in `en`; what has none (textbook wording, text not translated yet) shows in Vietnamese in every mode. Content
// has no Chinese of its own: in 中文 it reads its English twin.
import type { QuestStepPublic } from '@miu/schema/content';
import { mapBoth, twin, type Bilingual } from '../i18n/i18n';
import { nameOf } from '../i18n/names';
import { Bi } from '../i18n/use-t';

/** A line with its English twin (`twin` of i18n, kept here for the content screens that import it from here). */
export { twin };

/**
 * A title in both languages: its own English first, then the name glossary (content/i18n/names/quest.json holds the
 * quest and step titles that have no `en` of their own), else the Vietnamese.
 */
const titleTwin = (vi: string, en: string | null | undefined): Bilingual => nameOf(vi, en && en.trim() !== '' ? en : null);

/** A quest's (or a story's) title in both languages. */
export const titleOf = (quest: { title: string; en?: { title: string } | undefined }): Bilingual => titleTwin(quest.title, quest.en?.title);

/** A quest's summary in both languages. */
export const summaryOf = (quest: { summary: string; en?: { summary: string } | undefined }): Bilingual => twin(quest.summary, quest.en?.summary);

/** A step's English title and directions (textbook-only kinds have none). */
const enOf = (step: QuestStepPublic): { title?: string | undefined; goTo?: string | undefined } | undefined => ('en' in step ? step.en : undefined);

/** A step's own title in both languages. */
export const stepTitleOf = (step: QuestStepPublic): Bilingual => titleTwin(step.title, enOf(step)?.title);

/** Where the tracker sends the child for a step (its `goTo`, else its title), in both languages. */
export const stepLineOf = (step: QuestStepPublic): Bilingual => (step.goTo ? twin(step.goTo, enOf(step)?.goTo) : stepTitleOf(step));

/** The `i`-th English twin of a list the step translates (choices, items, elements), if any. */
export const nthEn = (list: readonly string[] | undefined, i: number): string | undefined => list?.[i];

/** Content text on screen: both languages filled with the player's name (`{name}`), shown by the current mode. */
export function Say({ text, fill }: { text: Bilingual; fill: (line: string) => string }) {
  const filled = mapBoth(text, fill);
  return <Bi {...filled} />;
}
