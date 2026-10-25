# English names on the web — implementation report

Plan: `plans/dattqh/261025-2147-english-names/plan.md`, phase 3 (web lookup + wiring). Status: DONE_WITH_CONCERNS.

## Core

- `apps/web/src/ui/i18n/names.ts`: `nameOf(vi, ownEnglish?) → Bilingual` (own English > glossary > Vietnamese), `nameText()` for one string in the current mode, `onNamesChange`, `onNameDisplayChange` (mode change or glossary arrival, for game labels), `loadNames()`. Lookup order: exact key; then templated keys (`{name}`, `{who}`…) compiled once into anchored regexes (keys that are only a placeholder are skipped); then labels built with `" · "` translate each part.
- `apps/web/src/ui/i18n/names-glossary.ts`: merges the 7 group files. It is imported only via `import('./names-glossary')`, so Vite emits it as its own chunk. Loading starts when the mode becomes `en` or `both`, either at the first `nameOf` call or through the `onLangModeChange` subscription. In `vi` mode nothing is downloaded (covered by a test).
- `use-t.tsx`: `useLangMode` now subscribes to the mode and to glossary arrival (snapshot `mode:revision`), so every screen re-renders when the names arrive. Added `<Name vi en? fill?>` and `useT().name(vi, en?)`.
- `content/i18n/names/*.json`: these were created as `{}`. Translators have filled them since (6,807 entries, 2 templated).
- Root `package.json`: `"content:names": "tsx tools/content/name-glossary.ts"` (not wired into content:check).

## Display sites wired

- **Interaction label over a target** (play-screen `InteractionLabel`): renders `joinBoth([name, ' · ', label])` through `<Bi>`, which gives "Puzzle Koala · Talk" in English and two stacked lines in Song ngữ. `InteractionPrompt` now carries `nameEn`/`labelEn`. The object manager sends the registry's own `nameEn`/`verbEn`/`offEn`, the game sends locale pairs for the player/pet prompts, and other players' names are never translated. The quest toasts' `{who}` uses the same name, and `fillLine` takes a `Bilingual`.
- **Minimap and full map:**
  - Markers hold `MarkerLine` (a Vietnamese name, a Bilingual, or a locale key with params). `map-text.ts` turns them into the display language at draw time, so a mode change or late glossary shows at the next drawing.
  - Hard-coded Vietnamese UI words in the minimap model moved to 19 new `map.*` locale keys: legend groups, "Cổng sang …", "Bến/Ga …", "Đi tới: …", story, games, boss kinds and quest place.
  - Boss markers use the quest's own `en.title`/`en.bossName`. Side-givers use the step's `en.title`, and storytellers use the chapter `title.en`.
  - The map title is written in the display language each time the sheet opens.
- **Other game runtime:** name boards on maps are painted in the current mode at load (`interactables.ts`), and the pet's outing line `{map}` uses the English map name.
- **UI screens:**
  - **Backpack:** item name (`en.name`) and description (`en.description`).
  - **Collection book:** item names, set name/title (getters, so they stay fresh), the region tab, `map` param and item description.
  - **Collectible drop:** handled through `itemName`.
  - **Trophy room:** item description and cup region.
  - **Shop:** item names via `nameOf(name, nameEn)`, bundle parts, decor slot names. The booster choice is wired too.
  - **Home decor:** slot names, style names, souvenir region (aria, lock badge, note, link).
  - **Wardrobe (creator):** species, pets, accessories, outfits, and the lock text's region and quest title (quest's own `en.title`).
  - **Pet care:** the default kind name. A picked pet name stays as written. Also the dish names and the pet HUD button.
  - **Cooking:** recipe (`en.name`) and ingredients (item `en.name`).
  - **Achievements:** names and reward items.
  - **Journey:** region cards, skill-up skill name, event detail (label + item).
  - **Profile:** skill tree (skill, subject tab, gift item), progress (subjects, skill chips), owned items.
  - **Topic label:** subject and topic.
  - **Region screen:** sign name and subject, board titles (region prefix stripped per language), story NPC name.
  - **Region rewards:** tier item, decor souvenir and slot, title, earned title. Reward badges are wired too.
  - **Region books:** name, subject, topics.
  - **World map:** island markers, name and subject.
  - **Travel button:** map name.
  - **Daily lesson:** map name.
  - **Loading overlay:** region name.
  - **Dialogue:** speaker title.
  - **Challenge frame:** presenter name.
  - **Boss duel:** boss name.
  - **NPC card:** title and `{who}`, gift item names.
  - **Village friends:** names, relations, regions, likes.
  - **Completion screens:** skills, items, region, story NPC.
  - **Skill-check modal:** target and skill.
  - **Social layer:** place of a party member, travel invite place, pet alt.
  - **Ride button:** vehicle title.
  - **Coop:** boss name (`nameEn` first).
