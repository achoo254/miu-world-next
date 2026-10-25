# Báo cáo: xóa kiểm kê sách, cổng cứng chống chép, tệp riêng (pha 7, mục 1–3)

Plan: `plans/dattqh/261025-0029-original-learning-content/`. Trạng thái: xong. Chưa stage, chưa commit.

## Kết quả

Kiểm kê sách, danh sách chờ viết lại và mọi nhánh miễn trừ đã xóa hết. Từ nay mọi quest đều qua kiểm vân tay và kiểm cụm cấm. Schema không còn trường nào trỏ về sách. `pnpm content:gaps` chỉ báo theo mục tiêu: 21 chủ đề, 64/64 mục tiêu đã luyện đủ dạng bài. Tệp vân tay `content/learning/textbook-fingerprints.bin` và kiểm vân tay được giữ.

## Tệp đã xóa

- `content/curriculum/` (15 tệp), `apps/server/test/fixtures/curriculum/` (4 tệp)
- `packages/schema/src/curriculum.ts` và `.test.ts`. `ExerciseType` và `evaluateExpression` vốn đã nằm ở `learning.ts`; các ca test của `evaluateExpression` chuyển sang `learning.test.ts`.
- `tools/content/check-curriculum.ts` và `.test.ts`
- `tools/content/curriculum-links.ts` và `.test.ts`: `stepMechanic` chuyển sang `mechanic-rules.ts`, `normaliseWording` (cùng test của nó) chuyển sang `content-variety.ts`, phần còn lại thuộc kiểm kê nên xóa.
- `tools/content/textbook-copy-pending.json`, `tools/content/textbook-copy-baseline.ts`
- `apps/server/src/worksheet/curriculum-books.ts` và `.test.ts`
- `tools/learning/migrate-quest-topics.ts`, `tools/sgk/review-quests.ts`, `tools/sgk/split-pages.py`
- `assets/generated/review/sgk-coverage.json`, thay bằng `objective-coverage.json`

## Tệp đổi tên

- `apps/server/test/fixtures/quests/quest-sgk.json` → `quest-mechanics.json` (id `quest-mechanics`)
- `apps/web/e2e/sgk-mechanics.spec.ts` → `apps/web/e2e/quest-mechanics.spec.ts`; project Playwright `quest-mechanics`. CI chia shard theo số, không theo tên, nên `ci.yml` không phải sửa.
- `apps/web/e2e/fixtures/quests/e2e-sgk-mechanics.json` → `e2e-quest-mechanics.json` (id `e2e-quest-mechanics`)
- Thư mục ảnh E2E ở local: `.data/sgk/review-shots/` → `.data/review-shots/` (trong `maps`, `worksheets`, `quest-mechanics`)

## Thay đổi chính

- **Schema** (`packages/schema/src/content.ts`):
  - Bỏ `lesson`, `curriculumRef` và `lessonId`; bỏ `author`, `section` khỏi `QuestText`.
  - Bước `worksheet` giờ bắt buộc có `sheet`.
  - `isTextbookQuest` đổi thành `isLearningQuestId`. Các thông báo lỗi đổi theo: "a side quest teaches no topic", "a learning quest needs…".
- **Phiếu viết** (`packages/schema/src/worksheet.ts`): khối phiếu bỏ `curriculumRef`.
- **Tác giả bài đọc** (`packages/schema/src/game.ts`): trước đây tên tác giả hiện cho người chơi lấy từ `author` của sách. Trường đó đã bỏ, nên `QuestView` giờ lấy tên tác giả từ `source` khi bài đọc là `public-domain` (quyền được nêu tên của tác giả không hết hạn). Nhờ vậy giao diện `read-step` vẫn hiện tên tác giả như cũ. Hiện chưa quest nào dùng `public-domain`.
- **Worksheet builder**: chỉ còn in phiếu của chính quest (`sheets`), không còn nhánh `lessonId` hay đọc kiểm kê. Fixture phiếu trong `test-app.ts` viết lại bằng `sheet`.
- **`no-textbook-copy.ts`**:
  - Bỏ danh sách chờ, baseline và `textbookLinks` (schema strict đã chặn các trường đó).
  - Kiểm áp cho mọi quest; bài đọc nào cũng phải khai `source`.
