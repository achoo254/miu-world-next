# Code review: English names (4f76cf66, 2dfbaaee, be55635b, e391fae0)

Scope: `git diff -w 0facdbf3..HEAD -- apps/web tools package.json` (75 files, +1158/−269) plus the glossary (`content/i18n/names/*.json`, 6,807 entries) and a sample of the quest English renames (614 files).

Checks run locally:
- `pnpm vitest run` on `names.test.tsx`, `language-lesson.test.ts` and `name-glossary.test.ts`: 15/15 passed.
- `pnpm typecheck`: exit 0.
- `pnpm lint`: exit 0, check-brand OK.

CI checks:
- mobile run 40206707659: **failed**.
- ci run 40206707679: e2e 1/2 and 2/2, maps, integration and sast are green. `check` was still running when I looked; see C1.

## Critical

### C1. The glossary chunk fails `security:dist`, so CI and the mobile build are red

- **Where:** `tools/content/name-glossary.ts:102`. It reads `['name','label']` from every quest step.
- **Evidence:** mobile run 40206707659 failed with:
  - `security:dist FAILED (1): apps/web/dist-native/assets/names-glossary-B5JVDguD.js: answer text "5 giờ rưỡi chiều…"`
  - The `check` job of ci.yml runs the same `pnpm security:dist` after the web build, and it scans the same chunk, so it will fail the same way. That blocks the release gate.
- **Cause:** the harvest copies quest answer labels into the glossary.
  - The sort label `"Trả đồ cho từng bạn: 5 giờ rưỡi chiều"` (`yarn-doi-tai-to-do-lac-3`) becomes a glossary key.
  - It contains the answer text `"5 giờ rưỡi chiều"` of `yarn-canh-cut-xoay-ba-vong-4`, which `questSecrets` treats as secret (≥16 chars).
  - I checked all 2,264 secrets against the glossary: 1 hit today. Every new quest can add more.
- **Gaps:**
  - `content:check` does not run this scan, so the gap shows only after a build on CI.
  - The plan says "names". Quest step labels are lesson content, not names: logic clues such as "Bi không ở dưới chiếc cốc đứng giữa.", sort items, and Tiếng Việt spelling words ("ô"→"umbrella", "cậu"→"uncle", "và"→"and").
  - The whole set now ships to every English/Song ngữ client in one chunk, including quests not yet unlocked.
- **Fix, either one:**
  - (a) Stop harvesting quest `label`s (line 102). Translate lesson labels through the step's own `en` twins only.
  - (b) Keep the harvest, but in `content:check` (next to `glossaryIssues`, `check-content.ts:756`) fail when any glossary key or value contains a `questSecrets(...)` string. Also drop the language-lesson labels from the harvest.

  Recommended: (a), plus the `content:check` scan as a guard.

## High

### H1. In English mode, the answers can be in English while the question stays in Vietnamese

- **Where:** `learning-step.tsx:131`.
- **Behaviour:** `label` uses the glossary even when the step has no English twin for its prompt. `say` (line 130) then shows the prompt in Vietnamese in every mode.
- **Scale:** about 59 non-language lesson steps with glossary-matched labels have no `en` at all.
- **Examples:**
  - `toan2-cd1-b01/mieng-bia-bang-so`: the prompt says "Ô xanh ở…". The groups read "Blue square / Yellow square / Red square / Purple square".
  - `toan2-cd3-b16/nhieu-nuoc-it-nuoc`: the prompt says "ấm 4 l, bình 5 l, xô 8 l, can 11 l". The items read "Kettle / Pitcher / Bucket" plus an untranslated "can".
  - `toan2-cd5-b26` (×3 steps): the choices read "Cloud Rabbit", "Hổ Con Đậu" (no glossary entry), "Button Bear". The prompt names all three in Vietnamese.
- **Risk:**
  - In English mode the child has to translate between the two languages to match the prompt to the answer. That changes how hard a maths lesson is.
  - Choices can show half in English, half in Vietnamese.
  - Grading is not affected: answers are compared by id. I checked quiz `{choice}`, sort order ids, classify assignment ids, drag-drop `placed` ids and multi-select ids.
- **Fix:** use the glossary for labels only when the step has an English prompt (`step.en?.prompt`). Otherwise use `twin(vi, en)`.

## Medium

### M1. Bus, boat and train stops on the map are never in English
- **Where:** `minimap-model.ts:93–119`, `map-text.ts:24`.
- **Behaviour:** the vehicle names split from stop names are not in the glossary: "Xe buýt", "Thuyền", "Tàu rừng", "Đò", "Cáp treo", "Khinh khí cầu". Neither are many destinations: "Rừng nhiệt đới", "Hang động", "quảng trường", "thư viện"…
- **Effect:** `untranslated` keeps every station label in Vietnamese in English mode, and the "Đi tới:" places are mostly Vietnamese.
- **Gap:** the `content:check` gate cannot see these, because it harvests only whole stop names.
- **Fix:** harvest the parts `rideOf` produces (vehicle and destinations) into the glossary.

