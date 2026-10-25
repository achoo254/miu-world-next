// Large answer choices (quiz, reading questions): tap one to select it, then "Kiểm tra".
import { mapBoth, type Bilingual } from '../i18n/i18n';
import { Bi } from '../i18n/use-t';
import { twin } from '../quest/content-text';

const SHORT_CHOICE = 14;

export function ChoiceList({
  choices,
  en,
  selected,
  onSelect,
  fill,
  label,
  say,
}: {
  choices: ReadonlyArray<{ id: string; text: string }>;
  /** The choices' English twins, in order, when the step has them (textbook choices have none). */
  en?: readonly string[] | undefined;
  selected: string | null;
  onSelect: (id: string) => void;
  fill: (text: string) => string;
  label: string;
  /** How a choice reads in both languages (a challenge's `context.label`); default: its twin, `{name}` filled. */
  say?: (vi: string, en?: string | null) => Bilingual;
}) {
  // Short labels ("Cốc đỏ") sit two or three to a row, so a phone shows every choice without scrolling;
  // sentence-long ones keep the wide columns.
  const short = choices.every((c) => fill(c.text).length <= SHORT_CHOICE);
  return (
    <div className={`choice-list${short ? ' choice-list--short' : ''}`} role="radiogroup" aria-label={label}>
      {choices.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={selected === c.id}
          className={`choice${selected === c.id ? ' choice--selected' : ''}`}
          data-id={`choice-${c.id}`}
          onClick={() => onSelect(c.id)}
        >
          <Bi {...(say ? say(c.text, en?.[i]) : mapBoth(twin(c.text, en?.[i]), fill))} />
        </button>
      ))}
    </div>
  );
}