- **`no-book-or-grade-wording.ts`**: bỏ `pendingQuests`; quét mọi chuỗi của mọi tệp quest, cộng NPC và `targets.json`.
- **`learning-links.ts`**: bỏ tham số `pending` và cờ `gated`; mọi mục tiêu của mọi chủ đề đều bị gate.
- **`content-gaps.ts`**:
  - Báo theo mục tiêu là mặc định; bỏ `--topics`, `--book`, `--unit`; giữ `--missing`.
  - `--review` ghi `assets/generated/review/objective-coverage.json`, gồm tổng theo từng chủ đề và tên môn. Trang review (`review-main.ts`, `review.html`) vẽ một bảng cho mỗi môn.
  - Đã chạy `pnpm assets:manifest`. Diff của manifest chỉ gồm 2 mục: thêm mục `objective-coverage.json`, bỏ mục `sgk-coverage.json`.
- **`content-variety.ts`**:
  - Bỏ miễn trừ "chữ của sách".
  - Bỏ miễn trừ đã làm lộ một lỗi ở `side-chi-chi`: `steps[1].en.title` lặp đúng dòng tiếng Việt "Chi chi chành chành" của chính bước đó (tên trò dân gian giữ nguyên trong bản tiếng Anh). Giờ bản `en` được phép giữ nguyên dòng tiếng Việt của chính nó, nhưng vẫn không được lặp dòng khác. Đã thêm test cho trường hợp này.
- **`textbook-fingerprints.ts`**: bỏ phần sinh tệp. Phần đó đọc `content/curriculum` nên không chạy lại được nữa. Phần đọc và băm vân tay giữ nguyên.
- **`acceptance-page.ts`**: bản quest cũ lấy từ git (commit `90294f44`) không còn khớp schema mới. Thêm hàm `legacyQuest` gỡ các trường của sách trước khi parse; tên tác giả cũ hiện riêng ở cột bản cũ. Bỏ dòng nói về "danh sách chờ".
- **`apps/server/src/quest/toan2-quests.test.ts`, `tv2-quests.test.ts`**: không đọc mục lục sách nữa. Giờ kiểm đủ 36 và 34 quest, kiểm map và chương theo id; mỗi bước có chấm điểm phải khai `objective`.
- **`package.json`**: bỏ script `sgk:review`.
- **`tools/private/`**:
  - Bỏ cả 5 PDF sách khỏi `private-files.json`, chỉ còn thời khóa biểu (khớp với `CLAUDE.md` mà docs agent đang sửa: "chỉ còn thời khóa biểu mặc định").
  - `sync-private.ts` chưa từng có nhánh tách trang (nhánh đó nằm ở `tools/sgk/split-pages.py`, đã xóa); chỉ sửa chú thích đầu tệp. Test đổi tên tệp mẫu.
  - Font HP001 không còn tham chiếu nào trong code. Còn lại: một dòng lịch sử trong `review.html` và ghi nhớ của code-reviewer.
- **`.claude/rules/quest-content.md`**: cập nhật luật như trên.

Các tệp khác chỉ sửa chữ hoặc fixture theo các thay đổi trên: `content-catalog.test.ts`, `quest-routes.test.ts`, `endpoint-table.test.ts` (bỏ `:lessonId`), `notebook.test.ts`, `quest-catalog.test.ts`, `minigame.test.ts`, `mechanics.test.tsx`, `voice-recorder.test.tsx`, `progress-panel.test.tsx`, `quest-flow.spec.ts`, `playwright.config.ts`, `generated.json`, `probe-quests.ts` (giữ làm công cụ kiểm từng quest).

Không đụng tới `content/quests/*.json` và map. Không quest nào còn `lesson`/`curriculumRef`; schema strict cũng chặn.

## Kết quả kiểm (theo thứ tự)

1. `pnpm assets:check`: `assets:check OK — 17 packs, 4746 files`.
2. `pnpm content:check`: `content:check OK — 2158 files`, 0 cảnh báo. Kiểm vân tay có chạy: khóa đọc được từ iCloud, không có cảnh báo "skipped".
3. `pnpm typecheck`: 0 lỗi (root, `apps/mobile`, `apps/server`, `apps/web` đều Done).
4. `pnpm lint`: eslint `--max-warnings=0` sạch; `check-brand` OK.
5. `pnpm vitest run --maxWorkers=1`:
   - `tools/content/`, `packages/schema/`: 35 tệp, 284 test, đều pass.
   - `tools/learning/`, `tools/private/`: pass (trong lượt 38 tệp).
   - `packages/quest/`, `apps/server/src/quest/`, `apps/server/src/worksheet/`, `content-catalog.test.ts`, `endpoint-table.test.ts`, `minigame.test.ts`: 24 tệp, 312 test, đều pass.
   - Web: `mechanics/`, `lesson-page-data`, `worksheets/`, `vite-lesson-pages`: 5 tệp, 58 test pass; `progress-panel.test.tsx`: 3 test pass.
   - Không chạy full `pnpm test`, build web hay E2E. Cần CI cho build web, E2E `quest-mechanics` và `worksheets`.
