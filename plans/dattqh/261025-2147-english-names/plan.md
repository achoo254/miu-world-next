# English names for characters, places, things and maps

Status: done (deployed 25/10/2026, build ea2af28d) · Tier L · Owner request 25/10/2026: "tên NPC, tên vật phẩm, tên đường, tên map… chưa có tiếng Anh. Soát toàn bộ các tên tiếng Việt rồi thêm tiếng Anh."

## Decisions (owner, 25/10/2026)

- NPC names: nicknames translated by meaning, personal names kept, kinship titles in English ("Koala Ghép Tranh" → "Puzzle Koala", "Bác câu cá Sơn" → "Uncle Sơn the Angler"). Same as the Olympic event characters (`nameEn`).
- Existing English quest text that names an NPC by its old Vietnamese name is updated to the new English name (name only, sentences not rewritten).

## Approach

- One glossary per group, `content/i18n/names/<group>.json`, `{"Vietnamese name": "English name"}` (groups: character, place, thing, wearable, home, action, title, quest — the last holds quest and step titles that have no `en` of their own). A name gets one English twin wherever it shows. An item's own `en.name` and an event character's `nameEn` stay authoritative.
- `pnpm content:names` (`tools/content/name-glossary.ts`) harvests every Vietnamese name from `content/` and `assets/generated/world/*/entities.json` and lists those without English; `content:check` fails on gaps and broken placeholders.
- Web: the glossary loads only when the language mode is English or Both; every place that shows a name goes through one lookup.

## Phases

| # | Phase | Tier | Status |
|---|---|---|---|
| 1 | Harvest tool + batches | S | done |
| 2 | Translate 6,833 names (parallel batches) | L | done |
| 3 | Web lookup + wire every name display + gate in `content:check` | M | done |
| 4 | English quest text uses the new NPC names | M | done (3,072 lines; 44 lines holding Vietnamese sentences kept) |
| 5 | Review, screens in English mode, release | S | done |
| 6 | Quest and step titles without English (1,161, glossary group `quest`) | M | done |

## Translation style

- Short, natural English a child learning English can read; no explanations in brackets.
- Case: characters and places in Title Case ("Puzzle Koala", "Secret Forest", "Lantern Parade Road"); things, wearables, home decor and verbs in sentence case ("Night star map", "Mint bamboo basket", "Open chest", "Talk").
- Kinship titles: Ông → Grandpa, Bà → Grandma, Bác → Uncle (Auntie when the hint or name is clearly female), Chú → Uncle, Cô → Auntie (Cô giáo → Teacher), Dì/Thím/Mợ → Auntie, Anh → Brother, Chị → Sister, Bé/Em → Little. Keep personal names with their diacritics: "Cô bánh mì Hạnh" → "Auntie Hạnh the Baker", "Bà Năm Kể Chuyện" → "Grandma Năm the Storyteller".
- Animal nicknames by meaning: "Voi Bốc Hàng" → "Porter Elephant", "Mèo Gắp Thú" → "Claw-Machine Cat".
- Generic passers-by: "Cô bán hoa" → "Flower seller", "Chú bán hoa quả" → "Fruit seller".
- Vietnamese things with no English word keep the word: tò he, bánh chưng, nón lá → "conical hat" (an English word exists, use it), áo dài stays "áo dài".
- `{placeholders}` stay as they are: "Nhà của {name}" → "{name}'s Home".
- Colour and pattern suffixes stay consistent across a family: bạc hà → mint, hồng → pink, chấm bi → polka-dot, kẻ sọc → striped, ngôi sao → star.
- Never mention a grade, a textbook or a lesson.

## Known limits

- Names inside a few logic puzzles stay Vietnamese in the English text when the answers name the same characters ("Gấu Bắp Cày", "Mèo Mướp").
- Answer labels show English only beside an English question; Vietnamese-language lessons keep their labels.
- Name boards painted on the map follow the language chosen when the map loads.