### M2. Name boards painted while the glossary is still loading stay in Vietnamese
- **Where:** `interactables.ts:227`.
- **Behaviour:** boards are painted once, at map load, with `nameText`.
- **Scenario:** a cold start in English mode on a slow mobile network. The map builds before the chunk (~340 KB raw) arrives, so "Nhà của …" stays Vietnamese until the next map load.
- **Misleading comment:** `names.ts:8` says "the game relabels through `onNameDisplayChange`", but `onNameDisplayChange` (`names.ts:135`) is never called.
- **Fix:** either `await loadNames()` before building boards when the mode is not `vi`, or subscribe and repaint. Remove the dead export or the comment.

### M3. Quest English renames are inconsistent (2dfbaaee, content)
- **Inconsistency:**
  - Short names were renamed in some places and not others, e.g. "Every evening **Cat** sits on **Voi**'s back" and "**Cô** keeps losing **Cat**'s trick riddles".
  - Generic species words read oddly as names: "into the paws of Bear".
- **Leftovers (3):**
  - `yarn-ho-coi-giao-huu-1` `support.en.answer.explanation` still says "Mèo Mướp".
  - `yarn-khi-day-leo-nhac-4` `en.choices[3]` and `feedback.en.wrong[0]` still say "Gấu Bắp".

## Low

- **L1. A pet name the child typed can be translated** (`game.ts:1325` → `play-screen.tsx:158`).
  - The pet prompt sends `name: petName` (bond name) without `nameEn`, so it goes through the glossary.
  - A pet named "Mèo", "Vàng" or "Thỏ" shows as "Cat", "Yellow" or "Rabbit".
  - The report says picked pet names stay as written; this path does not. Fix: send `nameEn: petName`.
- **L2. Classify ignores its own English twin** (`classify-challenge.tsx:57`).
  - It calls `context.label(item.label)` without `step.en?.items?.[i]`, so the glossary wins over the step's own twin.
  - One step has `en.items` today; its values happen to match the glossary, so nothing shows wrong yet.
- **L3. A failed download is retried only on the next mode change** (`names.ts:67–70`).
  - On failure the fallback is Vietnamese with no crash. Verified: `catch` resets `loading`, and there is no `vite:preloadError` reload handler, so no reload loop.
  - Some browsers remember a failed dynamic import for the page's lifetime, so a retry may need a page reload. Acceptable.
- **L4. The party place does not refresh when the glossary arrives** (`social-layer.tsx:34`).
  - `nameText` is read during render. The component that uses it may not subscribe to name changes; check the caller.
- **L5. The template `Nhà của {name}` also matches NPC houses missing from the glossary**, giving half-translated names like "Bà Năm's Home". Exact keys win, so the risk is small.
- **L6. The `content:check` gate does not flag stale glossary entries** whose name has left the content, so the glossary only grows.

## Checked and fine

- **Precedence:** own English (`en.name`, `nameEn`, a step's `en` twin, the registry's `nameEn`/`verbEn`) beats the glossary, which beats Vietnamese (`names.ts:113–117`). There are no conflicts between glossary groups (0).
- **Player names:**
  - Other players' and bots' names travel as `nameEn`, so they are never looked up.
  - Coop and party names use a local `nameOf` and display names.
  - `{name}` is filled after the lookup (`<Name fill>`), and the template keeps the player's name as written.
  - No dialogue speaker contains `{name}`.
- **Language lessons:**
  - `teachesLanguage` covers all 150 language steps whose labels match the glossary.
  - Challenge steps always carry `skill` in the public schema, so the fallback works for bosses and guardians too.
  - Boss duel and fill-blank do not use `label`.
- **Vietnamese mode:** nothing downloads the glossary. `names-glossary` is imported only by `import()` (the CI log shows its own chunk), and `followMode` skips `vi`.
- **Re-renders and subscriptions:**
  - `useSyncExternalStore` uses a string snapshot, and its subscription cleans up after itself.
  - `ensureFollowing` subscribes once.
  - `useT` memoises on `mode`, but `name()` reads the live glossary and the component re-renders on the revision, so names are not stale.
  - No changed file memoises names.
- **Performance:**
  - The game sends the prompt only when it changes (`game.ts:1301`), not every frame.
  - The map sheet looks up labels per draw (a Map lookup, 2 precompiled regexes, then a split); the minimap disc draws no labels.
- **E2E:** selectors use `.npc-label[data-target]` and `[data-id=play-prompt-*]`, and `toContainText('Vẹt')` in `vi` mode. `<Bi>` renders plain text in `vi`, and E2E is green on CI.
- **Server:** untouched (no diff under `apps/server` or `packages`).
- **`content:check` gate:** the new `readByNameGlossary` whitelist and the missing/broken-placeholder checks are correct. The only templated keys (2) have matching placeholders.

## Recommended actions
1. Fix C1 before anything else ships. CI and mobile are red.
2. H1: use the glossary for lesson labels only when the step has an English prompt.
3. M1, M2, then L1 and L2.
4. Clean up the three English leftovers and the inconsistent short names (M3).

## Unresolved questions
- Product: in English mode, should a maths lesson without an English prompt keep its answer labels in Vietnamese (H1)? I recommend yes.

Status: DONE_WITH_CONCERNS
Summary: The glossary harvests quest answer labels, so the shipped chunk trips `security:dist`: mobile CI is already red and the web `check` job runs the same scan. Lesson labels are also translated when the prompt has no English, mixing two languages in one question; grading is unaffected because answers are compared by id.
