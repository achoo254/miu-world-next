// Whether a step teaches a language (Tiếng Việt, English): its answer labels ("ô", "cậu", a word to spell or sort) are
// then the lesson itself and are never swapped for the name glossary's English. Read from the quest's topic when it
// has one, else from the step's skill (content/learning/skills.json: every skill belongs to a subject).
import skillsJson from '../../../../../content/learning/skills.json';

/** Subjects whose words are what the child learns. */
const LANGUAGE_SUBJECTS: ReadonlySet<string> = new Set(['tieng-viet', 'english']);

interface SkillCatalog {
  subjects: ReadonlyArray<{ id: string; skills: ReadonlyArray<{ id: string }> }>;
}

const LANGUAGE_SKILLS: ReadonlySet<string> = new Set(
  (skillsJson as SkillCatalog).subjects.filter((s) => LANGUAGE_SUBJECTS.has(s.id)).flatMap((s) => s.skills.map((k) => k.id)),
);

/** True when the quest's topic or the step's skill is a language lesson. */
export function teachesLanguage(quest: { topic?: { subject: string } | undefined }, step: object): boolean {
  if (quest.topic && LANGUAGE_SUBJECTS.has(quest.topic.subject)) return true;
  const skill = 'skill' in step ? step.skill : undefined;
  return typeof skill === 'string' && LANGUAGE_SKILLS.has(skill);
}