- **Challenge labels:** I added `ChallengeContext.label(vi, en?)`. The step's own `en` twin wins; when it is missing, the glossary fills the gap, unless the step teaches a language. It is used for:
  - drag-drop pieces and container
  - classify cards and groups
  - sort items
  - logic elements and choices
  - multi-select choices
  - quiz choices (`ChoiceList` got an optional `say`)

### Language-lesson detection (coordinator rule)

`ui/challenge/language-lesson.ts` `teachesLanguage(quest, step)`:
- It returns true when `quest.topic.subject` is `tieng-viet` or `english`. The server fills `topic` on learning quests.
- Otherwise it reads the step's `skill` field, which the public step keeps. The skill is checked against `content/learning/skills.json` for those two subjects. This catches bosses, guardians and early chapters that have no topic.
- I also excluded `english`: translating a Vietnamese label in English mode could hand over the answer of an English lesson.

## Deliberately skipped

- **Fill-blank options:** the template sentence has no English twin. A translated option would sit inside a Vietnamese sentence.
- **Read-step choices:** reading comprehension wording.
- **Connect-point labels:** letters or numbers.
- **Not translated by rule:** the player's own name, other players' names, picked pet names, timetable entries, free text.
- **Parent worksheets screen:** a Vietnamese-only printable screen with no i18n in it today.
- **Progress suggestion titles (server-filled quest titles):** the DTO has no English and quest titles are not in the glossary.
- **Region taglines/descriptions, species trait, item `usedIn`:** these are sentences, not names, and have no English source.
- **The map's player card "Bạn đang ở đây" and the disc aria text:** hard-coded Vietnamese UI strings, not names, left as they were.
- **Name boards in 3D:** painted once at map load in the current mode. A later mode switch needs a map reload to repaint.
- **Events and olympiad:** already bilingual from content (`BiText`).

## Server

Untouched. Lines produced server-side that include names (toasts with `feedback`, `ProgressSuggestion.title`) carry their own English or none. No new server sentence needs the glossary.

## Tests

- New tests:
  - `ui/i18n/names.test.tsx` (9): own English wins, glossary fallback, unknown name, templated `{name}`/`{who}`, composite `·` labels, modes, 'vi' never loads, React re-render and game notify on arrival, Song ngữ stack.
  - `ui/challenge/language-lesson.test.ts` (3).
- Updated tests:
  - `minimap-model.test.ts` (17): English lines, untranslated vehicle falls back to Vietnamese.
  - `side-givers.test.ts`
  - `play-screen.test.tsx` (`mapBossesOf` Bilingual)
  - `object-interaction.test.ts` (prompt carries `nameEn`/`labelEn`)
  - `boss-duel.test.tsx` (context `label`)
- Runs, each with `--maxWorkers=1`:
  - The batch for `ui/i18n`, `game/hud`, object-interaction and play-screen had 87 tests with 1 failure in `side-givers.test.ts`. I fixed it, and the file now passes on its own (2/2).
  - The batch of 25 touched UI and game folders: 44 files, 334 tests, all passed.
- `pnpm typecheck`: exit 0, 0 `error TS`.
- `pnpm lint`: exit 0 (eslint `--max-warnings=0`, 0 warnings; check-brand OK).
- `pnpm content:check`: OK, 2166 files.
- Not run locally (per CLAUDE.md): full `pnpm test`, web build, E2E. CI must confirm the build and that the glossary lands in its own chunk.

## Concerns

- E2E selectors that read prompt or map text could change in English mode only. Vietnamese mode renders the same text, but the interaction label now renders through `<Bi>`, so its inner DOM in Song ngữ is stacked spans.
- In Song ngữ the 3D name boards show "Vi / En" inline on one board and shrink to fit.
- The glossary chunk is about 340 KB of JSON before compression, downloaded once by English/Song ngữ players.