6. `git grep -nE "lớp 2|lớp Hai|SGK|sách giáo khoa|Kết nối tri thức"` ngoài `plans/`. Chỗ còn lại:
   - Lý do và mẫu của kiểm cụm cấm: `tools/content/no-book-or-grade-wording.ts` (6 dòng) và `.test.ts` (11 dòng).
   - Assert phủ định (chặn cụm quay lại): `apps/web/src/ui/parent/worksheets/worksheets-screen.test.tsx:95`, `apps/web/vite-lesson-pages.test.ts:80`.
   - `apps/web/review.html` (6 dòng: 30, 42, 59, 73, 82, 173): nội dung trang review của các đợt cũ, thuộc mục 6. Phần số liệu theo mục tiêu tôi đã sửa.
   - Ngoài phạm vi của tôi: `CLAUDE.md`, `docs/**`, Master Plan v3, `.claude/agent-memory/**`.

## Việc docs agent cần cập nhật

- **`content:gaps`**: chỉ còn `pnpm content:gaps [--missing] [--review]`. Bỏ `--topics`, `--book`, `--unit`. `--review` ghi `assets/generated/review/objective-coverage.json` (không còn `sgk-coverage.json`), rồi chạy `pnpm assets:manifest`.
- **E2E**: project `quest-mechanics` (`apps/web/e2e/quest-mechanics.spec.ts`, fixture `e2e-quest-mechanics.json`). Ảnh E2E ở local nằm trong `.data/review-shots/`.
- **Fixture server**: `apps/server/test/fixtures/quests/quest-mechanics.json`.
- **Đã xóa**: `pnpm sgk:review`, `tools/sgk/`, `content/curriculum/`, `textbook-copy-pending.json`, `textbook-copy-baseline.ts`, `check-curriculum.ts`, `curriculum-links.ts`, `curriculum-books.ts`, `migrate-quest-topics.ts`.
- **Schema**: không còn `lesson`, `curriculumRef`, `lessonId`, `author`/`section` của bài đọc; bước `worksheet` bắt buộc có `sheet`. Tên tác giả hiện cho người chơi lấy từ `source.author` khi bài đọc là `public-domain`.
- **Vân tay**: tệp `.bin` không sinh lại được nữa. Chú thích của `tools/learning/textbook-fingerprints.ts` nói rõ điều này; mọi lệnh "chạy `textbook-fingerprints.ts` để sinh" trong docs phải bỏ.
- **Tệp riêng**: `tools/private/private-files.json` chỉ còn thời khóa biểu. Đã bỏ cả 5 PDF sách: Toán 2 và Tiếng Việt 2 tập 1 và tập 2, cùng mẫu Tiếng Anh 2 Global Success.
- **Trang review** (mục 6): mục "Nội dung học theo chủ đề" đã đổi sang số liệu theo mục tiêu. Các dòng còn nhắc sách ở dòng 30, 42, 59, 73, 82, 173 của `apps/web/review.html` cần viết lại khi làm trang review của đợt này.
- **Ghi nhớ code-reviewer**: `.claude/agent-memory/code-reviewer/project-copy-guard-review.md` còn nhắc kiểm `lessonId`, giờ đã lỗi thời. Đây là ghi nhớ của agent, người sở hữu tự quyết có sửa hay không.


## Vòng 2: sửa theo code review (`code-reviewer-261025-1240-remove-textbook-inventory.md`)

