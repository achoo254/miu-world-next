# Brief: English twins for quest text (dialogue, prompts, support, feedback)

Owner request 25/10/2026: "dịch tiếp lời thoại và đề bài còn thiếu luôn". 93 quests (70 learning quests `toan2-*` / `tv2-*`, 4 chapter stories, 8 `viec-tot-*`, 10 `vuot-ai-*`) have no English for their lines. The goal: each of them reads in English in the English display mode, by the same rule side quests and stories already meet: `englishIssues(quest, true)` in `packages/schema/src/content.ts`.

## What to add (schema: `packages/schema/src/content.ts`)

- Quest: `en: { title, summary }`.
- Every step: its `en` twin, same lines, same order, same counts (`DialogueEn`, `DecisionEn`, `FindObjectEn`, `ReadEn`, `RiddleEn`, `ChallengeEn`, `BeatEn`, `BossEn`, and the other step kinds' `en` near their schema). `en.goTo` exactly when the step has `goTo`.
- `support.en` (`guide` same length, `hint`, `answer: { text, explanation }`), `feedback.en` (`right`, `wrong`, same lengths), boss turns' `en` (`prompt`, `choices`).
- Read the schema for the exact keys; strict objects reject extra keys.
- `speak` (speaking practice) and `worksheet` (printed sheet) steps stay Vietnamese: they take no `en` and `content:english` does not ask for one. Leave them untouched.

## Rules

1. Titles: the quest's `en.title` and each step's `en.title` are EXACTLY the English already chosen in `content/i18n/names/quest.json` (key = the Vietnamese title). Characters and places named anywhere use `content/i18n/names/character.json` and `place.json` (e.g. "Koala Ghép Tranh" → "Puzzle Koala", "Khu rừng bí mật" → "Secret Forest"). Items use `thing.json`.
2. Vietnamese-language lessons (`tv2-*`, and any step whose skill belongs to Tiếng Việt): the words being taught stay Vietnamese. Explain in English, quote the Vietnamese word ("Which word has the rhyme «ương»?"). Choices, items, elements and answer texts that ARE Vietnamese words/letters/syllables/sentences being judged stay exactly as in Vietnamese in `en.choices` / `en.items` / `en.elements` / `support.en.answer.text` (the child must still pick the Vietnamese word). Reading passages (`read` steps, `source` folk or original) get an English translation of the passage in `en.text`, but a question about Vietnamese spelling/words keeps those words.
3. Maths (`toan2-*`): numbers, expressions and units stay; translate the story and the question. Choice labels that are numbers stay as they are.
4. Keep every `{name}` (and other `{placeholder}`) exactly. Keep «» quotes style if used.
5. Short, warm, natural English for children and adults; British spelling (colour, Mum, maths, centre). No brackets with explanations.
6. Never mention a grade/class year, a textbook, a lesson number or a page (`tools/content/no-book-or-grade-wording.ts` checks English too). If the Vietnamese says "lớp 2" as a school class name, use the class's name, not a grade.
7. Only add `en` keys. Do not change any Vietnamese text, ids, answers, order or any other field.

## How

- Edit only your assigned files in `content/quests/`. Writing a file back with `JSON.stringify(data, null, 2) + "\n"` is fine.
- Check your files: `pnpm content:english <id> <id> …` must print `complete` for each (it also validates the schema; a parse error in a file not yours means another agent is mid-write: rerun). Do not run `pnpm content:check`, `pnpm test`, builds or E2E (shared machine; the controller runs the gates).
- Do not git add/commit/push.