- **H1.** Trong `tools/content/check-content.ts`, `catch {}` giờ chỉ bọc phần parse quest. Các kiểm học (chủ đề, chống chép, mục tiêu, lặp dòng, logic) chạy trong `learningCheckIssues`. Mọi lỗi ở đó, như khóa sai định dạng, khóa sai, `.bin` hỏng hay `allowed-*.json` sai, đều thành issue `the learning checks could not run: …`. `checkContent(dir, { env })` nhận `env` để test được. Đã thêm test: trên CI, khóa `abc` làm check báo đúng issue đó.
- **H2. Giá trị kiểm khóa.**
  - Tệp mới `content/learning/textbook-fingerprints.key-check` chứa 16 ký tự hex, là 8 byte đầu của `HMAC(key, "miu-fingerprint-key-check")`. Giá trị: `6b062f10ab00b0cc`.
  - Giá trị được tính bằng khóa thật đọc từ iCloud, qua một script tạm ở scratchpad. Script chỉ in giá trị kiểm, không in hay ghi khóa.
  - `fingerprintKey()` giờ báo lỗi khi khóa không khớp giá trị kiểm. Tệp này nằm trong danh sách có validator của `content:check`.
  - Test đã thêm:
    - khóa toàn số 0 báo lỗi "not the one the fingerprints were made with";
    - khóa sai trong `checkRepoTextbookCopy` cũng báo lỗi;
    - khóa thật khớp giá trị kiểm (tự skip khi máy không có khóa; ở máy này test đã chạy và pass).
  - Nếu secret `MIU_FINGERPRINT_KEY` trên CI khác khóa local, CI sẽ đỏ, đúng như muốn.
- **M1.** Ngoại lệ `en` trong `content-variety.ts` giờ chỉ áp cho `title` và `goTo` của một bước (`nameTwinOf`). Đã thêm test: lời thoại và lựa chọn trong bản `en` để nguyên tiếng Việt đều bị báo.
- **Các mục Low:**
  - `quest-routes.test.ts`: regex chặn lộ dữ liệu thêm `source|died`; describe đổi thành `learning mechanics over the API`; biến `sgkView` đổi thành `mechanicsView`.
  - Test mới: bài đọc `folk` và `original` ra `QuestView` không có `author`, không có `source`. View của fixture `public-domain` cũng không có khóa `source` hay `died`.
  - Test mới: `QuestText` từ chối `author` và `section`.
  - Đã xóa dòng chỉ có dấu cách trong `content.ts`; đã ngắt dòng chú thích đầu `sync-private.ts`.
  - Sửa số mục tiêu thành **64/64** (21 chủ đề), đếm lại từ `objective-coverage.json`.
- **M2.** Cả 5 PDF đều bỏ, theo quyết định của coordinator: mẫu Tiếng Anh 2 cũng là sách giáo khoa, mà sản phẩm bỏ hẳn sách. Tệp trong iCloud của người sở hữu không bị đụng tới.

Low 1 (dòng 589 của Master Plan còn nhắc `sgk-mechanics`) nằm ngoài phạm vi của tôi; docs agent cần sửa thành `quest-mechanics`. Docs agent cũng cần ghi thêm tệp mới `content/learning/textbook-fingerprints.key-check`: khóa sai thì `content:check` đỏ ở mọi máy, không riêng CI.

### Kết quả kiểm vòng 2 (theo thứ tự)

1. `pnpm assets:check`: `OK — 17 packs, 4746 files`.
2. `pnpm content:check`: `OK — 2159 files` (thêm tệp key-check), 0 cảnh báo. Thử lại hai kịch bản lỗi của reviewer:
   - `CI=1 MIU_FINGERPRINT_KEY=abc`: FAILED, 1 issue (khóa phải đủ 64 ký tự hex).
   - `CI=1 MIU_FINGERPRINT_KEY=<64 số 0>`: FAILED, 1 issue (khóa không phải khóa đã tạo vân tay).
3. `pnpm typecheck`: 0 lỗi (root, mobile, server, web đều Done).
4. `pnpm lint`: eslint `--max-warnings=0` sạch; check-brand OK.
5. `pnpm vitest run --maxWorkers=1` trên các tệp test đã sửa: `check-content`, `no-textbook-copy`, `content-variety`, `textbook-fingerprints`, `game`, `content`, `quest-routes`, `sync-private`. 8 tệp, 160 test, đều pass.

Không chạy full suite, build web hay E2E. Không stage, không commit.

Status: DONE_WITH_CONCERNS
Summary: Đã xóa kiểm kê, danh sách chờ và mọi miễn trừ; content:gaps báo theo mục tiêu (64/64). Đã sửa H1, H2, M1 và các mục Low: khóa sai định dạng hay sai giá trị giờ làm content:check đỏ, và ngoại lệ en chỉ còn cho title và goTo. Bốn gate local xanh, 160 test của các tệp đã sửa pass.
Concerns: Cần CI xanh cho build web, E2E (quest-mechanics, worksheets) và test khóa thật với secret MIU_FINGERPRINT_KEY. Nếu CI đỏ ở test khóa, secret trên GitHub không phải khóa đã tạo vân tay, và người sở hữu phải cập nhật secret. Dòng 589 Master Plan thuộc docs agent.
